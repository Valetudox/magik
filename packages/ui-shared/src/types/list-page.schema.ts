import { z } from 'zod'

const fieldFormatterSchema = z.function({
  input: [z.any(), z.any()],
  output: z.union([z.string(), z.number(), z.boolean()])
}).describe('Transforms raw field value to string, number, or boolean for display')

const fieldRendererSchema = z.function({
  input: [z.any(), z.any()],
  output: z.any()
}).describe('Returns VNode or Component for custom field rendering')

export const listFieldConfigSchema = z.object({
  key: z.string().min(1).describe('Property key from entity data'),
  title: z.string().min(1).describe('Column header text'),
  sortable: z.boolean().optional().describe('Enable column sorting'),
  align: z.enum(['start', 'center', 'end']).optional().describe('Column alignment'),
  formatter: fieldFormatterSchema.optional(),
  renderer: fieldRendererSchema.optional(),
  width: z.union([z.string(), z.number()]).optional().describe('Column width'),
}).describe('Field configuration for table columns')
  .refine(
    (data) => !(data.formatter && data.renderer),
    { message: 'Cannot use both formatter and renderer on the same field', path: ['formatter'] }
  )

const rowActionViewSchema = z.object({
  type: z.literal('view'),
  icon: z.string().min(1).describe('MDI icon name'),
  title: z.string().min(1).describe('Action title/tooltip'),
  onClick: z.function({
    input: [z.any()],
    output: z.union([z.void(), z.promise(z.void())])
  }).optional().describe('Custom click handler'),
  disabled: z.function({
    input: [z.any()],
    output: z.boolean()
  }).optional().describe('Function returning disabled state'),
  color: z.string().optional().describe('Action color'),
}).describe('View/edit action that navigates to detail page')

const rowActionDeleteSchema = z.object({
  type: z.literal('delete'),
  icon: z.string().min(1),
  title: z.string().min(1),
  onClick: z.function({
    input: [z.any()],
    output: z.union([z.void(), z.promise(z.void())])
  }).optional(),
  disabled: z.function({
    input: [z.any()],
    output: z.boolean()
  }).optional(),
  color: z.string().optional(),
}).describe('Delete action that shows confirmation dialog')

const rowActionCustomSchema = z.object({
  type: z.literal('custom'),
  icon: z.string().min(1),
  title: z.string().min(1),
  onClick: z.function({
    input: [z.any()],
    output: z.union([z.void(), z.promise(z.void())])
  }).describe('Required click handler for custom actions'),
  disabled: z.function({
    input: [z.any()],
    output: z.boolean()
  }).optional(),
  color: z.string().optional(),
}).describe('Custom action with user-defined onClick handler')

export const rowActionConfigSchema = z.discriminatedUnion('type', [
  rowActionViewSchema,
  rowActionDeleteSchema,
  rowActionCustomSchema,
]).describe('Row action configuration discriminated by type')

const bulkActionDeleteSchema = z.object({
  type: z.literal('delete'),
  label: z.string().min(1).describe('Action button label'),
  icon: z.string().min(1),
  onClick: z.function({
    input: [z.array(z.string()), z.array(z.any())],
    output: z.union([z.void(), z.promise(z.void())])
  }).optional(),
  disabled: z.function({
    input: [z.array(z.string()), z.array(z.any())],
    output: z.boolean()
  }).optional(),
  color: z.string().optional(),
}).describe('Bulk delete action for selected items')

const bulkActionCustomSchema = z.object({
  type: z.literal('custom'),
  label: z.string().min(1),
  icon: z.string().min(1),
  onClick: z.function({
    input: [z.array(z.string()), z.array(z.any())],
    output: z.union([z.void(), z.promise(z.void())])
  }).describe('Required handler receiving selectedIds and items'),
  disabled: z.function({
    input: [z.array(z.string()), z.array(z.any())],
    output: z.boolean()
  }).optional(),
  color: z.string().optional(),
}).describe('Custom bulk action with user-defined onClick handler')

