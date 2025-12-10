#!/usr/bin/env bun

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { parse } from '@typescript-eslint/parser'

interface ValidationError {
  service: string
  errorType:
    | 'missing-eslint-config'
    | 'invalid-eslint-import'
    | 'missing-tsconfig'
    | 'invalid-tsconfig-extends'
    | 'wrong-module-resolution'
  details: string
}

// ANSI color codes
const RED = '\x1b[0;31m'
const GREEN = '\x1b[0;32m'
const YELLOW = '\x1b[1;33m'
const NC = '\x1b[0m' // No Color

/**
 * Check if a file exists
 */
function fileExists(filePath: string): boolean {
  try {
    return statSync(filePath).isFile()
  } catch {
    return false
  }
}

/**
 * Validate that eslint.config.js properly imports and extends backend config
 * Expected pattern:
 *   import backendConfig from '../../eslint.config.backend.js'
 *   export default backendConfig
 */
function validateEslintConfig(
  serviceName: string,
  serviceDir: string,
): ValidationError[] {
  const errors: ValidationError[] = []
  const eslintConfigPath = join(serviceDir, 'eslint.config.js')

  // Check if file exists
  if (!fileExists(eslintConfigPath)) {
    errors.push({
      service: serviceName,
      errorType: 'missing-eslint-config',
      details: 'eslint.config.js file not found',
    })
    return errors
  }

  try {
    const content = readFileSync(eslintConfigPath, 'utf-8')
    const ast = parse(content, {
      ecmaVersion: 'latest',
      sourceType: 'module',
      loc: true,
    })

    let hasValidImport = false

    // Traverse AST to find import statement
    function traverse(node: any) {
      if (!node) return

      // Look for import declaration
      if (node.type === 'ImportDeclaration') {
        const source = node.source?.value
        if (
          source === '../../eslint.config.backend.js' &&
          node.specifiers?.some(
            (spec: any) =>
              spec.type === 'ImportDefaultSpecifier' &&
              spec.local?.name === 'backendConfig',
          )
        ) {
          hasValidImport = true
        }
      }

      // Recursively traverse child nodes
      for (const key in node) {
        if (node[key] && typeof node[key] === 'object') {
          if (Array.isArray(node[key])) {
            node[key].forEach(traverse)
          } else {
            traverse(node[key])
          }
        }
      }
    }

    traverse(ast)

    if (!hasValidImport) {
      errors.push({
        service: serviceName,
        errorType: 'invalid-eslint-import',
        details:
          "Missing or invalid import: Expected 'import backendConfig from \"../../eslint.config.backend.js\"'",
      })
    }
  } catch (error) {
    errors.push({
      service: serviceName,
      errorType: 'invalid-eslint-import',
      details: `Failed to parse eslint.config.js: ${error}`,
    })
  }

  return errors
}

/**
 * Validate that tsconfig.json properly extends root config
 * Expected pattern:
 *   {
 *     "extends": "../../tsconfig.json",
 *     "compilerOptions": {
 *       "module": "NodeNext",
 *       "moduleResolution": "NodeNext"
 *     }
 *   }
 */
function validateTsConfig(
  serviceName: string,
  serviceDir: string,
): ValidationError[] {
  const errors: ValidationError[] = []
  const tsconfigPath = join(serviceDir, 'tsconfig.json')

  // Check if file exists
  if (!fileExists(tsconfigPath)) {
    errors.push({
      service: serviceName,
      errorType: 'missing-tsconfig',
      details: 'tsconfig.json file not found',
    })
    return errors
  }

  try {
    const content = readFileSync(tsconfigPath, 'utf-8')
    const config = JSON.parse(content)

    // Check extends field
    if (!config.extends || config.extends !== '../../tsconfig.json') {
      errors.push({
        service: serviceName,
        errorType: 'invalid-tsconfig-extends',
        details: config.extends
          ? `Invalid extends value: "${config.extends}". Expected: "../../tsconfig.json"`
          : 'Missing "extends" field. Expected: "../../tsconfig.json"',
      })
    }

    // Check module resolution (warning only)
    const compilerOptions = config.compilerOptions || {}
    if (
      compilerOptions.module !== 'NodeNext' ||
      compilerOptions.moduleResolution !== 'NodeNext'
    ) {
      errors.push({
        service: serviceName,
        errorType: 'wrong-module-resolution',
        details: `Module settings should be "NodeNext". Current: module="${compilerOptions.module || 'not set'}", moduleResolution="${compilerOptions.moduleResolution || 'not set'}"`,
      })
    }
  } catch (error) {
    errors.push({
      service: serviceName,
      errorType: 'invalid-tsconfig-extends',
      details: `Failed to parse tsconfig.json: ${error}`,
    })
  }

  return errors
}

/**
 * Validate a single backend service
 */
function validateService(
  serviceName: string,
  serviceDir: string,
): ValidationError[] {
  const errors: ValidationError[] = []

  // Validate ESLint config
  errors.push(...validateEslintConfig(serviceName, serviceDir))

  // Validate TypeScript config
  errors.push(...validateTsConfig(serviceName, serviceDir))

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
      `${GREEN}✓${NC} All backend services have proper config extends`,
    )
    console.log(
      `  Validated ${backendServices.length} service(s): ${backendServices.join(', ')}`,
    )
    process.exit(0)
  } else {
    console.log(`${RED}✗${NC} Config extends validation failed`)
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

      // Group by error type
      const eslintErrors = errors.filter((e) =>
        ['missing-eslint-config', 'invalid-eslint-import'].includes(e.errorType),
      )
      const tsconfigErrors = errors.filter((e) =>
        ['missing-tsconfig', 'invalid-tsconfig-extends'].includes(e.errorType),
      )
      const moduleWarnings = errors.filter(
        (e) => e.errorType === 'wrong-module-resolution',
      )

      if (eslintErrors.length > 0) {
        console.log(`    ESLint configuration issues:`)
        for (const error of eslintErrors) {
          console.log(`      - ${error.details}`)
        }
      }

      if (tsconfigErrors.length > 0) {
        console.log(`    TypeScript configuration issues:`)
        for (const error of tsconfigErrors) {
          console.log(`      - ${error.details}`)
        }
      }

      if (moduleWarnings.length > 0) {
        console.log(`    ${YELLOW}⚠${NC} Module resolution warnings:`)
        for (const error of moduleWarnings) {
          console.log(`      - ${error.details}`)
        }
      }

      console.log('')
    }

    process.exit(1)
  }
}

main()
