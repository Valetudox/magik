#!/usr/bin/env bun

import { readFile, writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { homedir } from 'os'

interface TableRow {
  id?: string
  use_case: string
  diagram?: string
  required_context?: string[]
  required_tools?: string[]
  potential_interactions?: string[]
  notes?: string[]
}

interface TableDocument {
  confluence_url?: string
  table: TableRow[]
}

// Generate random ID for use cases
function generateRandomId(): string {
  return Math.random().toString(36).substring(2, 15)
}

async function migrateTableDocument() {
  const sourceFile = join(homedir(), 'Documents/documentation/agentic-use-cases.json')
  const targetDir = join(homedir(), 'Documents/table-documents')
  const targetFile = join(targetDir, 'agentic-use-cases.json')

  console.log('📄 Reading source file:', sourceFile)

  try {
    // Read source file
    const sourceContent = await readFile(sourceFile, 'utf-8')
    const sourceData = JSON.parse(sourceContent) as TableDocument

    console.log(`✓ Loaded document with ${sourceData.table.length} use cases`)

    // Add IDs to all use cases that don't have them
    let addedIds = 0
    for (const useCase of sourceData.table) {
      if (!useCase.id) {
        useCase.id = generateRandomId()
        addedIds++
      }
    }

    console.log(`✓ Added IDs to ${addedIds} use cases`)

    // Create target directory if it doesn't exist
    try {
      await mkdir(targetDir, { recursive: true })
      console.log(`✓ Created target directory: ${targetDir}`)
    } catch (e) {
      // Directory might already exist, that's fine
    }

    // Write to target file
    await writeFile(targetFile, JSON.stringify(sourceData, null, 2), 'utf-8')
    console.log(`✓ Wrote migrated document to: ${targetFile}`)

    console.log('\n✅ Migration completed successfully!')
    console.log(`\nYou can now access this document at:`)
    console.log(`- Backend: http://localhost:4004/api/table-documents/agentic-use-cases`)
    console.log(`- Frontend: http://localhost:5174/agentic-use-cases`)
  } catch (error) {
    if (error instanceof Error) {
      console.error('❌ Migration failed:', error.message)
    } else {
      console.error('❌ Migration failed:', error)
    }
    process.exit(1)
  }
}

// Run migration
void migrateTableDocument()
