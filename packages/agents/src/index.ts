// Agent functions
export { runDecisionAgent } from './agents/decision/decision.agent.js'
export { runCodebaseAgent } from './agents/codebase/codebase.agent.js'
export { runTableDocumentAgent } from './agents/tabledocument/tabledocument.agent.js'

// Library utilities
export { createTypedAgent } from './lib/index.js'
export type { TypedAgentConfig, TypedAgentResult } from './lib/index.js'

// Codebase agent types
export type { CodebaseAgentOptions, CodebaseAgentResult } from './agents/codebase/codebase.agent.js'

export type {
  ReadFileInput,
  ListDirectoryInput,
  FindFilesInput,
  SearchContentInput,
  AnalyzeCodeInput,
  FileContent,
  DirectoryEntry,
  DirectoryListing,
  FileMatch,
  SearchMatch,
  CodeImport,
  CodeExport,
  CodeFunction,
  CodeClass,
  CodeAnalysis,
} from './agents/codebase/interface.types.js'
