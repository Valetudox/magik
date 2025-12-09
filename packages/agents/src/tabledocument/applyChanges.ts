import type { TableDocument } from '@magik/tabledocuments'
import type { TableDocumentChange } from './interface.type.js'

export function applyChanges(
  inputDocument: TableDocument,
  changes: TableDocumentChange[]
): TableDocument {
  // Create a deep copy of the document
  const result = JSON.parse(JSON.stringify(inputDocument)) as TableDocument

  for (const change of changes) {
    switch (change.type) {
      case 'addUseCase':
        result.table.push(change.useCase)
        break

      case 'updateUseCase': {
        const useCase = result.table.find((uc) => uc.id === change.useCaseId)
        if (useCase) {
          if (change.updates.use_case !== undefined) {
            useCase.use_case = change.updates.use_case
          }
          if (change.updates.diagram !== undefined) {
            useCase.diagram = change.updates.diagram
          }
          if (change.updates.required_context !== undefined) {
            useCase.required_context = change.updates.required_context
          }
          if (change.updates.required_tools !== undefined) {
            useCase.required_tools = change.updates.required_tools
          }
          if (change.updates.potential_interactions !== undefined) {
            useCase.potential_interactions = change.updates.potential_interactions
          }
          if (change.updates.notes !== undefined) {
            useCase.notes = change.updates.notes
          }
        }
        break
      }

      case 'removeUseCase':
        result.table = result.table.filter((uc) => uc.id !== change.useCaseId)
        break

      case 'setConfluenceUrl':
        result.confluence_url = change.url
        break
    }
  }

  return result
}
