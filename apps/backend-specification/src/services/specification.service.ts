import { readdir, readFile } from 'fs/promises'
import { join, relative } from 'path'
import { SPECIFICATIONS_DIR } from '../config'

type NodeError = Error & {
  code?: string
}

export type SpecificationRequirementItem = {
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

export type SpecificationSection = {
  sectionName: string
  items: SpecificationRequirementItem[]
}

export type Specification = {
  title: string
  description: string
  requirements: SpecificationSection[]
}

export type SpecificationSummary = {
  id: string
  title: string
  description: string
  filepath: string
  project: string
}

export type SpecificationDetail = Specification & {
  id: string
}

export async function listAllSpecifications(): Promise<SpecificationSummary[]> {
  try {
    const jsonFiles = await findJsonFiles(SPECIFICATIONS_DIR)

    const summaries: SpecificationSummary[] = []

    for (const filePath of jsonFiles) {
      try {
        const content = await readFile(filePath, 'utf-8')
        const spec = JSON.parse(content) as Specification

        const relativePath = relative(SPECIFICATIONS_DIR, filePath)
        const id = relativePath.slice(0, -5)

        const pathParts = id.split('/')
        const project = pathParts.length > 1 ? pathParts[pathParts.length - 2] : 'unknown'

        summaries.push({
          id,
          title: spec.title,
          description: spec.description,
          filepath: filePath,
          project,
        })
      } catch (error) {
        console.warn(`Skipping invalid specification file: ${filePath}`, error)
        continue
      }
    }

    return summaries
  } catch (error) {
    const nodeError = error as NodeError
    if (nodeError.code === 'ENOENT') {
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

async function findJsonFiles(dir: string): Promise<string[]> {
  const files: string[] = []

  try {
    const entries = await readdir(dir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = join(dir, entry.name)

      if (entry.isDirectory()) {
        const subFiles = await findJsonFiles(fullPath)
        files.push(...subFiles)
      } else if (entry.isFile() && entry.name.endsWith('.json')) {
        files.push(fullPath)
      }
    }
  } catch (error) {
    console.warn(`Could not read directory: ${dir}`, error)
  }

  return files
}
