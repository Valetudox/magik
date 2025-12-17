/**
 * Examples of ListPageConfig validation using Zod schemas
 *
 * These examples demonstrate how discriminated unions prevent invalid states
 */

import type { ListPageConfig } from '../types/list-page.types'
import {
  validateListPageConfig,
  validateListPageConfigOrThrow,
  validateListPageConfigDev,
} from '../utils/validateListPageConfig'

// ============================================================================
// VALID CONFIGURATIONS
// ============================================================================

/**
 * ✅ Valid: Read-only list without bulk actions
 */
export const validReadOnlyConfig: ListPageConfig = {
  entityId: 'id',
  entityName: 'Item',
  entityNamePlural: 'Items',
  fields: [
    { key: 'name', title: 'Name' },
  ],
  endpoints: {
    list: async () => [],
  },
  enableSelection: false, // No selection, no bulk actions
  bulkActions: undefined,
}

/**
 * ✅ Valid: List with selection and bulk actions
 */
export const validWithBulkActionsConfig: ListPageConfig = {
  entityId: 'id',
  entityName: 'Item',
  entityNamePlural: 'Items',
  fields: [
    { key: 'name', title: 'Name' },
  ],
  endpoints: {
    list: async () => [],
    delete: async (id: string) => {}, // Required for bulk delete
  },
  enableSelection: true, // Selection enabled for bulk actions
  bulkActions: [
    {
      type: 'delete',
      label: 'Delete',
      icon: 'mdi-delete',
    },
  ],
}

/**
 * ✅ Valid: Socket with handlers
 */
export const validSocketConfig: ListPageConfig = {
  entityId: 'id',
  entityName: 'Item',
  entityNamePlural: 'Items',
  fields: [
    { key: 'name', title: 'Name' },
  ],
  endpoints: {
    list: async () => [],
  },
  socket: {
    enabled: true,
    handlers: {
      onUpdated: (callback) => {
        // Setup listener
        return () => {} // Cleanup function
      },
    },
  },
}

/**
 * ✅ Valid: Socket disabled (no handlers needed)
 */
export const validSocketDisabledConfig: ListPageConfig = {
  entityId: 'id',
  entityName: 'Item',
  entityNamePlural: 'Items',
  fields: [
    { key: 'name', title: 'Name' },
  ],
  endpoints: {
    list: async () => [],
  },
  socket: {
    enabled: false,
    // handlers not required when disabled
  },
}

// ============================================================================
// INVALID CONFIGURATIONS (will fail validation)
// ============================================================================

/**
 * ❌ Invalid: Bulk actions without enableSelection
 *
 * This configuration is invalid because bulkActions are defined
 * but enableSelection is false (or undefined)
 */
export const invalidBulkWithoutSelection: ListPageConfig = {
  entityId: 'id',
  entityName: 'Item',
  entityNamePlural: 'Items',
  fields: [
    { key: 'name', title: 'Name' },
  ],
  endpoints: {
    list: async () => [],
    delete: async (id: string) => {},
  },
  enableSelection: false, // ❌ INVALID: bulkActions requires enableSelection=true
  bulkActions: [
    {
      type: 'delete',
      label: 'Delete',
      icon: 'mdi-delete',
    },
  ],
}

/**
 * ❌ Invalid: Delete action without delete endpoint
 *
 * This configuration is invalid because a bulk delete action
 * requires endpoints.delete to be defined
 */
export const invalidDeleteWithoutEndpoint: ListPageConfig = {
  entityId: 'id',
  entityName: 'Item',
  entityNamePlural: 'Items',
  fields: [
    { key: 'name', title: 'Name' },
  ],
  endpoints: {
    list: async () => [],
    // ❌ INVALID: Missing delete endpoint
  },
  enableSelection: true,
  bulkActions: [
    {
      type: 'delete', // ❌ INVALID: Requires endpoints.delete
      label: 'Delete',
      icon: 'mdi-delete',
    },
  ],
}

