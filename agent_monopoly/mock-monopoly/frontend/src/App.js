import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useSocket } from './hooks/useSocket';
import { useGame } from './hooks/useGame';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import LobbyPage from './pages/LobbyPage';
import RoomPage from './pages/RoomPage';
import GamePage from './pages/GamePage';
import GameOverPage from './pages/GameOverPage';
import apiClient from './utils/apiClient';
import './styles/App.css';

function App() {
  const { user, login, logout, loading } = useAuth();
  const { socket, connected } = useSocket();
  const { 
    gameStatus, 
    roomInfo, 
    players, 
    currentPlayer, 
    properties, 
    diceValue, 
    message,
    startGame,
    rollDice,
    buyProperty,
    buildHouse,
    endTurn,
    drawCard,
    payRent,
    updatePlayerPosition,
    updatePlayerMoney,
    updatePropertyOwner,
    updatePropertyHouses,
    updateGameStatus,
    updateRoomInfo,
    updatePlayers,
    updateCurrentPlayer,
    updateProperties,
    updateDiceValue,
    updateMessage,
    resetGame
  } = useGame();

  // 初始化Socket连接
  useEffect(() => {
    if (user && !connected) {
      // Socket连接已在useSocket中处理
    }
  }, [user, connected]);

  // 处理Socket事件
  useEffect(() => {
    if (!socket) return;

    // 房间事件
    socket.on('roomUpdated', (data) => {
      updateRoomInfo(data.room);
      updatePlayers(data.players);
    });

    socket.on('playerJoined', (data) => {
      updatePlayers(data.players);
      updateMessage(`${data.playerName} 加入了房间`);
    });

    socket.on('playerLeft', (data) => {
      updatePlayers(data.players);
      updateMessage(`${data.playerName} 离开了房间`);
    });

    socket.on('playerReady', (data) => {
      updatePlayers(data.players);
      updateMessage(`${data.playerName} ${data.ready ? '已' : '取消'}准备`);
    });

    // 游戏事件
    socket.on('gameStarted', (data) => {
      updateGameStatus('playing');
      updateRoomInfo(data.room);
      updatePlayers(data.players);
      updateCurrentPlayer(data.currentPlayer);
      updateMessage('游戏开始！');
    });

    socket.on('diceRolled', (data) => {
      updateDiceValue(data.diceValue);
      updatePlayerPosition(data.playerId, data.newPosition);
      updateMessage(`${data.playerName} 掷出了 ${data.diceValue} 点`);
    });

    socket.on('playerMoved', (data) => {
      updatePlayerPosition(data.playerId, data.newPosition);
      updateMessage(`${data.playerName} 移动到了位置 ${data.newPosition}`);
    });

    socket.on('propertyPurchased', (data) => {
      updatePropertyOwner(data.propertyId, data.playerId);
      updatePlayerMoney(data.playerId, data.playerMoney);
      updateMessage(`${data.playerName} 购买了 ${data.propertyName}`);
    });

    socket.on('rentPaid', (data) => {
      updatePlayerMoney(data.payerId, data.payerMoney);
      updatePlayerMoney(data.ownerId, data.ownerMoney);
      updateMessage(`${data.payerName} 支付 ${data.amount} 租金给 ${data.ownerName}`);
    });

    socket.on('houseBuilt', (data) => {
      updatePropertyHouses(data.propertyId, data.houseCount);
      updatePlayerMoney(data.playerId, data.playerMoney);
      updateMessage(`${data.playerName} 在 ${data.propertyName} 建造了一座房子`);
    });

    socket.on('cardDrawn', (data) => {
      updateMessage(`${data.playerName} 抽到了: ${data.cardDescription}`);
      // 执行卡牌效果
      if (data.cardType === 'move') {
        updatePlayerPosition(data.playerId, data.targetPosition);
      } else if (data.cardType === 'money') {
        updatePlayerMoney(data.playerId, data.playerMoney);
      }
    });

    socket.on('turnEnded', (data) => {
      updateCurrentPlayer(data.nextPlayerId);
      updateMessage(`轮到 ${data.nextPlayerName} 的回合`);
    });

    socket.on('gameOver', (data) => {
      updateGameStatus('finished');
      updateMessage(`游戏结束！获胜者是: ${data.winnerName}`);
    });

    // 清理事件监听器
    return () => {
      socket.off('roomUpdated');
      socket.off('playerJoined');
      socket.off('playerLeft');
      socket.off('playerReady');
      socket.off('gameStarted');
      socket.off('diceRolled');
      socket.off('playerMoved');
      socket.off('propertyPurchased');
      socket.off('rentPaid');
      socket.off('houseBuilt');
      socket.off('cardDrawn');
      socket.off('turnEnded');
      socket.off('gameOver');
    };
  }, [socket, updateGameStatus, updateRoomInfo, updatePlayers, updateCurrentPlayer, 
      updatePlayerPosition, updatePlayerMoney, updatePropertyOwner, updatePropertyHouses, 
      updateDiceValue, updateMessage]);

  // 处理游戏操作
  const handleStartGame = () => {
    if (roomInfo && roomInfo.players.length >= 2) {
      startGame();
    } else {
      updateMessage('至少需要2名玩家才能开始游戏');
    }
  };

  const handleRollDice = () => {
    if (gameStatus === 'playing' && currentPlayer && currentPlayer.id === user.id) {
      rollDice();
    }
  };

  const handleBuyProperty = (propertyId) => {
    if (gameStatus === 'playing' && currentPlayer && currentPlayer.id === user.id) {
      buyProperty(propertyId);
    }
  };

  const handleBuildHouse = (propertyId) => {
    if (gameStatus === 'playing' && currentPlayer && currentPlayer.id === user.id) {
      buildHouse(propertyId);
    }
  };

  const handleEndTurn = () => {
    if (gameStatus === 'playing' && currentPlayer && currentPlayer.id === user.id) {
      endTurn();
    }
  };

  const handleDrawCard = () => {
    if (gameStatus === 'playing' && currentPlayer && currentPlayer.id === user.id) {
      drawCard();
    }
  };

  const handlePayRent = (propertyId) => {
    if (gameStatus === 'playing' && currentPlayer && currentPlayer.id === user.id) {
      payRent(propertyId);
    }
  };

  // 渲染应用
  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <Router>
      <div className="app">
        <Header user={user} onLogout={logout} />
        
        <main className="main-content">
          <Routes>
            <Route path="/" element={
              user ? <Navigate to="/lobby" /> : <Navigate to="/login" />
            } />
            <Route path="/login" element={
              user ? <Navigate to="/lobby" /> : <LoginPage onLogin={login} />
            } />
            <Route path="/register" element={
              user ? <Navigate to="/lobby" /> : <RegisterPage onLogin={login} />
            } />
            <Route path="/lobby" element={
              user ? (
                <LobbyPage 
                  user={user} 
                  socket={socket}
                  rooms={roomInfo ? [roomInfo] : []}
                  onCreateRoom={() => {}}
                  onJoinRoom={() => {}}
                />
              ) : <Navigate to="/login" />
            } />
            <Route path="/room/:roomId" element={
              user ? (
                <RoomPage 
                  user={user}
                  roomInfo={roomInfo}
                  players={players}
                  currentPlayer={currentPlayer}
                  onReady={() => {}}
                  onStartGame={handleStartGame}
                  onLeaveRoom={() => {}}
                />
              ) : <Navigate to="/login" />
            } />
            <Route path="/game/:roomId" element={
              user ? (
                <GamePage 
                  user={user}
                  gameStatus={gameStatus}
                  roomInfo={roomInfo}
                  players={players}
                  currentPlayer={currentPlayer}
                  properties={properties}
                  diceValue={diceValue}
                  message={message}
                  onRollDice={handleRollDice}
                  onBuyProperty={handleBuyProperty}
                  onBuildHouse={handleBuildHouse}
                  onEndTurn={handleEndTurn}
                  onDrawCard={handleDrawCard}
                  onPayRent={handlePayRent}
                />
              ) : <Navigate to="/login" />
            } />
            <Route path="/game-over" element={
              user ? <GameOverPage winner={currentPlayer} onReset={resetGame} /> : <Navigate to="/login" />
            } />
          </Routes>
        </main>
        
        <Footer />
      </div>
    </Router>
  );
}

export default App;
```