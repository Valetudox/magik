#!/usr/bin/env bun
/**
 * Live audio recording with real-time Speechmatics transcription
 * Usage: bun run src/recordLiveTS.ts <meeting_name> <language> <device_name> <wav_path> <markdown_path> <jsonl_path>
 */

import { createWriteStream, writeFileSync, appendFileSync } from 'fs'
import { RealtimeClient } from '@speechmatics/real-time-client'
import mic from 'mic'
import { FileWriter } from 'wav'

const SAMPLE_RATE = 48000
const CHANNELS = 2
const BIT_DEPTH = 16

interface TranscriptMessage {
  message: string
  metadata?: {
    transcript?: string
    start_time?: number
    end_time?: number
  }
  results?: any[]
}

async function recordAndTranscribe(
  meetingName: string,
  language: string,
  deviceName: string,
  wavPath: string,
  markdownPath: string,
  jsonlPath: string
) {
  const apiKey = process.env.SPEECHMATICS_API_KEY
  if (!apiKey) {
    console.error('Error: SPEECHMATICS_API_KEY environment variable not set')
    process.exit(1)
  }

  // Set PulseAudio source device
  process.env.PULSE_SOURCE = deviceName

  console.log(`Using device: ${deviceName}`)
  console.log(`Recording to: ${wavPath}`)
  console.log(`Markdown: ${markdownPath}`)
  console.log(`JSONL: ${jsonlPath}`)
  console.log('')

  // Initialize markdown file
  writeFileSync(markdownPath, `# Live Transcription\n\n**Language:** ${language}\n\n---\n\n`)

  // Create WAV file writer
  const wavWriter = new FileWriter(wavPath, {
    sampleRate: SAMPLE_RATE,
    channels: CHANNELS,
    bitDepth: BIT_DEPTH,
  })

  // Initialize mic
  const micInstance = mic({
    device: 'pulse',
    rate: SAMPLE_RATE.toString(),
    channels: CHANNELS.toString(),
    fileType: 'raw',
    encoding: 'signed-integer',
    bitwidth: BIT_DEPTH,
    exitOnSilence: false,
  })

  const micInputStream = micInstance.getAudioStream()

  // Track last transcript to avoid duplicates
  let lastTranscript = ''

  // Initialize Speechmatics Real-time client
  const rtClient = new RealtimeClient(apiKey)

  // Set up event handlers
  rtClient.addEventListener('AddTranscript', (message: TranscriptMessage) => {
    // Write to JSONL
    appendFileSync(jsonlPath, JSON.stringify(message) + '\n')

    // Write to markdown (only final transcripts with content)
    const transcript = message.metadata?.transcript || ''
    if (transcript && transcript !== lastTranscript) {
      const startTime = message.metadata?.start_time || 0
      const minutes = Math.floor(startTime / 60)
      const seconds = Math.floor(startTime % 60)

      const formattedLine = `**${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}** ${transcript}\n\n`
      appendFileSync(markdownPath, formattedLine)
      lastTranscript = transcript
    }
  })

  rtClient.addEventListener('AddPartialTranscript', (message: TranscriptMessage) => {
    // Write all partials to JSONL for debugging
    appendFileSync(jsonlPath, JSON.stringify(message) + '\n')
  })

  rtClient.addEventListener('Error', (error: any) => {
    console.error('Speechmatics error:', error)
  })

  rtClient.addEventListener('EndOfTranscript', () => {
    console.log('\nEnd of transcript')
  })

  // Handle mic stream data
  micInputStream.on('data', (data: Buffer) => {
    // Write to WAV file
    wavWriter.write(data)

    // Send to Speechmatics
    if (rtClient.isConnected()) {
      rtClient.sendAudio(data)
    }
  })

  micInputStream.on('error', (err: Error) => {
    console.error('Mic error:', err)
  })

  // Handle process termination
  const cleanup = async () => {
    console.log('\n\nStopping...')

    // Stop mic
    micInstance.stop()

    // End WAV file
    wavWriter.end()

    // Close Speechmatics connection
    if (rtClient.isConnected()) {
      await rtClient.stop()
    }

    console.log('Recording stopped.')
    console.log(`WAV: ${wavPath}`)
    console.log(`Markdown: ${markdownPath}`)
    console.log(`JSONL: ${jsonlPath}`)

    process.exit(0)
  }

  process.on('SIGINT', cleanup)
  process.on('SIGTERM', cleanup)

  // Start Speechmatics connection
  console.log('Connecting to Speechmatics...')

  await rtClient.start({
    transcription_config: {
      language,
      enable_partials: true,
      max_delay: 2.0,
    },
    audio_format: {
      type: 'raw',
      encoding: 'pcm_s16le',
      sample_rate: SAMPLE_RATE,
    },
  })

  console.log('Connected! Recording started...')
  console.log('Press Ctrl+C to stop\n')

  // Start mic
  micInstance.start()

  // Keep process alive
  await new Promise(() => {})
}

// Main
const args = process.argv.slice(2)
if (args.length !== 6) {
  console.error(
    'Usage: bun run src/recordLiveTS.ts <meeting_name> <language> <device_name> <wav_path> <markdown_path> <jsonl_path>'
  )
  process.exit(1)
}

const [meetingName, language, deviceName, wavPath, markdownPath, jsonlPath] = args

recordAndTranscribe(meetingName, language, deviceName, wavPath, markdownPath, jsonlPath).catch(
  (err) => {
    console.error('Fatal error:', err)
    process.exit(1)
  }
)
