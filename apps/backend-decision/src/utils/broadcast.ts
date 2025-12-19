import { SOCKET_SERVER_URL } from '../config'

export type BroadcastMessage = {
  channel: string
  payload: Record<string, unknown>
}

export async function broadcastToSocket(message: BroadcastMessage): Promise<void> {
  try {
    const response = await fetch(`${SOCKET_SERVER_URL}/api/broadcast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    })

    if (!response.ok) {
      throw new Error(`Socket server responded with ${response.status}`)
    }

    await response.json()
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Failed to broadcast to socket server: ${errorMessage}`)
  }
}
