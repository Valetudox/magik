import { homedir } from 'os'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export const SCRIPTS_DIR = join(__dirname, '..', '..', 'scripts')
export const MEETINGS_DIR = join(homedir(), 'Obsidian', 'magic', 'Meetings')
