import { execSync } from 'child_process'
import { query } from '@anthropic-ai/claude-agent-sdk'
import type { ZodSchema } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'
import { createReporterServer, TOOL_NAME } from './reporterServer.js'
import { sessionExists } from './sessionManager.js'

export type TypedAgentConfig<TDocument> = {
  /** Name of the agent (used for server naming) */
  name: string
  /** Zod schema for the document */
  documentSchema: ZodSchema<TDocument>
  /** Model to use (default: claude-haiku-4-5) */
  model?: string
}

export type TypedAgentResult<TDocument> = {
  data: TDocument
  sessionId?: string
}

/**
 * Factory function that creates a typed agent with consistent configuration.
 * Uses jq for document transformations.
 */
export function createTypedAgent<TDocument>(config: TypedAgentConfig<TDocument>) {
  const { name, documentSchema, model = 'claude-haiku-4-5' } = config

  const serverName = `${name}_reporter_server`
  const toolFullName = `mcp__${serverName}__${TOOL_NAME}`
  const systemPrompt = createSystemPrompt(toolFullName)
  const documentJsonSchema = JSON.stringify(zodToJsonSchema(documentSchema, 'Document'), null, 2)

  return async function runAgent(
    input: TDocument,
    userAsk: string,
    sessionId?: string
  ): Promise<TypedAgentResult<TDocument>> {
    const inputJson = JSON.stringify(input, null, 2)
    const shouldResume = sessionId && sessionExists(sessionId)

    const server = createReporterServer({
      serverName,
      description: `Submit jq operations to transform the ${name} document.`,
    })

    const stream = query({
      prompt: createUserPrompt(inputJson, userAsk, documentJsonSchema),
      options: {
        model,
        ...(shouldResume && { resume: sessionId }),
        mcpServers: {
          [serverName]: server,
        },
        allowedTools: [toolFullName],
        systemPrompt: {
          type: 'preset',
          preset: 'claude_code',
          append: systemPrompt,
        },
        settingSources: ['user', 'project', 'local'],
      },
    })

    let operations: string[] | null = null
    let newSessionId: string | undefined

    for await (const message of stream) {
      if (message.type === 'system' && message.subtype === 'init') {
        newSessionId = message.session_id
      }

      if (message.type === 'assistant' && message.message?.content) {
        for (const content of message.message.content) {
          if (content.type === 'tool_use' && content.name === toolFullName) {
            const input = content.input as { operations: string[] }
            operations = input.operations
            break
          }
        }
      }
    }

    if (!operations || operations.length === 0) {
      throw new Error('No jq operations were reported by the agent!')
    }

    // Apply jq operations
    const result = applyJqOperations(input, operations)

    // Validate with Zod
    const validated = documentSchema.parse(result)

    return {
      data: validated,
      sessionId: newSessionId,
    }
  }
}

function createSystemPrompt(toolFullName: string): string {
  return `You are an expert document editor. Your role is to modify documents based on user requests.

You MUST report your changes via the ${toolFullName} tool with an array of jq filter expressions.

Each jq expression will be applied sequentially to transform the document.

Examples of jq operations:
- Set a field: '.fieldName = "new value"'
- Add to array: '.items += [{"id": "new-item", "name": "New Item"}]'
- Update array item: '.items |= map(if .id == "item-1" then .name = "Updated" else . end)'
- Remove from array: '.items |= map(select(.id != "item-to-remove"))'
- Update nested: '.nested.field = "value"'

IMPORTANT:
- Always use the ${toolFullName} tool to submit your jq operations
- Never send text messages to the user
- Each operation must be a valid jq filter expression
- Operations are applied in order
- The final result must conform to the document schema`
}

function createUserPrompt(documentJson: string, userAsk: string, schemaJson: string): string {
  return `<document_schema>
${schemaJson}
</document_schema>

<current_document>
${documentJson}
</current_document>

<user_request>
${userAsk}
</user_request>

Analyze the current document and the user's request. Generate the jq operations needed to fulfill the request.`
}

function applyJqOperations<T>(document: T, operations: string[]): T {
  let result = document

  for (const operation of operations) {
    const input = JSON.stringify(result)
    try {
      const output = execSync(`echo '${input.replace(/'/g, "'\\''")}' | jq '${operation}'`, {
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024,
      })
      result = JSON.parse(output.trim())
    } catch (error) {
      throw new Error(`Failed to apply jq operation "${operation}": ${error}`)
    }
  }

  return result
}
