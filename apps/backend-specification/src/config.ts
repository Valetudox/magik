import { homedir } from 'os'
import { join } from 'path'
import { getPort } from '../../../config/config'

export const SPECIFICATIONS_DIR =
  process.env.SPECIFICATIONS_DIR ?? join(homedir(), 'Documents/specifications')
export const PORT = getPort('BACKEND_SPECIFICATION')
