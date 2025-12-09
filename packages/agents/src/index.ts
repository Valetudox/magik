// Agent functions
export { runDecisionAgent } from './decision/decision.agent.js'
export { runCodebaseAgent } from './codebase/codebase.agent.js'
export { runTableDocumentAgent } from './tabledocument/tabledocument.agent.js'

// Utility functions
export { applyChanges } from './decision/applyChanges.js'

// Decision agent types
export type {
  DecisionChange,
  DecisionChangeReport,
  AddComponent,
  UpdateComponent,
  RemoveComponent,
  AddDriver,
  UpdateDriver,
  RemoveDriver,
  AddOption,
  UpdateOption,
  RemoveOption,
  AddEvaluation,
  UpdateEvaluation,
  RemoveEvaluation,
  UpdateProblemDefinition,
  UpdateProposal,
  SetSelectedOption,
  SetConfluenceLink,
} from './decision/interface.type.js'

// Codebase agent types
export type { CodebaseAgentOptions, CodebaseAgentResult } from './codebase/codebase.agent.js'

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
} from './codebase/interface.types.js'

// Table document agent types
export type {
  TableDocumentChange,
  TableDocumentChangeReport,
  AddUseCase,
  UpdateUseCase,
  RemoveUseCase,
  SetConfluenceUrl,
} from './tabledocument/interface.type.js'

// Zod schemas (for validation if needed)
export { decisionChange, decisionChangeReport } from './decision/interface.type.js'
export { tableDocumentChange, tableDocumentChangeReport } from './tabledocument/interface.type.js'
