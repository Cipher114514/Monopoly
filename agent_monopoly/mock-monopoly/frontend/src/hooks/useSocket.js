import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './useAuth';

export const useSocket = () => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const auth = useAuth();
  const socketRef = useRef(null);

  useEffect(() => {
    // 如果用户已登录，建立socket连接
    if (auth.user && !socketRef.current) {
      const newSocket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:3001', {
        auth: {
          token: localStorage.getItem('token')
        }
      });

      socketRef.current = newSocket;

      newSocket.on('connect', () => {
        setConnected(true);
        setError(null);
      });

      newSocket.on('disconnect', () => {
        setConnected(false);
      });

      newSocket.on('error', (err) => {
        setError(err.message);
      });

      setSocket(newSocket);
    }

    // 清理函数
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setConnected(false);
      }
    };
  }, [auth.user]);

  // 发送事件
  const emit = (event, data) => {
    if (socket && connected) {
      socket.emit(event, data);
    } else {
      setError('Socket not connected');
    }
  };

  // 监听事件
  const on = (event, callback) => {
    if (socket) {
      socket.on(event, callback);
      return () => {
        socket.off(event, callback);
      };
    }
  };

  // 移除监听
  const off = (event, callback) => {
    if (socket) {
      socket.off(event, callback);
    }
  };

  return {
    socket,
    connected,
    error,
    emit,
    on,
    off
  };
};
```