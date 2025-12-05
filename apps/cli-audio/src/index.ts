#!/usr/bin/env bun

import { Command } from 'commander'
import inquirer from 'inquirer'
import { deleteMeetingCommand } from './commands/deleteMeeting.js'
import { knowledgeBaseCommand } from './commands/knowledgeBase.js'
import { recordCommand } from './commands/record.js'
import { recordLiveCommand } from './commands/recordLive.js'
import { renameCommand } from './commands/rename.js'
import { setupSpeakersCommand } from './commands/setupSpeakers.js'

const program = new Command()

program
  .name('magik')
  .description('Audio recording and transcription tool with Obsidian integration')
  .version('1.0.0')

// Register commands
program.addCommand(recordCommand)
program.addCommand(recordLiveCommand)
program.addCommand(renameCommand)
program.addCommand(setupSpeakersCommand)
program.addCommand(knowledgeBaseCommand)
program.addCommand(deleteMeetingCommand)

// If no command provided, show interactive selector
if (process.argv.length <= 2) {
  const commands = [
    {
      name: '🎙️  Record a meeting',
      value: 'record',
      description: 'Record audio, convert to MP3, and transcribe with diarization',
    },
    {
      name: '🔴  Record a meeting live',
      value: 'record-live',
      description: 'Record audio with real-time transcription',
    },
    {
      name: '✏️  Rename a meeting',
      value: 'rename',
      description: 'Rename a meeting and all related files',
    },
    {
      name: '👥  Setup speakers',
      value: 'setup-speakers',
      description: 'Assign names to speakers in a transcription',
    },
    {
      name: '💬  Knowledge base Q&A',
      value: 'knowledge-base',
      description: 'Ask questions about your meeting transcripts',
    },
    {
      name: '🗑️  Delete a meeting',
      value: 'delete-meeting',
      description: 'Delete a meeting and all related files',
    },
  ]

  inquirer
    .prompt([
      {
        type: 'list',
        name: 'command',
        message: 'What would you like to do?',
        choices: commands.map((cmd) => ({
          name: cmd.name,
          value: cmd.value,
          short: cmd.name,
        })),
      },
    ])
    .then((answers) => {
      // Execute the selected command
      process.argv.push(answers.command)
      program.parse()
    })
} else {
  program.parse()
}
