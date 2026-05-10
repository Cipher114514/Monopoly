import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';

const useGame = (roomId) => {
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);

  // 连接Socket
  useEffect(() => {
    if (!roomId) return;

    const connectSocket = async () => {
      try {
        // 获取用户token
        const token = localStorage.getItem('token');
        if (!token) {
          setError('请先登录');
          return;
        }

        // 连接Socket
        const newSocket = new WebSocket(`ws://localhost:3000?token=${token}`);
        
        newSocket.onopen = () => {
          console.log('Socket connected');
          setSocket(newSocket);
        };

        newSocket.onmessage = (event) => {
          const data = JSON.parse(event.data);
          handleSocketMessage(data);
        };

        newSocket.onerror = (err) => {
          console.error('Socket error:', err);
          setError('连接失败');
        };

        newSocket.onclose = () => {
          console.log('Socket disconnected');
          setSocket(null);
        };
      } catch (err) {
        console.error('Socket connection error:', err);
        setError('连接失败');
      }
    };

    connectSocket();

    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [roomId]);

  // 处理Socket消息
  const handleSocketMessage = useCallback((data) => {
    switch (data.type) {
      case 'game_state':
        setGameState(data.payload);
        break;
      case 'player_joined':
        setGameState(prev => ({
          ...prev,
          players: data.payload.players
        }));
        break;
      case 'player_ready':
        setGameState(prev => ({
          ...prev,
          players: data.payload.players
        }));
        break;
      case 'game_started':
        setGameState(data.payload);
        break;
      case 'dice_rolled':
        setGameState(prev => ({
          ...prev,
          currentPlayer: data.payload.currentPlayer,
          dice: data.payload.dice,
          players: data.payload.players
        }));
        break;
      case 'player_moved':
        setGameState(prev => ({
          ...prev,
          currentPlayer: data.payload.currentPlayer,
          players: data.payload.players
        }));
        break;
      case 'property_bought':
        setGameState(prev => ({
          ...prev,
          currentPlayer: data.payload.currentPlayer,
          players: data.payload.players,
          properties: data.payload.properties
        }));
        break;
      case 'error':
        setError(data.message);
        break;
      default:
        console.log('Unknown socket message:', data);
    }
  }, []);

  // 获取游戏状态
  const fetchGameState = useCallback(async () => {
    if (!roomId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get(`/api/rooms/${roomId}/state`);
      if (response.code === 200) {
        setGameState(response.data);
      } else {
        setError(response.message || '获取游戏状态失败');
      }
    } catch (err) {
      console.error('Fetch game state error:', err);
      setError('获取游戏状态失败');
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  // 玩家准备/取消准备
  const toggleReady = useCallback(async () => {
    if (!roomId) return;
    
    try {
      const response = await api.put(`/api/players/ready`, { 
        roomId, 
        isReady: !gameState?.currentPlayer?.isReady 
      });
      
      if (response.code === 200) {
        setGameState(prev => ({
          ...prev,
          currentPlayer: response.data
        }));
      }
    } catch (err) {
      console.error('Toggle ready error:', err);
      setError('操作失败');
    }
  }, [roomId, gameState?.currentPlayer?.isReady]);

  // 开始游戏
  const startGame = useCallback(async () => {
    if (!roomId) return;
    
    try {
      await api.post(`/api/rooms/${roomId}/start`);
      fetchGameState();
    } catch (err) {
      console.error('Start game error:', err);
      setError('开始游戏失败');
    }
  }, [roomId, fetchGameState]);

  // 掷骰子
  const rollDice = useCallback(async () => {
    if (!roomId || !socket) return;
    
    try {
      socket.send(JSON.stringify({
        type: 'roll_dice',
        roomId
      }));
    } catch (err) {
      console.error('Roll dice error:', err);
      setError('掷骰子失败');
    }
  }, [roomId, socket]);

  // 购买地产
  const buyProperty = useCallback(async (propertyId) => {
    if (!roomId || !socket) return;
    
    try {
      socket.send(JSON.stringify({
        type: 'buy_property',
        roomId,
        propertyId
      }));
    } catch (err) {
      console.error('Buy property error:', err);
      setError('购买地产失败');
    }
  }, [roomId, socket]);

  // 结束回合
  const endTurn = useCallback(async () => {
    if (!roomId || !socket) return;
    
    try {
      socket.send(JSON.stringify({
        type: 'end_turn',
        roomId
      }));
    } catch (err) {
      console.error('End turn error:', err);
      setError('结束回合失败');
    }
  }, [roomId, socket]);

  // 获取地产列表
  const fetchProperties = useCallback(async () => {
    if (!roomId) return;
    
    try {
      const response = await api.get(`/api/properties?room_id=${roomId}`);
      if (response.code === 200) {
        setGameState(prev => ({
          ...prev,
          properties: response.data
        }));
      }
    } catch (err) {
      console.error('Fetch properties error:', err);
      setError('获取地产列表失败');
    }
  }, [roomId]);

  // 抽卡
  const drawCard = useCallback(async (cardType) => {
    if (!roomId || !socket) return;
    
    try {
      socket.send(JSON.stringify({
        type: 'draw_card',
        roomId,
        cardType
      }));
    } catch (err) {
      console.error('Draw card error:', err);
      setError('抽卡失败');
    }
  }, [roomId, socket]);

  // 初始化时获取游戏状态
  useEffect(() => {
    if (roomId) {
      fetchGameState();
    }
  }, [roomId, fetchGameState]);

  return {
    gameState,
    loading,
    error,
    fetchGameState,
    toggleReady,
    startGame,
    rollDice,
    buyProperty,
    endTurn,
    fetchProperties,
    drawCard
  };
};

export default useGame;