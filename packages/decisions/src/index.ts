import { z } from 'zod'
import {
  component as componentSchema,
  decisionDriver as decisionDriverSchema,
  decisionOption as decisionOptionSchema,
  evaluationRating as evaluationRatingSchema,
  evaluationRecord as evaluationRecordSchema,
  proposal as proposalSchema,
  decision as decisionSchema,
} from '../scripts/decision.js'

// Re-export schemas
export {
  componentSchema as component,
  decisionDriverSchema as decisionDriver,
  decisionOptionSchema as decisionOption,
  evaluationRatingSchema as evaluationRating,
  evaluationRecordSchema as evaluationRecord,
  proposalSchema as proposal,
  decisionSchema as decision,
}

// Export TypeScript types
export type component = z.infer<typeof componentSchema>
export type decisionDriver = z.infer<typeof decisionDriverSchema>
export type decisionOption = z.infer<typeof decisionOptionSchema>
export type evaluationRating = z.infer<typeof evaluationRatingSchema>
export type evaluationRecord = z.infer<typeof evaluationRecordSchema>
export type proposal = z.infer<typeof proposalSchema>
export type decision = z.infer<typeof decisionSchema>
