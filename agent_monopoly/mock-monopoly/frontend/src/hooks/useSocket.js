import { useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import api from '../api/client';

const SOCKET_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:3001' 
  : '';

export function useSocket(user) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);

  // 初始化 Socket 连接
  const connect = useCallback(() => {
    if (!user || !user.token) {
      setError('用户未登录或缺少令牌');
      return;
    }

    // 如果已有连接，先断开
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    try {
      const newSocket = io(SOCKET_URL, {
        auth: {
          token: user.token
        },
        transports: ['websocket', 'polling']
      });

      // 连接事件
      newSocket.on('connect', () => {
        setConnected(true);
        setError(null);
      });

      // 连接错误
      newSocket.on('connect_error', (err) => {
        console.error('Socket连接错误:', err);
        setError('连接服务器失败');
        setConnected(false);
      });

      // 断开连接
      newSocket.on('disconnect', () => {
        setConnected(false);
      });

      socketRef.current = newSocket;
      setSocket(newSocket);
    } catch (err) {
      console.error('Socket初始化失败:', err);
      setError('初始化连接失败');
    }
  }, [user]);

  // 断开连接
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setSocket(null);
    setConnected(false);
    setError(null);
  }, []);

  // 发送事件
  const emit = useCallback((event, data) => {
    if (socket && connected) {
      socket.emit(event, data);
      return true;
    }
    console.warn('Socket未连接，无法发送事件:', event);
    return false;
  }, [socket, connected]);

  // 监听事件
  const on = useCallback((event, callback) => {
    if (socket) {
      socket.on(event, callback);
      return () => {
        socket.off(event, callback);
      };
    }
    return () => {};
  }, [socket]);

  // 自动连接/断开
  useEffect(() => {
    if (user && user.token) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [user, connect, disconnect]);

  // 清理函数
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  return {
    socket,
    connected,
    error,
    emit,
    on,
    connect,
    disconnect
  };
}