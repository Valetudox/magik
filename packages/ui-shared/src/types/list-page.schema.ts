import { z } from 'zod'

/**
 * Zod schemas for list page configuration with discriminated unions
 * to prevent invalid states at runtime
 */

// ============================================================================
// Base Schemas
// ============================================================================

/**
 * Field formatter function schema
 * Note: Functions can't be fully validated by Zod, so we use z.function()
 */
const fieldFormatterSchema = z.function()

/**
 * Field renderer function schema
 */
const fieldRendererSchema = z.function()

/**
 * Field configuration for table columns
 */
export const listFieldConfigSchema = z.object({
  key: z.string().min(1),
  title: z.string().min(1),
  sortable: z.boolean().optional(),
  align: z.enum(['start', 'center', 'end']).optional(),
  formatter: fieldFormatterSchema.optional(),
  renderer: fieldRendererSchema.optional(),
  width: z.union([z.string(), z.number()]).optional(),
}).refine(
  (data) => !(data.formatter && data.renderer),
  {
    message: 'Cannot use both formatter and renderer on the same field',
    path: ['formatter'],
  }
)

// ============================================================================
// Row Actions (Discriminated Union)
// ============================================================================

const rowActionViewSchema = z.object({
  type: z.literal('view'),
  icon: z.string().min(1),
  title: z.string().min(1),
  onClick: z.function().optional(),
  disabled: z.function().optional(),
  color: z.string().optional(),
})

const rowActionDeleteSchema = z.object({
  type: z.literal('delete'),
  icon: z.string().min(1),
  title: z.string().min(1),
  onClick: z.function().optional(),
  disabled: z.function().optional(),
  color: z.string().optional(),
})

const rowActionCustomSchema = z.object({
  type: z.literal('custom'),
  icon: z.string().min(1),
  title: z.string().min(1),
  onClick: z.function(),
  disabled: z.function().optional(),
  color: z.string().optional(),
})

export const rowActionConfigSchema = z.discriminatedUnion('type', [
  rowActionViewSchema,
  rowActionDeleteSchema,
  rowActionCustomSchema,
])

// ============================================================================
// Bulk Actions (Discriminated Union)
// ============================================================================

const bulkActionDeleteSchema = z.object({
  type: z.literal('delete'),
  label: z.string().min(1),
  icon: z.string().min(1),
  onClick: z.function().optional(),
  disabled: z.function().optional(),
  color: z.string().optional(),
})

const bulkActionCustomSchema = z.object({
  type: z.literal('custom'),
  label: z.string().min(1),
  icon: z.string().min(1),
  onClick: z.function(),
  disabled: z.function().optional(),
  color: z.string().optional(),
})

export const bulkActionConfigSchema = z.discriminatedUnion('type', [
  bulkActionDeleteSchema,
  bulkActionCustomSchema,
])

// ============================================================================
// Endpoints
// ============================================================================

export const endpointConfigSchema = z.object({
  list: z.function(),
  create: z.function().optional(),
  delete: z.function().optional(),
})

// ============================================================================
// Page URLs
// ============================================================================

export const pageUrlConfigSchema = z.object({
  edit: z.function().optional(),
  create: z.string().optional(),
})

// ============================================================================
// Create Action (Discriminated Union)
// ============================================================================

const createActionDisabledSchema = z.object({
  enabled: z.literal(false),
})

const createActionWithDialogSchema = z.object({
  enabled: z.literal(true),
  label: z.string().optional(),
  useDialog: z.literal(true).optional().default(true),
  dialogTitle: z.string().optional(),
  dialogComponent: z.any().optional(), // Vue Component
  onCreate: z.function().optional(),
})

const createActionWithUrlSchema = z.object({
  enabled: z.literal(true),
  label: z.string().optional(),
  useDialog: z.literal(false),
  onCreate: z.function().optional(),
})

export const createActionConfigSchema = z.discriminatedUnion('enabled', [
  createActionDisabledSchema,
  createActionWithDialogSchema,
  createActionWithUrlSchema,
])

// ============================================================================
// Delete Dialog
// ============================================================================

export const deleteDialogConfigSchema = z.object({
  confirmMessage: z.function().optional(),
  bulkConfirmMessage: z.function().optional(),
})

// ============================================================================
// Socket Configuration (Discriminated Union)
// ============================================================================

const socketDisabledSchema = z.object({
  enabled: z.literal(false),
})

const socketHandlersSchema = z.object({
  onUpdated: z.function().optional(),
  onAdded: z.function().optional(),
  onDeleted: z.function().optional(),
})

const socketEnabledSchema = z.object({
  enabled: z.literal(true),
  initSocket: z.function().optional(),
  handlers: socketHandlersSchema,
})

export const socketConfigSchema = z.discriminatedUnion('enabled', [
  socketDisabledSchema,
  socketEnabledSchema,
])

// ============================================================================
// Selection Configuration (Discriminated Union)
// ============================================================================

/**
 * When selection is disabled, bulk actions must not be defined
 */
