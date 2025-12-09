import { query } from '@anthropic-ai/claude-agent-sdk'
import type { TableDocument } from '@magik/tabledocuments'
import { zodToJsonSchema } from 'zod-to-json-schema'
import { applyChanges } from './applyChanges.js'
import { tableDocumentChange, type TableDocumentChange } from './interface.type.js'
import { createUserPrompt } from './tabledocument.prompt.js'
import { createSystemPrompt } from './tabledocument.systemPrompt.js'
import {
  createTableDocumentReporterServer,
  SERVER_NAME,
  TOOL_FULL_NAME,
} from './tabledocument.tools.js'

export async function runTableDocumentAgent(
  inputDocument: TableDocument,
  userAsk: string,
  sessionId?: string
): Promise<{ document: TableDocument; sessionId?: string }> {
  const schemaJson = JSON.stringify(
    zodToJsonSchema(tableDocumentChange, 'TableDocumentChange'),
    null,
    2
  )

  const documentJson = JSON.stringify(inputDocument, null, 2)

  const stream = query({
    prompt: createUserPrompt(documentJson, userAsk, schemaJson),
    options: {
      model: 'claude-haiku-4-5',
      resume: sessionId,
      mcpServers: {
        [SERVER_NAME]: createTableDocumentReporterServer(),
      },
      allowedTools: [TOOL_FULL_NAME],
      systemPrompt: {
        type: 'preset',
        preset: 'claude_code',
        append: createSystemPrompt(),
      },
      settingSources: ['user', 'project', 'local'],
    },
  })

  let changes: TableDocumentChange[] | null = null
  let newSessionId: string | undefined = undefined

  for await (const message of stream) {
    // Extract session ID from init message
    if (message.type === 'system' && message.subtype === 'init') {
      newSessionId = message.session_id
    }

    // Extract changes from tool use
    if (message.type === 'assistant' && message.message?.content) {
      for (const content of message.message.content) {
        if (content.type === 'tool_use' && content.name === TOOL_FULL_NAME) {
          changes = content.input.data.changes
          break
        }
      }
    }
  }

  if (!changes) {
    throw new Error('No changes were reported by the agent!')
  }

  const updatedDocument = applyChanges(inputDocument, changes)

  return {
    document: updatedDocument,
    sessionId: newSessionId,
  }
}
