import { tool } from 'ai'
import { todoWriteInput, todoReadInput, type TodoItem } from './interface.types.js'

export function createTodoTools() {
  let todoList: TodoItem[] = []

  return {
    todo_write: tool({
      description:
        'Write/update the complete todo list. MUST be called at the start of every task and after each completed task.',
      parameters: todoWriteInput,
      execute: async ({ todos }) => {
        todoList = todos
        console.log('\n📝 Todo List Updated:')
        for (const todo of todos) {
          const icon =
            todo.status === 'completed' ? '✅' : todo.status === 'in_progress' ? '🔄' : '⏳'
          console.log(`   ${icon} [${todo.status}] ${todo.task}`)
        }
        return await Promise.resolve({
          success: true,
          message: `Updated ${todos.length} todo items`,
          todos,
        })
      },
    }),

    todo_read: tool({
      description: 'Read the current todo list to check progress and see remaining tasks',
      parameters: todoReadInput,
      execute: async () => {
        return await Promise.resolve({
          todos: todoList,
        })
      },
    }),
  }
}
