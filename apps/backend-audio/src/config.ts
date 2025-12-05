import { homedir } from 'os'
import { join } from 'path'

export const RECORDINGS_DIR =
  process.env.RECORDINGS_DIR ?? join(homedir(), 'Documents', 'recordings')
export const PORT = Number(process.env.PORT) || 3002
