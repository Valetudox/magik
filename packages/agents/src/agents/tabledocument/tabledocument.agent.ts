import { tableDocumentSchema, type TableDocument } from '@magik/tabledocuments'
import { createTypedAgent } from '../../lib/typedAgent.js'

const runAgent = createTypedAgent<TableDocument>({
  name: 'tabledocument',
  documentSchema: tableDocumentSchema,
})

export async function runTableDocumentAgent(
  inputDocument: TableDocument,
  userAsk: string,
  sessionId?: string
): Promise<{ document: TableDocument; sessionId?: string }> {
  const result = await runAgent(inputDocument, userAsk, sessionId)
  return {
    document: result.data,
    sessionId: result.sessionId,
  }
}
