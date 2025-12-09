import { z } from 'zod'

/**
 * Schema for a single table row entry
 */
export const tableRow = z.object({
  use_case: z.string().describe('Description of the use case'),
  diagram: z.string().optional().describe('Mermaid diagram code'),
  required_context: z.array(z.string()).optional().describe('List of required context items'),
  required_tools: z.array(z.string()).optional().describe('List of required tools'),
  potential_interactions: z.array(z.string()).optional().describe('List of potential user interactions'),
  notes: z.array(z.string()).optional().describe('List of notes'),
})

/**
 * Schema for the complete table document
 */
export const tableDocument = z.object({
  confluence_url: z.string().url().describe('Confluence page URL'),
  table: z.array(tableRow).describe('Array of table rows'),
})

export type TableRow = z.infer<typeof tableRow>
export type TableDocument = z.infer<typeof tableDocument>
