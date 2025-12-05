import { spawn } from 'child_process'
import { mkdirSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'
import { Command } from 'commander'
import inquirer from 'inquirer'
import { SCRIPTS_DIR, LANGUAGES } from '../utils/index.js'

const JSONL_DIR = join(homedir(), 'Documents', 'live-transcriptions')
const MARKDOWN_DIR = join(homedir(), 'Obsidian', 'magic', 'LiveTranscriptions')
const RECORDINGS_DIR = join(homedir(), 'Documents', 'recordings')
const DEVICE_NAME = 'rec_mix.monitor'

export const recordLiveCommand = new Command('record-live')
  .description('Record audio with real-time transcription')
  .action(async () => {
    // Interactive prompts
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Meeting name:',
        default: `live_${new Date().toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '_')}`,
      },
      {
        type: 'list',
        name: 'language',
        message: 'Select language:',
        choices: LANGUAGES,
        default: 'en',
      },
    ])

    const { name, language } = answers

    console.log('')
    console.log(`Starting live recording for meeting: ${name}`)
    console.log(`Language: ${language}`)
    console.log('Transcription will be saved in real-time.')
    console.log('Press Ctrl+C to stop recording')
    console.log('')

    // Ensure directories exist
    mkdirSync(JSONL_DIR, { recursive: true })
    mkdirSync(MARKDOWN_DIR, { recursive: true })
    mkdirSync(RECORDINGS_DIR, { recursive: true })

    const wavPath = join(RECORDINGS_DIR, `${name}.wav`)
    const jsonlPath = join(JSONL_DIR, `${name}.jsonl`)
    const markdownPath = join(MARKDOWN_DIR, `${name}.md`)
    const recordLiveScriptPath = join(process.cwd(), 'src', 'recordLiveTS.ts')

    // Record audio with live transcription
    const child = spawn(
      'bun',
      ['run', recordLiveScriptPath, name, language, DEVICE_NAME, wavPath, markdownPath, jsonlPath],
      {
        stdio: 'inherit',
      }
    )

    // Handle Ctrl+C gracefully
    process.on('SIGINT', () => {
      console.log('\n\nStopping recording...')
      child.kill('SIGINT')
      // Give the child process a moment to flush and close the file
      setTimeout(() => {
        console.log('')
        console.log(`✓ WAV: ${wavPath}`)
        console.log(`✓ Markdown: ${markdownPath}`)
        console.log(`✓ JSONL: ${jsonlPath}`)
        console.log('')
        process.exit(0)
      }, 500)
    })

    child.on('error', (error) => {
      console.error(`Error: ${error.message}`)
      process.exit(1)
    })

    child.on('exit', (code) => {
      if (code === 0) {
        console.log('')
        console.log(`✓ WAV: ${wavPath}`)
        console.log(`✓ Markdown: ${markdownPath}`)
        console.log(`✓ JSONL: ${jsonlPath}`)
        console.log('')
      }
    })
  })
