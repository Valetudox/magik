import { spawn } from 'child_process'
import { join } from 'path'
import { Command } from 'commander'
import inquirer from 'inquirer'
import { SCRIPTS_DIR } from '../utils/index.js'

export const knowledgeBaseCommand = new Command('knowledge-base')
  .description('Ask questions about your meeting transcripts using AI')
  .action(async () => {
    console.log('')
    console.log('💬 Knowledge Base Q&A')
    console.log('Ask questions about your meeting transcripts')
    console.log('Leave empty or press Ctrl+C to exit')
    console.log('')

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    while (true) {
      const answers = await inquirer.prompt<{ question: string }>([
        {
          type: 'input',
          name: 'question',
          message: '🔍 Ask a question:',
        },
      ])

      const question = answers.question.trim()

      // Exit if empty
      if (!question) {
        console.log('')
        console.log('Goodbye! 👋')
        break
      }

      console.log('')
      console.log('⏳ Searching transcripts...')
      console.log('')

      // Spawn Python script with question
      // Must run from the gemini directory for uv to find the venv
      const geminiDir = join(SCRIPTS_DIR, 'gemini')
      const child = spawn('uv', ['run', 'query_knowledge_base.py', '--question', question], {
        cwd: geminiDir,
        stdio: 'inherit',
      })

      // Wait for completion
      await new Promise<void>((resolve, reject) => {
        child.on('error', (error) => {
          console.error(`Error: ${error.message}`)
          reject(error)
        })

        child.on('exit', (code) => {
          if (code !== 0) {
            console.error(`Query failed with exit code ${code}`)
          }
          console.log('')
          resolve()
        })
      })
    }
  })
