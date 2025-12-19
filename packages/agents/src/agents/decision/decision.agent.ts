import { decision } from '@magik/decisions'
import { z } from 'zod'
import { createTypedAgent } from '../../lib/typedAgent.js'

type Decision = z.infer<typeof decision>

export async function runDecisionAgent(
  inputDecision: Decision,
  userAsk: string,
  sessionId?: string
): Promise<{ decision: Decision; sessionId?: string }> {
  const runAgent = createTypedAgent<Decision>({
    name: 'decision',
    documentSchema: decision,
  })
  const result = await runAgent(inputDecision, userAsk, sessionId)
  return {
    decision: result.data,
    sessionId: result.sessionId,
  }
}
