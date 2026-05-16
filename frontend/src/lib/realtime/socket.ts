'use client';
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(token: string): Socket {
  if (socket && socket.connected) return socket;
  if (socket) socket.disconnect();
  socket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000', {
    path: process.env.NEXT_PUBLIC_WS_PATH || '/realtime',
    transports: ['websocket'],
    auth: { token },
    autoConnect: true,
  });
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}
