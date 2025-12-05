import { spawn } from 'child_process'
import { homedir } from 'os'
import { join } from 'path'
import { Command } from 'commander'
import inquirer from 'inquirer'
import { SCRIPTS_DIR, getRecentMeetings, extractSpeakers } from '../utils/index.js'

export const setupSpeakersCommand = new Command('setup-speakers')
  .description('Setup speaker names for a meeting transcription')
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

      const selectAnswer = await inquirer.prompt([
        {
          type: 'list',
          name: 'meeting',
          message: 'Select meeting to setup speakers:',
          choices,
          pageSize: 12,
        },
      ])

      if (selectAnswer.meeting === '__manual__') {
        // Manual input
        const manualAnswer = await inquirer.prompt([
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
      const manualAnswer = await inquirer.prompt([
        {
          type: 'input',
          name: 'meeting',
          message: 'Meeting name:',
          validate: (input) => input.length > 0 || 'Meeting name is required',
        },
      ])
      meetingName = manualAnswer.meeting
    }

    // Get transcript path
    const recordingDir = join(homedir(), 'Documents', 'recordings')
    const transcriptPath = join(recordingDir, `${meetingName}_transcript.json`)

    // Extract speakers from transcript
    let speakers: string[]
    try {
      speakers = await extractSpeakers(transcriptPath)
    } catch (error) {
      console.error('Error: Could not extract speakers from transcript')
      console.error(`Make sure ${transcriptPath} exists`)
      process.exit(1)
    }

    if (speakers.length === 0) {
      console.error('Error: No speakers found in transcript')
      process.exit(1)
    }

    console.log('')
    console.log(`Found ${speakers.length} speaker(s): ${speakers.join(', ')}`)
    console.log('')

    // Ask for speaker names
    const speakerMappings: Record<string, string> = {}

    for (const speakerId of speakers) {
      const answer = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: `Enter name for ${speakerId}:`,
          validate: (input) => input.length > 0 || 'Speaker name is required',
        },
      ])
      speakerMappings[speakerId] = answer.name
    }

    console.log('')
    console.log('Speaker mappings:')
    for (const [id, name] of Object.entries(speakerMappings)) {
      console.log(`  ${id} → ${name}`)
    }
    console.log('')

    const scriptPath = join(SCRIPTS_DIR, 'transcription', 'setupSpeakers.sh')

    // Pass speaker mappings as JSON string
    const child = spawn(scriptPath, [meetingName, JSON.stringify(speakerMappings)], {
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
