import { execSync } from 'child_process'
import { readFile, writeFile } from 'fs/promises'
import type { TableDocument } from '@magik/tabledocuments'
import axios from 'axios'
import FormData from 'form-data'
import { JIRA_USERNAME, JIRA_TOKEN } from '../config.js'

interface AttachmentInfo {
  id: string
  title: string
}

//Generate Mermaid PNG image using mmdc CLI
async function generateMermaidImage(mermaidCode: string): Promise<Buffer> {
  const tempMmdPath = `/tmp/mermaid-${Date.now()}.mmd`
  const tempPngPath = `/tmp/mermaid-${Date.now()}.png`

  try {
    //Write mermaid code to temporary file
    await writeFile(tempMmdPath, mermaidCode, 'utf-8')

    //Generate PNG using mermaid CLI
    execSync(`mmdc -i ${tempMmdPath} -o ${tempPngPath}`, {
      stdio: 'pipe',
    })

    //Read the generated PNG
    const imageBuffer = await readFile(tempPngPath)

    //Clean up temporary files
    execSync(`rm ${tempMmdPath} ${tempPngPath}`)

    return Buffer.from(imageBuffer)
  } catch (error: unknown) {
    //Clean up on error
    try {
      execSync(`rm -f ${tempMmdPath} ${tempPngPath}`)
    } catch {
      //Ignore cleanup errors
    }
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Failed to generate Mermaid diagram: ${errorMessage}`)
  }
}

//Get existing attachments for a Confluence page
async function getExistingAttachments(pageId: string): Promise<AttachmentInfo[]> {
  if (!JIRA_USERNAME || !JIRA_TOKEN) {
    throw new Error('JIRA_USERNAME and JIRA_TOKEN environment variables are required')
  }

  try {
    const response = await axios.get<{ results: AttachmentInfo[] }>(
      `https://emarsys.jira.com/wiki/rest/api/content/${pageId}/child/attachment`,
      {
        auth: { username: JIRA_USERNAME, password: JIRA_TOKEN },
      }
    )
    return response.data.results
  } catch (_error: unknown) {
    return []
  }
}

//Upload or update an attachment on a Confluence page
async function uploadAttachment(
  pageId: string,
  imageBuffer: Buffer,
  filename: string
): Promise<AttachmentInfo> {
  if (!JIRA_USERNAME || !JIRA_TOKEN) {
    throw new Error('JIRA_USERNAME and JIRA_TOKEN environment variables are required')
  }

  //Check if attachment already exists
  const existingAttachments = await getExistingAttachments(pageId)
  const existingAttachment = existingAttachments.find((att) => att.title === filename)

  const formData = new FormData()
  formData.append('file', imageBuffer, {
    filename,
    contentType: 'image/png',
  })

  if (existingAttachment) {
    //Update existing attachment
    const response = await axios.post<AttachmentInfo>(
      `https://emarsys.jira.com/wiki/rest/api/content/${pageId}/child/attachment/${existingAttachment.id}/data`,
      formData,
      {
        auth: { username: JIRA_USERNAME, password: JIRA_TOKEN },
        headers: {
          'X-Atlassian-Token': 'nocheck',
          ...formData.getHeaders(),
        },
      }
    )
    return response.data
  } else {
    //Create new attachment
    const response = await axios.post<{ results: AttachmentInfo[] }>(
      `https://emarsys.jira.com/wiki/rest/api/content/${pageId}/child/attachment`,
      formData,
      {
        auth: { username: JIRA_USERNAME, password: JIRA_TOKEN },
        headers: {
          'X-Atlassian-Token': 'nocheck',
          ...formData.getHeaders(),
        },
      }
    )
    return response.data.results[0]
  }
}

