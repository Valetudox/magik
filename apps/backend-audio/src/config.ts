import { homedir } from 'node:os'
import { join } from 'node:path'

export const RECORDINGS_DIR =
  process.env.RECORDINGS_DIR ?? join(homedir(), 'Documents', 'recordings')
export const PORT = Number(process.env.PORT) || 3002
