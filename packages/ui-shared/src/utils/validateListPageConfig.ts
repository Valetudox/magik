import { listPageConfigSchema } from '../types/list-page.schema'
import type { ListPageConfig } from '../types/list-page.types'

/**
 * Validation result type
 */
export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: Array<{ path: string; message: string }> }

/**
 * Validates a list page configuration using Zod schema
 *
 * This ensures:
 * - bulkActions can only be defined when enableSelection is true
 * - socket.enabled=true requires handlers to be defined
 * - Row/bulk delete actions require endpoints.delete
 * - createAction with useDialog=false requires pageUrls.create
 * - Fields cannot have both formatter and renderer
 *
 * @example
 * ```typescript
 * const config: ListPageConfig<MyEntity> = {
 *   // ...config
 * }
 *
 * const result = validateListPageConfig(config)
 * if (!result.success) {
 *   console.error('Invalid configuration:', result.errors)
 *   result.errors.forEach(err => {
 *     console.error(`  ${err.path}: ${err.message}`)
 *   })
 * }
 * ```
 */
export function validateListPageConfig<T = any>(
  config: ListPageConfig<T>
): ValidationResult<ListPageConfig<T>> {
  const result = listPageConfigSchema.safeParse(config)

  if (result.success) {
    return {
      success: true,
      data: result.data as ListPageConfig<T>,
    }
  }

  return {
    success: false,
    errors: result.error.issues.map((issue: any) => ({
      path: issue.path.join('.'),
      message: issue.message,
    })),
  }
}

/**
 * Validates a list page configuration and throws if invalid
 *
 * Use this when you want to fail fast on invalid configuration
 *
 * @throws {Error} If the configuration is invalid
 *
 * @example
 * ```typescript
 * const config: ListPageConfig<MyEntity> = {
 *   // ...config
 * }
 *
 * try {
 *   validateListPageConfigOrThrow(config)
 *   // Config is valid, proceed
 * } catch (error) {
 *   console.error('Invalid configuration:', error.message)
 * }
 * ```
 */
export function validateListPageConfigOrThrow<T = any>(
  config: ListPageConfig<T>
): asserts config is ListPageConfig<T> {
  const result = validateListPageConfig(config)

  if (!result.success) {
    const errorMessages = result.errors
      .map(err => `  - ${err.path}: ${err.message}`)
      .join('\n')

    throw new Error(
      `Invalid ListPageConfig:\n${errorMessages}`
    )
  }
}

/**
 * Development mode validator
 *
 * Only validates in development mode, silently passes in production
 * Logs warnings to console instead of throwing
 *
 * @example
 * ```typescript
 * const config: ListPageConfig<MyEntity> = {
 *   // ...config
 * }
 *
 * validateListPageConfigDev(config) // Only warns in dev mode
 * ```
 */
export function validateListPageConfigDev<T = any>(
  config: ListPageConfig<T>
): void {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.MODE !== 'development') {
    return
  }

  const result = validateListPageConfig(config)

  if (!result.success) {
    console.warn('⚠️ Invalid ListPageConfig detected:')
    result.errors.forEach(err => {
      console.warn(`  - ${err.path}: ${err.message}`)
    })
  }
}
