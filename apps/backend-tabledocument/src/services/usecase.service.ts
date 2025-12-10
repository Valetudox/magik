import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import type { TableRow } from '@magik/tabledocuments'
import { tableDocumentSchema, tableRowSchema } from '@magik/tabledocuments'
import { TABLE_DOCUMENTS_DIR } from '../config.js'
import { generateRandomId } from '../utils/generate-id.js'

export async function createUseCase(
  documentId: string,
  useCase: Omit<TableRow, 'id'>
): Promise<TableRow> {
  const filePath = join(TABLE_DOCUMENTS_DIR, `${documentId}.json`)
  const content = await readFile(filePath, 'utf-8')
  const documentData = tableDocumentSchema.parse(JSON.parse(content))

  // Generate new ID
  const newUseCase: TableRow = {
    id: generateRandomId(),
    ...useCase,
  }

  // Validate the new use case
  tableRowSchema.parse(newUseCase)

  // Add to table
  documentData.table.push(newUseCase)

  await writeFile(filePath, JSON.stringify(documentData, null, 2), 'utf-8')

  return newUseCase
}

export async function updateUseCase(
  documentId: string,
  useCaseId: string,
  updates: Partial<Omit<TableRow, 'id'>>
): Promise<TableRow> {
  const filePath = join(TABLE_DOCUMENTS_DIR, `${documentId}.json`)
  const content = await readFile(filePath, 'utf-8')
  const documentData = tableDocumentSchema.parse(JSON.parse(content))

  // Find the use case
  const useCaseIndex = documentData.table.findIndex((uc) => uc.id === useCaseId)
  if (useCaseIndex === -1) {
    throw new Error('Use case not found')
  }

  // Update the use case
  const updatedUseCase = {
    ...documentData.table[useCaseIndex],
    ...updates,
  }

  // Validate the updated use case
  tableRowSchema.parse(updatedUseCase)

  documentData.table[useCaseIndex] = updatedUseCase

  await writeFile(filePath, JSON.stringify(documentData, null, 2), 'utf-8')

  return updatedUseCase
}

export async function deleteUseCase(documentId: string, useCaseId: string): Promise<void> {
  const filePath = join(TABLE_DOCUMENTS_DIR, `${documentId}.json`)
  const content = await readFile(filePath, 'utf-8')
  const documentData = tableDocumentSchema.parse(JSON.parse(content))

  // Find the use case
  const useCaseIndex = documentData.table.findIndex((uc) => uc.id === useCaseId)
  if (useCaseIndex === -1) {
    throw new Error('Use case not found')
  }

  // Remove the use case
  documentData.table.splice(useCaseIndex, 1)

  await writeFile(filePath, JSON.stringify(documentData, null, 2), 'utf-8')
}
