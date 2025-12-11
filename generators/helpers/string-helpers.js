/**
 * Converts a string to camelCase
 * @param {string} str - The string to convert
 * @returns {string} - The camelCase string
 */
export function camelCase(str) {
  return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase())
}

/**
 * Converts a string to PascalCase
 * @param {string} str - The string to convert
 * @returns {string} - The PascalCase string
 */
export function pascalCase(str) {
  const camel = camelCase(str)
  return camel.charAt(0).toUpperCase() + camel.slice(1)
}

/**
 * Converts a string to kebab-case
 * @param {string} str - The string to convert
 * @returns {string} - The kebab-case string
 */
export function kebabCase(str) {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/\s+/g, '-')
    .toLowerCase()
}

/**
 * Converts a string to UPPER_CASE
 * @param {string} str - The string to convert
 * @returns {string} - The UPPER_CASE string
 */
export function upperCase(str) {
  return str.replace(/-/g, '_').toUpperCase()
}

/**
 * Checks if a string contains a substring
 * @param {string} str - The string to check
 * @param {string} substr - The substring to find
 * @returns {boolean} - True if contains substring
 */
export function contains(str, substr) {
  return str.includes(substr)
}
