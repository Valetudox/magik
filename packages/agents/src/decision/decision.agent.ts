import { query } from '@anthropic-ai/claude-agent-sdk'
import { decision } from '@magik/decisions'
import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'
import { applyChanges } from './applyChanges.js'
import { createUserPrompt } from './decision.prompt.js'
import { createSystemPrompt } from './decision.systemPrompt.js'
import { createDecisionReporterServer, SERVER_NAME, TOOL_FULL_NAME } from './decision.tools.js'
import { decisionChange, type DecisionChange } from './interface.type.js'

type Decision = z.infer<typeof decision>

export async function runDecisionAgent(
  inputDecision: Decision,
  userAsk: string,
  sessionId?: string
): Promise<{ decision: Decision; sessionId?: string }> {
  const schemaJson = JSON.stringify(zodToJsonSchema(decisionChange, 'DecisionChange'), null, 2)

  const decisionJson = JSON.stringify(inputDecision, null, 2)

  const stream = query({
    prompt: createUserPrompt(decisionJson, userAsk, schemaJson),
    options: {
      model: 'claude-haiku-4-5',
      resume: sessionId,
      mcpServers: {
        [SERVER_NAME]: createDecisionReporterServer(),
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

  let changes: DecisionChange[] | null = null
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

  const updatedDecision = applyChanges(inputDecision, changes)

  return {
    decision: updatedDecision,
    sessionId: newSessionId,
  }
}