export const bulkActionConfigSchema = z.discriminatedUnion('type', [
  bulkActionDeleteSchema,
  bulkActionCustomSchema,
]).describe('Bulk action configuration discriminated by type')

export const endpointConfigSchema = z.object({
  list: z.function({
    input: [],
    output: z.promise(z.array(z.any()))
  }).describe('Function returning Promise<T[]> to fetch all items'),
  create: z.function({
    input: [z.any()],
    output: z.promise(z.object({ id: z.string() }).passthrough())
  }).optional().describe('Function to create new item, returns Promise<{id: string}>'),
  delete: z.function({
    input: [z.string()],
    output: z.promise(z.void())
  }).optional().describe('Function to delete item by id, returns Promise<void>'),
}).describe('API endpoint functions for CRUD operations')

export const pageUrlConfigSchema = z.object({
  edit: z.function({
    input: [z.any()],
    output: z.string()
  }).optional().describe('Function generating detail/edit page URL from item'),
  create: z.string().optional().describe('URL for create page (when not using dialog)'),
}).describe('Navigation URLs for pages')

const createActionDisabledSchema = z.object({
  enabled: z.literal(false),
}).describe('Create action disabled')

const createActionWithDialogSchema = z.object({
  enabled: z.literal(true),
  label: z.string().optional().describe('Button label'),
  useDialog: z.literal(true).optional().default(true).describe('Use dialog for creation'),
  dialogTitle: z.string().optional(),
  dialogComponent: z.any().optional().describe('Custom Vue component for dialog'),
  onCreate: z.function({
    input: [z.any()],
    output: z.union([z.void(), z.promise(z.void())])
  }).optional().describe('Callback when item is created'),
}).describe('Create action using dialog')

const createActionWithUrlSchema = z.object({
  enabled: z.literal(true),
  label: z.string().optional(),
  useDialog: z.literal(false).describe('Navigate to URL instead of dialog'),
  onCreate: z.function({
    input: [z.any()],
    output: z.union([z.void(), z.promise(z.void())])
  }).optional(),
}).describe('Create action navigating to URL (requires pageUrls.create)')

export const createActionConfigSchema = z.discriminatedUnion('enabled', [
  createActionDisabledSchema,
  createActionWithDialogSchema,
  createActionWithUrlSchema,
]).describe('Create action configuration discriminated by enabled state')

export const deleteDialogConfigSchema = z.object({
  confirmMessage: z.function({
    input: [z.any()],
    output: z.string()
  }).optional().describe('Custom confirmation message for single delete'),
  bulkConfirmMessage: z.function({
    input: [z.number()],
    output: z.string()
  }).optional().describe('Custom confirmation message for bulk delete'),
}).describe('Delete dialog customization')

const socketDisabledSchema = z.object({
  enabled: z.literal(false),
}).describe('Socket.IO disabled')

const socketHandlersSchema = z.object({
  onUpdated: z.function({
    input: [z.function({
      input: [z.object({ id: z.string() }).passthrough()],
      output: z.void()
    })],
    output: z.function({ input: [], output: z.void() })
  }).optional().describe('Handler for item update events'),
  onAdded: z.function({
    input: [z.function({
      input: [z.object({ id: z.string() }).passthrough()],
      output: z.void()
    })],
    output: z.function({ input: [], output: z.void() })
  }).optional().describe('Handler for item add events'),
  onDeleted: z.function({
    input: [z.function({
      input: [z.object({ id: z.string() })],
      output: z.void()
    })],
    output: z.function({ input: [], output: z.void() })
  }).optional().describe('Handler for item delete events'),
}).describe('Socket.IO event handlers')

const socketEnabledSchema = z.object({
  enabled: z.literal(true),
  initSocket: z.function({
    input: [],
    output: z.void()
  }).optional().describe('Function to initialize socket connection'),
  handlers: socketHandlersSchema.describe('Event handlers required when socket enabled'),
}).describe('Socket.IO enabled with handlers')

