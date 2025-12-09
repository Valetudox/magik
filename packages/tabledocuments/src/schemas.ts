import { z } from 'zod'

/**
 * Schema for a single table row (use case entry)
 */
export const tableRowSchema = z.object({
  id: z.string().describe('Unique identifier for the use case'),
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
export const tableDocumentSchema = z.object({
  confluence_url: z.string().url().optional().describe('Confluence page URL'),
  table: z.array(tableRowSchema).describe('Array of table rows (use cases)'),
  aiSessionId: z.string().optional().describe('AI agent session ID for continuity'),
})

/**
 * Schema for table document summary (used in list views)
 */
export const tableDocumentSummarySchema = z.object({
  id: z.string().describe('Document identifier (filename without extension)'),
  name: z.string().describe('Document name'),
  directory: z.string().describe('Relative directory path'),
  useCaseCount: z.number().describe('Number of use cases in the document'),
  createdAt: z.string().datetime().describe('Creation timestamp'),
  updatedAt: z.string().datetime().describe('Last update timestamp'),
  confluence_url: z.string().url().optional().describe('Confluence page URL if linked'),
})

/**
 * TypeScript types inferred from Zod schemas
 */
export type TableRow = z.infer<typeof tableRowSchema>
export type TableDocument = z.infer<typeof tableDocumentSchema>
export type TableDocumentSummary = z.infer<typeof tableDocumentSummarySchema>
