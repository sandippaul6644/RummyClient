import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000');

export const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
});

socket.on('connect', () => {
  console.log('[Socket] Connected to realtime server ID:', socket.id);
});

socket.on('disconnect', (reason) => {
  console.log('[Socket] Disconnected from realtime server:', reason);
});
