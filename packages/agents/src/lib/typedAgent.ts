import { execSync } from 'child_process'
import { query } from '@anthropic-ai/claude-agent-sdk'
import type { ZodSchema } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'
import { createReporterServer, TOOL_NAME } from './reporterServer.js'
import { sessionExists } from './sessionManager.js'

export interface TypedAgentConfig<TDocument> {
  /** Name of the agent (used for server naming) */
  name: string
  /** Zod schema for the document */
  documentSchema: ZodSchema<TDocument>
  /** Model to use (default: claude-haiku-4-5) */
  model?: string
}

export interface TypedAgentResult<TDocument> {
  data: TDocument
  sessionId?: string
}

const MAX_ITERATIONS = 5

/**
 * Factory function that creates a typed agent with consistent configuration.
 * Uses jq for document transformations.
 *
 * Features:
 * - Automatically retries on parse errors (up to MAX_ITERATIONS)
 * - Continues session and asks agent to fix data on validation failures
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
    let currentSessionId = sessionId
    let lastError: Error | null = null

    for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
      const shouldResume = currentSessionId && sessionExists(currentSessionId)

      const server = createReporterServer({
        serverName,
        description: `Submit jq operations to transform the ${name} document.`,
      })

      // Build the prompt based on whether this is a retry
      let prompt: string
      if (iteration === 0) {
        prompt = createUserPrompt(inputJson, userAsk, documentJsonSchema)
      } else {
        prompt = createRetryPrompt(lastError!)
      }

      const stream = query({
        prompt,
        options: {
          model,
          ...(shouldResume && { resume: currentSessionId }),
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

        if (message.type === 'assistant') {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
          const content = (message as any).message?.content
          if (Array.isArray(content)) {
            for (const item of content) {
              if (
                typeof item === 'object' &&
                item !== null &&
                'type' in item &&
                (item as { type: unknown }).type === 'tool_use' &&
                'name' in item &&
                (item as { name: unknown }).name === toolFullName &&
                'input' in item
              ) {
                const toolInput = (item as { input: { operations: string[] } }).input
                operations = toolInput.operations
                break
              }
            }
          }
        }
      }

      // Update session ID for potential retry
      if (newSessionId) {
        currentSessionId = newSessionId
      }

      if (!operations || operations.length === 0) {
        lastError = new Error('No jq operations were reported by the agent!')
        continue
      }

      try {
        // Apply jq operations
        const result = applyJqOperations(input, operations)

        // Validate with Zod
        const validated = documentSchema.parse(result)

        return {
          data: validated,
          sessionId: currentSessionId,
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        // Continue to next iteration to retry
      }
    }

    // If we've exhausted all iterations, throw the last error
    throw new Error(
      `Failed after ${MAX_ITERATIONS} iterations. Last error: ${lastError?.message ?? 'Unknown error'}`
    )
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

function createRetryPrompt(error: Error): string {
  return `<error>
The previous operations failed with the following error:
${error.message}
</error>

Please fix the jq operations and try again. Make sure:
1. All jq expressions are valid
2. The resulting document conforms to the schema
3. All required fields are present with correct types`
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
      result = JSON.parse(output.trim()) as T
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      throw new Error(`Failed to apply jq operation "${operation}": ${errorMessage}`)
    }
  }

  return result
}
