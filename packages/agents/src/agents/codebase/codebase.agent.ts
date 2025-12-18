import { anthropic } from '@ai-sdk/anthropic'
import { generateText } from 'ai'
import { createSystemPrompt } from './codebase.systemPrompt.js'
import { createCodebaseTools } from './codebase.tools.js'

export interface CodebaseAgentOptions {
  basePath: string
  query: string
  model?: 'claude-opus-4-20250514' | 'claude-sonnet-4-20250514' | 'claude-3-5-haiku-20241022'
  onStepFinish?: (step: any) => void
}

export interface CodebaseAgentResult {
  response: string
  toolCalls: {
    tool: string
    args: any
  }[]
}

export async function runCodebaseAgent(
  options: CodebaseAgentOptions
): Promise<CodebaseAgentResult> {
  const { basePath, query, model = 'claude-sonnet-4-20250514', onStepFinish } = options

  const tools = createCodebaseTools(basePath)
  const toolCalls: CodebaseAgentResult['toolCalls'] = []

  const result = await generateText({
    model: anthropic(model),
    system: createSystemPrompt(basePath),
    messages: [
      {
        role: 'user',
        content: query,
      },
    ],
    tools,
    maxSteps: 150,
    onStepFinish: (event) => {
      if (event.toolCalls && event.toolCalls.length > 0) {
        for (const toolCall of event.toolCalls) {
          console.log(`\n🔧 Tool: ${toolCall.toolName}`)
          console.log(`   Args: ${JSON.stringify(toolCall.args)}`)
        }
      }

      if (onStepFinish) {
        onStepFinish(event)
      }
    },
  })

  for (const step of result.steps) {
    if (step.toolCalls) {
      for (const toolCall of step.toolCalls) {
        toolCalls.push({
          tool: toolCall.toolName,
          args: toolCall.args,
        })
      }
    }
  }

  return {
    response: result.text,
    toolCalls,
  }
}
