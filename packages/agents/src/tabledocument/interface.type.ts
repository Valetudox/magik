import { z } from 'zod'

// Use case changes
const addUseCase = z.object({
  type: z.literal('addUseCase'),
  useCase: z.object({
    id: z.string(),
    use_case: z.string(),
    diagram: z.string().optional(),
    required_context: z.array(z.string()).optional(),
    required_tools: z.array(z.string()).optional(),
    potential_interactions: z.array(z.string()).optional(),
    notes: z.array(z.string()).optional(),
  }),
})

const updateUseCase = z.object({
  type: z.literal('updateUseCase'),
  useCaseId: z.string(),
  updates: z.object({
    use_case: z.string().optional(),
    diagram: z.string().optional(),
    required_context: z.array(z.string()).optional(),
    required_tools: z.array(z.string()).optional(),
    potential_interactions: z.array(z.string()).optional(),
    notes: z.array(z.string()).optional(),
  }),
})

const removeUseCase = z.object({
  type: z.literal('removeUseCase'),
  useCaseId: z.string(),
})

// Table document level changes
const setConfluenceUrl = z.object({
  type: z.literal('setConfluenceUrl'),
  url: z.string().url(),
})

// Discriminated union of all change types
export const tableDocumentChange = z.discriminatedUnion('type', [
  addUseCase,
  updateUseCase,
  removeUseCase,
  setConfluenceUrl,
])

// Main schema for the report tool
export const tableDocumentChangeReport = z.object({
  changes: z.array(tableDocumentChange),
})

// Export TypeScript types
export type AddUseCase = z.infer<typeof addUseCase>
export type UpdateUseCase = z.infer<typeof updateUseCase>
export type RemoveUseCase = z.infer<typeof removeUseCase>
export type SetConfluenceUrl = z.infer<typeof setConfluenceUrl>
export type TableDocumentChange = z.infer<typeof tableDocumentChange>
export type TableDocumentChangeReport = z.infer<typeof tableDocumentChangeReport>
