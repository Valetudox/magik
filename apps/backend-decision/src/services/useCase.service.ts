import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import type { decision } from '@magik/decisions'
import { DECISIONS_DIR } from '../config'
import { generateId } from '../utils/generate-id'

export type UseCase = {
  id: string
  name: string
  description: string
}

export async function createUseCase(
  decisionId: string,
  name: string,
  description: string
): Promise<UseCase> {
  const filePath = join(DECISIONS_DIR, `${decisionId}.json`)
  const content = await readFile(filePath, 'utf-8')
  const decisionData = JSON.parse(content) as decision

  const newUseCaseId = generateId(name)
  if (decisionData.useCases.some((uc) => uc.id === newUseCaseId)) {
    throw new Error('Use case with this name already exists')
  }

  const newUseCase: UseCase = {
    id: newUseCaseId,
    name,
    description,
  }

  decisionData.useCases.push(newUseCase)

  await writeFile(filePath, JSON.stringify(decisionData, null, 2), 'utf-8')
  return newUseCase
}

export async function updateUseCase(
  decisionId: string,
  useCaseId: string,
  name: string,
  description: string
): Promise<UseCase> {
  const filePath = join(DECISIONS_DIR, `${decisionId}.json`)
  const content = await readFile(filePath, 'utf-8')
  const decisionData = JSON.parse(content) as decision

  const useCaseIndex = decisionData.useCases.findIndex((uc) => uc.id === useCaseId)
  if (useCaseIndex === -1) {
    throw new Error('Use case not found')
  }

  decisionData.useCases[useCaseIndex] = {
    ...decisionData.useCases[useCaseIndex],
    name,
    description,
  }

  await writeFile(filePath, JSON.stringify(decisionData, null, 2), 'utf-8')
  return decisionData.useCases[useCaseIndex]
}

export async function deleteUseCase(decisionId: string, useCaseId: string): Promise<void> {
  const filePath = join(DECISIONS_DIR, `${decisionId}.json`)
  const content = await readFile(filePath, 'utf-8')
  const decisionData = JSON.parse(content) as decision

  const useCaseIndex = decisionData.useCases.findIndex((uc) => uc.id === useCaseId)
  if (useCaseIndex === -1) {
    throw new Error('Use case not found')
  }

  decisionData.useCases.splice(useCaseIndex, 1)

  await writeFile(filePath, JSON.stringify(decisionData, null, 2), 'utf-8')
}
