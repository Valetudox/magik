export interface TranscriptMetadata {
  format: string
  job: {
    created_at: string
    data_name: string
    duration: number
    id: string
  }
  metadata: {
    created_at: string
    language_pack_info: {
      language_description: string
      [key: string]: unknown
    }
    transcription_config: {
      diarization: string
      language: string
    }
    [key: string]: unknown
  }
  results?: unknown[]
}

export interface Recording {
  id: string
  filename: string
  format: 'wav' | 'mp3'
  size: number
  createdAt: string
  modifiedAt: string
  hasTranscript: boolean
  transcriptMetadata?: {
    duration: number
    language: string
    diarization: string
    jobId: string
    transcriptCreatedAt: string
  }
}

export interface RecordingListResponse {
  recordings: Recording[]
  total: number
}
