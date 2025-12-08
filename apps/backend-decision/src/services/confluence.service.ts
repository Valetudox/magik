import { spawn } from 'child_process'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { DECISIONS_DIR, JIRA_USERNAME, JIRA_TOKEN } from '../config'

export interface ConfluenceUploadResult {
  success: boolean
  message?: string
  output?: string
  error?: string
  details?: string
}

export async function pushToConfluence(
  decisionId: string,
  confluenceUrl: string
): Promise<ConfluenceUploadResult> {
  // Check if decision exists
  const filePath = join(DECISIONS_DIR, `${decisionId}.json`)
  await readFile(filePath, 'utf-8') // This will throw if file doesn't exist

  // Check environment variables
  if (!JIRA_USERNAME || !JIRA_TOKEN) {
    throw new Error('JIRA_USERNAME and JIRA_TOKEN environment variables are required')
  }

  const uploadScript = join(process.cwd(), '../../packages/decisions/scripts/uploadToConfluence.ts')

  // Execute the upload script
  return new Promise((resolve, reject) => {
    const proc = spawn('bun', [uploadScript, '--url', confluenceUrl, filePath], {
      env: {
        JIRA_USERNAME,
        JIRA_TOKEN,
      },
      stdio: 'pipe',
    })

    let stdout = ''
    let stderr = ''

    proc.stdout.on('data', (data: Buffer) => {
      stdout += data.toString()
    })

    proc.stderr.on('data', (data: Buffer) => {
      stderr += data.toString()
    })

    proc.on('close', (code) => {
      if (code === 0) {
        resolve({
          success: true,
          message: 'Successfully pushed to Confluence',
          output: stdout,
        })
      } else {
        resolve({
          success: false,
          error: 'Failed to push to Confluence',
          details: stderr.length > 0 ? stderr : stdout,
        })
      }
    })

    proc.on('error', (error) => {
      reject(new Error(`Failed to execute upload script: ${error.message}`))
    })
  })
}
