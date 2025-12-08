import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import { runDecisionAgent } from '@magik/agents'
import type { decision } from '@magik/decisions'
import { DECISIONS_DIR } from '../config'

export async function runAgent(decisionId: string, prompt: string): Promise<void> {
  const filePath = join(DECISIONS_DIR, `${decisionId}.json`)

  // Read the current decision
  const content = await readFile(filePath, 'utf-8')
  const currentDecision = JSON.parse(content) as decision

  // Run the agent with optional session ID
  const result = await runDecisionAgent(currentDecision, prompt, currentDecision.aiSessionId)

  // Update the decision with the new session ID
  result.decision.aiSessionId = result.sessionId ?? currentDecision.aiSessionId

  // Save the updated decision back to file
  await writeFile(filePath, JSON.stringify(result.decision, null, 2), 'utf-8')
}
