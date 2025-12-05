#!/usr/bin/env bun

import { readFile } from 'fs/promises'
import { resolve } from 'path'
import { Command } from 'commander'
import { decision } from './decision.js'

const program = new Command()

program
  .name('convertToConfluenceStorage')
  .description('Convert a decision JSON file to Confluence Storage Format (HTML)')
  .version('1.0.0')
  .argument('<json-file>', 'Path to decision JSON file')
  .option(
    '-a, --attachments <json>',
    'JSON map of option IDs to attachment filenames (e.g., \'{"option1":"diagram.png"}\')'
  )
  .parse(process.argv)

const jsonFile = program.args[0]
const options = program.opts()

function getRatingEmoji(rating: 'high' | 'medium' | 'low'): string {
  switch (rating) {
    case 'high':
      return '🟢'
    case 'medium':
      return '🟡'
    case 'low':
      return '🔴'
  }
}

function convertToConfluenceStorage(data: any, attachmentMap = new Map<string, string>()): string {
  let html = ''

  // Problem Definition
  html += '<h1>Problem Definition</h1>'
  html += `<p>${data.problemDefinition}</p>`

  // Components (only show if there are components)
  if (data.components && data.components.length > 0) {
    html += '<h1>Components</h1>'
    html += '<ul>'
    data.components.forEach((component: any) => {
      html += `<li><strong>${component.name}</strong>: ${component.description}</li>`
    })
    html += '</ul>'
  }

  // Decision Drivers
  html += '<h1>Decision Drivers</h1>'
  html += '<ul>'
  data.decisionDrivers.forEach((driver: any) => {
    html += `<li><strong>${driver.name}</strong>: ${driver.description}</li>`
  })
  html += '</ul>'

  // Evaluation Matrix
  html += '<h1>Evaluation Matrix</h1>'
  html += '<table data-layout="full-width"><tbody>'

  // Create table header row
  html += '<tr><th>Decision Driver</th>'
  data.options.forEach((option: any) => {
    const isSelected = data.selectedOption === option.id
    const star = isSelected ? ' ⭐' : ''
    const name = isSelected ? `<strong>${option.name}</strong>` : option.name
    html += `<th>${name}${star}</th>`
  })
  html += '</tr>'

  // Description row
  html += '<tr><th>Description</th>'
  data.options.forEach((option: any) => {
    let cell = option.description
    if (option.moreLink) {
      cell += ` <a href="${option.moreLink}">More →</a>`
    }
    html += `<td>${cell}</td>`
  })
  html += '</tr>'

  // Diagram row (only show if at least one option has a diagram)
  const hasAnyDiagram = data.options.some(
    (option: any) => option.architectureDiagramMermaid || option.architectureDiagramLink
  )

  if (hasAnyDiagram) {
    html += '<tr><th>Diagram</th>'
    data.options.forEach((option: any) => {
      if (option.architectureDiagramMermaid && attachmentMap.has(option.id)) {
        // Use uploaded attachment instead of Mermaid macro
        const filename = attachmentMap.get(option.id)
        html += `<td><ac:image ac:width="600"><ri:attachment ri:filename="${filename}" /></ac:image></td>`
      } else if (option.architectureDiagramMermaid) {
        // Fallback to Mermaid macro if attachment not available (shouldn't happen in normal flow)
        html +=
          '<td><ac:structured-macro ac:name="mermaid" ac:schema-version="1"><ac:plain-text-body><![CDATA['
        html += option.architectureDiagramMermaid
        html += ']]></ac:plain-text-body></ac:structured-macro></td>'
      } else if (option.architectureDiagramLink) {
        html += `<td><ac:image ac:width="200"><ri:url ri:value="${option.architectureDiagramLink}" /></ac:image></td>`
      } else {
        html += '<td>—</td>'
      }
    })
    html += '</tr>'
  }

  // Create rows for each driver
  data.decisionDrivers.forEach((driver: any) => {
    html += `<tr><th>${driver.name}</th>`

    data.options.forEach((option: any) => {
      // Find the evaluation for this option/driver pair
      const evaluation = data.evaluationMatrix.find(
        (e: any) => e.optionId === option.id && e.driverId === driver.id
      )

      if (evaluation) {
        const emoji = getRatingEmoji(evaluation.rating)
        const detailsList = evaluation.evaluationDetails
          .map((detail: string) => `<li>${detail}</li>`)
          .join('')
        html += `<td>${emoji}<ul>${detailsList}</ul></td>`
      } else {
        html += '<td>N/A</td>'
      }
    })

    html += '</tr>'
  })

  html += '</tbody></table>'

  // Color Legend
  html += '<p><strong>Color Legend:</strong></p>'
  html += '<p>🟢 Green - Meets requirements well / Good fit / Low risk</p>'
  html +=
    '<p>🟡 Yellow - Partially meets requirements / Acceptable with trade-offs / Medium risk</p>'
  html += '<p>🔴 Red - Does not meet requirements / Significant concerns / High risk</p>'

  // Proposal
  html += '<h1>Proposal</h1>'
  html += `<p>${data.proposal.description}</p>`
  html += '<p><strong>Reasoning:</strong></p>'
  html += '<ul>'
  data.proposal.reasoning.forEach((reason: string) => {
    html += `<li>${reason}</li>`
  })
  html += '</ul>'

  return html
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
