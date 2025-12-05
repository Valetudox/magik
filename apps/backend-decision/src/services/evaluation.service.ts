import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import type { decision } from '@magik/decisions'
import { DECISIONS_DIR } from '../config'

export interface Evaluation {
  optionId: string
  driverId: string
  rating: 'high' | 'medium' | 'low'
  evaluationDetails: string[]
}

export async function updateEvaluationRating(
  decisionId: string,
  optionId: string,
  driverId: string,
  rating: 'high' | 'medium' | 'low'
): Promise<Evaluation> {
  if (!['high', 'medium', 'low'].includes(rating)) {
    throw new Error('rating must be high, medium, or low')
  }

  const filePath = join(DECISIONS_DIR, `${decisionId}.json`)
  const content = await readFile(filePath, 'utf-8')
  const decisionData = JSON.parse(content) as decision

  const evalIndex = decisionData.evaluationMatrix.findIndex(
    (e) => e.optionId === optionId && e.driverId === driverId
  )

  if (evalIndex === -1) {
    throw new Error('Evaluation not found')
  }

  decisionData.evaluationMatrix[evalIndex].rating = rating

  await writeFile(filePath, JSON.stringify(decisionData, null, 2), 'utf-8')
  return decisionData.evaluationMatrix[evalIndex]
}

export async function updateEvaluationDetails(
  decisionId: string,
  optionId: string,
  driverId: string,
  evaluationDetails: string[]
): Promise<Evaluation> {
  const filePath = join(DECISIONS_DIR, `${decisionId}.json`)
  const content = await readFile(filePath, 'utf-8')
  const decisionData = JSON.parse(content) as decision

  const evalIndex = decisionData.evaluationMatrix.findIndex(
    (e) => e.optionId === optionId && e.driverId === driverId
  )

  if (evalIndex === -1) {
    throw new Error('Evaluation not found')
  }

  decisionData.evaluationMatrix[evalIndex].evaluationDetails = evaluationDetails

  await writeFile(filePath, JSON.stringify(decisionData, null, 2), 'utf-8')
  return decisionData.evaluationMatrix[evalIndex]
}
