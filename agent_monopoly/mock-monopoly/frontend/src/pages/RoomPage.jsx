import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import apiClient from '../utils/apiClient';
import { validateRoomId } from '../utils/validation';

const RoomPage = () => {
  const { user } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();
  const { roomId } = useParams();
  
  const [roomInfo, setRoomInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);

  // 验证房间ID格式
  useEffect(() => {
    if (!validateRoomId(roomId)) {
      setError('无效的房间ID');
      setIsLoading(false);
    }
  }, [roomId]);

  // 获取房间详情
  useEffect(() => {
    const fetchRoomDetails = async () => {
      if (!roomId) return;
      
      try {
        setIsLoading(true);
        const response = await apiClient.get(`/api/rooms/${roomId}`);
        if (response.code === 200) {
          setRoomInfo(response.data);
          
          // 检查当前玩家是否已准备
          const player = response.data.players.find(p => p.userId === user?.id);
          if (player) {
            setIsReady(player.isReady);
          }
        } else {
          setError(response.message || '获取房间信息失败');
        }
      } catch (err) {
        setError('获取房间信息失败，请检查网络连接');
        console.error('获取房间详情错误:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoomDetails();
  }, [roomId, user?.id]);

  // 监听房间更新
  useEffect(() => {
    if (!socket || !roomId) return;

    const handleRoomUpdated = (data) => {
      setRoomInfo(data);
      
      // 更新当前玩家的准备状态
      const player = data.players.find(p => p.userId === user?.id);
      if (player) {
        setIsReady(player.isReady);
      }
    };

    const handlePlayerReadyUpdated = (data) => {
      if (data.userId === user?.id) {
        setIsReady(data.isReady);
      }
    };

    const handleMessageReceived = (data) => {
      setMessages(prev => [...prev, {
        userId: data.userId,
        username: data.username,
        message: data.message,
        timestamp: data.timestamp
      }]);
    };

    socket.on('room_updated', handleRoomUpdated);
    socket.on('player_ready_updated', handlePlayerReadyUpdated);
    socket.on('message_received', handleMessageReceived);

    return () => {
      socket.off('room_updated', handleRoomUpdated);
      socket.off('player_ready_updated', handlePlayerReadyUpdated);
      socket.off('message_received', handleMessageReceived);
    };
  }, [socket, roomId, user?.id]);

  // 加入房间
  const handleJoinRoom = async () => {
    if (!roomId || !user) return;

    try {
      const response = await apiClient.post('/api/rooms/join', { room_id: roomId });
      if (response.code === 200) {
        // 加入成功，Socket.io会自动处理更新
      } else {
        setError(response.message || '加入房间失败');
      }
    } catch (err) {
      setError('加入房间失败，请检查网络连接');
      console.error('加入房间错误:', err);
    }
  };

  // 离开房间
  const handleLeaveRoom = async () => {
    if (!roomId || !user) return;

    try {
      const response = await apiClient.post('/api/rooms/leave', { room_id: roomId });
      if (response.code === 200) {
        navigate('/lobby');
      } else {
        setError(response.message || '离开房间失败');
      }
    } catch (err) {
      setError('离开房间失败，请检查网络连接');
      console.error('离开房间错误:', err);
    }
  };

  // 切换准备状态
  const handleToggleReady = () => {
    if (!socket || !roomId || !user) return;

    socket.emit('toggle_ready', { roomId });
    setIsReady(!isReady);
  };

  // 开始游戏
  const handleStartGame = () => {
    if (!socket || !roomId || !user) return;

    socket.emit('start_game', { roomId });
  };

  // 发送消息
  const handleSendMessage = () => {
    if (!socket || !roomId || !user || !message.trim()) return;

    socket.emit('send_message', { roomId, message: message.trim() });
    setMessage('');
  };

  // 渲染玩家列表
  const renderPlayers = () => {
    if (!roomInfo?.players) return null;

    return (
      <div className="players-list">
        <h3>玩家列表 ({roomInfo.players.length}/{roomInfo.maxPlayers})</h3>
        <div className="players">
          {roomInfo.players.map((player, index) => (
            <div 
              key={player.userId} 
              className={`player ${player.userId === user?.id ? 'current-player' : ''} ${player.isReady ? 'ready' : ''}`}
            >
              <div className="player-avatar">{index + 1}</div>
              <div className="player-info">
                <div className="player-name">{player.username}</div>
                <div className="player-status">
                  {player.userId === user?.id ? (
                    <span>{isReady ? '已准备' : '未准备'}</span>
                  ) : (
                    <span>{player.isReady ? '已准备' : '未准备'}</span>
                  )}
                </div>
              </div>
              {player.userId === user?.id && (
                <button 
                  className={`ready-button ${isReady ? 'ready' : ''}`}
                  onClick={handleToggleReady}
                >
                  {isReady ? '取消准备' : '准备'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 渲染聊天区域
  const renderChat = () => {
    return (
      <div className="chat-area">
        <h3>聊天</h3>
        <div className="messages">
          {messages.map((msg, index) => (
            <div key={index} className="message">
              <span className="message-user">{msg.username}: </span>
              <span className="message-text">{msg.message}</span>
              <span className="message-time">{new Date(msg.timestamp).toLocaleTimeString()}</span>
            </div>
          ))}
        </div>
        <div className="message-input">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="输入消息..."
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <button onClick={handleSendMessage}>发送</button>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return <div className="loading">加载中...</div>;
  }

  if (error) {
    return (
      <div className="error">
        <p>{error}</p>
        <button onClick={() => navigate('/lobby')}>返回大厅</button>
      </div>
    );
  }

  if (!roomInfo) {
    return (
      <div className="error">
        <p>房间不存在或已关闭</p>
        <button onClick={() => navigate('/lobby')}>返回大厅</button>
      </div>
    );
  }

  // 检查用户是否已加入房间
  const isPlayerInRoom = roomInfo.players.some(p => p.userId === user?.id);

  return (
    <div className="room-page">
      <div className="room-header">
        <h1>{roomInfo.name}</h1>
        <div className="room-status">
          <span>状态: {roomInfo.status === 'waiting' ? '等待中' : roomInfo.status === 'playing' ? '游戏中' : '已结束'}</span>
          <span>玩家: {roomInfo.currentPlayers}/{roomInfo.maxPlayers}</span>
        </div>
      </div>

      <div className="room-content">
        <div className="room-main">
          {renderPlayers()}
          
          <div className="room-actions">
            {!isPlayerInRoom ? (
              <button className="join-button" onClick={handleJoinRoom}>
                加入房间
              </button>
            ) : (
              <>
                <button className="leave-button" onClick={handleLeaveRoom}>
                  离开房间
                </button>
                {roomInfo.status === 'waiting' && roomInfo.players.every(p => p.isReady) && (
                  <button className="start-button" onClick={handleStartGame}>
                    开始游戏
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        <div className="room-sidebar">
          {renderChat()}
        </div>
      </div>
    </div>
  );
};

export default RoomPage;