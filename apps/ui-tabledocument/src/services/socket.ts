import { io, Socket } from 'socket.io-client'
import type { TableDocumentDetail } from './api'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:4004'

let socket: Socket | null = null

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

// Helper functions for table document-specific events
export function onTableDocumentUpdated(
  callback: (data: { id: string; document: TableDocumentDetail }) => void
): () => void {
  const sock = socket ?? initSocket()

  sock.on('tabledocument:updated', callback)

  return () => {
    sock.off('tabledocument:updated', callback)
  }
}

export function onTableDocumentAdded(
  callback: (data: { id: string; document: TableDocumentDetail }) => void
): () => void {
  const sock = socket ?? initSocket()

  sock.on('tabledocument:added', callback)

  return () => {
    sock.off('tabledocument:added', callback)
  }
}

export function onTableDocumentDeleted(callback: (data: { id: string }) => void): () => void {
  const sock = socket ?? initSocket()

  sock.on('tabledocument:deleted', callback)

  return () => {
    sock.off('tabledocument:deleted', callback)
  }
}
