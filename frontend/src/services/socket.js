import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';

if (process.env.NODE_ENV === 'production' && (!process.env.REACT_APP_SOCKET_URL || process.env.REACT_APP_SOCKET_URL.includes('localhost'))) {
  console.error('[Socket] REACT_APP_SOCKET_URL is not set or points to localhost in production. Set it to https://gutmann-backend.onrender.com');
}

let socket = null;

const socketService = {
  connect(userId) {
    if (socket && socket.connected) return socket;

    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000
    });

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      if (userId) {
        socket.emit('join-room', userId);
      }
    });

    socket.on('connect_error', (err) => {
      console.warn('Socket connection error:', err.message);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    return socket;
  },

  disconnect() {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  on(event, callback) {
    if (socket) socket.on(event, callback);
  },

  off(event, callback) {
    if (socket) socket.off(event, callback);
  },

  emit(event, data) {
    if (socket && socket.connected) {
      socket.emit(event, data);
    }
  },

  getSocket() {
    return socket;
  }
};

export default socketService;
