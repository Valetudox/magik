import { readdir, readFile, writeFile, stat, unlink, mkdir } from 'fs/promises'
import { join, basename, dirname, relative } from 'path'
import type { TableDocument, TableDocumentSummary } from '@magik/tabledocuments'
import { tableDocumentSchema } from '@magik/tabledocuments'
import { TABLE_DOCUMENTS_DIR } from '../config.js'

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

export async function listAllTableDocuments(): Promise<TableDocumentSummary[]> {
  const documentIds = await findAllJsonFiles(TABLE_DOCUMENTS_DIR, TABLE_DOCUMENTS_DIR)

  const documents: TableDocumentSummary[] = await Promise.all(
    documentIds.map(async (id) => {
      const filePath = join(TABLE_DOCUMENTS_DIR, `${id}.json`)
      const content = await readFile(filePath, 'utf-8')
      const fileStats = await stat(filePath)
      const document = JSON.parse(content) as TableDocument

      const filename = basename(id)
      const directory = dirname(id) === '.' ? '' : dirname(id)

      return {
        id,
        name: filename.replace(/-/g, ' '),
        directory,
        useCaseCount: document.table.length,
        confluence_url: document.confluence_url,
        createdAt: fileStats.birthtime.toISOString(),
        updatedAt: fileStats.mtime.toISOString(),
      }
    })
  )

  return documents
}

export async function getTableDocumentById(id: string): Promise<TableDocument & { id: string }> {
  const filePath = join(TABLE_DOCUMENTS_DIR, `${id}.json`)
  const content = await readFile(filePath, 'utf-8')
  const documentData = tableDocumentSchema.parse(JSON.parse(content))

  return {
    id,
    ...documentData,
  }
}

export async function createTableDocument(pathId: string): Promise<string> {
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

  const filePath = join(TABLE_DOCUMENTS_DIR, `${sanitized}.json`)

  try {
    await stat(filePath)
    throw new Error('Table document with this name already exists')
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'code' in e && e.code !== 'ENOENT') {
      throw e
    }
  }

  const parentDir = dirname(filePath)
  await mkdir(parentDir, { recursive: true })

  const emptyDocument: TableDocument = {
    table: [],
  }

  await writeFile(filePath, JSON.stringify(emptyDocument, null, 2), 'utf-8')

  return sanitized
}

export async function deleteTableDocument(id: string): Promise<void> {
  const filePath = join(TABLE_DOCUMENTS_DIR, `${id}.json`)
  await unlink(filePath)
}

export async function updateTableDocument(
  id: string,
  updates: {
    confluence_url?: string
    aiSessionId?: string
    table?: TableDocument['table']
  }
): Promise<void> {
  const filePath = join(TABLE_DOCUMENTS_DIR, `${id}.json`)
  const content = await readFile(filePath, 'utf-8')
  const documentData = tableDocumentSchema.parse(JSON.parse(content))

  if (updates.confluence_url !== undefined) {
    if (updates.confluence_url === '') {
      delete documentData.confluence_url
    } else {
      documentData.confluence_url = updates.confluence_url
    }
  }

  if (updates.aiSessionId !== undefined) {
    documentData.aiSessionId = updates.aiSessionId
  }

  if (updates.table !== undefined) {
    documentData.table = updates.table
  }

  await writeFile(filePath, JSON.stringify(documentData, null, 2), 'utf-8')
}
