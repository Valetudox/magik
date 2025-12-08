import { homedir } from 'node:os'
import { join } from 'node:path'
import { getPort } from '../../../config/config'

export const RECORDINGS_DIR =
  process.env.RECORDINGS_DIR ?? join(homedir(), 'Documents', 'recordings')
export const PORT = getPort('BACKEND_AUDIO')
