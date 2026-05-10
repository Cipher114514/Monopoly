import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import GameBoard from '../components/GameBoard';
import PlayerList from '../components/PlayerList';
import ActionPanel from '../components/ActionPanel';
import PropertyPanel from '../components/PropertyPanel';
import DiceRoller from '../components/DiceRoller';
import './GamePage.css';

const GamePage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { socket, connected, emit, on } = useSocket(user);
  const [gameState, setGameState] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [players, setPlayers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [diceValue, setDiceValue] = useState(0);
  const [canRoll, setCanRoll] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // 初始化游戏数据
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // 加入房间
    const joinRoom = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // 加入房间
        emit('join_room', { roomId, userId: user.userId });
        
        // 设置准备状态
        emit('player_ready', { roomId, userId: user.userId, isReady: true });
        
        // 获取初始游戏数据
        const response = await api.get(`/api/rooms/${roomId}`);
        if (response.data.code === 200) {
          setGameState(response.data.data);
          setGameStarted(response.data.data.status === 'playing');
          
          // 获取玩家列表
          const playersResponse = await api.get(`/api/players/room/${roomId}`);
          if (playersResponse.data.code === 200) {
            setPlayers(playersResponse.data.data);
            
            // 设置当前玩家
            const player = playersResponse.data.data.find(p => p.userId === user.userId);
            if (player) {
              setCurrentPlayer(player);
              setCanRoll(player.isReady && !player.inJail && player.turnActive);
            }
          }
          
          // 获取地产列表
          const propertiesResponse = await api.get(`/api/properties?room_id=${roomId}`);
          if (propertiesResponse.data.code === 200) {
            setProperties(propertiesResponse.data.data);
          }
        }
      } catch (err) {
        console.error('加入房间失败:', err);
        setError('加入房间失败，请重试');
        navigate('/rooms');
      } finally {
        setIsLoading(false);
      }
    };

    joinRoom();

    // 监听游戏事件
    const handleGameStarted = (data) => {
      setGameStarted(true);
      setGameState(data);
    };

    const handlePlayerJoined = (data) => {
      setPlayers(data.players);
    };

    const handlePlayerReady = (data) => {
      setPlayers(data.players);
      if (data.userId === user.userId) {
        const player = data.players.find(p => p.userId === user.userId);
        setCanRoll(player.isReady && !player.inJail && player.turnActive);
      }
    };

    const handleDiceRolled = (data) => {
      setDiceValue(data.diceValue);
      setCanRoll(false);
      
      // 更新当前玩家位置
      if (data.userId === user.userId) {
        setCurrentPlayer(prev => ({
          ...prev,
          position: data.newPosition,
          money: data.newMoney,
          inJail: data.inJail
        }));
      }
    };

    const handlePlayerMoved = (data) => {
      setPlayers(data.players);
      
      if (data.userId === user.userId) {
        setCurrentPlayer(data.players.find(p => p.userId === user.userId));
        setCanRoll(data.canRoll);
      }
    };

    const handlePropertyBought = (data) => {
      setProperties(data.properties);
      setPlayers(data.players);
      
      if (data.userId === user.userId) {
        setCurrentPlayer(data.players.find(p => p.userId === user.userId));
      }
    };

    const handleTurnChanged = (data) => {
      setPlayers(data.players);
      
      if (data.currentPlayerId === user.userId) {
        const player = data.players.find(p => p.userId === user.userId);
        setCurrentPlayer(player);
        setCanRoll(player.isReady && !player.inJail && player.turnActive);
      } else {
        setCanRoll(false);
      }
    };

    const handleGameEnded = (data) => {
      setGameState(data);
      setGameStarted(false);
    };

    const handleError = (data) => {
      setError(data.message);
    };

    // 注册事件监听
    on('game_started', handleGameStarted);
    on('player_joined', handlePlayerJoined);
    on('player_ready', handlePlayerReady);
    on('dice_rolled', handleDiceRolled);
    on('player_moved', handlePlayerMoved);
    on('property_bought', handlePropertyBought);
    on('turn_changed', handleTurnChanged);
    on('game_ended', handleGameEnded);
    on('error', handleError);

    // 清理函数
    return () => {
      off('game_started', handleGameStarted);
      off('player_joined', handlePlayerJoined);
      off('player_ready', handlePlayerReady);
      off('dice_rolled', handleDiceRolled);
      off('player_moved', handlePlayerMoved);
      off('property_bought', handlePropertyBought);
      off('turn_changed', handleTurnChanged);
      off('game_ended', handleGameEnded);
      off('error', handleError);
    };
  }, [roomId, user, navigate, emit, on]);

  // 掷骰子
  const handleRollDice = async () => {
    if (!canRoll || !socket.connected) return;
    
    try {
      emit('roll_dice', { roomId, userId: user.userId });
    } catch (err) {
      console.error('掷骰子失败:', err);
      setError('掷骰子失败，请重试');
    }
  };

  // 购买地产
  const handleBuyProperty = async (propertyId) => {
    if (!socket.connected) return;
    
    try {
      emit('buy_property', { roomId, userId: user.userId, propertyId });
    } catch (err) {
      console.error('购买地产失败:', err);
      setError('购买地产失败，请重试');
    }
  };

  // 建造房屋
  const handleBuildHouse = async (propertyId) => {
    if (!socket.connected) return;
    
    try {
      emit('build_house', { roomId, userId: user.userId, propertyId });
    } catch (err) {
      console.error('建造房屋失败:', err);
      setError('建造房屋失败，请重试');
    }
  };

  // 结束回合
  const handleEndTurn = async () => {
    if (!socket.connected) return;
    
    try {
      emit('end_turn', { roomId, userId: user.userId });
    } catch (err) {
      console.error('结束回合失败:', err);
      setError('结束回合失败，请重试');
    }
  };

  // 离开房间
  const handleLeaveRoom = async () => {
    if (!socket.connected) return;
    
    try {
      emit('leave_room', { roomId });
      navigate('/rooms');
    } catch (err) {
      console.error('离开房间失败:', err);
      setError('离开房间失败，请重试');
    }
  };

  // 抽卡
  const handleDrawCard = async () => {
    if (!socket.connected) return;
    
    try {
      emit('draw_card', { roomId, userId: user.userId });
    } catch (err) {
      console.error('抽卡失败:', err);
      setError('抽卡失败，请重试');
    }
  };

  if (isLoading) {
    return (
      <div className="game-page loading">
        <div className="loading-spinner">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="game-page error">
        <div className="error-message">{error}</div>
        <button onClick={() => navigate('/rooms')} className="btn btn-primary">
          返回房间列表
        </button>
      </div>
    );
  }

  return (
    <div className="game-page">
      <div className="game-header">
        <h1>大富翁游戏 - {gameState?.name}</h1>
        <div className="game-status">
          {gameStarted ? (
            <span className="status-playing">游戏进行中</span>
          ) : (
            <span className="status-waiting">等待其他玩家</span>
          )}
        </div>
        <button onClick={handleLeaveRoom} className="btn btn-secondary">
          离开房间
        </button>
      </div>

      <div className="game-content">
        <div className="game-board-container">
          <GameBoard 
            players={players} 
            properties={properties} 
            currentPlayer={currentPlayer}
          />
        </div>

        <div className="game-sidebar">
          <div className="player-section">
            <h3>玩家列表</h3>
            <PlayerList 
              players={players} 
              currentPlayerId={currentPlayer?.id}
            />
          </div>

          <div className="action-section">
            <h3>操作面板</h3>
            <ActionPanel 
              canRoll={canRoll}
              diceValue={diceValue}
              onRollDice={handleRollDice}
              onEndTurn={handleEndTurn}
              onDrawCard={handleDrawCard}
            />
          </div>

          <div className="property-section">
            <h3>我的地产</h3>
            <PropertyPanel 
              properties={properties.filter(p => p.owner_id === user.userId)}
              onBuildHouse={handleBuildHouse}
            />
          </div>
        </div>
      </div>

      {currentPlayer && (
        <div className="player-info">
          <div className="player-status">
            <span>位置: {currentPlayer.position}</span>
            <span>资金: ${currentPlayer.money}</span>
            {currentPlayer.inJail && <span className="jail-status">在监狱中</span>}
          </div>
        </div>
      )}
    </div>
  );
};

export default GamePage;