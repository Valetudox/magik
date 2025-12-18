import { z } from 'zod'

const socketDisabledSchema = z.object({
  enabled: z.literal(false),
}).describe('Socket.IO disabled')

const socketEnabledSchema = z.object({
  enabled: z.literal(true),
  initSocket: z.function({
    input: [],
    output: z.void()
  }).optional().describe('Function to initialize socket connection'),
  onUpdated: z.function({
    input: [z.function({
      input: [z.object({ id: z.string() }).passthrough()],
      output: z.void()
    })],
    output: z.function({ input: [], output: z.void() })
  }).describe('Handler for entity update events, returns unsubscribe function'),
}).describe('Socket.IO enabled with update handler')

export const detailSocketConfigSchema = z.discriminatedUnion('enabled', [
  socketDisabledSchema,
  socketEnabledSchema,
]).describe('Socket.IO configuration for detail pages')

const agentDisabledSchema = z.object({
  enabled: z.literal(false),
}).describe('Agent input disabled')

const agentEnabledSchema = z.object({
  enabled: z.literal(true),
  placeholder: z.string().optional().describe('Placeholder text for agent input'),
  onSubmit: z.function({
    input: [z.string()],
    output: z.promise(z.void())
  }).describe('Handler for agent prompt submission'),
}).describe('Agent input enabled')

export const detailAgentConfigSchema = z.discriminatedUnion('enabled', [
  agentDisabledSchema,
  agentEnabledSchema,
]).describe('Agent input configuration for detail pages')

export const detailPageConfigSchema = z.object({
  // Page metadata
  pageTitle: z.string().min(1).describe('Title displayed in breadcrumbs'),
  goBackUrl: z.string().min(1).describe('URL to navigate back to'),

  // Entity identification
  entityId: z.string().min(1).describe('The ID of the entity being viewed'),

  // Data fetching
  getEntity: z.function({
    input: [z.string()],
    output: z.promise(z.any())
  }).describe('Function to fetch entity by ID'),

  // Subtitle generation
  getSubtitle: z.function({
    input: [z.any()],
    output: z.string()
  }).describe('Function to generate subtitle from entity data'),

  // Callback when entity loads or updates
  onLoad: z.function({
    input: [z.any()],
    output: z.void()
  }).describe('Callback when entity is loaded or updated'),

  // Socket configuration
  socket: detailSocketConfigSchema.optional(),

  // Agent configuration
  agent: detailAgentConfigSchema.optional(),
}).describe('Configuration for detail page')

export type DetailSocketConfig = z.infer<typeof detailSocketConfigSchema>
export type DetailAgentConfig = z.infer<typeof detailAgentConfigSchema>
export type DetailPageConfig<_T = any> = z.infer<typeof detailPageConfigSchema>
