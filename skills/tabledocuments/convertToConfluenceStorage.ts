#!/usr/bin/env bun

import { readFile } from 'fs/promises'
import { resolve } from 'path'
import { Command } from 'commander'
import { tableDocument } from './tableDocument.js'

const program = new Command()

program
  .name('convertToConfluenceStorage')
  .description('Convert a table document JSON file to Confluence Storage Format (HTML)')
  .version('1.0.0')
  .argument('<json-file>', 'Path to table document JSON file')
  .option(
    '-a, --attachments <json>',
    'JSON map of row indices to diagram attachment filenames (e.g., \'{"0":"diagram-0.png"}\')'
  )
  .parse(process.argv)

const jsonFile = program.args[0]
const options = program.opts()

function convertToConfluenceStorage(
  data: any,
  attachmentMap = new Map<string, string>()
): string {
  let html = ''

  // Create table with full width
  html += '<table data-layout="full-width"><tbody>'

  // Create table header row
  html += '<tr>'
  html += '<th>#</th>'
  html += '<th>Use Case</th>'
  html += '<th>Diagram</th>'
  html += '<th>Required Context</th>'
  html += '<th>Required Tools</th>'
  html += '<th>Potential Interactions</th>'
  html += '<th>Notes</th>'
  html += '</tr>'

  // Create rows for each table entry
  data.table.forEach((row: any, index: number) => {
    html += '<tr>'

    // Index column
    html += `<td style="text-align: center; font-weight: 600;">${index + 1}</td>`

    // Use Case column
    html += `<td>${row.use_case}</td>`

    // Diagram column
    if (attachmentMap.has(index.toString())) {
      // Use uploaded attachment
      const filename = attachmentMap.get(index.toString())
      html += `<td><ac:image ac:width="400"><ri:attachment ri:filename="${filename}" /></ac:image></td>`
    } else if (row.diagram) {
      // Fallback to Mermaid macro if attachment not available
      html +=
        '<td><ac:structured-macro ac:name="mermaid" ac:schema-version="1"><ac:plain-text-body><![CDATA['
      html += row.diagram
      html += ']]></ac:plain-text-body></ac:structured-macro></td>'
    } else {
      html += '<td>—</td>'
    }

    // Required Context column (as bullet list)
    html += '<td>'
    if (row.required_context && row.required_context.length > 0) {
      html += '<ul>'
      row.required_context.forEach((context: string) => {
        html += `<li>${context}</li>`
      })
      html += '</ul>'
    } else {
      html += '—'
    }
    html += '</td>'

    // Required Tools column (as bullet list)
    html += '<td>'
    if (row.required_tools && row.required_tools.length > 0) {
      html += '<ul>'
      row.required_tools.forEach((tool: string) => {
        html += `<li>${tool}</li>`
      })
      html += '</ul>'
    } else {
      html += '—'
    }
    html += '</td>'

    // Potential Interactions column (as bullet list)
    html += '<td>'
    if (row.potential_interactions && row.potential_interactions.length > 0) {
      html += '<ul>'
      row.potential_interactions.forEach((interaction: string) => {
        html += `<li>${interaction}</li>`
      })
      html += '</ul>'
    } else {
      html += '—'
    }
    html += '</td>'

    // Notes column (as bullet list)
    html += '<td>'
    if (row.notes && row.notes.length > 0) {
      html += '<ul>'
      row.notes.forEach((note: string) => {
        html += `<li>${note}</li>`
      })
      html += '</ul>'
    } else {
      html += '—'
    }
    html += '</td>'

    html += '</tr>'
  })

  html += '</tbody></table>'

  return html
}

async function main() {
  try {
    // Read and parse JSON file
    const jsonPath = resolve(jsonFile)
    const jsonContent = await readFile(jsonPath, 'utf-8')
    const jsonData = JSON.parse(jsonContent)

    // Validate with Zod
    const result = tableDocument.safeParse(jsonData)

    if (!result.success) {
      console.error('❌ Invalid table document JSON:')
      console.error(JSON.stringify(result.error.format(), null, 2))
      process.exit(1)
    }

    const data = result.data

    // Parse attachment map if provided
    let attachmentMap = new Map<string, string>()
    if (options.attachments) {
      try {
        const attachmentsObj = JSON.parse(options.attachments)
        attachmentMap = new Map(Object.entries(attachmentsObj))
      } catch (error: any) {
        console.error(`❌ Invalid attachments JSON: ${error.message}`)
        process.exit(1)
      }
    }

    // Convert to Confluence Storage Format
    const confluenceContent = convertToConfluenceStorage(data, attachmentMap)

    // Output HTML to stdout
    console.log(confluenceContent)
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
