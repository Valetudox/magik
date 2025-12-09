// Helper to generate random ID for use cases
export function generateRandomId(): string {
  return Math.random().toString(36).substring(2, 15)
}

// Helper to generate kebab-case ID from name
export function generateId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}
