import { useState, useEffect, useCallback } from 'react';
import { useSocket } from './useSocket';
import { useAuth } from './useAuth';

export const useGame = () => {
  const { user } = useAuth();
  const { socket, connected, emit, on, off } = useSocket();
  
  // 游戏状态
  const [gameState, setGameState] = useState(null);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [players, setPlayers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [cards, setCards] = useState([]);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // 监听游戏相关事件
  useEffect(() => {
    if (!socket) return;

    // 房间更新
    const handleRoomUpdated = (roomInfo) => {
      setCurrentRoom(roomInfo);
    };

    // 玩家移动
    const handlePlayerMoved = (data) => {
      setPlayers(prev => prev.map(p => 
        p.userId === data.userId 
          ? { ...p, position: data.newPosition } 
          : p
      ));
    };

    // 回合切换
    const handleTurnChanged = (currentUserId) => {
      setGameState(prev => ({
        ...prev,
        currentTurn: currentUserId
      }));
    };

    // 骰子结果
    const handleDiceRolled = (data) => {
      setGameState(prev => ({
        ...prev,
        lastDiceRoll: data.value,
        rolling: false
      }));
    };

    // 地产购买
    const handlePropertyPurchased = (data) => {
      setProperties(prev => prev.map(p => 
        p.id === data.propertyId 
          ? { ...p, ownerId: data.ownerId } 
          : p
      ));
    };

    // 房屋建设
    const handleHouseBuilt = (data) => {
      setProperties(prev => prev.map(p => 
        p.id === data.propertyId 
          ? { ...p, houseCount: data.houseCount } 
          : p
      ));
    };

    // 租金支付
    const handleRentPaid = (data) => {
      setPlayers(prev => prev.map(p => {
        if (p.userId === data.fromUserId) {
          return { ...p, money: p.money - data.amount };
        }
        if (p.userId === data.toUserId) {
          return { ...p, money: p.money + data.amount };
        }
        return p;
      }));
    };

    // 卡牌抽取
    const handleCardDrawn = (cardInfo) => {
      setCards(prev => [...prev, cardInfo]);
    };

    // 卡牌效果
    const handleCardEffect = (effectData) => {
      // 根据不同效果类型处理
      switch (effectData.effectType) {
        case 'move':
          setPlayers(prev => prev.map(p => 
            p.userId === user?.id 
              ? { ...p, position: effectData.position } 
              : p
          ));
          break;
        case 'money':
          setPlayers(prev => prev.map(p => 
            p.userId === user?.id 
              ? { ...p, money: p.money + effectData.amount } 
              : p
          ));
          break;
        // 其他效果处理...
      }
    };

    // 玩家破产
    const handlePlayerBankrupted = (data) => {
      setPlayers(prev => prev.filter(p => p.userId !== data.userId));
      setGameState(prev => ({
        ...prev,
        players: prev.players.filter(p => p.userId !== data.userId)
      }));
    };

    // 游戏结束
    const handleGameEnded = (data) => {
      setGameState(prev => ({
        ...prev,
        gameEnded: true,
        winner: data.winner
      }));
    };

    // 消息接收
    const handleMessageReceived = (data) => {
      setMessages(prev => [...prev, data]);
    };

    // 错误处理
    const handleError = (err) => {
      setError(err.message);
    };

    // 注册事件监听
    on('room_updated', handleRoomUpdated);
    on('player_moved', handlePlayerMoved);
    on('turn_changed', handleTurnChanged);
    on('dice_rolled', handleDiceRolled);
    on('property_purchased', handlePropertyPurchased);
    on('house_built', handleHouseBuilt);
    on('rent_paid', handleRentPaid);
    on('card_drawn', handleCardDrawn);
    on('card_effect', handleCardEffect);
    on('player_bankrupted', handlePlayerBankrupted);
    on('game_ended', handleGameEnded);
    on('message_received', handleMessageReceived);
    on('error', handleError);

    // 清理函数
    return () => {
      off('room_updated', handleRoomUpdated);
      off('player_moved', handlePlayerMoved);
      off('turn_changed', handleTurnChanged);
      off('dice_rolled', handleDiceRolled);
      off('property_purchased', handlePropertyPurchased);
      off('house_built', handleHouseBuilt);
      off('rent_paid', handleRentPaid);
      off('card_drawn', handleCardDrawn);
      off('card_effect', handleCardEffect);
      off('player_bankrupted', handlePlayerBankrupted);
      off('game_ended', handleGameEnded);
      off('message_received', handleMessageReceived);
      off('error', handleError);
    };
  }, [socket, user]);

  // 游戏操作函数
  const rollDice = useCallback(() => {
    if (!connected || !currentRoom) return;
    
    setLoading(true);
    setError(null);
    emit('roll_dice', { roomId: currentRoom.id });
  }, [connected, currentRoom, emit]);

  const endTurn = useCallback(() => {
    if (!connected || !currentRoom) return;
    
    setLoading(true);
    setError(null);
    emit('end_turn', { roomId: currentRoom.id });
  }, [connected, currentRoom, emit]);

  const buyProperty = useCallback((propertyId) => {
    if (!connected || !currentRoom) return;
    
    setLoading(true);
    setError(null);
    emit('buy_property', { roomId: currentRoom.id, propertyId });
  }, [connected, currentRoom, emit]);

  const buildHouse = useCallback((propertyId) => {
    if (!connected || !currentRoom) return;
    
    setLoading(true);
    setError(null);
    emit('build_house', { roomId: currentRoom.id, propertyId });
  }, [connected, currentRoom, emit]);

  const drawCard = useCallback(() => {
    if (!connected || !currentRoom) return;
    
    setLoading(true);
    setError(null);
    emit('draw_card', { roomId: currentRoom.id });
  }, [connected, currentRoom, emit]);

  const declareBankrupt = useCallback(() => {
    if (!connected || !currentRoom) return;
    
    setLoading(true);
    setError(null);
    emit('bankrupt', { roomId: currentRoom.id });
  }, [connected, currentRoom, emit]);

  const sendMessage = useCallback((message) => {
    if (!connected || !currentRoom) return;
    
    setLoading(true);
    setError(null);
    emit('send_message', { roomId: currentRoom.id, message });
  }, [connected, currentRoom, emit]);

  // 开始游戏
  const startGame = useCallback(() => {
    if (!connected || !currentRoom) return;
    
    setLoading(true);
    setError(null);
    emit('start_game', { roomId: currentRoom.id });
  }, [connected, currentRoom, emit]);

  // 准备状态切换
  const toggleReady = useCallback(() => {
    if (!connected || !currentRoom) return;
    
    setLoading(true);
    setError(null);
    emit('toggle_ready', { roomId: currentRoom.id });
  }, [connected, currentRoom, emit]);

  // 离开房间
  const leaveRoom = useCallback(() => {
    if (!connected || !currentRoom) return;
    
    setLoading(true);
    setError(null);
    emit('leave_room', { roomId: currentRoom.id });
    setCurrentRoom(null);
    setPlayers([]);
    setProperties([]);
    setCards([]);
    setMessages([]);
  }, [connected, currentRoom, emit]);

  return {
    // 状态
    gameState,
    currentRoom,
    players,
    properties,
    cards,
    messages,
    error,
    loading,
    
    // 操作函数
    rollDice,
    endTurn,
    buyProperty,
    buildHouse,
    drawCard,
    declareBankrupt,
    sendMessage,
    startGame,
    toggleReady,
    leaveRoom,
    
    // 辅助函数
    isMyTurn: gameState?.currentTurn === user?.id,
    isGameStarted: gameState?.gameStarted,
    isGameEnded: gameState?.gameEnded
  };
};
```