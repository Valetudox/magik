import { homedir } from 'os'
import { join } from 'path'

export const DECISIONS_DIR = process.env.DECISIONS_DIR || join(homedir(), 'Documents/decisions')
export const SOCKET_SERVER_URL = process.env.SOCKET_SERVER_URL || 'http://localhost:4001'
