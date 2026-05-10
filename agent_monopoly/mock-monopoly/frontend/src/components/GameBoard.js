import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useParams, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import useSocket from '../hooks/useSocket';
import Dice from './Dice';
import PropertyCard from './PropertyCard';
import PlayerList from './PlayerList';
import './GameBoard.css';

const GameBoard = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, connected, emit, on } = useSocket(user);
  const [gameState, setGameState] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [properties, setProperties] = useState([]);
  const [diceResult, setDiceResult] = useState(null);
  const [isRolling, setIsRolling] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!socket || !connected) return;

    // 加入房间
    emit('join_room', { roomId });

    // 监听游戏状态更新
    on('game_state_update', (data) => {
      setGameState(data.room);
      setCurrentPlayer(data.currentPlayer);
      setProperties(data.properties || []);
      setGameStarted(data.room?.status === 'playing');
    });

    // 监听骰子结果
    on('dice_rolled', (data) => {
      setDiceResult(data.dice);
      setIsRolling(false);
      setMessage(`骰子点数: ${data.dice[0]} + ${data.dice[1]} = ${data.total}`);
    });

    // 监听玩家移动
    on('player_moved', (data) => {
      setCurrentPlayer(data.currentPlayer);
      setMessage(`${data.player.username} 移动到了位置 ${data.position}`);
    });

    // 监听购买地产
    on('property_bought', (data) => {
      setProperties(data.properties);
      setMessage(`${data.player.username} 购买了 ${data.property.name}`);
    });

    // 监听游戏开始
    on('game_started', (data) => {
      setGameStarted(true);
      setGameState(data.room);
      setCurrentPlayer(data.currentPlayer);
      setMessage('游戏开始！');
    });

    // 监听游戏结束
    on('game_ended', (data) => {
      setMessage(`游戏结束！获胜者: ${data.winner.username}`);
    });

    // 监听错误消息
    on('error', (data) => {
      setMessage(data.message);
    });

    // 清理函数
    return () => {
      emit('leave_room', { roomId });
    };
  }, [user, socket, connected, roomId, navigate, emit, on]);

  const handleRollDice = () => {
    if (!gameStarted || isRolling || !currentPlayer || currentPlayer.userId !== user.id) {
      return;
    }
    setIsRolling(true);
    emit('roll_dice', { roomId });
  };

  const handleBuyProperty = (propertyId) => {
    if (!gameStarted || !currentPlayer || currentPlayer.userId !== user.id) {
      return;
    }
    emit('buy_property', { roomId, propertyId });
  };

  const handleEndTurn = () => {
    if (!gameStarted || !currentPlayer || currentPlayer.userId !== user.id) {
      return;
    }
    emit('end_turn', { roomId });
  };

  if (!gameState) {
    return <div className="loading">加载游戏中...</div>;
  }

  return (
    <div className="game-board-container">
      <h1>大富翁游戏 - {gameState.name}</h1>
      
      {message && <div className="message">{message}</div>}
      
      <div className="game-board">
        {/* 游戏棋盘 */}
        <div className="board">
          {properties.map((property) => (
            <PropertyCard 
              key={property.id} 
              property={property} 
              onBuy={handleBuyProperty}
              isCurrentPlayerTurn={currentPlayer?.userId === user.id}
            />
          ))}
        </div>

        {/* 游戏控制面板 */}
        <div className="control-panel">
          <div className="player-info">
            <h3>当前玩家</h3>
            {currentPlayer && (
              <div>
                <p>玩家: {currentPlayer.username}</p>
                <p>资金: ${currentPlayer.money}</p>
                <p>位置: {currentPlayer.position}</p>
                <p>状态: {currentPlayer.inJail ? '监狱中' : '游戏中'}</p>
              </div>
            )}
          </div>

          <div className="dice-area">
            <Dice rolling={isRolling} result={diceResult} />
            <button 
              onClick={handleRollDice} 
              disabled={!gameStarted || isRolling || !currentPlayer || currentPlayer.userId !== user.id}
            >
              掷骰子
            </button>
          </div>

          <div className="actions">
            <button onClick={handleEndTurn} disabled={!gameStarted || !currentPlayer || currentPlayer.userId !== user.id}>
              结束回合
            </button>
          </div>
        </div>

        {/* 玩家列表 */}
        <div className="player-list">
          <h3>玩家列表</h3>
          <PlayerList players={gameState.players || []} currentPlayerId={currentPlayer?.id} />
        </div>
      </div>
    </div>
  );
};

export default GameBoard;