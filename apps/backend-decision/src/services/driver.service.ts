import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import type { decision } from '@magik/decisions'
import { DECISIONS_DIR } from '../config'
import { generateId } from '../utils/generateId'

export interface Driver {
  id: string
  name: string
  description: string
}

export async function createDriver(
  decisionId: string,
  name: string,
  description: string
): Promise<Driver> {
  const filePath = join(DECISIONS_DIR, `${decisionId}.json`)
  const content = await readFile(filePath, 'utf-8')
  const decisionData = JSON.parse(content) as decision

  const newDriverId = generateId(name)
  if (decisionData.decisionDrivers.some((d) => d.id === newDriverId)) {
    throw new Error('Driver with this name already exists')
  }

  const newDriver: Driver = {
    id: newDriverId,
    name,
    description,
  }

  decisionData.decisionDrivers.push(newDriver)

  // Create evaluation records for all existing options
  for (const option of decisionData.options) {
    decisionData.evaluationMatrix.push({
      optionId: option.id,
      driverId: newDriverId,
      rating: 'medium',
      evaluationDetails: [],
    })
  }

  await writeFile(filePath, JSON.stringify(decisionData, null, 2), 'utf-8')
  return newDriver
}

export async function updateDriver(
  decisionId: string,
  driverId: string,
  name: string,
  description: string
): Promise<Driver> {
  const filePath = join(DECISIONS_DIR, `${decisionId}.json`)
  const content = await readFile(filePath, 'utf-8')
  const decisionData = JSON.parse(content) as decision

  const driverIndex = decisionData.decisionDrivers.findIndex((d) => d.id === driverId)
  if (driverIndex === -1) {
    throw new Error('Driver not found')
  }

  decisionData.decisionDrivers[driverIndex] = {
    ...decisionData.decisionDrivers[driverIndex],
    name,
    description,
  }

  await writeFile(filePath, JSON.stringify(decisionData, null, 2), 'utf-8')
  return decisionData.decisionDrivers[driverIndex]
}

export async function deleteDriver(decisionId: string, driverId: string): Promise<void> {
  const filePath = join(DECISIONS_DIR, `${decisionId}.json`)
  const content = await readFile(filePath, 'utf-8')
  const decisionData = JSON.parse(content) as decision

  const driverIndex = decisionData.decisionDrivers.findIndex((d) => d.id === driverId)
  if (driverIndex === -1) {
    throw new Error('Driver not found')
  }

  decisionData.decisionDrivers.splice(driverIndex, 1)
  decisionData.evaluationMatrix = decisionData.evaluationMatrix.filter(
    (e) => e.driverId !== driverId
  )

  await writeFile(filePath, JSON.stringify(decisionData, null, 2), 'utf-8')
}
