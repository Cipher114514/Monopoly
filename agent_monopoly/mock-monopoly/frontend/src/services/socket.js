import { io } from 'socket.io-client';

const SOCKET_URL = process.env.NODE_ENV === 'production' 
  ? window.location.origin 
  : 'http://localhost:3001';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.eventListeners = {};
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect(token) {
    if (this.socket) {
      this.socket.disconnect();
    }

    this.socket = io(SOCKET_URL, {
      auth: {
        token: token
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000
    });

    this.socket.on('connect', () => {
      this.connected = true;
      this.reconnectAttempts = 0;
      console.log('Socket connected:', this.socket.id);
    });

    this.socket.on('disconnect', (reason) => {
      this.connected = false;
      console.log('Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.clearEventListeners();
    }
  }

  emit(event, data) {
    if (!this.connected || !this.socket) {
      console.error('Socket not connected');
      return false;
    }
    this.socket.emit(event, data);
    return true;
  }

  on(event, callback) {
    if (!this.socket) {
      console.error('Socket not initialized');
      return;
    }

    this.socket.on(event, callback);
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
  }

  off(event, callback) {
    if (!this.socket) {
      return;
    }

    if (callback) {
      this.socket.off(event, callback);
      if (this.eventListeners[event]) {
        this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
      }
    } else {
      this.socket.off(event);
      if (this.eventListeners[event]) {
        this.eventListeners[event].forEach(cb => {
          this.socket.off(event, cb);
        });
        this.eventListeners[event] = [];
      }
    }
  }

  clearEventListeners() {
    Object.keys(this.eventListeners).forEach(event => {
      this.eventListeners[event].forEach(callback => {
        if (this.socket) {
          this.socket.off(event, callback);
        }
      });
    });
    this.eventListeners = {};
  }

  isConnected() {
    return this.connected && this.socket;
  }
}

export default new SocketService();