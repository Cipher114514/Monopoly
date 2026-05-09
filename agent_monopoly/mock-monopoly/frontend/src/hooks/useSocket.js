import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './useAuth';

export const useSocket = () => {
  const { isAuthenticated, user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated) {
      // Connect to the socket server
      const newSocket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001', {
        auth: {
          token: localStorage.getItem('token'),
          userId: user?.id
        }
      });
      
      socketRef.current = newSocket;
      setSocket(newSocket);
      
      newSocket.on('connect', () => {
        setConnected(true);
      });
      
      newSocket.on('disconnect', () => {
        setConnected(false);
      });
      
      return () => {
        newSocket.close();
      };
    } else {
      if (socketRef.current) {
        socketRef.current.close();
        setSocket(null);
        setConnected(false);
      }
    }
  }, [isAuthenticated, user]);

  return { socket, connected };
};
```

```