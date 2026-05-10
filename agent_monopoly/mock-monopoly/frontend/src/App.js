import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import api from './api/client';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import HomePage from './components/HomePage';
import RoomListPage from './components/RoomListPage';
import CreateRoomPage from './components/CreateRoomPage';
import GameRoomPage from './components/GameRoomPage';
import { Toaster } from 'react-hot-toast';

function App() {
  const { user, loading, login, logout } = useAuth();
  const [socket, setSocket] = useState(null);

  // 初始化 Socket 连接
  useEffect(() => {
    if (user) {
      const newSocket = new WebSocket(`ws://localhost:3001?token=${localStorage.getItem('token')}`);
      setSocket(newSocket);
      
      newSocket.onclose = () => {
        console.log('Socket 连接关闭');
      };
    }
    
    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [user]);

  // 处理 Socket 消息
  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('收到 Socket 消息:', data);
        
        // 根据消息类型处理不同的游戏事件
        switch (data.type) {
          case 'player_joined':
            // 更新房间玩家列表
            break;
          case 'game_started':
            // 游戏开始状态更新
            break;
          case 'dice_rolled':
            // 更新骰子结果和玩家位置
            break;
          case 'player_moved':
            // 更新玩家位置
            break;
          case 'property_bought':
            // 更新地产状态
            break;
          case 'error':
            // 显示错误消息
            alert(data.message);
            break;
          default:
            console.log('未知消息类型:', data.type);
        }
      } catch (error) {
        console.error('解析 Socket 消息失败:', error);
      }
    };

    socket.addEventListener('message', handleMessage);

    return () => {
      socket.removeEventListener('message', handleMessage);
    };
  }, [socket]);

  // 发送 Socket 消息
  const emitSocketMessage = (type, data) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type, ...data }));
    } else {
      console.error('Socket 连接未建立或未连接');
    }
  };

  const handleLogin = async (username, password) => {
    try {
      await login(username, password);
      return true;
    } catch (error) {
      console.error('登录失败:', error);
      return false;
    }
  };

  const handleRegister = async (username, email, password) => {
    try {
      await api.register({ username, email, password });
      return true;
    } catch (error) {
      console.error('注册失败:', error);
      return false;
    }
  };

  const handleCreateRoom = async (roomData) => {
    try {
      const response = await api.createRoom(roomData);
      return response.data;
    } catch (error) {
      console.error('创建房间失败:', error);
      throw error;
    }
  };

  const handleJoinRoom = async (roomId) => {
    try {
      const response = await api.joinRoom(roomId);
      return response.data;
    } catch (error) {
      console.error('加入房间失败:', error);
      throw error;
    }
  };

  const handlePlayerReady = async (roomId, isReady) => {
    try {
      await api.playerReady(roomId, isReady);
      emitSocketMessage('player_ready', { roomId, isReady });
    } catch (error) {
      console.error('更新准备状态失败:', error);
      throw error;
    }
  };

  const handleStartGame = async (roomId) => {
    try {
      await api.startGame(roomId);
      emitSocketMessage('start_game', { roomId });
    } catch (error) {
      console.error('开始游戏失败:', error);
      throw error;
    }
  };

  const handleRollDice = async (roomId) => {
    try {
      const response = await api.rollDice(roomId);
      emitSocketMessage('roll_dice', { 
        roomId, 
        diceValue: response.data.diceValue,
        newPosition: response.data.newPosition 
      });
      return response.data;
    } catch (error) {
      console.error('掷骰子失败:', error);
      throw error;
    }
  };

  const handleBuyProperty = async (roomId, propertyId) => {
    try {
      await api.buyProperty(roomId, propertyId);
      emitSocketMessage('buy_property', { roomId, propertyId });
    } catch (error) {
      console.error('购买地产失败:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-xl">加载中...</div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Toaster position="top-right" />
        
        <Routes>
          {/* 未登录用户只能访问登录/注册页面 */}
          {!user && (
            <>
              <Route path="/login" element={
                <LoginPage onLogin={handleLogin} />
              } />
              <Route path="/register" element={
                <RegisterPage onRegister={handleRegister} />
              } />
              <Route path="/" element={<Navigate to="/login" />} />
            </>
          )}

          {/* 已登录用户访问主页和房间相关页面 */}
          {user && (
            <>
              <Route path="/" element={
                <HomePage 
                  user={user} 
                  onLogout={logout}
                  onCreateRoom={handleCreateRoom}
                  onJoinRoom={handleJoinRoom}
                />
              } />
              <Route path="/rooms" element={
                <RoomListPage 
                  user={user}
                  onJoinRoom={handleJoinRoom}
                />
              } />
              <Route path="/create-room" element={
                <CreateRoomPage 
                  user={user}
                  onCreateRoom={handleCreateRoom}
                />
              } />
              <Route path="/room/:roomId" element={
                <GameRoomPage 
                  user={user}
                  roomId={/* 从路由参数获取 */}
                  onPlayerReady={handlePlayerReady}
                  onStartGame={handleStartGame}
                  onRollDice={handleRollDice}
                  onBuyProperty={handleBuyProperty}
                  emitSocketMessage={emitSocketMessage}
                />
              } />
              <Route path="*" element={<Navigate to="/" />} />
            </>
          )}
        </Routes>
      </div>
    </Router>
  );
}

export default App;