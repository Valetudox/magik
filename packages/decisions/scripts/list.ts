#!/usr/bin/env bun

import { readFile } from 'fs/promises'
import { resolve, relative, dirname, basename } from 'path'
import { glob } from 'glob'

// Find repository root by looking for package.json with workspaces
function findRepoRoot(startPath: string = process.cwd()): string {
  let currentPath = startPath
  while (currentPath !== '/') {
    try {
      const pkgPath = resolve(currentPath, 'package.json')
      const pkg = require(pkgPath)
      if (pkg.workspaces) {
        return currentPath
      }
    } catch (e) {
      // Continue searching
    }
    currentPath = dirname(currentPath)
  }
  return process.cwd()
}

const repoRoot = findRepoRoot()
const decisionsPath = resolve(repoRoot, 'documents/decisions')

async function main() {
  try {
    const pattern = `${decisionsPath}/**/*.json`
    const files = await glob(pattern, { absolute: true })

    if (files.length === 0) {
      console.log('No decisions found')
      process.exit(0)
    }

    for (const file of files) {
      const relativePath = relative(decisionsPath, file)
      const content = await readFile(file, 'utf-8')
      const data = JSON.parse(content)

      console.log(relativePath)
      if (data.problemDefinition) {
        console.log(`  ${data.problemDefinition}`)
      }
      if (data.selectedOption && data.options) {
        const selected = data.options.find((o: any) => o.id === data.selectedOption)
        if (selected) {
          console.log(`  → ${selected.name}`)
        }
      }
      console.log()
    }

    console.log(`Total: ${files.length} decisions`)
  } catch (error: any) {
    console.error(`Error: ${error.message}`)
    process.exit(1)
  }
}

main()
