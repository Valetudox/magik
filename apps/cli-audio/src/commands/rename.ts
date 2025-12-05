import { spawn } from 'child_process'
import { join } from 'path'
import { Command } from 'commander'
import inquirer from 'inquirer'
import { SCRIPTS_DIR, getRecentMeetings } from '../utils/index.js'

export const renameCommand = new Command('rename')
  .description('Rename a meeting and all related files')
  .action(async () => {
    // Get recent meetings
    const recentMeetings = await getRecentMeetings()

    let old: string
    let newName: string

    if (recentMeetings.length > 0) {
      // Show list of recent meetings + option to enter manually
      const choices = [
        ...recentMeetings,
        new inquirer.Separator(),
        { name: '→ Enter manually', value: '__manual__' },
      ]

      const selectAnswer = await inquirer.prompt([
        {
          type: 'list',
          name: 'old',
          message: 'Select meeting to rename:',
          choices,
          pageSize: 12,
        },
      ])

      if (selectAnswer.old === '__manual__') {
        // Manual input
        const manualAnswer = await inquirer.prompt([
          {
            type: 'input',
            name: 'old',
            message: 'Old meeting name:',
            validate: (input) => input.length > 0 || 'Old meeting name is required',
          },
        ])
        old = manualAnswer.old
      } else {
        old = selectAnswer.old
      }
    } else {
      // No meetings found, fallback to manual input
      const manualAnswer = await inquirer.prompt([
        {
          type: 'input',
          name: 'old',
          message: 'Old meeting name:',
          validate: (input) => input.length > 0 || 'Old meeting name is required',
        },
      ])
      old = manualAnswer.old
    }

    // Ask for new name
    const newNameAnswer = await inquirer.prompt([
      {
        type: 'input',
        name: 'new',
        message: 'New meeting name:',
        validate: (input) => input.length > 0 || 'New meeting name is required',
      },
    ])

    newName = newNameAnswer.new

    console.log('')
    console.log(`Renaming meeting from '${old}' to '${newName}'...`)
    console.log('')

    const scriptPath = join(SCRIPTS_DIR, 'renameMeeting.sh')

    const child = spawn(scriptPath, [old, newName], {
      stdio: 'inherit',
    })

    child.on('error', (error) => {
      console.error(`Error: ${error.message}`)
      process.exit(1)
    })

    child.on('exit', (code) => {
      if (code !== 0) {
        console.error(`Process exited with code ${code}`)
        process.exit(code || 1)
      }
    })
  })
