import { readdir, stat, readFile } from 'fs/promises'
import { join, extname, basename } from 'path'
import { RECORDINGS_DIR } from '../config'
import type { Recording, TranscriptMetadata } from '../types'

export async function listRecordings(): Promise<Recording[]> {
  try {
    const files = await readdir(RECORDINGS_DIR)

    // Filter for audio files only (wav, mp3)
    function isAudioFile(file: string) {
      const ext = extname(file).toLowerCase()
      return ext === '.wav' || ext === '.mp3'
    }
    const audioFiles = files.filter(isAudioFile)

    // Process each audio file
    const recordings = await Promise.all(audioFiles.map(getRecordingInfo))

    // Sort by modified date (newest first)
    function compareByModifiedDate(a: Recording, b: Recording) {
      return new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime()
    }
    return recordings.sort(compareByModifiedDate)
  } catch (error) {
    console.error('Error listing recordings:', error)
    throw error
  }
}

export async function getRecordingInfo(filename: string): Promise<Recording> {
  const filePath = join(RECORDINGS_DIR, filename)
  const fileStats = await stat(filePath)
  const ext = extname(filename).toLowerCase()
  const baseName = basename(filename, ext)

  // Check for transcript file
  const transcriptPath = join(RECORDINGS_DIR, `${baseName}_transcript.json`)
  let hasTranscript = false
  let transcriptMetadata = undefined

  try {
    const transcriptContent = await readFile(transcriptPath, 'utf-8')
    const transcript = JSON.parse(transcriptContent) as TranscriptMetadata
    hasTranscript = true

    transcriptMetadata = {
      duration: transcript.job.duration,
      language: transcript.metadata.transcription_config.language,
      diarization: transcript.metadata.transcription_config.diarization,
      jobId: transcript.job.id,
      transcriptCreatedAt: transcript.metadata.created_at,
    }
  } catch (_error) {
    // Transcript doesn't exist or couldn't be read
  }

  return {
    id: baseName,
    filename,
    format: ext.substring(1) as 'wav' | 'mp3',
    size: fileStats.size,
    createdAt: fileStats.birthtime.toISOString(),
    modifiedAt: fileStats.mtime.toISOString(),
    hasTranscript,
    transcriptMetadata,
  }
}

export async function getRecordingById(id: string): Promise<Recording | null> {
  try {
    const files = await readdir(RECORDINGS_DIR)

    // Find the audio file with matching ID
    function matchesId(file: string) {
      const ext = extname(file).toLowerCase()
      const baseName = basename(file, ext)
      return baseName === id && (ext === '.wav' || ext === '.mp3')
    }
    const audioFile = files.find(matchesId)

    if (!audioFile) {
      return null
    }

    return await getRecordingInfo(audioFile)
  } catch (error) {
    console.error(`Error getting recording ${id}:`, error)
    throw error
  }
}
