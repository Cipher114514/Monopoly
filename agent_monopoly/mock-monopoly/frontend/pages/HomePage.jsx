import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

const HomePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [creatingRoom, setCreatingRoom] = useState(false);

  // 检查用户登录状态
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }
        
        api.setToken(token);
        const response = await api.getMe();
        if (response.success) {
          setUser(response.data);
        } else {
          localStorage.removeItem('token');
          navigate('/login');
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        localStorage.removeItem('token');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  // 获取房间列表
  const fetchRooms = async () => {
    try {
      const response = await api.getRooms();
      if (response.success) {
        setRooms(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
      setError('获取房间列表失败');
    }
  };

  // 创建新房间
  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) {
      setError('请输入房间名称');
      return;
    }

    setCreatingRoom(true);
    try {
      const response = await api.createRoom(newRoomName, maxPlayers);
      if (response.success) {
        setShowCreateRoom(false);
        setNewRoomName('');
        fetchRooms(); // 刷新房间列表
      } else {
        setError(response.message || '创建房间失败');
      }
    } catch (err) {
      console.error('Create room failed:', err);
      setError('创建房间失败');
    } finally {
      setCreatingRoom(false);
    }
  };

  // 加入房间
  const handleJoinRoom = async (roomId) => {
    try {
      const response = await api.joinRoom(roomId);
      if (response.success) {
        navigate(`/room/${roomId}`);
      } else {
        setError(response.message || '加入房间失败');
      }
    } catch (err) {
      console.error('Join room failed:', err);
      setError('加入房间失败');
    }
  };

  // 登出
  const handleLogout = () => {
    localStorage.removeItem('token');
    api.setToken(null);
    navigate('/login');
  };

  // 页面加载时获取房间列表
  useEffect(() => {
    if (user) {
      fetchRooms();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">加载中...</div>
      </div>
    );
  }

  if (!user) {
    return null; // 已重定向到登录页
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 导航栏 */}
      <nav className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">在线大富翁</h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">欢迎, {user.username}</span>
            <button 
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
            >
              登出
            </button>
          </div>
        </div>
      </nav>

      {/* 主要内容 */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">游戏大厅</h2>
          <button
            onClick={() => setShowCreateRoom(true)}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            创建房间
          </button>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* 创建房间模态框 */}
        {showCreateRoom && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-96">
              <h3 className="text-xl font-bold mb-4">创建新房间</h3>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">房间名称</label>
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入房间名称"
                />
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 mb-2">最大玩家数</label>
                <select
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="2">2人</option>
                  <option value="3">3人</option>
                  <option value="4">4人</option>
                  <option value="5">5人</option>
                  <option value="6">6人</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowCreateRoom(false);
                    setNewRoomName('');
                    setError(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  取消
                </button>
                <button
                  onClick={handleCreateRoom}
                  disabled={creatingRoom}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  {creatingRoom ? '创建中...' : '创建'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 房间列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <div key={room.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-800">{room.name}</h3>
                <span className={`px-2 py-1 rounded text-sm ${
                  room.status === 'waiting' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {room.status === 'waiting' ? '等待中' : '游戏中'}
                </span>
              </div>
              <div className="mb-4">
                <p className="text-gray-600">
                  玩家: {room.currentPlayers}/{room.maxPlayers}
                </p>
                <p className="text-gray-600 text-sm">
                  创建者: {room.creatorName}
                </p>
              </div>
              <button
                onClick={() => handleJoinRoom(room.id)}
                disabled={room.status !== 'waiting' || room.currentPlayers >= room.maxPlayers}
                className={`w-full py-2 rounded transition ${
                  room.status === 'waiting' && room.currentPlayers < room.maxPlayers
                    ? 'bg-blue-500 hover:bg-blue-600 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {room.status === 'waiting' && room.currentPlayers < room.maxPlayers
                  ? '加入房间'
                  : room.status !== 'waiting'
                  ? '游戏中'
                  : '房间已满'}
              </button>
            </div>
          ))}
        </div>

        {rooms.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">暂无可用房间</p>
            <p className="text-gray-400 mt-2">点击"创建房间"开始游戏</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;