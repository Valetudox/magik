import { spawn } from 'child_process'
import { join } from 'path'
import { Command } from 'commander'
import inquirer from 'inquirer'
import { SCRIPTS_DIR, getRecentMeetings } from '../utils/index.js'

export const deleteMeetingCommand = new Command('delete-meeting')
  .description('Delete a meeting and all related files')
  .action(async () => {
    // Get recent meetings
    const recentMeetings = await getRecentMeetings()

    let meetingName: string

    if (recentMeetings.length > 0) {
      // Show list of recent meetings + option to enter manually
      const choices = [
        ...recentMeetings,
        new inquirer.Separator(),
        { name: '→ Enter manually', value: '__manual__' },
      ]

      const selectAnswer = await inquirer.prompt<{ meeting: string }>([
        {
          type: 'list',
          name: 'meeting',
          message: 'Select meeting to delete:',
          choices,
          pageSize: 12,
        },
      ])

      if (selectAnswer.meeting === '__manual__') {
        // Manual input
        const manualAnswer = await inquirer.prompt<{ meeting: string }>([
          {
            type: 'input',
            name: 'meeting',
            message: 'Meeting name:',
            validate: (input) => input.length > 0 || 'Meeting name is required',
          },
        ])
        meetingName = manualAnswer.meeting
      } else {
        meetingName = selectAnswer.meeting
      }
    } else {
      // No meetings found, fallback to manual input
      const manualAnswer = await inquirer.prompt<{ meeting: string }>([
        {
          type: 'input',
          name: 'meeting',
          message: 'Meeting name:',
          validate: (input) => input.length > 0 || 'Meeting name is required',
        },
      ])
      meetingName = manualAnswer.meeting
    }

    // Confirmation prompt
    console.log('')
    console.log(`⚠️  You are about to delete meeting: ${meetingName}`)
    console.log('This will remove:')
    console.log('  - Audio files (MP3, WAV)')
    console.log('  - Transcript files (JSON, speaker mappings)')
    console.log('  - Obsidian notes (meeting note, transcript page)')
    console.log('')

    const confirmAnswer = await inquirer.prompt<{ confirmed: boolean }>([
      {
        type: 'confirm',
        name: 'confirmed',
        message: '⚠️  Are you sure? This cannot be undone.',
        default: false,
      },
    ])

    if (!confirmAnswer.confirmed) {
      console.log('')
      console.log('Deletion cancelled.')
      return
    }

    console.log('')
    console.log('Deleting...')
    console.log('')

    const scriptPath = join(SCRIPTS_DIR, 'deleteMeeting.sh')

    // Spawn bash script
    const child = spawn(scriptPath, [meetingName], {
      stdio: 'inherit',
    })

    child.on('error', (error) => {
      console.error(`Error: ${error.message}`)
      process.exit(1)
    })

    child.on('exit', (code) => {
      if (code !== 0) {
        console.error(`\nDeletion failed with exit code ${code}`)
        process.exit(code ?? 1)
      }
    })
  })
