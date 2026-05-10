import React, { useState } from 'react';
import api from '../api/client';
import { useNavigate } from 'react-router-dom';

const CreateRoom = () => {
  const [roomName, setRoomName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(6);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!roomName.trim()) {
      setError('请输入房间名称');
      return;
    }

    if (maxPlayers < 2 || maxPlayers > 6) {
      setError('玩家数量必须在2-6之间');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.createRoom({
        name: roomName.trim(),
        maxPlayers: parseInt(maxPlayers)
      });

      if (response.code === 200) {
        // 创建成功，跳转到房间页面
        navigate(`/room/${response.data.roomId}`);
      } else {
        setError(response.message || '创建房间失败');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
      console.error('Create room error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-room-container">
      <h2>创建房间</h2>
      <form onSubmit={handleSubmit} className="create-room-form">
        <div className="form-group">
          <label htmlFor="roomName">房间名称</label>
          <input
            type="text"
            id="roomName"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="输入房间名称"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="maxPlayers">玩家数量</label>
          <select
            id="maxPlayers"
            value={maxPlayers}
            onChange={(e) => setMaxPlayers(e.target.value)}
            disabled={loading}
          >
            <option value="2">2人</option>
            <option value="3">3人</option>
            <option value="4">4人</option>
            <option value="5">5人</option>
            <option value="6">6人</option>
          </select>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <button 
          type="submit" 
          className="submit-btn"
          disabled={loading}
        >
          {loading ? '创建中...' : '创建房间'}
        </button>
      </form>
    </div>
  );
};

export default CreateRoom;