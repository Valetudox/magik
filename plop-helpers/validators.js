/**
 * Validates a service name
 * @param {string} name - The service name
 * @returns {boolean|string} - True if valid, error message if invalid
 */
export function validateServiceName(name) {
  if (!name || name.trim() === '') {
    return 'Service name is required'
  }
  if (!/^[a-z]+(-[a-z]+)*$/.test(name)) {
    return 'Service name must be in kebab-case (lowercase with hyphens)'
  }
  return true
}

/**
 * Validates a port number
 * @param {string|number} port - The port number
 * @returns {boolean|string} - True if valid, error message if invalid
 */
export function validatePort(port) {
  const num = parseInt(port)
  if (isNaN(num)) {
    return 'Port must be a number'
  }
  if (num < 1 || num > 65535) {
    return 'Port must be between 1 and 65535'
  }
  return true
}

/**
 * Validates a route path
 * @param {string} route - The route path
 * @returns {boolean|string} - True if valid, error message if invalid
 */
export function validateRoute(route) {
  if (!route || route.trim() === '') {
    return 'Route is required'
  }
  if (!route.startsWith('/api/')) {
    return 'Route must start with /api/'
  }
  return true
}

/**
 * Validates a function name
 * @param {string} name - The function name
 * @returns {boolean|string} - True if valid, error message if invalid
 */
export function validateFunctionName(name) {
  if (!name || name.trim() === '') {
    return 'Function name is required'
  }
  if (!/^[a-z][a-zA-Z0-9]*$/.test(name)) {
    return 'Function name must be in camelCase'
  }
  return true
}
