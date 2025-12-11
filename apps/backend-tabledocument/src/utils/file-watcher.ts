import { readFile } from 'fs/promises'
import { relative } from 'path'
import type { TableDocument } from '@magik/tabledocuments'
import { watch, type FSWatcher } from 'chokidar'

export interface FileChangeEvent {
  type: 'updated' | 'deleted'
  id: string
  document?: TableDocument & { id: string }
}

export interface Observable<T> {
  subscribe(observer: (value: T) => void | Promise<void>): void
  unsubscribe(): void
}

export function setupFileWatcher(baseDir: string): Observable<FileChangeEvent> {
  let observer: ((value: FileChangeEvent) => void | Promise<void>) | null = null
  let watcher: FSWatcher | null = null

  return {
    subscribe(obs: (value: FileChangeEvent) => void | Promise<void>) {
      observer = obs

      watcher = watch(baseDir, {
        persistent: true,
        ignoreInitial: true,
        depth: 10,
        ignored: [
          '**/node_modules/**',
          '**/.git/**',
          '**/dist/**',
          '**/*.log',
          '**/.DS_Store',
          '**/temp/**',
          '**/tmp/**',
        ],
        //Optimize watcher performance
        awaitWriteFinish: {
          stabilityThreshold: 100,
          pollInterval: 50,
        },
        //Reduce system load
        usePolling: false,
        alwaysStat: false,
      })

      watcher.on('ready', () => {
        console.log('File watcher ready')
      })

      watcher.on('error', (error) => {
        console.error('File watcher error:', error)
      })

      async function handleChange(filePath: string) {
        if (!filePath.endsWith('.json')) {
          return
        }
        console.log('File change detected:', filePath)
        if (!observer) {
          return
        }

        const relativePath = relative(baseDir, filePath)
        const id = relativePath.slice(0, -5)

        try {
          const content = await readFile(filePath, 'utf-8')
          const documentData = JSON.parse(content) as TableDocument

          await observer({
            type: 'updated',
            id,
            document: { id, ...documentData },
          })
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          console.error(`Error reading ${filePath}:`, errorMessage)
        }
      }

      watcher.on('add', (filePath) => {
        void handleChange(filePath)
      })
      watcher.on('change', (filePath) => {
        void handleChange(filePath)
      })
      watcher.on('unlink', (filePath) => {
        void (async () => {
          if (!filePath.endsWith('.json')) {
            return
          }
          console.log('File deleted:', filePath)
          if (!observer) {
            return
          }
          const relativePath = relative(baseDir, filePath)
          const id = relativePath.slice(0, -5)
          await observer({ type: 'deleted', id })
        })()
      })
    },

    unsubscribe() {
      if (watcher) {
        void watcher.close()
        watcher = null
      }
      observer = null
    },
  }
}
