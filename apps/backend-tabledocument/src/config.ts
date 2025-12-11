import { homedir } from 'os'
import { join } from 'path'

export const TABLE_DOCUMENTS_DIR =
  process.env.TABLE_DOCUMENTS_DIR ?? join(homedir(), 'Documents/table-documents')
export const SOCKET_SERVER_URL = process.env.SOCKET_SERVER_URL ?? 'http://localhost:4004'

//Jira/Confluence credentials (optional - only needed for Confluence integration)
export const JIRA_USERNAME = process.env.JIRA_USERNAME
export const JIRA_TOKEN = process.env.JIRA_TOKEN

//Server configuration
export const PORT = process.env.PORT ? parseInt(process.env.PORT) : 4004
export const HOST = process.env.HOST ?? '0.0.0.0'
