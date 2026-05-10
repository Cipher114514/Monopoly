```
import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }

  // 初始化Socket连接
  connect(token, onConnect, onDisconnect, onError) {
    if (this.socket) {
      this.socket.disconnect();
    }

    this.socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001', {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      this.connected = true;
      this.reconnectAttempts = 0;
      console.log('Socket connected:', this.socket.id);
      if (onConnect) onConnect();
    });

    this.socket.on('disconnect', (reason) => {
      this.connected = false;
      console.log('Socket disconnected:', reason);
      if (onDisconnect) onDisconnect(reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      if (onError) onError(error);
    });
  }

  // 发送事件
  emit(eventName, data) {
    if (this.connected && this.socket) {
      this.socket.emit(eventName, data);
    } else {
      console.warn('Socket not connected. Cannot emit event:', eventName);
    }
  }

  // 监听事件
  on(eventName, callback) {
    if (this.socket) {
      this.socket.on(eventName, callback);
    }
  }

  // 移除事件监听
  off(eventName, callback) {
    if (this.socket) {
      this.socket.off(eventName, callback);
    }
  }

  // 断开连接
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  // 检查连接状态
  isConnected() {
    return this.connected;
  }
}

// 创建单例实例
const socketService = new SocketService();

export default socketService;
```