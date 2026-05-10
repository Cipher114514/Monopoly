import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../hooks/useAuth';

const Lobby = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomMaxPlayers, setNewRoomMaxPlayers] = useState(4);

  // 获取房间列表
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await api.getRooms();
        if (response.code === 200) {
          setRooms(response.data);
        } else {
          setError(response.message || '获取房间列表失败');
        }
      } catch (err) {
        setError('网络错误，请稍后重试');
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, []);

  // 创建新房间
  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) {
      setError('请输入房间名称');
      return;
    }

    try {
      const response = await api.createRoom({
        name: newRoomName.trim(),
        maxPlayers: newRoomMaxPlayers
      });

      if (response.code === 200) {
        setNewRoomName('');
        setNewRoomMaxPlayers(4);
        // 刷新房间列表
        const fetchRooms = async () => {
          const response = await api.getRooms();
          if (response.code === 200) {
            setRooms(response.data);
          }
        };
        fetchRooms();
      } else {
        setError(response.message || '创建房间失败');
      }
    } catch (err) {
      setError('创建房间失败，请稍后重试');
    }
  };

  // 加入房间
  const handleJoinRoom = async (roomId) => {
    try {
      const response = await api.joinRoom(roomId);
      if (response.code === 200) {
        navigate(`/room/${roomId}`);
      } else {
        setError(response.message || '加入房间失败');
      }
    } catch (err) {
      setError('加入房间失败，请稍后重试');
    }
  };

  // 退出登录
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="lobby-container">
      <div className="lobby-header">
        <h1>大富翁游戏大厅</h1>
        <div className="user-info">
          <span>欢迎, {user.username}</span>
          <button onClick={handleLogout} className="logout-btn">退出</button>
        </div>
      </div>

      <div className="create-room-section">
        <h2>创建房间</h2>
        <div className="create-room-form">
          <input
            type="text"
            placeholder="房间名称"
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
            className="room-input"
          />
          <select
            value={newRoomMaxPlayers}
            onChange={(e) => setNewRoomMaxPlayers(parseInt(e.target.value))}
            className="room-select"
          >
            <option value={2}>2人</option>
            <option value={3}>3人</option>
            <option value={4}>4人</option>
            <option value={5}>5人</option>
            <option value={6}>6人</option>
          </select>
          <button onClick={handleCreateRoom} className="create-btn">创建房间</button>
        </div>
      </div>

      <div className="rooms-section">
        <h2>房间列表</h2>
        {error && <div className="error-message">{error}</div>}
        
        {loading ? (
          <div className="loading">加载中...</div>
        ) : (
          <div className="rooms-list">
            {rooms.length === 0 ? (
              <div className="no-rooms">暂无房间，请创建一个新房间</div>
            ) : (
              rooms.map(room => (
                <div key={room.id} className="room-card">
                  <div className="room-info">
                    <h3>{room.name}</h3>
                    <div className="room-details">
                      <span>玩家: {room.current_players}/{room.max_players}</span>
                      <span>状态: {room.status === 'waiting' ? '等待中' : '游戏中'}</span>
                    </div>
                  </div>
                  <div className="room-actions">
                    {room.status === 'waiting' && room.current_players < room.max_players ? (
                      <button 
                        onClick={() => handleJoinRoom(room.id)}
                        className="join-btn"
                        disabled={room.current_players >= room.max_players}
                      >
                        加入
                      </button>
                    ) : (
                      <button className="full-btn" disabled>房间已满</button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Lobby;