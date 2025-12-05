import { spawn } from 'child_process'
import { writeFileSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'
import { Command } from 'commander'
import inquirer from 'inquirer'
import { SCRIPTS_DIR, LANGUAGES } from '../utils/index.js'

const RECORDINGS_DIR = join(homedir(), 'Documents', 'recordings')

export const recordCommand = new Command('record')
  .description('Record audio to WAV file (processing handled by Airflow DAG)')
  .action(async () => {
    // Interactive prompts
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Meeting name:',
        default: new Date().toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '_'),
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
    console.log(`Starting recording for meeting: ${name}`)
    console.log(`Language: ${language}`)
    console.log('Press Ctrl+C to stop recording')
    console.log('')

    const wavPath = join(RECORDINGS_DIR, `${name}.wav`)
    const metadataPath = join(RECORDINGS_DIR, `${name}.meta.json`)
    const recordScriptPath = join(SCRIPTS_DIR, 'audio', 'recordAudio.sh')

    // Function to create metadata file
    const createMetadata = () => {
      const metadata = {
        meeting_name: name,
        language: language,
        wav_path: wavPath,
        timestamp: new Date().toISOString(),
      }

      try {
        writeFileSync(metadataPath, JSON.stringify(metadata, null, 2))
        console.log('')
        console.log(`✓ Recording saved: ${wavPath}`)
        console.log(`✓ Metadata created: ${metadataPath}`)
        console.log('')
        console.log('Processing pipeline will start automatically via Airflow DAG.')
        console.log('Monitor progress at: http://localhost:8080')
      } catch (error) {
        console.error(`Warning: Failed to create metadata file: ${error}`)
        console.log(`Recording saved, but you may need to process manually: ${wavPath}`)
      }
    }

    // Record audio to WAV file
    const child = spawn(recordScriptPath, [wavPath], {
      stdio: 'inherit',
    })

    // Handle Ctrl+C gracefully
    process.on('SIGINT', () => {
      console.log('\n\nStopping recording...')
      child.kill('SIGINT')
      // Give the child process a moment to flush and close the file
      setTimeout(() => {
        createMetadata()
        process.exit(0)
      }, 500)
    })

    child.on('error', (error) => {
      console.error(`Error: ${error.message}`)
      process.exit(1)
    })

    child.on('exit', (code) => {
      // Only create metadata if process exited normally (not from SIGINT)
      if (code === 0) {
        createMetadata()
      }
    })
  })
