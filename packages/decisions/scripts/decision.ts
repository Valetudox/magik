import { z } from 'zod'

export const component = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
})

export const useCase = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
})

export const decisionDriver = z.object({
  id: z.string(),
  name: z.string(),
  description: z
    .string()
    .max(500)
    .describe(
      'A plain text description of the decision driver. Should not contain formatting, markdown, or special characters. Maximum 500 characters.'
    ),
})

export const decisionOption = z.object({
  id: z.string(),
  name: z.string(),
  description: z
    .string()
    .max(200)
    .describe(
      'A brief, plain text description of the option. Should be concise and not contain formatting. Maximum 200 characters.'
    ),
  moreLink: z
    .string()
    .url()
    .optional()
    .describe('Optional URL link to more detailed information about this option'),
  architectureDiagramLink: z
    .string()
    .url()
    .optional()
    .describe('Optional URL link to an architecture diagram for this option'),
  architectureDiagramMermaid: z
    .string()
    .optional()
    .describe('Optional Mermaid diagram code for architecture visualization'),
})

export const evaluationRating = z.enum(['high', 'medium', 'low'])

export const evaluationRecord = z.object({
  optionId: z.string(),
  driverId: z.string(),
  rating: evaluationRating,
  evaluationDetails: z.array(z.string()),
})

export const proposal = z.object({
  description: z.string().describe('Brief description of the chosen solution'),
  reasoning: z.array(z.string()).describe('List of reasons supporting this decision'),
})

export const decision = z
  .object({
    problemDefinition: z.string(),
    components: z.array(component),
    useCases: z.array(useCase),
    decisionDrivers: z.array(decisionDriver),
    options: z.array(decisionOption),
    evaluationMatrix: z
      .array(evaluationRecord)
      .describe(
        'A complete evaluation matrix containing a score for each option/driver combination. Each option must be evaluated against every decision driver.'
      ),
    proposal: proposal,
    selectedOption: z
      .string()
      .optional()
      .describe('Optional ID of the selected option from the options array'),
    confluenceLink: z
      .string()
      .url()
      .optional()
      .describe('Optional Confluence page URL where this decision is published'),
    aiSessionId: z
      .string()
      .optional()
      .describe('Optional AI agent session ID for maintaining conversation context'),
  })
  .superRefine((data, ctx) => {
    const expectedPairs = data.options.flatMap((option) =>
      data.decisionDrivers.map((driver) => ({
        optionId: option.id,
        driverId: driver.id,
        optionName: option.name,
        driverName: driver.name,
      }))
    )

    const missingPairs = expectedPairs.filter(
      (pair) =>
        !data.evaluationMatrix.some(
          (e) => e.optionId === pair.optionId && e.driverId === pair.driverId
        )
    )

    if (missingPairs.length > 0) {
      const missingDetails = missingPairs
        .map((pair) => `"${pair.optionName}" × "${pair.driverName}"`)
        .join(', ')

      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Evaluation matrix is missing records for: ${missingDetails}`,
        path: ['evaluationMatrix'],
      })
    }
  })
