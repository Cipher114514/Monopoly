import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import '../styles/RoomPage.css';

const RoomPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { socket, connected, emit, on } = useSocket(user);
  
  const [room, setRoom] = useState(null);
  const [players, setPlayers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreator, setIsCreator] = useState(false);
  const [canStartGame, setCanStartGame] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState(null);

  // 初始化房间信息
  useEffect(() => {
    const fetchRoomInfo = async () => {
      try {
        const response = await api.get(`/rooms/${roomId}`);
        if (response.code === 200) {
          setRoom(response.data);
          setIsCreator(response.data.creatorId === user.userId);
          
          // 获取房间玩家列表
          const playersResponse = await api.get(`/rooms/${roomId}/players`);
          if (playersResponse.code === 200) {
            setPlayers(playersResponse.data);
            // 检查是否所有玩家都准备好了
            const allReady = playersResponse.data.every(p => p.isReady);
            setCanStartGame(allReady && playersResponse.data.length >= 2);
          }
        } else {
          setError(response.message || '获取房间信息失败');
        }
      } catch (err) {
        console.error('获取房间信息失败:', err);
        setError('获取房间信息失败，请稍后重试');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoomInfo();
  }, [roomId, user.userId]);

  // 设置Socket事件监听
  useEffect(() => {
    if (!socket || !connected) return;

    // 玩家加入房间
    on('player_joined', (data) => {
      setRoom(data.room);
      setPlayers(data.players);
      
      // 检查是否可以开始游戏
      const allReady = data.players.every(p => p.isReady);
      setCanStartGame(allReady && data.players.length >= 2);
    });

    // 玩家离开房间
    on('player_left', (data) => {
      setRoom(data.room);
      setPlayers(data.players);
      
      // 检查是否可以开始游戏
      const allReady = data.players.every(p => p.isReady);
      setCanStartGame(allReady && data.players.length >= 2);
    });

    // 玩家准备状态改变
    on('player_ready_status_changed', (data) => {
      setPlayers(data.players);
      
      // 检查是否可以开始游戏
      const allReady = data.players.every(p => p.isReady);
      setCanStartGame(allReady && data.players.length >= 2);
    });

    // 游戏开始
    on('game_started', (data) => {
      navigate(`/game/${roomId}`);
    });

    // 当前玩家轮次
    on('current_turn', (data) => {
      setCurrentPlayer(data.currentPlayer);
    });

    return () => {
      // 清理事件监听
      socket.off('player_joined');
      socket.off('player_left');
      socket.off('player_ready_status_changed');
      socket.off('game_started');
      socket.off('current_turn');
    };
  }, [socket, connected, navigate, roomId]);

  // 加入房间
  const handleJoinRoom = async () => {
    try {
      const response = await api.post(`/rooms/${roomId}/join`, {
        userId: user.userId
      });
      
      if (response.code === 200) {
        // 发送加入房间的Socket事件
        emit('join_room', {
          roomId,
          userId: user.userId,
          username: user.username
        });
      } else {
        setError(response.message || '加入房间失败');
      }
    } catch (err) {
      console.error('加入房间失败:', err);
      setError('加入房间失败，请稍后重试');
    }
  };

  // 设置准备状态
  const handleSetReady = async () => {
    try {
      const response = await api.post(`/rooms/${roomId}/ready`, {
        userId: user.userId,
        isReady: !players.find(p => p.userId === user.userId)?.isReady
      });
      
      if (response.code === 200) {
        // 发送准备状态改变的Socket事件
        emit('player_ready', {
          roomId,
          userId: user.userId,
          isReady: !players.find(p => p.userId === user.userId)?.isReady
        });
      } else {
        setError(response.message || '设置准备状态失败');
      }
    } catch (err) {
      console.error('设置准备状态失败:', err);
      setError('设置准备状态失败，请稍后重试');
    }
  };

  // 开始游戏
  const handleStartGame = async () => {
    try {
      const response = await api.post(`/rooms/${roomId}/start`, {
        userId: user.userId
      });
      
      if (response.code === 200) {
        // 发送开始游戏的Socket事件
        emit('start_game', {
          roomId,
          userId: user.userId
        });
      } else {
        setError(response.message || '开始游戏失败');
      }
    } catch (err) {
      console.error('开始游戏失败:', err);
      setError('开始游戏失败，请稍后重试');
    }
  };

  // 离开房间
  const handleLeaveRoom = async () => {
    try {
      const response = await api.post(`/rooms/${roomId}/leave`, {
        userId: user.userId
      });
      
      if (response.code === 200) {
        // 发送离开房间的Socket事件
        emit('leave_room', {
          roomId,
          userId: user.userId
        });
        navigate('/lobby');
      } else {
        setError(response.message || '离开房间失败');
      }
    } catch (err) {
      console.error('离开房间失败:', err);
      setError('离开房间失败，请稍后重试');
    }
  };

  if (isLoading) {
    return (
      <div className="room-page loading">
        <div className="loading-spinner">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="room-page error">
        <div className="error-message">{error}</div>
        <button className="btn btn-primary" onClick={() => navigate('/lobby')}>
          返回大厅
        </button>
      </div>
    );
  }

  return (
    <div className="room-page">
      <div className="room-header">
        <h1>{room?.name}</h1>
        <div className="room-info">
          <span>房间ID: {roomId}</span>
          <span>玩家: {players.length}/{room?.maxPlayers}</span>
          <span>状态: {room?.status === 'waiting' ? '等待中' : '游戏中'}</span>
        </div>
      </div>

      <div className="room-content">
        <div className="players-section">
          <h2>玩家列表</h2>
          <div className="players-list">
            {players.map(player => (
              <div 
                key={player.id} 
                className={`player-item ${player.userId === user.userId ? 'current-player' : ''}`}
              >
                <div className="player-info">
                  <span className="player-name">{player.username}</span>
                  <span className="player-color">颜色: {player.color}</span>
                </div>
                <div className="player-status">
                  {player.userId === user.userId ? (
                    <button 
                      className={`btn ${player.isReady ? 'btn-success' : 'btn-secondary'}`}
                      onClick={handleSetReady}
                    >
                      {player.isReady ? '已准备' : '准备'}
                    </button>
                  ) : (
                    <span className={`status ${player.isReady ? 'ready' : 'not-ready'}`}>
                      {player.isReady ? '已准备' : '未准备'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="actions-section">
          {room?.status === 'waiting' && (
            <>
              {!players.find(p => p.userId === user.userId) ? (
                <button className="btn btn-primary" onClick={handleJoinRoom}>
                  加入房间
                </button>
              ) : (
                <>
                  <button 
                    className={`btn ${players.find(p => p.userId === user.userId)?.isReady ? 'btn-success' : 'btn-secondary'}`}
                    onClick={handleSetReady}
                  >
                    {players.find(p => p.userId === user.userId)?.isReady ? '已准备' : '准备'}
                  </button>
                  
                  {isCreator && canStartGame && (
                    <button className="btn btn-primary" onClick={handleStartGame}>
                      开始游戏
                    </button>
                  )}
                </>
              )}
              
              <button className="btn btn-secondary" onClick={handleLeaveRoom}>
                离开房间
              </button>
            </>
          )}
          
          {room?.status === 'playing' && (
            <div className="game-status">
              <p>游戏进行中...</p>
              {currentPlayer && (
                <p>当前回合: {currentPlayer.username}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomPage;