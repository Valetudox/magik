import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import { runDecisionAgent } from '@magik/agents'
import type { decision } from '@magik/decisions'
import { DECISIONS_DIR } from '../config'

export async function runAgent(decisionId: string, prompt: string): Promise<void> {
  const filePath = join(DECISIONS_DIR, `${decisionId}.json`)

  const content = await readFile(filePath, 'utf-8')
  const currentDecision = JSON.parse(content) as decision

  const result = await runDecisionAgent(currentDecision, prompt, currentDecision.aiSessionId)

  result.decision.aiSessionId = result.sessionId ?? currentDecision.aiSessionId

  await writeFile(filePath, JSON.stringify(result.decision, null, 2), 'utf-8')
}
