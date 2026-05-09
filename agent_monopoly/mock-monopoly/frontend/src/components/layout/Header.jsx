import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import { useGame } from '../../hooks/useGame';
import Button from '../ui/Button';
import apiClient from '../../utils/apiClient';

const Header = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { socket, isConnected } = useSocket();
  const { currentRoom, gameStarted } = useGame();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    try {
      await apiClient.post('/auth/logout');
      logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleCreateRoom = () => {
    navigate('/room/create');
  };

  const handleJoinRoom = () => {
    navigate('/room/join');
  };

  const handleBackToLobby = () => {
    if (socket && currentRoom) {
      socket.emit('leaveRoom', { roomId: currentRoom.id });
    }
    navigate('/lobby');
  };

  return (
    <header className="header">
      <div className="header-left">
        <h1 className="logo">大富翁在线</h1>
      </div>
      
      <div className="header-center">
        {gameStarted && currentRoom && (
          <div className="game-info">
            <span className="room-name">房间: {currentRoom.name}</span>
            <span className="round-info">回合: {currentRoom.currentRound || 1}</span>
          </div>
        )}
      </div>
      
      <div className="header-right">
        {isAuthenticated ? (
          <>
            <div className="user-info">
              <span className="username">{user.username}</span>
              <div className="user-menu" onClick={() => setShowUserMenu(!showUserMenu)}>
                <div className="user-avatar">{user.username.charAt(0).toUpperCase()}</div>
                {showUserMenu && (
                  <div className="dropdown-menu">
                    <div className="dropdown-item">
                      <span>余额: ${user.balance || 0}</span>
                    </div>
                    <div className="dropdown-item">
                      <span>胜场: {user.wins || 0}</span>
                    </div>
                    <div className="dropdown-divider"></div>
                    <button className="dropdown-button" onClick={handleLogout}>
                      退出登录
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {!gameStarted && currentRoom && (
              <div className="room-actions">
                <Button variant="secondary" onClick={handleBackToLobby}>
                  返回大厅
                </Button>
              </div>
            )}
            
            {!currentRoom && (
              <div className="navigation-actions">
                <Button variant="primary" onClick={handleCreateRoom}>
                  创建房间
                </Button>
                <Button variant="secondary" onClick={handleJoinRoom}>
                  加入房间
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="auth-actions">
            <Button variant="secondary" onClick={() => navigate('/login')}>
              登录
            </Button>
            <Button variant="primary" onClick={() => navigate('/register')}>
              注册
            </Button>
          </div>
        )}
        
        <div className="connection-status">
          {isConnected ? (
            <span className="status-connected">已连接</span>
          ) : (
            <span className="status-disconnected">连接断开</span>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
```

```