export const socketConfigSchema = z.discriminatedUnion('enabled', [
  socketDisabledSchema,
  socketEnabledSchema,
]).describe('Socket.IO configuration discriminated by enabled state')

const baseConfigSchema = z.object({
  entityId: z.string().min(1).describe('Property name used as unique identifier'),
  entityName: z.string().min(1).describe('Singular entity display name'),
  entityNamePlural: z.string().min(1).describe('Plural entity display name'),
  fields: z.array(listFieldConfigSchema).min(1).describe('Field/column configurations'),
  rowActions: z.array(rowActionConfigSchema).optional().describe('Per-row action buttons'),
  createAction: createActionConfigSchema.optional(),
  endpoints: endpointConfigSchema,
  pageUrls: pageUrlConfigSchema.optional(),
  deleteDialog: deleteDialogConfigSchema.optional(),
  socket: socketConfigSchema.optional(),
  enableSearch: z.boolean().optional().describe('Show search field'),
  itemsPerPage: z.number().int().positive().optional().describe('Rows per page'),
  defaultSort: z.array(z.object({
    key: z.string(),
    order: z.enum(['asc', 'desc']),
  })).optional().describe('Default sort configuration'),
}).describe('Base configuration shared by all list page variants')

const listPageConfigWithoutSelectionSchema = baseConfigSchema.extend({
  enableSelection: z.union([z.literal(false), z.undefined()]),
  bulkActions: z.undefined(),
}).describe('List page without selection (bulk actions not allowed)')

const listPageConfigWithSelectionSchema = baseConfigSchema.extend({
  enableSelection: z.literal(true),
  bulkActions: z.array(bulkActionConfigSchema).optional(),
}).describe('List page with selection (bulk actions allowed)')

export const listPageConfigSchema = z.discriminatedUnion('enableSelection', [
  listPageConfigWithoutSelectionSchema,
  listPageConfigWithSelectionSchema,
])
  .describe('Main list page configuration discriminated by enableSelection')
  .refine(
    (data) => {
      const hasDeleteRowAction = data.rowActions?.some(action => action.type === 'delete')
      return !hasDeleteRowAction || !!data.endpoints.delete
    },
    { message: 'Row action type "delete" requires endpoints.delete to be defined', path: ['endpoints', 'delete'] }
  )
  .refine(
    (data) => {
      const hasDeleteBulkAction = data.bulkActions?.some(action => action.type === 'delete')
      return !hasDeleteBulkAction || !!data.endpoints.delete
    },
    { message: 'Bulk action type "delete" requires endpoints.delete to be defined', path: ['endpoints', 'delete'] }
  )
  .refine(
    (data) => {
      if (data.createAction?.enabled && 'useDialog' in data.createAction && data.createAction.useDialog === false) {
        return !!data.pageUrls?.create
      }
      return true
    },
    { message: 'createAction with useDialog=false requires pageUrls.create to be defined', path: ['pageUrls', 'create'] }
  )

export const bulkOperationResultSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    id: z.string(),
    name: z.string(),
  }).describe('Successful bulk operation result'),
  z.object({
    success: z.literal(false),
    id: z.string(),
    name: z.string(),
    error: z.string().describe('Error message'),
  }).describe('Failed bulk operation result'),
]).describe('Bulk operation result discriminated by success state')

export const bulkOperationConfigSchema = z.object({
  operation: z.function({
    input: [z.any()],
    output: z.promise(bulkOperationResultSchema)
  }).describe('Function performing operation on single item, returns BulkOperationResult'),
  title: z.string().min(1).describe('Dialog title during operation'),
  resultsTitle: z.string().min(1).describe('Dialog title showing results'),
}).describe('Bulk operation configuration for BulkOperationDialog')

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
