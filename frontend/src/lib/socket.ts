import { io, type Socket } from 'socket.io-client'

const SOCKET_URL = 'http://localhost:3000'

let socket: Socket | null = null

export function connectSocket(): Socket {
  if (socket) return socket
  socket = io(SOCKET_URL, { withCredentials: true })
  socket.on('connect', () => console.log('[socket] connected', socket?.id))
  socket.on('disconnect', (reason) => console.log('[socket] disconnected:', reason))
  socket.on('connect_error', (err) => console.error('[socket] connect_error:', err.message))
  return socket
}

export function disconnectSocket() {
  socket?.disconnect()
  socket = null
}
