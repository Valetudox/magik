import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import type { decision } from '@magik/decisions'
import { DECISIONS_DIR } from '../config'
import { generateId } from '../utils/generate-id'

export interface Option {
  id: string
  name: string
  description: string
  moreLink?: string
}

export async function createOption(
  decisionId: string,
  name: string,
  description: string,
  moreLink?: string
): Promise<Option> {
  const filePath = join(DECISIONS_DIR, `${decisionId}.json`)
  const content = await readFile(filePath, 'utf-8')
  const decisionData = JSON.parse(content) as decision

  const newOptionId = generateId(name)
  if (decisionData.options.some((o) => o.id === newOptionId)) {
    throw new Error('Option with this name already exists')
  }

  const newOption: Option = {
    id: newOptionId,
    name,
    description,
    ...(moreLink && { moreLink }),
  }

  decisionData.options.push(newOption)

  for (const driver of decisionData.decisionDrivers) {
    decisionData.evaluationMatrix.push({
      optionId: newOptionId,
      driverId: driver.id,
      rating: 'medium',
      evaluationDetails: [],
    })
  }

  await writeFile(filePath, JSON.stringify(decisionData, null, 2), 'utf-8')
  return newOption
}

export async function updateOption(
  decisionId: string,
  optionId: string,
  name: string,
  description: string,
  moreLink?: string
): Promise<Option> {
  const filePath = join(DECISIONS_DIR, `${decisionId}.json`)
  const content = await readFile(filePath, 'utf-8')
  const decisionData = JSON.parse(content) as decision

  const optionIndex = decisionData.options.findIndex((o) => o.id === optionId)
  if (optionIndex === -1) {
    throw new Error('Option not found')
  }

  if (moreLink) {
    decisionData.options[optionIndex] = {
      ...decisionData.options[optionIndex],
      name,
      description,
      moreLink,
    }
  } else {
    decisionData.options[optionIndex] = {
      id: decisionData.options[optionIndex].id,
      name,
      description,
    }
  }

  await writeFile(filePath, JSON.stringify(decisionData, null, 2), 'utf-8')
  return decisionData.options[optionIndex]
}

export async function deleteOption(decisionId: string, optionId: string): Promise<void> {
  const filePath = join(DECISIONS_DIR, `${decisionId}.json`)
  const content = await readFile(filePath, 'utf-8')
  const decisionData = JSON.parse(content) as decision

  const optionIndex = decisionData.options.findIndex((o) => o.id === optionId)
  if (optionIndex === -1) {
    throw new Error('Option not found')
  }

  decisionData.options.splice(optionIndex, 1)
  decisionData.evaluationMatrix = decisionData.evaluationMatrix.filter(
    (e) => e.optionId !== optionId
  )

  if (decisionData.selectedOption === optionId) {
    delete decisionData.selectedOption
  }

  await writeFile(filePath, JSON.stringify(decisionData, null, 2), 'utf-8')
}
