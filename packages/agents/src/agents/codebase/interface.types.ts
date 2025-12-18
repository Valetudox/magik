import { z } from 'zod'

export const readFileInput = z.object({
  path: z.string().describe('Absolute or relative file path'),
  lines: z
    .object({
      start: z.number().describe('Starting line number (1-indexed)'),
      end: z.number().optional().describe('Ending line number (inclusive)'),
    })
    .optional()
    .describe('Optional line range to read'),
})

export const listDirectoryInput = z.object({
  path: z.string().describe('Directory path to list'),
  recursive: z.boolean().optional().describe('Whether to list recursively'),
  maxDepth: z.number().optional().describe('Maximum depth for recursive listing'),
})

export const findFilesInput = z.object({
  pattern: z.string().describe('Glob pattern (e.g., "**/*.ts", "src/**/*.tsx")'),
  path: z.string().optional().describe('Base path to search from (defaults to cwd)'),
  excludePatterns: z
    .array(z.string())
    .optional()
    .describe('Patterns to exclude (e.g., ["node_modules/**", "dist/**"])'),
})

export const searchContentInput = z.object({
  pattern: z.string().describe('Search pattern (regex supported)'),
  path: z.string().optional().describe('Path to search in (file or directory)'),
  filePattern: z.string().optional().describe('File pattern to filter (e.g., "*.ts")'),
  caseSensitive: z.boolean().optional().describe('Case sensitive search'),
  maxResults: z.number().optional().describe('Maximum number of results'),
})

export const analyzeCodeInput = z.object({
  path: z.string().describe('File path to analyze'),
  analysisType: z
    .enum(['imports', 'exports', 'functions', 'classes', 'all'])
    .describe('Type of code analysis to perform'),
})

export const todoWriteInput = z.object({
  todos: z
    .array(
      z.object({
        id: z.string().describe('Unique identifier for the todo item'),
        task: z.string().describe('Description of the task'),
        status: z
          .enum(['pending', 'in_progress', 'completed'])
          .describe('Current status of the task'),
      })
    )
    .describe('Complete list of todo items'),
})

export const todoReadInput = z.object({})

export const fileContent = z.object({
  path: z.string(),
  content: z.string(),
  lineCount: z.number(),
  startLine: z.number().optional(),
  endLine: z.number().optional(),
})

export const directoryEntry = z.object({
  name: z.string(),
  path: z.string(),
  type: z.enum(['file', 'directory', 'symlink']),
  size: z.number().optional(),
})

export const directoryListing = z.object({
  path: z.string(),
  entries: z.array(directoryEntry),
})

export const fileMatch = z.object({
  path: z.string(),
  relativePath: z.string(),
})

export const searchMatch = z.object({
  path: z.string(),
  line: z.number(),
  column: z.number().optional(),
  content: z.string(),
  matchedText: z.string(),
})

export const codeImport = z.object({
  source: z.string(),
  specifiers: z.array(z.string()),
  importType: z.enum(['default', 'named', 'namespace', 'side-effect']),
})

export const codeExport = z.object({
  name: z.string().optional(),
  type: z.enum(['default', 'named']),
  kind: z.enum(['function', 'class', 'variable', 'type']).optional(),
})

export const codeFunction = z.object({
  name: z.string(),
  params: z.array(z.string()),
  isAsync: z.boolean(),
  isExported: z.boolean(),
  line: z.number(),
})

export const codeClass = z.object({
  name: z.string(),
  methods: z.array(z.string()),
  isExported: z.boolean(),
  line: z.number(),
})

export const codeAnalysis = z.object({
  path: z.string(),
  imports: z.array(codeImport).optional(),
  exports: z.array(codeExport).optional(),
  functions: z.array(codeFunction).optional(),
  classes: z.array(codeClass).optional(),
})

export const todoItem = z.object({
  id: z.string(),
  task: z.string(),
  status: z.enum(['pending', 'in_progress', 'completed']),
})

export const todoList = z.object({
  todos: z.array(todoItem),
})

export type ReadFileInput = z.infer<typeof readFileInput>
export type ListDirectoryInput = z.infer<typeof listDirectoryInput>
export type FindFilesInput = z.infer<typeof findFilesInput>
export type SearchContentInput = z.infer<typeof searchContentInput>
export type AnalyzeCodeInput = z.infer<typeof analyzeCodeInput>
export type TodoWriteInput = z.infer<typeof todoWriteInput>
export type TodoReadInput = z.infer<typeof todoReadInput>

export type FileContent = z.infer<typeof fileContent>
export type DirectoryEntry = z.infer<typeof directoryEntry>
export type DirectoryListing = z.infer<typeof directoryListing>
export type FileMatch = z.infer<typeof fileMatch>
export type SearchMatch = z.infer<typeof searchMatch>
export type CodeImport = z.infer<typeof codeImport>
export type CodeExport = z.infer<typeof codeExport>
export type CodeFunction = z.infer<typeof codeFunction>
export type CodeClass = z.infer<typeof codeClass>
export type CodeAnalysis = z.infer<typeof codeAnalysis>
export type TodoItem = z.infer<typeof todoItem>
export type TodoList = z.infer<typeof todoList>
