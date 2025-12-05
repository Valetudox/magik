import { readFile, readdir, stat } from 'node:fs/promises'
import { join, relative, resolve } from 'node:path'
import { tool } from 'ai'
import { glob } from 'glob'
import {
  readFileInput,
  listDirectoryInput,
  findFilesInput,
  searchContentInput,
} from './interface.types.js'

export function createFileSystemTools(basePath: string) {
  const resolvedBasePath = resolve(basePath)

  return {
    read_file: tool({
      description: 'Read contents of a file, optionally with line range',
      parameters: readFileInput,
      execute: async ({ path: filePath, lines }) => {
        try {
          const fullPath = resolve(resolvedBasePath, filePath)
          const content = await readFile(fullPath, 'utf-8')
          const lineArray = content.split('\n')

          let resultContent = content
          let startLine = 1
          let endLine = lineArray.length

          if (lines) {
            startLine = lines.start
            endLine = lines.end || lineArray.length
            resultContent = lineArray.slice(startLine - 1, endLine).join('\n')
          }

          return {
            path: fullPath,
            content: resultContent,
            lineCount: lineArray.length,
            startLine,
            endLine,
          }
        } catch (error: any) {
          throw new Error(`Error reading file: ${error.message}`)
        }
      },
    }),

    list_directory: tool({
      description: 'List contents of a directory, optionally recursive',
      parameters: listDirectoryInput,
      execute: async ({ path: dirPath, recursive = false, maxDepth = Infinity }) => {
        try {
          const fullPath = resolve(resolvedBasePath, dirPath)
          const entries: {
            name: string
            path: string
            type: 'file' | 'directory' | 'symlink'
            size?: number
          }[] = []

          async function listDir(path: string, depth = 0) {
            if (depth > maxDepth) {
              return
            }

            const items = await readdir(path)
            for (const item of items) {
              const itemPath = join(path, item)
              const stats = await stat(itemPath)
              const relativePath = relative(resolvedBasePath, itemPath)

              entries.push({
                name: item,
                path: relativePath,
                type: stats.isDirectory()
                  ? 'directory'
                  : stats.isSymbolicLink()
                    ? 'symlink'
                    : 'file',
                size: stats.isFile() ? stats.size : undefined,
              })

              if (recursive && stats.isDirectory()) {
                await listDir(itemPath, depth + 1)
              }
            }
          }

          await listDir(fullPath)

          return {
            path: relative(resolvedBasePath, fullPath),
            entries,
          }
        } catch (error: any) {
          throw new Error(`Error listing directory: ${error.message}`)
        }
      },
    }),

    find_files: tool({
      description: 'Find files matching glob patterns',
      parameters: findFilesInput,
      execute: async ({ pattern, path: searchPath, excludePatterns }) => {
        try {
          const fullPath = searchPath ? resolve(resolvedBasePath, searchPath) : resolvedBasePath
          const exclude = excludePatterns || ['node_modules/**', 'dist/**', '.git/**']

          const files = await glob(pattern, {
            cwd: fullPath,
            ignore: exclude,
            absolute: true,
          })

          return files.map((file) => ({
            path: file,
            relativePath: relative(resolvedBasePath, file),
          }))
        } catch (error: any) {
          throw new Error(`Error finding files: ${error.message}`)
        }
      },
    }),

    search_content: tool({
      description: 'Search for pattern in file contents (grep)',
      parameters: searchContentInput,
      execute: async ({
        pattern,
        path: searchPath,
        filePattern = '**/*',
        caseSensitive = false,
        maxResults = 100,
      }) => {
        try {
          const fullPath = searchPath ? resolve(resolvedBasePath, searchPath) : resolvedBasePath
          const regex = new RegExp(pattern, caseSensitive ? 'g' : 'gi')
          const matches: {
            path: string
            line: number
            column?: number
            content: string
            matchedText: string
          }[] = []

          const stats = await stat(fullPath)
          const filesToSearch = stats.isDirectory()
            ? await glob(filePattern, {
                cwd: fullPath,
                ignore: ['node_modules/**', 'dist/**', '.git/**'],
                absolute: true,
              })
            : [fullPath]

          for (const filePath of filesToSearch) {
            if (matches.length >= maxResults) {
              break
            }

            try {
              const content = await readFile(filePath, 'utf-8')
              const lines = content.split('\n')

              for (let i = 0; i < lines.length; i++) {
                if (matches.length >= maxResults) {
                  break
                }

                const line = lines[i]
                const match = regex.exec(line)

                if (match) {
                  matches.push({
                    path: relative(resolvedBasePath, filePath),
                    line: i + 1,
                    column: match.index,
                    content: line.trim(),
                    matchedText: match[0],
                  })
                }
              }
            } catch {
              continue
            }
          }

          return matches
        } catch (error: any) {
          throw new Error(`Error searching content: ${error.message}`)
        }
      },
    }),
  }
}
