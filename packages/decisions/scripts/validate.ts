#!/usr/bin/env bun

import { readFile } from 'fs/promises'
import { resolve } from 'path'
import { Command } from 'commander'
import { z } from 'zod'

const program = new Command()

program
  .name('validate')
  .description('Validate a JSON file against a Zod schema')
  .version('1.0.0')
  .requiredOption('-s, --schema <path>', 'Path to TypeScript file containing Zod schema')
  .requiredOption('-e, --export <name>', 'Name of the exported Zod schema')
  .requiredOption('-j, --json <path>', 'Path to JSON file to validate')
  .parse(process.argv)

const options = program.opts()

async function main() {
  try {
    // Resolve absolute paths
    const schemaPath = resolve(options.schema)
    const jsonPath = resolve(options.json)

    // Import the Zod schema
    console.log(`Loading schema from: ${schemaPath}`)
    const schemaModule = await import(schemaPath)
    const schema = schemaModule[options.export]

    if (!schema) {
      console.error(`Error: Export "${options.export}" not found in ${schemaPath}`)
      console.error(`Available exports: ${Object.keys(schemaModule).join(', ')}`)
      process.exit(1)
    }

    // Check if it's a Zod schema
    if (!(schema instanceof z.ZodType)) {
      console.error(`Error: Export "${options.export}" is not a Zod schema`)
      process.exit(1)
    }

    // Read and parse JSON file
    console.log(`Reading JSON from: ${jsonPath}`)
    const jsonContent = await readFile(jsonPath, 'utf-8')
    const jsonData = JSON.parse(jsonContent)

    // Validate with Zod
    console.log(`Validating...`)
    const result = schema.safeParse(jsonData)

    if (result.success) {
      console.log('\n✅ Validation successful!\n')
      console.log('Validated data:')
      console.log(JSON.stringify(result.data, null, 2))
      process.exit(0)
    } else {
      console.error('\n❌ Validation failed!\n')
      console.error('Errors:')
      console.error(JSON.stringify(result.error.format(), null, 2))
      process.exit(1)
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.error(`Error: Invalid JSON file - ${error.message}`)
    } else if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      console.error(`Error: File not found - ${(error as NodeJS.ErrnoException).path}`)
    } else {
      console.error(`Error: ${error}`)
    }
    process.exit(1)
  }
}

main()
