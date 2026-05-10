import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import Lobby from './Lobby';
import GameBoard from './GameBoard';
import PlayerInfo from './PlayerInfo';
import Chat from './Chat';

const Room = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, connected } = useSocket(user);
  const [room, setRoom] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isGameStarted, setIsGameStarted] = useState(false);

  // 获取房间信息
  useEffect(() => {
    const fetchRoom = async () => {
      try {
        setLoading(true);
        const response = await api.getRoom(roomId);
        if (response.success) {
          setRoom(response.data);
          setPlayers(response.data.players || []);
          setIsGameStarted(response.data.status === 'playing');
        } else {
          setError(response.message || '获取房间信息失败');
        }
      } catch (err) {
        setError('获取房间信息失败');
        console.error('获取房间错误:', err);
      } finally {
        setLoading(false);
      }
    };

    if (roomId) {
      fetchRoom();
    }
  }, [roomId]);

  // 设置Socket监听器
  useEffect(() => {
    if (!socket || !connected) return;

    // 玩家加入房间
    socket.on('player_joined', (data) => {
      setRoom(data.room);
      setPlayers(data.room.players || []);
    });

    // 玩家离开房间
    socket.on('player_left', (data) => {
      setRoom(data.room);
      setPlayers(data.room.players || []);
    });

    // 玩家准备状态变化
    socket.on('player_ready_changed', (data) => {
      setRoom(data.room);
      setPlayers(data.room.players || []);
    });

    // 游戏开始
    socket.on('game_started', (data) => {
      setRoom(data.room);
      setIsGameStarted(true);
    });

    // 错误消息
    socket.on('error', (data) => {
      setError(data.message);
    });

    // 清理监听器
    return () => {
      socket.off('player_joined');
      socket.off('player_left');
      socket.off('player_ready_changed');
      socket.off('game_started');
      socket.off('error');
    };
  }, [socket, connected]);

  // 玩家准备/取消准备
  const handleReadyToggle = async () => {
    if (!socket || !user) return;

    try {
      socket.emit('player_ready', {
        roomId,
        userId: user.id,
        isReady: !room.isReady
      });
    } catch (err) {
      console.error('准备状态切换失败:', err);
    }
  };

  // 开始游戏
  const handleStartGame = async () => {
    if (!socket || !user) return;

    try {
      socket.emit('start_game', {
        roomId,
        userId: user.id
      });
    } catch (err) {
      console.error('开始游戏失败:', err);
    }
  };

  // 离开房间
  const handleLeaveRoom = async () => {
    if (!socket || !user) return;

    try {
      socket.emit('leave_room', {
        roomId,
        userId: user.id
      });
      navigate('/lobby');
    } catch (err) {
      console.error('离开房间失败:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-lg">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-lg text-red-600">{error}</div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-lg">房间不存在</div>
      </div>
    );
  }

  // 游戏开始前显示房间界面
  if (!isGameStarted) {
    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-6xl mx-auto">
          {/* 房间头部 */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{room.name}</h1>
                <p className="text-gray-600">房间ID: {room.id}</p>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-gray-600">
                  {players.length} / {room.maxPlayers} 玩家
                </span>
                <button
                  onClick={handleLeaveRoom}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
                >
                  离开房间
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 玩家列表 */}
            <div className="lg:col-span-2">
              <Lobby
                room={room}
                players={players}
                user={user}
                onReadyToggle={handleReadyToggle}
                onStartGame={handleStartGame}
              />
            </div>

            {/* 聊天区域 */}
            <div className="lg:col-span-1">
              <Chat roomId={roomId} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 游戏开始后显示游戏界面
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* 游戏头部 */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-800">{room.name}</h1>
            <button
              onClick={handleLeaveRoom}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
            >
              离开游戏
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* 游戏棋盘 */}
          <div className="lg:col-span-3">
            <GameBoard roomId={roomId} />
          </div>

          {/* 玩家信息和聊天 */}
          <div className="lg:col-span-1 space-y-4">
            <PlayerInfo 
              players={players} 
              currentPlayer={user}
              roomId={roomId}
            />
            <Chat roomId={roomId} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Room;