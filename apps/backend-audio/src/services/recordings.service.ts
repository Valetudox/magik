import { readFile, readdir, stat } from 'node:fs/promises'
import { basename, extname, join } from 'node:path'
import { RECORDINGS_DIR } from '../config'
import type { Recording, TranscriptMetadata } from '../types'

export async function listRecordings(): Promise<Recording[]> {
  try {
    const files = await readdir(RECORDINGS_DIR)

    function isAudioFile(file: string) {
      const ext = extname(file).toLowerCase()
      return ext === '.wav' || ext === '.mp3'
    }
    const audioFiles = files.filter(isAudioFile)

    const recordings = await Promise.all(audioFiles.map(getRecordingInfo))

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

  const transcriptPath = join(RECORDINGS_DIR, `${baseName}_transcript.json`)
  let hasTranscript = false
  let transcriptMetadata = undefined

  const transcriptContent = await readFile(transcriptPath, 'utf-8').catch(() => null)
  if (transcriptContent) {
    const transcript = JSON.parse(transcriptContent) as TranscriptMetadata
    hasTranscript = true

    transcriptMetadata = {
      duration: transcript.job.duration,
      language: transcript.metadata.transcription_config.language,
      diarization: transcript.metadata.transcription_config.diarization,
      jobId: transcript.job.id,
      transcriptCreatedAt: transcript.metadata.created_at,
    }
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
