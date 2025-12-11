import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import { runTableDocumentAgent } from '@magik/agents'
import type { TableDocument } from '@magik/tabledocuments'
import { TABLE_DOCUMENTS_DIR } from '../config.js'

export async function runAgent(documentId: string, prompt: string): Promise<void> {
  const filePath = join(TABLE_DOCUMENTS_DIR, `${documentId}.json`)

  //Read the current table document
  const content = await readFile(filePath, 'utf-8')
  const currentDocument = JSON.parse(content) as TableDocument

  //Run the agent with optional session ID
  const result = await runTableDocumentAgent(currentDocument, prompt, currentDocument.aiSessionId)

  //Update the document with the new session ID
  result.document.aiSessionId = result.sessionId ?? currentDocument.aiSessionId

  //Save the updated document back to file
  await writeFile(filePath, JSON.stringify(result.document, null, 2), 'utf-8')
}
