import { homedir } from 'os'
import { join } from 'path'

export const SPECIFICATIONS_DIR =
  process.env.SPECIFICATIONS_DIR ?? join(homedir(), 'Documents/specifications')
