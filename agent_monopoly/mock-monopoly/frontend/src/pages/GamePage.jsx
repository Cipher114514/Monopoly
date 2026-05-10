import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import { useGame } from '../hooks/useGame';
import GameBoard from '../components/GameBoard';
import Dice from '../components/Dice';
import PlayerInfo from '../components/PlayerInfo';
import PropertyCard from '../components/PropertyCard';
import GameResult from '../components/GameResult';

const GamePage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, connected } = useSocket(user);
  const { 
    room, 
    players, 
    currentPlayer, 
    properties, 
    dice, 
    gameStarted, 
    gameOver,
    rollDice,
    buyProperty,
    buildHouse,
    endTurn
  } = useGame();

  const [selectedProperty, setSelectedProperty] = useState(null);
  const [message, setMessage] = useState('');

  // 处理骰子投掷
  const handleRollDice = () => {
    if (!currentPlayer || currentPlayer.userId !== user.id) {
      setMessage('不是你的回合');
      return;
    }
    if (dice.rolling) return;
    
    rollDice(roomId, user.id);
    setMessage('投掷骰子中...');
  };

  // 处理购买地产
  const handleBuyProperty = (propertyId) => {
    if (!currentPlayer || currentPlayer.userId !== user.id) {
      setMessage('不是你的回合');
      return;
    }
    
    buyProperty(roomId, user.id, propertyId);
    setMessage('购买地产中...');
  };

  // 处理建设房屋
  const handleBuildHouse = (propertyId) => {
    if (!currentPlayer || currentPlayer.userId !== user.id) {
      setMessage('不是你的回合');
      return;
    }
    
    buildHouse(roomId, user.id, propertyId);
    setMessage('建设中房屋...');
  };

  // 结束回合
  const handleEndTurn = () => {
    if (!currentPlayer || currentPlayer.userId !== user.id) {
      setMessage('不是你的回合');
      return;
    }
    
    endTurn(roomId, user.id);
    setMessage('结束回合');
  };

  // 离开房间
  const handleLeaveRoom = () => {
    if (window.confirm('确定要离开房间吗？')) {
      navigate('/lobby');
    }
  };

  // 显示地产详情
  const showPropertyDetails = (property) => {
    setSelectedProperty(property);
  };

  // 关闭地产详情
  const closePropertyDetails = () => {
    setSelectedProperty(null);
  };

  if (!room) {
    return <div>加载中...</div>;
  }

  if (gameOver) {
    return <GameResult room={room} players={players} />;
  }

  return (
    <div className="game-page">
      <div className="game-header">
        <h1>大富翁游戏 - {room.name}</h1>
        <button onClick={handleLeaveRoom} className="btn btn-danger">离开房间</button>
      </div>

      <div className="game-info">
        <div className="current-turn">
          当前回合: {currentPlayer ? players.find(p => p.id === currentPlayer.id)?.username : '无'}
        </div>
        <div className="game-status">
          状态: {gameStarted ? '游戏中' : '等待开始'}
          {players.length}/{room.maxPlayers} 玩家
        </div>
        {message && <div className="message">{message}</div>}
      </div>

      <div className="game-board-container">
        <GameBoard 
          players={players} 
          properties={properties} 
          onPropertyClick={showPropertyDetails}
        />
        
        <div className="game-controls">
          {currentPlayer && currentPlayer.userId === user.id && !gameStarted && (
            <button onClick={() => socket.emit('player_ready', { roomId, userId: user.id, isReady: true })} 
                    className="btn btn-primary">
              准备
            </button>
          )}
          
          {currentPlayer && currentPlayer.userId === user.id && gameStarted && (
            <>
              <Dice 
                value={dice.value} 
                rolling={dice.rolling} 
                onRoll={handleRollDice}
              />
              <button onClick={handleEndTurn} className="btn btn-secondary">结束回合</button>
            </>
          )}
        </div>
      </div>

      <div className="players-sidebar">
        <h3>玩家信息</h3>
        {players.map(player => (
          <PlayerInfo 
            key={player.id} 
            player={player} 
            isCurrent={currentPlayer && currentPlayer.id === player.id}
          />
        ))}
      </div>

      {selectedProperty && (
        <PropertyCard 
          property={selectedProperty} 
          onBuy={handleBuyProperty}
          onBuild={handleBuildHouse}
          onClose={closePropertyDetails}
          currentPlayer={currentPlayer}
        />
      )}
    </div>
  );
};

export default GamePage;