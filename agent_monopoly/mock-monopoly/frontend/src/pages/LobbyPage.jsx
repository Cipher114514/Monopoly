import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../hooks/useAuth';
import '../App.css';

const LobbyPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newRoomName, setNewRoomName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(6);
  const [creatingRoom, setCreatingRoom] = useState(false);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await api.getRooms();
      setRooms(response.data || []);
    } catch (err) {
      setError('获取房间列表失败');
      console.error('获取房间失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!newRoomName.trim()) {
      setError('请输入房间名称');
      return;
    }

    setCreatingRoom(true);
    try {
      const response = await api.createRoom(newRoomName, maxPlayers);
      navigate(`/room/${response.data.roomId}`);
    } catch (err) {
      setError('创建房间失败');
      console.error('创建房间失败:', err);
    } finally {
      setCreatingRoom(false);
    }
  };

  const handleJoinRoom = async (roomId) => {
    try {
      await api.joinRoom(roomId);
      navigate(`/room/${roomId}`);
    } catch (err) {
      setError('加入房间失败');
      console.error('加入房间失败:', err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="lobby-container">
        <div className="loading">加载中...</div>
      </div>
    );
  }

  return (
    <div className="lobby-container">
      <div className="lobby-header">
        <h1>大富翁游戏大厅</h1>
        <div className="user-info">
          <span>欢迎, {user?.username}</span>
          <button onClick={handleLogout} className="logout-btn">退出登录</button>
        </div>
      </div>

      <div className="lobby-content">
        <div className="create-room-section">
          <h2>创建房间</h2>
          <form onSubmit={handleCreateRoom} className="create-room-form">
            <div className="form-group">
              <label htmlFor="roomName">房间名称</label>
              <input
                type="text"
                id="roomName"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                placeholder="输入房间名称"
                maxLength={20}
              />
            </div>
            <div className="form-group">
              <label htmlFor="maxPlayers">最大玩家数</label>
              <select
                id="maxPlayers"
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
              >
                <option value={2}>2人</option>
                <option value={3}>3人</option>
                <option value={4}>4人</option>
                <option value={5}>5人</option>
                <option value={6}>6人</option>
              </select>
            </div>
            <button type="submit" disabled={creatingRoom} className="create-btn">
              {creatingRoom ? '创建中...' : '创建房间'}
            </button>
          </form>
        </div>

        <div className="rooms-section">
          <h2>房间列表</h2>
          {error && <div className="error-message">{error}</div>}
          {rooms.length === 0 ? (
            <div className="no-rooms">暂无可用房间</div>
          ) : (
            <div className="rooms-list">
              {rooms.map((room) => (
                <div key={room.roomId} className="room-card">
                  <div className="room-info">
                    <h3>{room.name}</h3>
                    <div className="room-details">
                      <span>玩家: {room.currentPlayers}/{room.maxPlayers}</span>
                      <span>状态: {room.status === 'waiting' ? '等待中' : '游戏中'}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleJoinRoom(room.roomId)}
                    disabled={room.status === 'playing' || room.currentPlayers >= room.maxPlayers}
                    className={`join-btn ${room.status === 'playing' || room.currentPlayers >= room.maxPlayers ? 'disabled' : ''}`}
                  >
                    {room.status === 'playing' ? '游戏中' : '加入房间'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LobbyPage;