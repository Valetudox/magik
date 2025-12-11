/**
 * Extracts parameter names from a route
 * @param {string} route - The route string (e.g., /api/decisions/:id/options/:optionId)
 * @returns {string[]} - Array of parameter names
 */
export function extractParams(route) {
  const matches = route.match(/:(\w+)/g)
  if (!matches) return []
  return matches.map(match => match.substring(1))
}

/**
 * Converts a route to a file path
 * @param {string} route - The route string (e.g., /api/decisions/:id)
 * @returns {string} - The file path (e.g., actions/decisions/[id])
 */
export function routeToPath(route) {
  return route
    .replace(/^\/api\//, 'actions/')
    .replace(/:(\w+)/g, '[$1]')
    .replace(/\/$/, '')
}

/**
 * Calculates the import depth based on route nesting
 * @param {string} route - The route string
 * @returns {number} - The number of directory levels
 */
export function calculateImportDepth(route) {
  const path = routeToPath(route)
  const parts = path.split('/').filter(p => p && p !== 'actions')
  return parts.length
}

/**
 * Generates relative import path
 * @param {number} depth - The nesting depth
 * @returns {string} - The relative path (e.g., '../../../')
 */
export function generateImportPath(depth) {
  return '../'.repeat(depth + 1)
}

/**
 * Checks if a route contains parameters
 * @param {string} route - The route string
 * @returns {boolean} - True if route has parameters
 */
export function hasParams(route) {
  return /:/.test(route)
}