//Convert table document to Confluence Storage Format
function convertToConfluenceStorage(
  data: TableDocument,
  attachmentMap = new Map<number, string>()
): string {
  let html = ''

  //Create table with full width
  html += '<table data-layout="full-width"><tbody>'

  //Create table header row
  html += '<tr>'
  html += '<th>#</th>'
  html += '<th>Use Case</th>'
  html += '<th>Diagram</th>'
  html += '<th>Required Context</th>'
  html += '<th>Required Tools</th>'
  html += '<th>Potential Interactions</th>'
  html += '<th>Notes</th>'
  html += '</tr>'

  //Create rows for each table entry
  data.table.forEach((row, index) => {
    html += '<tr>'

    //Index column
    html += `<td style="text-align: center; font-weight: 600;">${index + 1}</td>`

    //Use Case column
    html += `<td>${row.use_case}</td>`

    //Diagram column
    if (attachmentMap.has(index)) {
      //Use uploaded attachment
      const filename = attachmentMap.get(index)
      html += `<td><ac:image ac:width="400"><ri:attachment ri:filename="${filename}" /></ac:image></td>`
    } else if (row.diagram) {
      //Fallback to Mermaid macro if attachment not available
      html +=
        '<td><ac:structured-macro ac:name="mermaid" ac:schema-version="1"><ac:plain-text-body><![CDATA['
      html += row.diagram
      html += ']]></ac:plain-text-body></ac:structured-macro></td>'
    } else {
      html += '<td>—</td>'
    }

    //Required Context column (as bullet list)
    html += '<td>'
    if (row.required_context && row.required_context.length > 0) {
      html += '<ul>'
      row.required_context.forEach((context) => {
        html += `<li>${context}</li>`
      })
      html += '</ul>'
    } else {
      html += '—'
    }
    html += '</td>'

    //Required Tools column (as bullet list)
    html += '<td>'
    if (row.required_tools && row.required_tools.length > 0) {
      html += '<ul>'
      row.required_tools.forEach((tool) => {
        html += `<li>${tool}</li>`
      })
      html += '</ul>'
    } else {
      html += '—'
    }
    html += '</td>'

    //Potential Interactions column (as bullet list)
    html += '<td>'
    if (row.potential_interactions && row.potential_interactions.length > 0) {
      html += '<ul>'
      row.potential_interactions.forEach((interaction) => {
        html += `<li>${interaction}</li>`
      })
      html += '</ul>'
    } else {
      html += '—'
    }
    html += '</td>'

    //Notes column (as bullet list)
    html += '<td>'
    if (row.notes && row.notes.length > 0) {
      html += '<ul>'
      row.notes.forEach((note) => {
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

//Get current version of a Confluence page
async function getPageVersion(pageId: string): Promise<number> {
  if (!JIRA_USERNAME || !JIRA_TOKEN) {
    throw new Error('JIRA_USERNAME and JIRA_TOKEN environment variables are required')
  }

  const response = await axios.get<{ version: { number: number } }>(
    `https://emarsys.jira.com/wiki/rest/api/content/${pageId}`,
    {
      auth: { username: JIRA_USERNAME, password: JIRA_TOKEN },
    }
  )

  return response.data.version.number
}

//Update Confluence page content
async function updatePageContent(
  pageId: string,
  content: string,
  version: number
): Promise<void> {
  if (!JIRA_USERNAME || !JIRA_TOKEN) {
    throw new Error('JIRA_USERNAME and JIRA_TOKEN environment variables are required')
  }

  await axios.put(
    `https://emarsys.jira.com/wiki/rest/api/content/${pageId}`,
    {
      version: { number: version + 1 },
      type: 'page',
      body: {
        storage: {
          value: content,
          representation: 'storage',
        },
      },
    },
    {
      auth: { username: JIRA_USERNAME, password: JIRA_TOKEN },
      headers: {
        'Content-Type': 'application/json',
      },
    }
  )
}

//Extract page ID from Confluence URL
function extractPageId(url: string): string {
  const regex = /pages\/(\d+)/
  const match = regex.exec(url)
  if (!match) {
    throw new Error('Invalid Confluence URL: could not extract page ID')
  }
  return match[1]
}

//Main function to push table document to Confluence
export async function pushToConfluence(document: TableDocument): Promise<void> {
  if (!document.confluence_url) {
    throw new Error('Document does not have a Confluence URL')
  }

  const pageId = extractPageId(document.confluence_url)

  //Upload diagram images and build attachment map
  const attachmentMap = new Map<number, string>()

  for (let i = 0; i < document.table.length; i++) {
    const row = document.table[i]
    if (row.diagram) {
      const filename = `diagram-${i}.png`
      const imageBuffer = await generateMermaidImage(row.diagram)
      await uploadAttachment(pageId, imageBuffer, filename)
      attachmentMap.set(i, filename)
    }
  }

  //Convert document to Confluence Storage Format
  const confluenceContent = convertToConfluenceStorage(document, attachmentMap)

  //Get current page version
  const currentVersion = await getPageVersion(pageId)

  //Update page content
  await updatePageContent(pageId, confluenceContent, currentVersion)
}
