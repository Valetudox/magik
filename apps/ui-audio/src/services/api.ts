import { listRecordings, getRecording } from '@magik/backend-audio-client'
import type { Recording } from '@magik/backend-audio-client'
import { client } from '@magik/backend-audio-client/client.gen'

const apiUrl = import.meta.env.VITE_API_URL
const API_BASE_URL = typeof apiUrl === 'string' ? apiUrl : 'http://localhost:4002'

// Configure the client base URL
client.setConfig({
  baseUrl: API_BASE_URL,
})

export type { Recording }
export type { Recording as TranscriptMetadata } from '@magik/backend-audio-client'

export interface RecordingListResponse {
  recordings: Recording[]
  total: number
}

export const api = {
  async getRecordings(): Promise<Recording[]> {
    const { data, error } = await listRecordings()
    if (error ?? !data) {
      throw new Error('Failed to load recordings')
    }
    return data.recordings
  },

  async getRecording(id: string): Promise<Recording> {
    const { data, error } = await getRecording({ path: { id } })
    if (error ?? !data) {
      throw new Error('Recording not found')
    }
    return data
  },
}
