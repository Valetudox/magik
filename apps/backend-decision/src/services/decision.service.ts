import { readdir, readFile, writeFile, stat, unlink, mkdir } from 'fs/promises'
import { join, basename, dirname, relative } from 'path'
import type { decision } from '@magik/decisions'
import { DECISIONS_DIR } from '../config'

export type DecisionSummary = {
  id: string
  name: string
  directory: string
  problemDefinition: string
  selectedOption?: string
  confluenceLink?: string
  createdAt: string
  updatedAt: string
}

export async function listAllDecisions(): Promise<DecisionSummary[]> {
  const decisionIds = await findAllJsonFiles(DECISIONS_DIR, DECISIONS_DIR)

  const decisions: DecisionSummary[] = await Promise.all(
    decisionIds.map(async (id) => {
      const filePath = join(DECISIONS_DIR, `${id}.json`)
      const content = await readFile(filePath, 'utf-8')
      const fileStats = await stat(filePath)
      const decision = JSON.parse(content) as decision

      const filename = basename(id)
      const directory = dirname(id) === '.' ? '' : dirname(id)

      return {
        id,
        name: filename.replace(/-/g, ' '),
        directory,
        problemDefinition: decision.problemDefinition,
        selectedOption: decision.selectedOption,
        confluenceLink: decision.confluenceLink,
        createdAt: fileStats.birthtime.toISOString(),
        updatedAt: fileStats.mtime.toISOString(),
      }
    })
  )

  return decisions
}

export async function getDecisionById(id: string): Promise<decision & { id: string }> {
  const filePath = join(DECISIONS_DIR, `${id}.json`)
  const content = await readFile(filePath, 'utf-8')
  const decisionData = JSON.parse(content) as decision

  return {
    id,
    ...decisionData,
  }
}

export async function createDecision(pathId: string): Promise<string> {
  const sanitized = pathId
    .split('/')
    .map((part) =>
      part
        .toLowerCase()
        .replace(/[^a-z0-9\s_-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
    )
    .filter((part) => part.length > 0)
    .join('/')

  if (!sanitized) {
    throw new Error('Invalid path')
  }

  const filePath = join(DECISIONS_DIR, `${sanitized}.json`)

  try {
    await stat(filePath)
    throw new Error('Decision with this name already exists')
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'code' in e && e.code !== 'ENOENT') {
      throw e
    }
  }

  const parentDir = dirname(filePath)
  await mkdir(parentDir, { recursive: true })

  const emptyDecision: decision = {
    problemDefinition: '',
    components: [],
    useCases: [],
    decisionDrivers: [],
    options: [],
    evaluationMatrix: [],
    proposal: {
      description: '',
      reasoning: [],
    },
  }

  await writeFile(filePath, JSON.stringify(emptyDecision, null, 2), 'utf-8')

  return sanitized
}

export async function deleteDecision(id: string): Promise<void> {
  const filePath = join(DECISIONS_DIR, `${id}.json`)
  await unlink(filePath)
}

export async function updateDecision(
  id: string,
  updates: {
    problemDefinition?: string
    proposal?: { description: string; reasoning: string[] }
    confluenceLink?: string
  }
): Promise<void> {
  const filePath = join(DECISIONS_DIR, `${id}.json`)
  const content = await readFile(filePath, 'utf-8')
  const decisionData = JSON.parse(content) as decision

  if (updates.problemDefinition !== undefined) {
    decisionData.problemDefinition = updates.problemDefinition
  }

  if (updates.proposal !== undefined) {
    decisionData.proposal = updates.proposal
  }

  if (updates.confluenceLink !== undefined) {
    if (updates.confluenceLink === '') {
      delete decisionData.confluenceLink
    } else {
      decisionData.confluenceLink = updates.confluenceLink
    }
  }

  await writeFile(filePath, JSON.stringify(decisionData, null, 2), 'utf-8')
}

export async function updateSelectedOption(
  id: string,
  optionId: string | null
): Promise<string | undefined> {
  const filePath = join(DECISIONS_DIR, `${id}.json`)
  const content = await readFile(filePath, 'utf-8')
  const decisionData = JSON.parse(content) as decision

  if (optionId !== null && !decisionData.options.some((o) => o.id === optionId)) {
    throw new Error('Option not found')
  }

  decisionData.selectedOption = optionId ?? undefined

  await writeFile(filePath, JSON.stringify(decisionData, null, 2), 'utf-8')
  return decisionData.selectedOption
}

async function findAllJsonFiles(dir: string, baseDir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await findAllJsonFiles(fullPath, baseDir)))
    } else if (entry.name.endsWith('.json')) {
      const relativePath = relative(baseDir, fullPath).slice(0, -5)
      files.push(relativePath)
    }
  }
  return files
}
