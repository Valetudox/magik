// Helper function to convert OpenAPI schema to TypeScript type
function mapSchemaToType(schema, schemas) {
  if (schema.$ref) {
    const refName = schema.$ref.split('/').pop()
    return refName
  }

  switch (schema.type) {
    case 'string':
      if (schema.enum) {
        return schema.enum.map(v => `'${v}'`).join(' | ')
      }
      return 'string'
    case 'integer':
    case 'number':
      return 'number'
    case 'boolean':
      return 'boolean'
    case 'array':
      const itemType = mapSchemaToType(schema.items, schemas)
      return `${itemType}[]`
    case 'object':
      if (schema.properties) {
        return 'Record<string, unknown>' // Inline objects handled separately
      }
      return 'Record<string, unknown>'
    default:
      return 'unknown'
  }
}

function generateInterface(name, schema, schemas) {
  const properties = schema.properties || {}
  const required = schema.required || []

  let lines = [`export interface ${name} {`]

  for (const [propName, propSchema] of Object.entries(properties)) {
    const optional = !required.includes(propName) ? '?' : ''
    const type = mapSchemaToType(propSchema, schemas)
    const description = propSchema.description ? `  // ${propSchema.description}\n` : ''
    lines.push(`${description}  ${propName}${optional}: ${type}`)
  }

  lines.push('}')
  return lines.join('\n')
}

module.exports = {
  prompt: ({ prompter, args }) => {
    // If arguments are provided, use them directly
    if (args.serviceName && args.schemas) {
      const schemas = JSON.parse(args.schemas)

      // Generate all interfaces
      const interfaces = []
      for (const [schemaName, schema] of Object.entries(schemas)) {
        interfaces.push(generateInterface(schemaName, schema, schemas))
      }

      return Promise.resolve({
        serviceName: args.serviceName,
        typesContent: interfaces.join('\n\n'),
      })
    }

    // Interactive mode not supported for this generator
    throw new Error('This generator must be called with --serviceName and --schemas arguments')
  },
}
