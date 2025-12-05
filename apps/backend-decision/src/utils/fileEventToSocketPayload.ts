import type { FileChangeEvent } from './fileWatcher'

export interface SocketPayload {
  channel: string
  payload: Record<string, unknown>
}

export function fileEventToSocketPayload(event: FileChangeEvent): SocketPayload {
  if (event.type === 'updated') {
    return {
      channel: 'decision:updated',
      payload: {
        id: event.id,
        decision: event.decision,
      },
    }
  }

  return {
    channel: 'decision:deleted',
    payload: { id: event.id },
  }
}
