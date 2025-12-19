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
    const initialPrompt = createUserPrompt(inputJson, userAsk, documentJsonSchema)

    return executeWithRetry({
      input,
      prompt: initialPrompt,
      sessionId,
      iteration: 0,
      serverName,
      toolFullName,
      systemPrompt,
      model,
      documentSchema,
      name,
    })
  }

  async function executeWithRetry(context: {
    input: TDocument
    prompt: string
    sessionId?: string
    iteration: number
    serverName: string
    toolFullName: string
    systemPrompt: string
    model: string
    documentSchema: ZodSchema<TDocument>
    name: string
  }): Promise<TypedAgentResult<TDocument>> {
    const { input, prompt, sessionId, iteration, serverName, toolFullName, systemPrompt, model, documentSchema, name } = context

    if (iteration >= MAX_ITERATIONS) {
      throw new Error(`Failed after ${MAX_ITERATIONS} iterations. Unable to generate valid document.`)
    }

    const shouldResume = sessionId && sessionExists(sessionId)
    const server = createReporterServer({
      serverName,
      description: `Submit jq operations to transform the ${name} document.`,
    })

    const { operations, newSessionId } = await queryAgent({
      prompt,
      model,
      shouldResume,
      sessionId,
      serverName,
      server,
      toolFullName,
      systemPrompt,
    })

    if (!operations || operations.length === 0) {
      const error = new Error('No jq operations were reported by the agent!')
      return executeWithRetry({
        ...context,
        prompt: createRetryPrompt(error),
        sessionId: newSessionId,
        iteration: iteration + 1,
      })
    }

    try {
      const transformedData = applyJqOperations(input, operations)
      const validatedData = documentSchema.parse(transformedData)

      return {
        data: validatedData,
        sessionId: newSessionId,
      }
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error))
      return executeWithRetry({
        ...context,
        prompt: createRetryPrompt(errorObj),
        sessionId: newSessionId,
        iteration: iteration + 1,
      })
    }
  }
}

async function queryAgent(params: {
  prompt: string
  model: string
  shouldResume: boolean
  sessionId?: string
  serverName: string
  server: Awaited<ReturnType<typeof createReporterServer>>
  toolFullName: string
  systemPrompt: string
}): Promise<{ operations: string[] | null; newSessionId?: string }> {
  const { prompt, model, shouldResume, sessionId, serverName, server, toolFullName, systemPrompt } = params

  const stream = query({
    prompt,
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

    if (message.type === 'assistant') {
      const parsedOperations = extractOperationsFromMessage(message, toolFullName)
      if (parsedOperations) {
        operations = parsedOperations
      }
    }
  }

  return { operations, newSessionId }
}

function extractOperationsFromMessage(message: unknown, toolFullName: string): string[] | null {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
  const content = (message as any).message?.content
  if (!Array.isArray(content)) {
    return null
  }

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
      return toolInput.operations
    }
  }

  return null
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
