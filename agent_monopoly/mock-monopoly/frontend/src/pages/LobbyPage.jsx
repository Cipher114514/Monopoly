import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import apiClient from '../utils/apiClient';
import { validateRoomName } from '../utils/validation';

const LobbyPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const socket = useSocket();
  
  // 状态管理
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomMaxPlayers, setNewRoomMaxPlayers] = useState(4);
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [filter, setFilter] = useState('waiting');
  const [pagination, setPagination] = useState({
    limit: 10,
    offset: 0,
    total: 0
  });

  // 检查用户是否登录
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // 获取房间列表
  const fetchRooms = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        status: filter,
        limit: pagination.limit,
        offset: pagination.offset
      });
      
      const response = await apiClient.get(`/api/rooms?${params}`);
      
      if (response.code === 200) {
        setRooms(response.data.rooms);
        setPagination(prev => ({
          ...prev,
          total: response.data.total
        }));
      } else {
        setError(response.message || '获取房间列表失败');
      }
    } catch (err) {
      console.error('获取房间列表失败:', err);
      setError('获取房间列表失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 初始化时获取房间列表
  useEffect(() => {
    fetchRooms();
  }, [filter, pagination.limit, pagination.offset]);

  // 监听房间更新
  useEffect(() => {
    if (!socket) return;

    // 监听房间更新事件
    socket.on('roomUpdated', (data) => {
      if (data.roomId) {
        // 更新特定房间
        setRooms(prevRooms => 
          prevRooms.map(room => 
            room.roomId === data.roomId ? data.room : room
          )
        );
      } else {
        // 重新获取房间列表
        fetchRooms();
      }
    });

    // 监听房间创建成功
    socket.on('roomCreated', (data) => {
      setShowCreateModal(false);
      setNewRoomName('');
      setNewRoomMaxPlayers(4);
      fetchRooms();
    });

    // 监听加入房间结果
    socket.on('joinedRoom', (data) => {
      if (data.success) {
        navigate(`/room/${data.roomId}`);
      } else {
        setError(data.message || '加入房间失败');
      }
    });

    // 清理事件监听
    return () => {
      socket.off('roomUpdated');
      socket.off('roomCreated');
      socket.off('joinedRoom');
    };
  }, [socket, navigate]);

  // 创建房间
  const handleCreateRoom = async () => {
    // 验证房间名称
    const validation = validateRoomName(newRoomName);
    if (!validation.valid) {
      setError(validation.message);
      return;
    }

    setCreatingRoom(true);
    setError(null);

    try {
      const response = await apiClient.post('/api/rooms/create', {
        name: newRoomName,
        max_players: newRoomMaxPlayers
      });

      if (response.code === 200) {
        // 通过Socket通知服务器创建房间
        socket.emit('createRoom', {
          roomId: response.data.roomId,
          name: response.data.name,
          maxPlayers: response.data.maxPlayers
        });
      } else {
        setError(response.message || '创建房间失败');
      }
    } catch (err) {
      console.error('创建房间失败:', err);
      setError('创建房间失败，请稍后重试');
    } finally {
      setCreatingRoom(false);
    }
  };

  // 加入房间
  const handleJoinRoom = async (roomId) => {
    setError(null);

    try {
      const response = await apiClient.post('/api/rooms/join', {
        room_id: roomId
      });

      if (response.code === 200) {
        // 通过Socket通知服务器加入房间
        socket.emit('joinRoom', {
          roomId: roomId
        });
      } else {
        setError(response.message || '加入房间失败');
      }
    } catch (err) {
      console.error('加入房间失败:', err);
      setError('加入房间失败，请稍后重试');
    }
  };

  // 分页处理
  const handlePageChange = (newOffset) => {
    setPagination(prev => ({
      ...prev,
      offset: newOffset
    }));
  };

  // 过滤房间状态
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setPagination(prev => ({
      ...prev,
      offset: 0
    }));
  };

  // 计算分页信息
  const totalPages = Math.ceil(pagination.total / pagination.limit);
  const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        {/* 页面标题 */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">游戏大厅</h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">欢迎, {user?.username}</span>
            <button 
              onClick={logout}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
            >
              退出登录
            </button>
          </div>
        </div>

        {/* 创建房间按钮 */}
        <div className="mb-6">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            创建新房间
          </button>
        </div>

        {/* 过滤器 */}
        <div className="mb-6 flex space-x-4">
          <button
            onClick={() => handleFilterChange('waiting')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'waiting' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-200'
            }`}
          >
            等待中 ({rooms.filter(r => r.status === 'waiting').length})
          </button>
          <button
            onClick={() => handleFilterChange('playing')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'playing' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-200'
            }`}
          >
            进行中 ({rooms.filter(r => r.status === 'playing').length})
          </button>
          <button
            onClick={() => handleFilterChange('finished')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'finished' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-200'
            }`}
          >
            已结束 ({rooms.filter(r => r.status === 'finished').length})
          </button>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* 房间列表 */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="text-xl font-medium text-gray-900 mb-2">暂无房间</h3>
            <p className="text-gray-500 mb-4">当前没有可用的房间，请创建一个新房间</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            >
              创建房间
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => (
              <div key={room.roomId} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">{room.name}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      room.status === 'waiting' ? 'bg-green-100 text-green-800' :
                      room.status === 'playing' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {room.status === 'waiting' ? '等待中' : 
                       room.status === 'playing' ? '进行中' : '已结束'}
                    </span>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>创建者: {room.creatorId === user?.userId ? '你' : '其他玩家'}</span>
                      <span>创建时间: {new Date(room.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-600">
                        玩家: {room.currentPlayers}/{room.maxPlayers}
                      </div>
                      <div className="flex space-x-1">
                        {Array.from({ length: room.maxPlayers }).map((_, index) => (
                          <div
                            key={index}
                            className={`w-3 h-3 rounded-full ${
                              index < room.currentPlayers ? 'bg-blue-500' : 'bg-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleJoinRoom(room.roomId)}
                    disabled={room.status !== 'waiting' || room.currentPlayers >= room.maxPlayers}
                    className={`w-full py-2 rounded-lg transition ${
                      room.status === 'waiting' && room.currentPlayers < room.maxPlayers
                        ? 'bg-blue-500 text-white hover:bg-blue-600'
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {room.status === 'waiting' && room.currentPlayers < room.maxPlayers
                      ? '加入房间'
                      : room.status !== 'waiting'
                      ? '游戏进行中'
                      : '房间已满'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(Math.max(0, pagination.offset - pagination.limit))}
                disabled={pagination.offset === 0}
                className={`px-3 py-1 rounded ${
                  pagination.offset === 0
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-200'
                }`}
              >
                上一页
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i;
                } else if (currentPage <= 3) {
                  pageNum = i;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 5 + i;
                } else {
                  pageNum = currentPage - 3 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum * pagination.limit)}
                    className={`px-3 py-1 rounded ${
                      pageNum === currentPage
                        ? 'bg-blue-500 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {pageNum + 1}
                  </button>
                );
              })}
              
              <button
                onClick={() => handlePageChange(Math.min((totalPages - 1) * pagination.limit, pagination.offset + pagination.limit))}
                disabled={pagination.offset + pagination.limit >= pagination.total}
                className={`px-3 py-1 rounded ${
                  pagination.offset + pagination.limit >= pagination.total
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-200'
                }`}
              >
                下一页
              </button>
            </div>
          </div>
        )}

        {/* 创建房间模态框 */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
              <h2 className="text-xl font-bold mb-4">创建新房间</h2>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  房间名称
                </label>
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="输入房间名称"
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  最大玩家数 (2-6)
                </label>
                <select
                  value={newRoomMaxPlayers}
                  onChange={(e) => setNewRoomMaxPlayers(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={2}>2人</option>
                  <option value={3}>3人</option>
                  <option value={4}>4人</option>
                  <option value={5}>5人</option>
                  <option value={6}>6人</option>
                </select>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition"
                >
                  取消
                </button>
                <button
                  onClick={handleCreateRoom}
                  disabled={creatingRoom}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
                >
                  {creatingRoom ? '创建中...' : '创建房间'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LobbyPage;