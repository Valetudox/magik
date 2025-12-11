import { homedir } from 'os'
import { join } from 'path'

export const DECISIONS_DIR = process.env.DECISIONS_DIR ?? join(homedir(), 'Documents/decisions')
export const SOCKET_SERVER_URL = process.env.SOCKET_SERVER_URL ?? 'http://localhost:4001'

export const JIRA_USERNAME = process.env.JIRA_USERNAME
export const JIRA_TOKEN = process.env.JIRA_TOKEN
