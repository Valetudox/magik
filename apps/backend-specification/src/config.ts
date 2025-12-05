import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Point to specs folder at repository root
// From apps/backend-specification, go up 3 levels to root, then into specs
export const SPECIFICATIONS_DIR =
  process.env.SPECIFICATIONS_DIR ?? join(__dirname, '../../../specs')
