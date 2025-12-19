import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import type { decision } from '@magik/decisions'
import { DECISIONS_DIR } from '../config'
import { generateId } from '../utils/generate-id'

export type Component = {
  id: string
  name: string
  description: string
}

export async function createComponent(
  decisionId: string,
  name: string,
  description: string
): Promise<Component> {
  const filePath = join(DECISIONS_DIR, `${decisionId}.json`)
  const content = await readFile(filePath, 'utf-8')
  const decisionData = JSON.parse(content) as decision

  const newComponentId = generateId(name)
  if (decisionData.components.some((c) => c.id === newComponentId)) {
    throw new Error('Component with this name already exists')
  }

  const newComponent: Component = {
    id: newComponentId,
    name,
    description,
  }

  decisionData.components.push(newComponent)

  await writeFile(filePath, JSON.stringify(decisionData, null, 2), 'utf-8')
  return newComponent
}

export async function updateComponent(
  decisionId: string,
  componentId: string,
  name: string,
  description: string
): Promise<Component> {
  const filePath = join(DECISIONS_DIR, `${decisionId}.json`)
  const content = await readFile(filePath, 'utf-8')
  const decisionData = JSON.parse(content) as decision

  const componentIndex = decisionData.components.findIndex((c) => c.id === componentId)
  if (componentIndex === -1) {
    throw new Error('Component not found')
  }

  decisionData.components[componentIndex] = {
    ...decisionData.components[componentIndex],
    name,
    description,
  }

  await writeFile(filePath, JSON.stringify(decisionData, null, 2), 'utf-8')
  return decisionData.components[componentIndex]
}

export async function deleteComponent(decisionId: string, componentId: string): Promise<void> {
  const filePath = join(DECISIONS_DIR, `${decisionId}.json`)
  const content = await readFile(filePath, 'utf-8')
  const decisionData = JSON.parse(content) as decision

  const componentIndex = decisionData.components.findIndex((c) => c.id === componentId)
  if (componentIndex === -1) {
    throw new Error('Component not found')
  }

  decisionData.components.splice(componentIndex, 1)

  await writeFile(filePath, JSON.stringify(decisionData, null, 2), 'utf-8')
}
