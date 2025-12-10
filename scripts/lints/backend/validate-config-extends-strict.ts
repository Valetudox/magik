#!/usr/bin/env bun

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

interface ValidationError {
  service: string
  file: string
  errorType: 'missing-file' | 'content-mismatch'
  expected?: string
  actual?: string
}

// ANSI color codes
const RED = '\x1b[0;31m'
const GREEN = '\x1b[0;32m'
const YELLOW = '\x1b[1;33m'
const NC = '\x1b[0m' // No Color

// Expected exact content for eslint.config.js
const EXPECTED_ESLINT_CONFIG = `import backendConfig from '../../eslint.config.backend.js'

export default backendConfig
`

// Expected exact content for tsconfig.json (normalized)
const EXPECTED_TSCONFIG = {
  extends: '../../tsconfig.json',
  compilerOptions: {
    outDir: './dist',
    module: 'NodeNext',
    moduleResolution: 'NodeNext',
  },
  include: ['src/**/*', '../../config/config.ts'],
  exclude: ['node_modules'],
}

/**
 * Normalize JSON by parsing and stringifying with consistent formatting
 */
function normalizeJSON(content: string): string {
  try {
    const parsed = JSON.parse(content)
    return JSON.stringify(parsed, null, 2)
  } catch {
    return content
  }
}

/**
 * Compare two JSON objects for exact equality
 */
function areJSONEqual(obj1: any, obj2: any): boolean {
  return JSON.stringify(obj1) === JSON.stringify(obj2)
}

/**
 * Validate a single backend service
 */
function validateService(
  serviceName: string,
  serviceDir: string,
): ValidationError[] {
  const errors: ValidationError[] = []

  // Validate eslint.config.js
  const eslintConfigPath = join(serviceDir, 'eslint.config.js')
  try {
    const actualEslintContent = readFileSync(eslintConfigPath, 'utf-8')

    // Exact text match (ignoring trailing whitespace differences)
    if (actualEslintContent.trim() !== EXPECTED_ESLINT_CONFIG.trim()) {
      errors.push({
        service: serviceName,
        file: 'eslint.config.js',
        errorType: 'content-mismatch',
        expected: EXPECTED_ESLINT_CONFIG.trim(),
        actual: actualEslintContent.trim(),
      })
    }
  } catch (err) {
    errors.push({
      service: serviceName,
      file: 'eslint.config.js',
      errorType: 'missing-file',
    })
  }

  // Validate tsconfig.json
  const tsconfigPath = join(serviceDir, 'tsconfig.json')
  try {
    const actualTsconfigContent = readFileSync(tsconfigPath, 'utf-8')
    const actualTsconfig = JSON.parse(actualTsconfigContent)

    // Exact JSON structure match
    if (!areJSONEqual(actualTsconfig, EXPECTED_TSCONFIG)) {
      errors.push({
        service: serviceName,
        file: 'tsconfig.json',
        errorType: 'content-mismatch',
        expected: JSON.stringify(EXPECTED_TSCONFIG, null, 2),
        actual: JSON.stringify(actualTsconfig, null, 2),
      })
    }
  } catch (err) {
    errors.push({
      service: serviceName,
      file: 'tsconfig.json',
      errorType: 'missing-file',
    })
  }

  return errors
}

/**
 * Main validation function
 */
function main() {
  const appsDir = 'apps'
  const backendServices: string[] = []

  // Find all backend-* directories
  const dirs = readdirSync(appsDir)
  for (const dir of dirs) {
    if (dir.startsWith('backend-') && statSync(join(appsDir, dir)).isDirectory()) {
      backendServices.push(dir)
    }
  }

  // Validate all backend services
  let allErrors: ValidationError[] = []

  for (const service of backendServices) {
    const serviceDir = join(appsDir, service)
    const errors = validateService(service, serviceDir)
    allErrors = allErrors.concat(errors)
  }

  // Report results
  if (allErrors.length === 0) {
    console.log(
      `${GREEN}✓${NC} All backend services have proper config extends (strict validation)`,
    )
    console.log(
      `  Validated ${backendServices.length} service(s): ${backendServices.join(', ')}`,
    )
    process.exit(0)
  } else {
    console.log(`${RED}✗${NC} Config extends validation failed (strict mode)`)
    console.log('')

    // Group errors by service
    const errorsByService = new Map<string, ValidationError[]>()
    for (const error of allErrors) {
      if (!errorsByService.has(error.service)) {
        errorsByService.set(error.service, [])
      }
      errorsByService.get(error.service)!.push(error)
    }

    // Print errors grouped by service
    for (const [service, errors] of errorsByService.entries()) {
      console.log(`  ${service}:`)

      for (const error of errors) {
        if (error.errorType === 'missing-file') {
          console.log(`    ${RED}✗${NC} Missing file: ${error.file}`)
        } else if (error.errorType === 'content-mismatch') {
          console.log(`    ${RED}✗${NC} Content mismatch: ${error.file}`)
          console.log(`      Expected content:`)
          console.log(
            error.expected
              ?.split('\n')
              .map((line) => `        ${line}`)
              .join('\n'),
          )
          console.log(`      Actual content:`)
          console.log(
            error.actual
              ?.split('\n')
              .map((line) => `        ${line}`)
              .join('\n'),
          )
        }
      }

      console.log('')
    }

    process.exit(1)
  }
}

main()
