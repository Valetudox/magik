import { createSdkMcpServer, tool } from '@anthropic-ai/claude-agent-sdk'
import { tableDocumentChangeReport } from './interface.type.js'

export const SERVER_NAME = 'tabledocument_reporter_server'
export const TOOL_NAME = 'report'
export const TOOL_FULL_NAME = `mcp__${SERVER_NAME}__${TOOL_NAME}`

export function createTableDocumentReporterServer() {
  return createSdkMcpServer({
    name: SERVER_NAME,
    version: '1.0.0',
    tools: [
      tool(
        TOOL_NAME,
        'Submit the table document changes according to the provided schema. Use this tool to report all modifications to the table document.',
        {
          data: tableDocumentChangeReport,
        },
        async (_args: any): Promise<any> => {
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
