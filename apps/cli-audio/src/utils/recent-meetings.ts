import { existsSync } from 'fs'
import { readdir, stat } from 'fs/promises'
import { join } from 'path'
import { MEETINGS_DIR } from './paths.js'

/**
 * Get the last 10 meeting names from the Meetings directory
 * @returns Array of meeting names, sorted by most recent first
 */
export async function getRecentMeetings(): Promise<string[]> {
  try {
    if (!existsSync(MEETINGS_DIR)) {
      return []
    }

    const files = await readdir(MEETINGS_DIR)
    const mdFiles = files.filter((f) => f.endsWith('.md'))

    // Get file stats with modification time
    const filesWithStats = await Promise.all(
      mdFiles.map(async (file) => {
        const filePath = join(MEETINGS_DIR, file)
        const stats = await stat(filePath)
        return {
          name: file.replace('.md', ''),
          mtime: stats.mtime,
        }
      })
    )

    // Sort by modification time (most recent first) and take top 10
    return filesWithStats
      .sort((a, b) => b.mtime.getTime() - a.mtime.getTime())
      .slice(0, 10)
      .map((f) => f.name)
  } catch (error) {
    console.error('Error reading meetings directory:', error)
    return []
  }
}
