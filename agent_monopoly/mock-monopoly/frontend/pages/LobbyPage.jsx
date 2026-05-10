import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../hooks/useAuth';

const LobbyPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [roomId] = useState(location.state?.roomId || null);
  const [room, setRoom] = useState(null);
  const [players, setPlayers] = useState([]);
  const [isCreator, setIsCreator] = useState(false);
  const [canStart, setCanStart] = useState(false);
  const [error, setError] = useState(null);

  // 获取房间信息
  useEffect(() => {
    if (roomId) {
      const fetchRoomInfo = async () => {
        try {
          const response = await api.getRoom(roomId);
          setRoom(response.data);
          setPlayers(response.data.players || []);
          setIsCreator(response.data.creatorId === user.id);
          
          // 检查是否可以开始游戏（至少2个玩家都准备）
          const readyPlayers = (response.data.players || []).filter(p => p.isReady).length;
          setCanStart(readyPlayers >= 2 && response.data.players.length >= 2);
        } catch (err) {
          setError('获取房间信息失败');
          console.error('获取房间信息失败:', err);
        }
      };
      
      fetchRoomInfo();
    }
  }, [roomId, user.id]);

  // 设置玩家准备状态
  const handleReady = async () => {
    try {
      await api.setPlayerReady(roomId, user.id, !room.players.find(p => p.userId === user.id)?.isReady);
      // 重新获取房间信息
      const response = await api.getRoom(roomId);
      setRoom(response.data);
      setPlayers(response.data.players || []);
      
      // 更新开始游戏条件
      const readyPlayers = response.data.players.filter(p => p.isReady).length;
      setCanStart(readyPlayers >= 2 && response.data.players.length >= 2);
    } catch (err) {
      setError('更新准备状态失败');
      console.error('更新准备状态失败:', err);
    }
  };

  // 开始游戏
  const handleStartGame = async () => {
    try {
      await api.startGame(roomId);
      // 游戏开始后跳转到游戏页面
      navigate(`/game/${roomId}`);
    } catch (err) {
      setError('开始游戏失败');
      console.error('开始游戏失败:', err);
    }
  };

  // 离开房间
  const handleLeaveRoom = async () => {
    try {
      await api.leaveRoom(roomId);
      navigate('/');
    } catch (err) {
      setError('离开房间失败');
      console.error('离开房间失败:', err);
    }
  };

  if (!roomId) {
    return <div className="error">房间ID不存在</div>;
  }

  if (!room) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className="lobby-container">
      <h1>房间: {room.name}</h1>
      <div className="room-info">
        <p>最大玩家数: {room.maxPlayers}</p>
        <p>当前玩家数: {players.length}</p>
        <p>游戏状态: {room.status}</p>
      </div>

      <div className="players-list">
        <h2>玩家列表</h2>
        {players.map((player) => (
          <div key={player.id} className={`player-item ${player.userId === user.id ? 'current-player' : ''}`}>
            <div className="player-info">
              <span className="player-name">{player.username}</span>
              <span className={`player-status ${player.isReady ? 'ready' : 'not-ready'}`}>
                {player.isReady ? '准备' : '未准备'}
              </span>
            </div>
            <div className="player-money">💰 ${player.money}</div>
          </div>
        ))}
      </div>

      <div className="lobby-actions">
        {isCreator ? (
          <button 
            className={`start-button ${canStart ? 'can-start' : 'cannot-start'}`}
            onClick={handleStartGame}
            disabled={!canStart}
          >
            开始游戏
          </button>
        ) : (
          <button 
            className={`ready-button ${room.players.find(p => p.userId === user.id)?.isReady ? 'ready' : 'not-ready'}`}
            onClick={handleReady}
          >
            {room.players.find(p => p.userId === user.id)?.isReady ? '取消准备' : '准备'}
          </button>
        )}
        <button className="leave-button" onClick={handleLeaveRoom}>
          离开房间
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default LobbyPage;