/**
 * ❌ Invalid: Row delete action without delete endpoint
 */
export const invalidRowDeleteWithoutEndpoint: ListPageConfig = {
  entityId: 'id',
  entityName: 'Item',
  entityNamePlural: 'Items',
  fields: [
    { key: 'name', title: 'Name' },
  ],
  endpoints: {
    list: async () => [],
    // ❌ INVALID: Missing delete endpoint
  },
  rowActions: [
    {
      type: 'delete', // ❌ INVALID: Requires endpoints.delete
      icon: 'mdi-delete',
      title: 'Delete',
    },
  ],
}

/**
 * ❌ Invalid: Field with both formatter and renderer
 */
export const invalidFieldWithBoth: ListPageConfig = {
  entityId: 'id',
  entityName: 'Item',
  entityNamePlural: 'Items',
  fields: [
    {
      key: 'name',
      title: 'Name',
      formatter: (value) => String(value), // ❌ INVALID: Cannot use both
      renderer: (value) => value, // ❌ INVALID: Cannot use both
    },
  ],
  endpoints: {
    list: async () => [],
  },
}

/**
 * ❌ Invalid: createAction with useDialog=false but no pageUrls.create
 */
export const invalidCreateWithoutUrl: ListPageConfig = {
  entityId: 'id',
  entityName: 'Item',
  entityNamePlural: 'Items',
  fields: [
    { key: 'name', title: 'Name' },
  ],
  endpoints: {
    list: async () => [],
  },
  createAction: {
    enabled: true,
    useDialog: false, // ❌ INVALID: Requires pageUrls.create
  },
  // ❌ Missing pageUrls.create
}

// ============================================================================
// VALIDATION EXAMPLES
// ============================================================================

/**
 * Example 1: Using validateListPageConfig (safe, returns result)
 */
export function exampleValidation() {
  const result = validateListPageConfig(invalidBulkWithoutSelection)

  if (result.success) {
    console.log('✅ Configuration is valid:', result.data)
  } else {
    console.error('❌ Configuration is invalid:')
    result.errors.forEach(err => {
      console.error(`  - ${err.path}: ${err.message}`)
    })
  }
}

/**
 * Example 2: Using validateListPageConfigOrThrow (throws on invalid)
 */
export function exampleValidationThrow() {
  try {
    validateListPageConfigOrThrow(validWithBulkActionsConfig)
    console.log('✅ Configuration is valid, proceeding...')
  } catch (error) {
    console.error('❌ Validation failed:', error)
    // Handle error
  }
}

/**
 * Example 3: Using validateListPageConfigDev (dev mode only)
 */
export function exampleValidationDev() {
  // Only validates in development mode
  // Logs warnings to console
  validateListPageConfigDev(validReadOnlyConfig)

  // Continue with your code
  // In production, this does nothing
}

// ============================================================================
// TYPE-SAFE CONFIGURATION HELPERS
// ============================================================================

/**
 * Helper to create a read-only list config (no bulk operations)
 */
export function createReadOnlyListConfig<T>(
  config: Omit<ListPageConfig<T>, 'enableSelection' | 'bulkActions'>
): ListPageConfig<T> {
  return {
    ...config,
    enableSelection: false,
    bulkActions: undefined,
  }
}

/**
 * Helper to create a list config with bulk operations
 */
export function createListConfigWithBulk<T>(
  config: Omit<ListPageConfig<T>, 'enableSelection'> & {
    bulkActions?: ListPageConfig<T>['bulkActions']
  }
): ListPageConfig<T> {
  return {
    ...config,
    enableSelection: true,
  }
}

// ============================================================================
// USAGE IN COMPONENTS
// ============================================================================

/**
 * Example: Validating config in a Vue component
 */
export function useValidatedConfig<T>(config: ListPageConfig<T>) {
  // Validate in development
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.MODE === 'development') {
    const result = validateListPageConfig(config)
    if (!result.success) {
      console.error('Invalid ListPageConfig:', result.errors)
    }
  }

  return config
}
