#!/usr/bin/env bun

import { execSync } from 'child_process'
import { unlinkSync } from 'fs'
import { readFile, writeFile } from 'fs/promises'
import axios from 'axios'
import { Command } from 'commander'
import FormData from 'form-data'

const program = new Command()

program
  .name('uploadMermaidDiagram')
  .description('Generate and upload a Mermaid diagram to Confluence')
  .version('1.0.0')
  .requiredOption('-p, --page-id <id>', 'Confluence page ID')
  .requiredOption('-f, --filename <name>', 'Filename for the attachment (e.g., diagram.png)')
  .requiredOption('-m, --mermaid <code>', 'Mermaid diagram code')
  .option('-t, --title <title>', 'Optional title/description for the diagram')
  .parse(process.argv)

const options = program.opts()

async function generateMermaidImage(mermaidCode: string): Promise<Buffer> {
  const tempMmdPath = `/tmp/mermaid-${Date.now()}.mmd`
  const tempPngPath = `/tmp/mermaid-${Date.now()}.png`

  try {
    // Write mermaid code to temporary file
    await writeFile(tempMmdPath, mermaidCode, 'utf-8')

    // Generate PNG using mermaid CLI
    execSync(`mmdc -i ${tempMmdPath} -o ${tempPngPath}`, {
      stdio: 'pipe',
    })

    // Read the generated PNG
    const imageBuffer = await readFile(tempPngPath)

    // Clean up temporary files
    unlinkSync(tempMmdPath)
    unlinkSync(tempPngPath)

    return Buffer.from(imageBuffer)
  } catch (error: any) {
    // Clean up on error
    try {
      unlinkSync(tempMmdPath)
    } catch {}
    try {
      unlinkSync(tempPngPath)
    } catch {}
    throw new Error(`Failed to generate Mermaid diagram: ${error.message}`)
  }
}

async function getExistingAttachments(pageId: string): Promise<{ id: string; title: string }[]> {
  const username = process.env.JIRA_USERNAME
  const token = process.env.JIRA_TOKEN

  if (!username || !token) {
    throw new Error('JIRA_USERNAME and JIRA_TOKEN environment variables are required')
  }

  try {
    const response = await axios.get(
      `https://emarsys.jira.com/wiki/rest/api/content/${pageId}/child/attachment`,
      {
        auth: { username, password: token },
      }
    )
    return response.data.results
  } catch (error) {
    return []
  }
}

async function uploadAttachment(
  pageId: string,
  imageBuffer: Buffer,
  filename: string
): Promise<{ id: string; title: string }> {
  const username = process.env.JIRA_USERNAME
  const token = process.env.JIRA_TOKEN

  if (!username || !token) {
    throw new Error('JIRA_USERNAME and JIRA_TOKEN environment variables are required')
  }

  // Check if attachment already exists
  const existingAttachments = await getExistingAttachments(pageId)
  const existingAttachment = existingAttachments.find((att) => att.title === filename)

  const formData = new FormData()
  formData.append('file', imageBuffer, {
    filename,
    contentType: 'image/png',
  })

  let response
  if (existingAttachment) {
    console.log(`Updating existing attachment: ${filename}`)
    // Update existing attachment
    response = await axios.post(
      `https://emarsys.jira.com/wiki/rest/api/content/${pageId}/child/attachment/${existingAttachment.id}/data`,
      formData,
      {
        auth: { username, password: token },
        headers: {
          'X-Atlassian-Token': 'nocheck',
          ...formData.getHeaders(),
        },
      }
    )
    return response.data
  } else {
    console.log(`Creating new attachment: ${filename}`)
    // Create new attachment
    response = await axios.post(
      `https://emarsys.jira.com/wiki/rest/api/content/${pageId}/child/attachment`,
      formData,
      {
        auth: { username, password: token },
        headers: {
          'X-Atlassian-Token': 'nocheck',
          ...formData.getHeaders(),
        },
      }
    )
    return response.data.results[0]
  }
}

async function main() {
  try {
    console.log(`Generating Mermaid diagram...`)
    const imageBuffer = await generateMermaidImage(options.mermaid)
    console.log(`✓ Generated PNG image (${imageBuffer.length} bytes)`)

    console.log(`Uploading to Confluence page ${options.pageId}...`)
    const attachment = await uploadAttachment(options.pageId, imageBuffer, options.filename)

    console.log(`✅ Successfully uploaded: ${attachment.title}`)
    console.log(`   Attachment ID: ${attachment.id}`)

    // Output JSON for easy parsing by calling scripts
    const result = {
      success: true,
      attachment: {
        id: attachment.id,
        title: attachment.title,
        filename: options.filename,
      },
    }
    console.log(JSON.stringify(result))
  } catch (error: any) {
    if (error.response) {
      console.error(`❌ API Error: ${error.response.status} ${error.response.statusText}`)
      console.error(JSON.stringify(error.response.data, null, 2))
    } else {
      console.error(`❌ Error: ${error.message}`)
    }

    // Output JSON error for easy parsing
    const result = {
      success: false,
      error: error.message,
    }
    console.log(JSON.stringify(result))
    process.exit(1)
  }
}

main()
