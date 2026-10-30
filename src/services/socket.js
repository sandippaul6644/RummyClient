import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000');

export const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 20,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  auth: (cb) => {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('nexus_token') : null;
    cb({ token });
  },
});

socket.on('connect', () => {
  console.log('[Socket] Connected to realtime server ID:', socket.id);
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('nexus_token') : null;
  if (token) {
    socket.emit('user:authenticate', { token });
  }
});

socket.on('disconnect', (reason) => {
  console.log('[Socket] Disconnected from realtime server:', reason);
});
