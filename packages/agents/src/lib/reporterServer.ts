import { createSdkMcpServer, tool } from '@anthropic-ai/claude-agent-sdk'
import { z } from 'zod'

export const TOOL_NAME = 'report'

/**
 * Get the full MCP tool name for an agent's report tool
 */
export function getToolFullName(agentName: string): string {
  return `mcp__${agentName}_reporter_server__${TOOL_NAME}`
}

export type ReporterServerConfig = {
  /** Name of the MCP server */
  serverName: string
  /** Tool description */
  description?: string
}

/** Schema for jq operations */
const jqOperationsSchema = {
  operations: z.array(z.string()).describe('Array of jq filter expressions to apply sequentially'),
}

/**
 * Creates a reporter MCP server that accepts jq operations.
 */
export function createReporterServer(config: ReporterServerConfig) {
  const {
    serverName,
    description = 'Submit jq operations to transform the document.',
  } = config

  return createSdkMcpServer({
    name: serverName,
    version: '1.0.0',
    tools: [
      tool(
        TOOL_NAME,
        description,
        jqOperationsSchema,
        async (_args: unknown): Promise<{ content: { type: string; text: string }[]; isError: boolean }> => {
          return {
            content: [
              {
                type: 'text',
                text: 'Successfully reported!',
              },
            ],
            isError: false,
          }
        }
      ),
    ],
  })
}
