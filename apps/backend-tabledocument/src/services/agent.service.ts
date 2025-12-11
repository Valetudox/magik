import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import { runTableDocumentAgent } from '@magik/agents'
import type { TableDocument } from '@magik/tabledocuments'
import { TABLE_DOCUMENTS_DIR } from '../config.js'

export async function runAgent(documentId: string, prompt: string): Promise<void> {
  const filePath = join(TABLE_DOCUMENTS_DIR, `${documentId}.json`)

  const content = await readFile(filePath, 'utf-8')
  const currentDocument = JSON.parse(content) as TableDocument

  const result = await runTableDocumentAgent(currentDocument, prompt, currentDocument.aiSessionId)

  result.document.aiSessionId = result.sessionId ?? currentDocument.aiSessionId

  await writeFile(filePath, JSON.stringify(result.document, null, 2), 'utf-8')
}
