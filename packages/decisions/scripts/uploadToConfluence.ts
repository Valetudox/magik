#!/usr/bin/env bun

import { execSync } from 'child_process'
import { readFile } from 'fs/promises'
import { resolve, dirname } from 'path'
import axios from 'axios'
import { Command } from 'commander'
import { decision } from './decision.js'

const program = new Command()

program
  .name('uploadToConfluence')
  .description('Upload a decision to a Confluence page')
  .version('1.0.0')
  .requiredOption('-u, --url <url>', 'Confluence page URL')
  .argument('<json-file>', 'Path to decision JSON file')
  .parse(process.argv)

const jsonFile = program.args[0]
const options = program.opts()

function getPageIdFromUrl(url: string): string {
  const regex = /\/pages\/(\d+)(?:\/|$)/
  const match = regex.exec(url)
  if (!match) {
    throw new Error('Page ID not found in URL.')
  }
  return match[1]
}

function createSettings(params: any = {}) {
  const username = process.env.JIRA_USERNAME
  const token = process.env.JIRA_TOKEN

  if (!username || !token) {
    throw new Error('JIRA_USERNAME and JIRA_TOKEN environment variables are required')
  }

  return {
    auth: {
      username,
      password: token,
    },
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    ...params,
  }
}

async function processMermaidDiagrams(data: any, pageId: string): Promise<Map<string, string>> {
  const attachmentMap = new Map<string, string>()

  // Get the directory of the current script
  const scriptDir = dirname(new URL(import.meta.url).pathname)
  const uploadMermaidScript = resolve(scriptDir, 'uploadMermaidDiagram.ts')

  for (const option of data.options) {
    if (option.architectureDiagramMermaid) {
      console.log(`  Processing Mermaid diagram for option: ${option.name}`)

      const filename = `${option.id}-diagram.png`

      // Escape mermaid code for shell
      const escapedMermaid = option.architectureDiagramMermaid
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\$/g, '\\$')
        .replace(/`/g, '\\`')

      // Call the standalone CLI tool
      try {
        const output = execSync(
          `"${uploadMermaidScript}" --page-id "${pageId}" --filename "${filename}" --mermaid "${escapedMermaid}"`,
          { encoding: 'utf-8', stdio: 'pipe' }
        )

        // Parse JSON output from CLI tool
        const lines = output.trim().split('\n')
        const jsonLine = lines[lines.length - 1]
        const result = JSON.parse(jsonLine)

        if (result.success) {
          attachmentMap.set(option.id, filename)
          console.log(`  ✓ Uploaded: ${result.attachment.title}`)
        } else {
          throw new Error(result.error)
        }
      } catch (error: any) {
        throw new Error(`Failed to upload Mermaid diagram for ${option.name}: ${error.message}`)
      }
    }
  }

  return attachmentMap
}

async function convertToConfluenceStorage(
  jsonFilePath: string,
  attachmentMap = new Map<string, string>()
): Promise<string> {
  // Get the directory of the current script
  const scriptDir = dirname(new URL(import.meta.url).pathname)
  const convertScript = resolve(scriptDir, 'convertToConfluenceStorage.ts')

  // Convert attachment map to JSON object
  const attachmentsObj = Object.fromEntries(attachmentMap)
  const attachmentsJson = JSON.stringify(attachmentsObj)

  // Escape JSON for shell
  const escapedAttachments = attachmentsJson
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\$/g, '\\$')

  // Call the CLI tool
  let cmd = `"${convertScript}" "${jsonFilePath}"`
  if (attachmentMap.size > 0) {
    cmd += ` --attachments "${escapedAttachments}"`
  }

  try {
    const html = execSync(cmd, { encoding: 'utf-8', stdio: 'pipe' })
    return html.trim()
  } catch (error: any) {
    throw new Error(`Failed to convert to Confluence storage format: ${error.message}`)
  }
}

async function getConfluencePage(pageId: string) {
  const response = await axios.get(
    `https://emarsys.jira.com/wiki/api/v2/pages/${pageId}`,
    createSettings()
  )
  return response.data
}

async function updateConfluencePage(
  pageId: string,
  title: string,
  content: string,
  version: number
) {
  const response = await axios.put(
    `https://emarsys.jira.com/wiki/api/v2/pages/${pageId}`,
    {
      id: pageId,
      status: 'current',
      title,
      body: {
        value: content,
        representation: 'storage',
      },
      version: {
        number: version + 1,
        message: 'Updated via decision script',
      },
    },
    createSettings()
  )
  return response.data
}

async function main() {
  try {
    // Read and parse JSON file
    const jsonPath = resolve(jsonFile)
    const jsonContent = await readFile(jsonPath, 'utf-8')
    const jsonData = JSON.parse(jsonContent)

    // Validate with Zod
    const result = decision.safeParse(jsonData)

    if (!result.success) {
      console.error('❌ Invalid decision JSON:')
      console.error(JSON.stringify(result.error.format(), null, 2))
      process.exit(1)
    }

    const data = result.data

    // Extract page ID from URL
    console.log(`Extracting page ID from: ${options.url}`)
    const pageId = getPageIdFromUrl(options.url)
    console.log(`✓ Page ID: ${pageId}`)

    // Get current page to fetch version
    console.log('Fetching current page...')
    const currentPage = await getConfluencePage(pageId)
    console.log(`✓ Current page: ${currentPage.title} (version ${currentPage.version.number})`)

    // Process Mermaid diagrams and upload as attachments
    console.log('Processing Mermaid diagrams...')
    const attachmentMap = await processMermaidDiagrams(data, pageId)
    if (attachmentMap.size > 0) {
      console.log(`✓ Uploaded ${attachmentMap.size} diagram(s)`)
    }

    // Convert decision to Confluence storage format
    console.log('Converting decision to Confluence storage format...')
    const confluenceContent = await convertToConfluenceStorage(jsonPath, attachmentMap)

    // Update the page
    console.log('Updating Confluence page...')
    const updatedPage = await updateConfluencePage(
      pageId,
      currentPage.title,
      confluenceContent,
      currentPage.version.number
    )

    console.log(`✅ Successfully updated: ${updatedPage.title}`)
    console.log(`   Version: ${updatedPage.version.number}`)
    console.log(`   URL: ${options.url}`)
  } catch (error: any) {
    if (error.response) {
      console.error(`❌ API Error: ${error.response.status} ${error.response.statusText}`)
      console.error(JSON.stringify(error.response.data, null, 2))
    } else if (error instanceof SyntaxError) {
      console.error(`❌ Invalid JSON file: ${error.message}`)
    } else {
      console.error(`❌ Error: ${error.message}`)
    }
    process.exit(1)
  }
}

main()
