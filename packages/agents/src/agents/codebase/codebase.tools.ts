import { createFileSystemTools } from './filesystem.tools.js'
import { createTodoTools } from './todo.tools.js'

export function createCodebaseTools(basePath: string) {
  const fileSystemTools = createFileSystemTools(basePath)
  const todoTools = createTodoTools()

  return {
    ...fileSystemTools,
    ...todoTools,
  }
}
