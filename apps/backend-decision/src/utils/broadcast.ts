import { SOCKET_SERVER_URL } from '../config'

export interface BroadcastMessage {
  channel: string
  payload: any
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
  } catch (error: any) {
    throw new Error(`Failed to broadcast to socket server: ${error.message}`)
  }
}