const selectionDisabledSchema = z.object({
  enableSelection: z.union([z.literal(false), z.undefined()]),
  bulkActions: z.undefined(),
})

/**
 * When selection is enabled, bulk actions can be defined
 */
const selectionEnabledSchema = z.object({
  enableSelection: z.literal(true),
  bulkActions: z.array(bulkActionConfigSchema).optional(),
})

export const selectionConfigSchema = z.discriminatedUnion('enableSelection', [
  selectionDisabledSchema,
  selectionEnabledSchema,
])

// ============================================================================
// Main List Page Configuration
// ============================================================================

/**
 * Base configuration that all variants share
 */
const baseConfigSchema = z.object({
  entityId: z.string().min(1),
  entityName: z.string().min(1),
  entityNamePlural: z.string().min(1),
  fields: z.array(listFieldConfigSchema).min(1),
  rowActions: z.array(rowActionConfigSchema).optional(),
  createAction: createActionConfigSchema.optional(),
  endpoints: endpointConfigSchema,
  pageUrls: pageUrlConfigSchema.optional(),
  deleteDialog: deleteDialogConfigSchema.optional(),
  socket: socketConfigSchema.optional(),
  enableSearch: z.boolean().optional(),
  itemsPerPage: z.number().int().positive().optional(),
  defaultSort: z.array(z.object({
    key: z.string(),
    order: z.enum(['asc', 'desc']),
  })).optional(),
})

/**
 * Configuration without selection (no bulk actions allowed)
 */
const listPageConfigWithoutSelectionSchema = baseConfigSchema.extend({
  enableSelection: z.union([z.literal(false), z.undefined()]),
  bulkActions: z.undefined(),
})

/**
 * Configuration with selection (bulk actions allowed)
 */
const listPageConfigWithSelectionSchema = baseConfigSchema.extend({
  enableSelection: z.literal(true),
  bulkActions: z.array(bulkActionConfigSchema).optional(),
})

/**
 * Main list page configuration schema (discriminated union)
 */
export const listPageConfigSchema = z.discriminatedUnion('enableSelection', [
  listPageConfigWithoutSelectionSchema,
  listPageConfigWithSelectionSchema,
])
  .refine(
    (data) => {
      // If any row action is 'delete', endpoints.delete must be defined
      const hasDeleteRowAction = data.rowActions?.some(action => action.type === 'delete')
      if (hasDeleteRowAction && !data.endpoints.delete) {
        return false
      }
      return true
    },
    {
      message: 'Row action type "delete" requires endpoints.delete to be defined',
      path: ['endpoints', 'delete'],
    }
  )
  .refine(
    (data) => {
      // If any bulk action is 'delete', endpoints.delete must be defined
      const hasDeleteBulkAction = data.bulkActions?.some(action => action.type === 'delete')
      if (hasDeleteBulkAction && !data.endpoints.delete) {
        return false
      }
      return true
    },
    {
      message: 'Bulk action type "delete" requires endpoints.delete to be defined',
      path: ['endpoints', 'delete'],
    }
  )
  .refine(
    (data) => {
      // If createAction uses dialog=false, pageUrls.create must be defined
      if (data.createAction?.enabled && 'useDialog' in data.createAction && data.createAction.useDialog === false) {
        if (!data.pageUrls?.create) {
          return false
        }
      }
      return true
    },
    {
      message: 'createAction with useDialog=false requires pageUrls.create to be defined',
      path: ['pageUrls', 'create'],
    }
  )

// ============================================================================
// Bulk Operation (used separately, not part of ListPageConfig)
// ============================================================================

export const bulkOperationResultSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    id: z.string(),
    name: z.string(),
  }),
  z.object({
    success: z.literal(false),
    id: z.string(),
    name: z.string(),
    error: z.string(),
  }),
])

export const bulkOperationConfigSchema = z.object({
  operation: z.function(),
  title: z.string().min(1),
  resultsTitle: z.string().min(1),
})

// ============================================================================
// Exported Types (derived from Zod schemas)
// ============================================================================

export type ListFieldConfig<T = any> = z.infer<typeof listFieldConfigSchema>
export type RowActionConfig<T = any> = z.infer<typeof rowActionConfigSchema>
export type BulkActionConfig<T = any> = z.infer<typeof bulkActionConfigSchema>
export type EndpointConfig = z.infer<typeof endpointConfigSchema>
export type PageUrlConfig<T = any> = z.infer<typeof pageUrlConfigSchema>
export type CreateActionConfig = z.infer<typeof createActionConfigSchema>
export type DeleteDialogConfig = z.infer<typeof deleteDialogConfigSchema>
export type SocketConfig<T = any> = z.infer<typeof socketConfigSchema>
export type ListPageConfig<T = any> = z.infer<typeof listPageConfigSchema>
export type BulkOperationResult = z.infer<typeof bulkOperationResultSchema>
export type BulkOperationConfig<T = any> = z.infer<typeof bulkOperationConfigSchema>
