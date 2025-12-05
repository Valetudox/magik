import { readdir, readFile } from 'fs/promises'
import { join, relative } from 'path'
import { SPECIFICATIONS_DIR } from '../config'

export interface SpecificationRequirementItem {
  type:
    | 'ubiquitous'
    | 'event-driven'
    | 'state-driven'
    | 'optional-feature'
    | 'unwanted-behaviour'
    | 'complex'
  systemName: string
  systemResponse: string
  triggers?: string[]
  preConditions?: string[]
  features?: string[]
  unwantedConditions?: string[]
}

export interface SpecificationSection {
  sectionName: string
  items: SpecificationRequirementItem[]
}

export interface Specification {
  title: string
  description: string
  requirements: SpecificationSection[]
}

export interface SpecificationSummary {
  id: string
  title: string
  description: string
  filepath: string
}

export interface SpecificationDetail extends Specification {
  id: string
}

// Recursively find all JSON files in a directory
async function findJsonFiles(dir: string): Promise<string[]> {
  const files: string[] = []

  try {
    const entries = await readdir(dir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = join(dir, entry.name)

      if (entry.isDirectory()) {
        // Recursively search subdirectories
        const subFiles = await findJsonFiles(fullPath)
        files.push(...subFiles)
      } else if (entry.isFile() && entry.name.endsWith('.json')) {
        // Add JSON files
        files.push(fullPath)
      }
    }
  } catch (error) {
    // Skip directories we can't read
    console.warn(`Could not read directory: ${dir}`, error)
  }

  return files
}

export async function listAllSpecifications(): Promise<SpecificationSummary[]> {
  try {
    // Recursively find all JSON files
    const jsonFiles = await findJsonFiles(SPECIFICATIONS_DIR)

    const summaries: SpecificationSummary[] = []

    // Process each JSON file
    for (const filePath of jsonFiles) {
      try {
        const content = await readFile(filePath, 'utf-8')
        const spec = JSON.parse(content) as Specification

        // Extract ID from relative path without .json extension
        // e.g., "projects/magik/specification-viewer.json" -> "projects/magik/specification-viewer"
        const relativePath = relative(SPECIFICATIONS_DIR, filePath)
        const id = relativePath.slice(0, -5) // Remove .json

        summaries.push({
          id,
          title: spec.title,
          description: spec.description,
          filepath: filePath,
        })
      } catch (error) {
        // Skip invalid JSON files, continue processing
        console.warn(`Skipping invalid specification file: ${filePath}`, error)
        continue
      }
    }

    return summaries
  } catch (error: unknown) {
    // If directory doesn't exist, return empty array
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return []
    }
    throw error
  }
}

export async function getSpecificationById(id: string): Promise<SpecificationDetail> {
  const filePath = join(SPECIFICATIONS_DIR, `${id}.json`)
  const content = await readFile(filePath, 'utf-8')
  const specification = JSON.parse(content) as Specification

  return {
    id,
    ...specification,
  }
}
