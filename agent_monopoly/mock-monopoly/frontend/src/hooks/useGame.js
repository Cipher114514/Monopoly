import { useState, useEffect } from 'react';
import { useSocket } from './useSocket';
import { apiClient } from '../utils/apiClient';

export const useGame = (roomId) => {
  const { socket } = useSocket();
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!socket || !roomId) return;

    // Fetch initial game state
    const fetchGameState = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/rooms/${roomId}/game-state`);
        setGameState(response.data);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch game state');
      } finally {
        setLoading(false);
      }
    };

    fetchGameState();

    // Listen for game state updates
    const handleGameStateUpdate = (newState) => {
      setGameState(newState);
    };

    const handlePlayerMoved = (data) => {
      setGameState(prev => ({
        ...prev,
        players: prev.players.map(player => 
          player.userId === data.userId 
            ? { ...player, position: data.newPosition } 
            : player
        )
      }));
    };

    const handleTurnChanged = (data) => {
      setGameState(prev => ({
        ...prev,
        currentTurn: data.currentUserId
      }));
    };

    const handlePropertyPurchased = (data) => {
      setGameState(prev => ({
        ...prev,
        properties: prev.properties.map(property => 
          property.id === data.propertyId 
            ? { ...property, ownerId: data.ownerId } 
            : property
        )
      }));
    };

    const handleCardDrawn = (data) => {
      setGameState(prev => ({
        ...prev,
        currentPlayer: {
          ...prev.currentPlayer,
          cards: [...prev.currentPlayer.cards, data.cardInfo]
        }
      }));
    };

    const handleBankruptcyDeclared = (data) => {
      setGameState(prev => ({
        ...prev,
        players: prev.players.map(player => 
          player.userId === data.userId 
            ? { ...player, isBankrupted: true } 
            : player
        )
      }));
    };

    const handleGameEnded = (data) => {
      setGameState(prev => ({
        ...prev,
        isGameEnded: true,
        winner: data.winner,
        gameStats: data.gameStats
      }));
    };

    socket.on('game_state_update', handleGameStateUpdate);
    socket.on('player_moved', handlePlayerMoved);
    socket.on('turn_changed', handleTurnChanged);
    socket.on('property_purchased', handlePropertyPurchased);
    socket.on('card_drawn', handleCardDrawn);
    socket.on('bankruptcy_declared', handleBankruptcyDeclared);
    socket.on('game_ended', handleGameEnded);

    return () => {
      socket.off('game_state_update', handleGameStateUpdate);
      socket.off('player_moved', handlePlayerMoved);
      socket.off('turn_changed', handleTurnChanged);
      socket.off('property_purchased', handlePropertyPurchased);
      socket.off('card_drawn', handleCardDrawn);
      socket.off('bankruptcy_declared', handleBankruptcyDeclared);
      socket.off('game_ended', handleGameEnded);
    };
  }, [socket, roomId]);

  const rollDice = () => {
    if (socket && gameState && gameState.currentTurn === gameState.currentPlayer.userId) {
      socket.emit('roll_dice', { roomId });
    }
  };

  const endTurn = () => {
    if (socket && gameState && gameState.currentTurn === gameState.currentPlayer.userId) {
      socket.emit('end_turn', { roomId });
    }
  };

  const buyProperty = (propertyId) => {
    if (socket && gameState && gameState.currentTurn === gameState.currentPlayer.userId) {
      socket.emit('buy_property', { roomId, propertyId });
    }
  };

  const buildHouse = (propertyId) => {
    if (socket && gameState && gameState.currentTurn === gameState.currentPlayer.userId) {
      socket.emit('build_house', { roomId, propertyId });
    }
  };

  const drawCard = () => {
    if (socket && gameState && gameState.currentTurn === gameState.currentPlayer.userId) {
      socket.emit('draw_card', { roomId });
    }
  };

  const declareBankruptcy = () => {
    if (socket && gameState && gameState.currentTurn === gameState.currentPlayer.userId) {
      socket.emit('bankrupt', { roomId });
    }
  };

  return {
    gameState,
    loading,
    error,
    rollDice,
    endTurn,
    buyProperty,
    buildHouse,
    drawCard,
    declareBankruptcy
  };
};
```

```