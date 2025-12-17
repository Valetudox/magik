import type { Component, VNode } from 'vue'

/**
 * Bulk operation result - discriminated union
 */
export type BulkOperationResult =
  | { success: true; id: string; name: string }
  | { success: false; id: string; name: string; error: string }

/**
 * Bulk operation configuration
 */
export interface BulkOperationConfig<T = any> {
  /** The operation to perform on each item */
  operation: (item: T) => Promise<BulkOperationResult>
  /** Dialog title shown during operation */
  title: string
  /** Dialog title shown in results */
  resultsTitle: string
}

/**
 * Field formatter function that transforms raw value to display value
 */
export type FieldFormatter<T = any> = (value: any, item: T) => string | number | boolean

/**
 * Field template renderer - returns a VNode or component
 */
export type FieldRenderer<T = any> = (value: any, item: T) => VNode | Component

/**
 * Field configuration for table columns
 */
export interface ListFieldConfig<T = any> {
  /** Unique key for the field (matches data property) */
  key: string
  /** Display title in table header */
  title: string
  /** Whether column is sortable */
  sortable?: boolean
  /** Column alignment */
  align?: 'start' | 'center' | 'end'
  /** Optional formatter function to transform value */
  formatter?: FieldFormatter<T>
  /** Optional custom renderer (slot content or component) */
  renderer?: FieldRenderer<T>
  /** Width of the column */
  width?: string | number
}

/**
 * Row action type
 */
export type RowActionType = 'view' | 'delete' | 'custom'

/**
 * Row action configuration
 */
export interface RowActionConfig<T = any> {
  /** Action type - determines behavior */
  type: RowActionType
  /** Action icon (MDI icon name) */
  icon: string
  /** Action title/tooltip */
  title: string
  /** Click callback (optional for 'view' and 'delete' types) */
  onClick?: (item: T) => void | Promise<void>
  /** Optional disabled condition */
  disabled?: (item: T) => boolean
  /** Optional color */
  color?: string
}

/**
 * Bulk action type
 */
export type BulkActionType = 'delete' | 'custom'

/**
 * Bulk action configuration
 */
export interface BulkActionConfig<T = any> {
  /** Action type - determines behavior */
  type: BulkActionType
  /** Action label */
  label: string
  /** Action icon */
  icon: string
  /** Click callback (optional for 'delete' type) */
  onClick?: (selectedIds: string[], items: T[]) => void | Promise<void>
  /** Optional disabled condition */
  disabled?: (selectedIds: string[], items: T[]) => boolean
  /** Optional color */
  color?: string
}

/**
 * Endpoint configuration for API calls
 */
export interface EndpointConfig {
  /** List endpoint - returns array of items */
  list: () => Promise<any[]>
  /** Create endpoint - returns created item with id */
  create?: (data: any) => Promise<{ id: string; [key: string]: any }>
  /** Delete endpoint - deletes single item by id */
  delete?: (id: string) => Promise<void>
}

/**
 * URL configuration for navigation
 */
export interface PageUrlConfig<T = any> {
  /** Edit/detail page URL generator */
  edit?: (item: T) => string
  /** Create page URL (if not using dialog) */
  create?: string
}

/**
 * Create action configuration
 */
export interface CreateActionConfig {
  /** Whether create action is enabled */
  enabled: boolean
  /** Button label */
  label?: string
  /** Whether to show dialog (true) or navigate to URL (false) */
  useDialog?: boolean
  /** Dialog title (if useDialog=true) */
  dialogTitle?: string
  /** Custom dialog component (if useDialog=true) */
  dialogComponent?: Component
  /** Callback when create is triggered */
  onCreate?: (data: any) => void | Promise<void>
}

/**
 * Delete dialog configuration
 */
export interface DeleteDialogConfig {
  /** Custom delete confirmation message generator */
  confirmMessage?: (item: any) => string
  /** Custom bulk delete confirmation message generator */
  bulkConfirmMessage?: (count: number) => string
}

/**
 * Socket.IO real-time updates configuration
 */
export interface SocketConfig<T = any> {
  /** Whether to enable Socket.IO integration */
  enabled: boolean
  /** Socket initialization function */
  initSocket?: () => void
  /** Event handlers */
  handlers?: {
    /** Handler for item updated event */
    onUpdated?: (callback: (data: { id: string; [key: string]: any }) => void) => () => void
    /** Handler for item added event */
    onAdded?: (callback: (data: { id: string; [key: string]: any }) => void) => () => void
    /** Handler for item deleted event */
    onDeleted?: (callback: (data: { id: string }) => void) => () => void
  }
}

/**
 * Main configuration for list page
 */
export interface ListPageConfig<T = any> {
  /** Unique identifier property name (e.g., 'id') */
  entityId: string
  /** Display name for entity (singular) */
  entityName: string
  /** Display name for entities (plural) */
  entityNamePlural: string
  /** Field/column configurations */
  fields: ListFieldConfig<T>[]
  /** Row action configurations */
  rowActions?: RowActionConfig<T>[]
  /** Bulk action configurations */
  bulkActions?: BulkActionConfig<T>[]
  /** Create action configuration */
  createAction?: CreateActionConfig
  /** API endpoint configurations */
  endpoints: EndpointConfig
  /** Page URL configurations */
  pageUrls?: PageUrlConfig<T>
  /** Delete dialog configuration */
  deleteDialog?: DeleteDialogConfig
  /** Socket.IO configuration */
  socket?: SocketConfig<T>
  /** Whether to enable row selection */
  enableSelection?: boolean
  /** Whether to enable search */
  enableSearch?: boolean
  /** Default items per page */
  itemsPerPage?: number
  /** Default sort configuration */
  defaultSort?: { key: string; order: 'asc' | 'desc' }[]
}
