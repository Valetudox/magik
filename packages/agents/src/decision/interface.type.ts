import { z } from 'zod'

// Component changes
const addComponent = z.object({
  type: z.literal('addComponent'),
  component: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
  }),
})

const updateComponent = z.object({
  type: z.literal('updateComponent'),
  componentId: z.string(),
  updates: z.object({
    name: z.string().optional(),
    description: z.string().optional(),
  }),
})

const removeComponent = z.object({
  type: z.literal('removeComponent'),
  componentId: z.string(),
})

// Decision Driver changes
const addDriver = z.object({
  type: z.literal('addDriver'),
  driver: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().max(500),
  }),
})

const updateDriver = z.object({
  type: z.literal('updateDriver'),
  driverId: z.string(),
  updates: z.object({
    name: z.string().optional(),
    description: z.string().max(500).optional(),
  }),
})

const removeDriver = z.object({
  type: z.literal('removeDriver'),
  driverId: z.string(),
})

// Option changes
const addOption = z.object({
  type: z.literal('addOption'),
  option: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().max(200),
    moreLink: z.string().url().optional(),
    architectureDiagramLink: z.string().url().optional(),
    architectureDiagramMermaid: z.string().optional(),
  }),
})

const updateOption = z.object({
  type: z.literal('updateOption'),
  optionId: z.string(),
  updates: z.object({
    name: z.string().optional(),
    description: z.string().max(200).optional(),
    moreLink: z.string().url().optional(),
    architectureDiagramLink: z.string().url().optional(),
    architectureDiagramMermaid: z.string().optional(),
  }),
})

const removeOption = z.object({
  type: z.literal('removeOption'),
  optionId: z.string(),
})

// Evaluation changes
const addEvaluation = z.object({
  type: z.literal('addEvaluation'),
  evaluation: z.object({
    optionId: z.string(),
    driverId: z.string(),
    rating: z.enum(['high', 'medium', 'low']),
    evaluationDetails: z.array(z.string()),
  }),
})

const updateEvaluation = z.object({
  type: z.literal('updateEvaluation'),
  optionId: z.string(),
  driverId: z.string(),
  updates: z.object({
    rating: z.enum(['high', 'medium', 'low']).optional(),
    evaluationDetails: z.array(z.string()).optional(),
  }),
})

const removeEvaluation = z.object({
  type: z.literal('removeEvaluation'),
  optionId: z.string(),
  driverId: z.string(),
})

// Top-level changes
const updateProblemDefinition = z.object({
  type: z.literal('updateProblemDefinition'),
  problemDefinition: z.string(),
})

const updateProposal = z.object({
  type: z.literal('updateProposal'),
  proposal: z.object({
    description: z.string(),
    reasoning: z.array(z.string()),
  }),
})

const setSelectedOption = z.object({
  type: z.literal('setSelectedOption'),
  selectedOption: z.string().optional(),
})

const setConfluenceLink = z.object({
  type: z.literal('setConfluenceLink'),
  confluenceLink: z.string().url().optional(),
})

// Discriminated union of all change types
export const decisionChange = z.discriminatedUnion('type', [
  addComponent,
  updateComponent,
  removeComponent,
  addDriver,
  updateDriver,
  removeDriver,
  addOption,
  updateOption,
  removeOption,
  addEvaluation,
  updateEvaluation,
  removeEvaluation,
  updateProblemDefinition,
  updateProposal,
  setSelectedOption,
  setConfluenceLink,
])

// Main schema for the report tool
export const decisionChangeReport = z.object({
  changes: z.array(decisionChange),
})

// Export TypeScript types
export type AddComponent = z.infer<typeof addComponent>
export type UpdateComponent = z.infer<typeof updateComponent>
export type RemoveComponent = z.infer<typeof removeComponent>
export type AddDriver = z.infer<typeof addDriver>
export type UpdateDriver = z.infer<typeof updateDriver>
export type RemoveDriver = z.infer<typeof removeDriver>
export type AddOption = z.infer<typeof addOption>
export type UpdateOption = z.infer<typeof updateOption>
export type RemoveOption = z.infer<typeof removeOption>
export type AddEvaluation = z.infer<typeof addEvaluation>
export type UpdateEvaluation = z.infer<typeof updateEvaluation>
export type RemoveEvaluation = z.infer<typeof removeEvaluation>
export type UpdateProblemDefinition = z.infer<typeof updateProblemDefinition>
export type UpdateProposal = z.infer<typeof updateProposal>
export type SetSelectedOption = z.infer<typeof setSelectedOption>
export type SetConfluenceLink = z.infer<typeof setConfluenceLink>
export type DecisionChange = z.infer<typeof decisionChange>
export type DecisionChangeReport = z.infer<typeof decisionChangeReport>
