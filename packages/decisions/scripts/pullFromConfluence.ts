#!/usr/bin/env bun

import { writeFile } from 'fs/promises'
import { resolve } from 'path'
import axios from 'axios'
import { Command } from 'commander'

const program = new Command()

program
  .name('pullFromConfluence')
  .description('Pull a decision document from a Confluence page')
  .version('1.0.0')
  .requiredOption('-u, --url <url>', 'Confluence page URL')
  .option('-o, --output <file>', 'Output file path (optional)')
  .parse(process.argv)

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

async function getConfluencePage(pageId: string) {
  const response = await axios.get(
    `https://emarsys.jira.com/wiki/api/v2/pages/${pageId}?body-format=storage`,
    createSettings()
  )
  return response.data
}

async function main() {
  try {
    // Extract page ID from URL
    console.log(`Extracting page ID from: ${options.url}`)
    const pageId = getPageIdFromUrl(options.url)
    console.log(`✓ Page ID: ${pageId}`)

    // Fetch page from Confluence
    console.log('Fetching page from Confluence...')
    const page = await getConfluencePage(pageId)

    console.log(`✓ Page: ${page.title}`)
    console.log(`  Version: ${page.version.number}`)
    console.log(`  Status: ${page.status}`)

    const content = page.body.storage.value

    if (options.output) {
      // Save to file
      const outputPath = resolve(options.output)
      await writeFile(outputPath, content, 'utf-8')
      console.log(`✅ Saved to: ${outputPath}`)
    } else {
      // Print to console
      console.log('\n--- Content ---')
      console.log(content)
    }
  } catch (error: any) {
    if (error.response) {
      console.error(`❌ API Error: ${error.response.status} ${error.response.statusText}`)
      console.error(JSON.stringify(error.response.data, null, 2))
    } else {
      console.error(`❌ Error: ${error.message}`)
    }
    process.exit(1)
  }
}

main()
