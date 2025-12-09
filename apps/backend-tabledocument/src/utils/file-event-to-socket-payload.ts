import type { FileChangeEvent } from './file-watcher.js'

export interface SocketPayload {
  channel: string
  payload: Record<string, unknown>
}

export function fileEventToSocketPayload(event: FileChangeEvent): SocketPayload {
  if (event.type === 'updated') {
    return {
      channel: 'tabledocument:updated',
      payload: {
        id: event.id,
        document: event.document,
      },
    }
  }

  return {
    channel: 'tabledocument:deleted',
    payload: { id: event.id },
  }
}
