import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useNavigate } from 'react-router-dom';

const RoomList = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // 获取房间列表
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
      console.error('获取房间列表错误:', err);
    } finally {
      setLoading(false);
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
      console.error('加入房间错误:', err);
    }
  };

  // 创建房间
  const handleCreateRoom = () => {
    navigate('/create-room');
  };

  // 初始化获取房间列表
  useEffect(() => {
    fetchRooms();
  }, []);

  if (loading) {
    return (
      <div className="room-list-container">
        <div className="loading">加载中...</div>
      </div>
    );
  }

  return (
    <div className="room-list-container">
      <div className="room-list-header">
        <h2>游戏房间</h2>
        <button className="create-room-btn" onClick={handleCreateRoom}>
          创建房间
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="rooms-grid">
        {rooms.length > 0 ? (
          rooms.map(room => (
            <div key={room.id} className="room-card">
              <div className="room-name">{room.name}</div>
              <div className="room-info">
                <span>玩家: {room.currentPlayers}/{room.maxPlayers}</span>
                <span className={`room-status ${room.status}`}>
                  {room.status === 'waiting' ? '等待中' : '游戏中'}
                </span>
              </div>
              <button 
                className="join-room-btn" 
                onClick={() => handleJoinRoom(room.id)}
                disabled={room.status !== 'waiting'}
              >
                {room.status === 'waiting' ? '加入房间' : '游戏中'}
              </button>
            </div>
          ))
        ) : (
          <div className="no-rooms">
            <p>暂无可用房间</p>
            <button className="create-room-btn" onClick={handleCreateRoom}>
              创建第一个房间
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomList;