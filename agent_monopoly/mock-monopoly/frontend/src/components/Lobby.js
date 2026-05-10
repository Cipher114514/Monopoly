import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../api/client';

const Lobby = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { roomId } = useParams();
  
  const [room, setRoom] = useState(null);
  const [players, setPlayers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isReady, setIsReady] = useState(false);
  
  // 加载房间信息
  useEffect(() => {
    const loadRoomInfo = async () => {
      try {
        const response = await api.get(`/api/rooms/${roomId}`);
        if (response.code === 200) {
          setRoom(response.data);
          // 加载玩家列表
          const playersResponse = await api.get(`/api/players/room/${roomId}`);
          if (playersResponse.code === 200) {
            setPlayers(playersResponse.data);
            // 检查当前玩家的准备状态
            const currentPlayer = playersResponse.data.find(p => p.userId === user.userId);
            if (currentPlayer) {
              setIsReady(currentPlayer.isReady);
            }
          }
        } else {
          setError(response.message || '加载房间信息失败');
        }
      } catch (err) {
        console.error('加载房间信息失败:', err);
        setError('加载房间信息失败，请重试');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (roomId && user) {
      loadRoomInfo();
    }
  }, [roomId, user]);
  
  // 处理准备/取消准备
  const handleReadyToggle = async () => {
    try {
      const response = await api.put(`/api/players/${user.userId}/ready`, {
        isReady: !isReady,
        roomId: parseInt(roomId)
      });
      
      if (response.code === 200) {
        setIsReady(!isReady);
        // 更新本地玩家状态
        setPlayers(prev => prev.map(p => 
          p.userId === user.userId 
            ? { ...p, isReady: !isReady } 
            : p
        ));
      } else {
        setError(response.message || '操作失败');
      }
    } catch (err) {
      console.error('准备状态切换失败:', err);
      setError('操作失败，请重试');
    }
  };
  
  // 开始游戏（房主）
  const handleStartGame = async () => {
    try {
      const response = await api.post(`/api/rooms/${roomId}/start`);
      if (response.code === 200) {
        navigate(`/game/${roomId}`);
      } else {
        setError(response.message || '开始游戏失败');
      }
    } catch (err) {
      console.error('开始游戏失败:', err);
      setError('开始游戏失败，请重试');
    }
  };
  
  // 离开房间
  const handleLeaveRoom = async () => {
    try {
      await api.post(`/api/rooms/${roomId}/leave`);
      navigate('/rooms');
    } catch (err) {
      console.error('离开房间失败:', err);
      // 即使失败也跳转，避免用户被困
      navigate('/rooms');
    }
  };
  
  if (isLoading) {
    return (
      <div className="lobby-container">
        <div className="loading">加载中...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="lobby-container">
        <div className="error">{error}</div>
        <button onClick={handleLeaveRoom} className="btn btn-primary">返回房间列表</button>
      </div>
    );
  }
  
  if (!room) {
    return (
      <div className="lobby-container">
        <div className="error">房间不存在</div>
        <button onClick={handleLeaveRoom} className="btn btn-primary">返回房间列表</button>
      </div>
    );
  }
  
  // 检查当前用户是否是房主
  const isOwner = room.creatorId === user.userId;
  
  return (
    <div className="lobby-container">
      <div className="room-info">
        <h2>{room.name}</h2>
        <div className="room-details">
          <span>玩家: {players.length}/{room.maxPlayers}</span>
          <span>状态: {room.status}</span>
        </div>
      </div>
      
      <div className="players-list">
        <h3>玩家列表</h3>
        <div className="players">
          {players.map(player => (
            <div key={player.id} className={`player ${player.userId === user.userId ? 'current' : ''}`}>
              <div className="player-info">
                <span className="player-name">{player.username}</span>
                <span className="player-status">
                  {player.userId === user.userId 
                    ? (isReady ? '已准备' : '未准备') 
                    : (player.isReady ? '已准备' : '未准备')}
                </span>
              </div>
              {player.userId === user.userId && (
                <button 
                  onClick={handleReadyToggle}
                  className={`btn ${isReady ? 'btn-warning' : 'btn-success'}`}
                >
                  {isReady ? '取消准备' : '准备'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
      
      <div className="lobby-actions">
        {isOwner && room.status === 'waiting' && players.length >= 2 && (
          <button 
            onClick={handleStartGame}
            className="btn btn-primary btn-lg"
            disabled={!players.every(p => p.isReady)}
          >
            开始游戏
          </button>
        )}
        <button onClick={handleLeaveRoom} className="btn btn-secondary">
          离开房间
        </button>
      </div>
      
      <div className="lobby-tips">
        <h4>游戏说明</h4>
        <ul>
          <li>至少需要2名玩家准备才能开始游戏</li>
          <li>所有玩家准备后，房主可以点击"开始游戏"</li>
          <li>游戏开始后，玩家将轮流掷骰子</li>
        </ul>
      </div>
    </div>
  );
};

export default Lobby;