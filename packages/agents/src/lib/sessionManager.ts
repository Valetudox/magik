import { existsSync, readdirSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'

/**
 * Check if a Claude session exists by looking for its .jsonl file in any projects folder
 */
export function sessionExists(sessionId: string): boolean {
  const projectsDir = join(homedir(), '.claude', 'projects')
  if (!existsSync(projectsDir)) {
    return false
  }

  const projectFolders = readdirSync(projectsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)

  for (const folder of projectFolders) {
    const sessionFile = join(projectsDir, folder, `${sessionId}.jsonl`)
    if (existsSync(sessionFile)) {
      return true
    }
  }

  return false
}
