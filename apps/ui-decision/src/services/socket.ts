import { io, Socket } from 'socket.io-client'
import type { DecisionDetail } from './api'

export function initSocket() {
  if (socket) {
    return socket
  }

  socket = io(SOCKET_URL, {
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  })

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error)
  })

  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export function getSocket(): Socket | null {
  return socket
}

// Helper functions for decision-specific events
export function onDecisionUpdated(
  callback: (data: { id: string; decision: DecisionDetail }) => void
): () => void {
  const sock = socket ?? initSocket()

  sock.on('decision:updated', callback)

  return () => {
    sock.off('decision:updated', callback)
  }
}

export function onDecisionAdded(
  callback: (data: { id: string; decision: DecisionDetail }) => void
): () => void {
  const sock = socket ?? initSocket()

  sock.on('decision:added', callback)

  return () => {
    sock.off('decision:added', callback)
  }
}

export function onDecisionDeleted(callback: (data: { id: string }) => void): () => void {
  const sock = socket ?? initSocket()

  sock.on('decision:deleted', callback)

  return () => {
    sock.off('decision:deleted', callback)
  }
}

// Private configuration (after exports)
const SOCKET_URL = (import.meta.env.VITE_SOCKET_URL as string | undefined) ?? 'http://localhost:4001'

let socket: Socket | null = null
