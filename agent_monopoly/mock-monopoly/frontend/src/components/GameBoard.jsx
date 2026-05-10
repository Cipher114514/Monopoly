import React, { useState, useEffect } from 'react';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../hooks/useAuth';
import api from '../api/client';
import Dice from './Dice';
import PropertyCard from './PropertyCard';

const GameBoard = ({ roomId }) => {
  const { user } = useAuth();
  const { socket, connected } = useSocket(user);
  const [players, setPlayers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [diceValue, setDiceValue] = useState(null);
  const [canRoll, setCanRoll] = useState(false);
  const [message, setMessage] = useState('');

  // 初始化游戏数据
  useEffect(() => {
    if (!roomId) return;

    // 获取房间信息
    api.getRoom(roomId)
      .then(response => {
        const room = response.data;
        setGameStarted(room.status === 'playing');
        
        // 获取玩家列表
        api.getPlayersByRoom(roomId)
          .then(response => {
            setPlayers(response.data);
            // 设置当前玩家（第一个玩家）
            if (response.data.length > 0) {
              setCurrentPlayer(response.data[0]);
            }
          })
          .catch(error => {
            console.error('获取玩家列表失败:', error);
            setMessage('获取玩家列表失败');
          });

        // 获取地产列表
        api.getProperties(roomId)
          .then(response => {
            setProperties(response.data);
          })
          .catch(error => {
            console.error('获取地产列表失败:', error);
            setMessage('获取地产列表失败');
          });
      })
      .catch(error => {
        console.error('获取房间信息失败:', error);
        setMessage('获取房间信息失败');
      });

    // 监听游戏事件
    if (socket && connected) {
      socket.on('game_started', (data) => {
        setGameStarted(true);
        setPlayers(data.players);
        setCurrentPlayer(data.currentPlayer);
        setMessage('游戏开始！');
      });

      socket.on('player_joined', (data) => {
        setPlayers(data.players);
        setMessage(`${data.playerName} 加入了游戏`);
      });

      socket.on('dice_rolled', (data) => {
        setDiceValue(data.diceValue);
        setCanRoll(false);
        setMessage(`${data.playerName} 掷出了 ${data.diceValue} 点`);
      });

      socket.on('player_moved', (data) => {
        setPlayers(data.players);
        setMessage(`${data.playerName} 移动到了 ${data.position} 号位置`);
        
        // 如果当前玩家是用户自己，检查是否可以行动
        if (data.currentPlayerId === user.userId) {
          setCanRoll(true);
        }
      });

      socket.on('property_bought', (data) => {
        setProperties(data.properties);
        setPlayers(data.players);
        setMessage(`${data.playerName} 购买了 ${data.propertyName}`);
      });

      socket.on('house_built', (data) => {
        setProperties(data.properties);
        setMessage(`${data.playerName} 在 ${data.propertyName} 上建造了房屋`);
      });

      socket.on('rent_collected', (data) => {
        setPlayers(data.players);
        setMessage(`${data.payerName} 支付了 ${data.amount} 租金给 ${data.ownerName}`);
      });

      socket.on('player_bankrupt', (data) => {
        setPlayers(data.players);
        setMessage(`${data.playerName} 破产了，退出游戏`);
      });

      socket.on('game_over', (data) => {
        setMessage(`游戏结束！获胜者：${data.winnerName}`);
      });

      socket.on('error', (data) => {
        setMessage(`错误：${data.message}`);
      });
    }

    return () => {
      // 清理事件监听器
      if (socket) {
        socket.off('game_started');
        socket.off('player_joined');
        socket.off('dice_rolled');
        socket.off('player_moved');
        socket.off('property_bought');
        socket.off('house_built');
        socket.off('rent_collected');
        socket.off('player_bankrupt');
        socket.off('game_over');
        socket.off('error');
      }
    };
  }, [roomId, socket, connected, user]);

  // 掷骰子
  const handleRollDice = () => {
    if (!canRoll || !socket || !connected) return;
    
    socket.emit('roll_dice', { roomId, userId: user.userId });
    setCanRoll(false);
    setMessage('掷骰子中...');
  };

  // 购买地产
  const handleBuyProperty = (propertyId) => {
    if (!socket || !connected) return;
    
    socket.emit('buy_property', { roomId, userId: user.userId, propertyId });
    setMessage('正在购买地产...');
  };

  // 建造房屋
  const handleBuildHouse = (propertyId) => {
    if (!socket || !connected) return;
    
    socket.emit('build_house', { roomId, userId: user.userId, propertyId });
    setMessage('正在建造房屋...');
  };

  // 结束回合
  const handleEndTurn = () => {
    if (!socket || !connected) return;
    
    socket.emit('end_turn', { roomId, userId: user.userId });
    setMessage('结束回合');
  };

  // 渲染游戏板格子
  const renderBoardCell = (position) => {
    const property = properties.find(p => p.position === position);
    const playerInCell = players.find(p => p.position === position);
    
    return (
      <div key={position} className="board-cell">
        {property && (
          <div className="property-info">
            <div className="property-name">{property.name}</div>
            <div className="property-price">${property.price}</div>
            {property.owner_id && (
              <div className="property-owner">所有者: {property.owner_id}</div>
            )}
            {property.house_count > 0 && (
              <div className="property-houses">房屋: {property.house_count}</div>
            )}
          </div>
        )}
        {playerInCell && (
          <div className="player-token" style={{ backgroundColor: playerInCell.color }}>
            {playerInCell.userId === user.userId ? '我' : playerInCell.userId}
          </div>
        )}
      </div>
    );
  };

  // 生成游戏板布局
  const renderGameBoard = () => {
    const boardSize = 10; // 10x10的游戏板
    const board = [];
    
    // 上边行（从右到左）
    for (let i = boardSize - 1; i >= 0; i--) {
      board.push(renderBoardCell(i));
    }
    
    // 右边列（从上到下）
    for (let i = 1; i < boardSize - 1; i++) {
      board.push(renderBoardCell(i * boardSize + boardSize - 1));
    }
    
    // 下边行（从左到右）
    for (let i = boardSize - 2; i >= 0; i--) {
      board.push(renderBoardCell((boardSize - 1) * boardSize + i));
    }
    
    // 左边列（从下到上）
    for (let i = boardSize - 2; i > 0; i--) {
      board.push(renderBoardCell(i * boardSize));
    }
    
    return board;
  };

  // 渲染玩家列表
  const renderPlayersList = () => {
    return (
      <div className="players-list">
        <h3>玩家列表</h3>
        {players.map(player => (
          <div 
            key={player.id} 
            className={`player-item ${currentPlayer && currentPlayer.id === player.id ? 'current' : ''}`}
          >
            <div className="player-info">
              <span className="player-name">{player.userId === user.userId ? '我' : player.userId}</span>
              <span className="player-money">${player.money}</span>
            </div>
            <div className="player-status">
              {player.in_jail && <span className="jail-tag">监狱</span>}
              {!player.is_ready && <span className="not-ready-tag">未准备</span>}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // 渲染地产列表
  const renderPropertiesList = () => {
    return (
      <div className="properties-list">
        <h3>我的地产</h3>
        {properties
          .filter(p => p.owner_id === user.userId)
          .map(property => (
            <PropertyCard 
              key={property.id} 
              property={property}
              onBuildHouse={() => handleBuildHouse(property.id)}
            />
          ))}
      </div>
    );
  };

  if (!gameStarted) {
    return (
      <div className="game-board">
        <h2>等待游戏开始...</h2>
        {renderPlayersList()}
      </div>
    );
  }

  return (
    <div className="game-board">
      <div className="board-container">
        <div className="game-board-grid">
          {renderGameBoard()}
        </div>
      </div>
      
      <div className="game-controls">
        <Dice value={diceValue} rolling={!canRoll} />
        <button 
          onClick={handleRollDice} 
          disabled={!canRoll}
          className="roll-dice-btn"
        >
          掷骰子
        </button>
        <button onClick={handleEndTurn} className="end-turn-btn">
          结束回合
        </button>
      </div>
      
      <div className="game-info">
        <div className="message">{message}</div>
        {renderPlayersList()}
        {renderPropertiesList()}
      </div>
    </div>
  );
};

export default GameBoard;