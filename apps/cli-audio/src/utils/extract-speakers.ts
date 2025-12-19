import { readFile } from 'fs/promises'

export type TranscriptResult = {
  type: string
  alternatives?: {
    speaker?: string
    content?: string
  }[]
}

export type TranscriptData = {
  results: TranscriptResult[]
}

export async function extractSpeakers(transcriptPath: string): Promise<string[]> {
  const content = await readFile(transcriptPath, 'utf-8')
  const data: TranscriptData = JSON.parse(content)

  const speakers = new Set<string>()

  for (const result of data.results) {
    if (result.type === 'word' && result.alternatives?.[0]?.speaker) {
      speakers.add(result.alternatives[0].speaker)
    }
  }

  return Array.from(speakers).sort()
}
