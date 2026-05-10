import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import api from '../api/client';
import PlayerInfo from './PlayerInfo';
import PropertyCard from './PropertyCard';
import Dice from './Dice';
import Modal from './Modal';

const Room = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, connected } = useSocket(user);
  const [room, setRoom] = useState(null);
  const [players, setPlayers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [diceValue, setDiceValue] = useState(null);
  const [isRolling, setIsRolling] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState('');
  const [isMyTurn, setIsMyTurn] = useState(false);

  // 加入房间
  useEffect(() => {
    if (user && roomId) {
      socket.emit('join_room', { roomId });
    }
  }, [user, roomId, socket]);

  // 监听房间更新
  useEffect(() => {
    if (socket) {
      socket.on('room_updated', (data) => {
        setRoom(data.room);
        setPlayers(data.players);
        
        // 检查游戏是否开始
        if (data.room.status === 'playing') {
          setGameStarted(true);
          setCurrentPlayer(data.currentPlayer);
          setIsMyTurn(data.currentPlayer?.userId === user?.id);
        }
      });

      // 监听玩家加入
      socket.on('player_joined', (data) => {
        setPlayers(data.players);
        setModalContent(`${data.playerUsername} 加入了房间`);
        setShowModal(true);
      });

      // 监听玩家离开
      socket.on('player_left', (data) => {
        setPlayers(data.players);
        setModalContent(`${data.playerUsername} 离开了房间`);
        setShowModal(true);
      });

      // 监听游戏开始
      socket.on('game_started', (data) => {
        setGameStarted(true);
        setRoom(data.room);
        setPlayers(data.players);
        setCurrentPlayer(data.currentPlayer);
        setIsMyTurn(data.currentPlayer?.userId === user?.id);
      });

      // 监听骰子结果
      socket.on('dice_rolled', (data) => {
        setDiceValue(data.diceValue);
        setIsRolling(false);
        
        if (data.message) {
          setModalContent(data.message);
          setShowModal(true);
        }
      });

      // 监听玩家移动
      socket.on('player_moved', (data) => {
        setPlayers(data.players);
        setCurrentPlayer(data.currentPlayer);
        setIsMyTurn(data.currentPlayer?.userId === user?.id);
      });

      // 监听购买地产
      socket.on('property_bought', (data) => {
        setProperties(data.properties);
        setModalContent(`${data.playerUsername} 购买了 ${data.propertyName}`);
        setShowModal(true);
      });

      // 监听回合结束
      socket.on('turn_ended', (data) => {
        setCurrentPlayer(data.nextPlayer);
        setIsMyTurn(data.nextPlayer?.userId === user?.id);
        setDiceValue(null);
      });

      // 监听游戏结束
      socket.on('game_ended', (data) => {
        setModalContent(`游戏结束！获胜者：${data.winnerUsername}`);
        setShowModal(true);
        setGameStarted(false);
      });

      // 监听错误信息
      socket.on('error', (data) => {
        setModalContent(data.message);
        setShowModal(true);
      });
    }
  }, [socket, user, roomId]);

  // 玩家准备/取消准备
  const toggleReady = () => {
    if (!room) return;
    socket.emit('player_ready', { 
      roomId: room.id, 
      isReady: !players.find(p => p.userId === user.id)?.isReady 
    });
  };

  // 开始游戏（房主）
  const startGame = () => {
    if (!room) return;
    socket.emit('start_game', { roomId: room.id });
  };

  // 掷骰子
  const rollDice = () => {
    if (!isMyTurn || isRolling || !gameStarted) return;
    setIsRolling(true);
    setDiceValue(null);
    socket.emit('roll_dice', { roomId: room.id });
  };

  // 结束回合
  const endTurn = () => {
    if (!isMyTurn || !gameStarted) return;
    socket.emit('end_turn', { roomId: room.id });
  };

  // 获取我的玩家信息
  const myPlayer = players.find(p => p.userId === user?.id);

  // 离开房间
  const leaveRoom = () => {
    if (socket) {
      socket.emit('leave_room', { roomId: room?.id });
    }
    navigate('/lobby');
  };

  if (!room) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className="room-container">
      <div className="room-header">
        <h2>{room.name}</h2>
        <div className="room-info">
          <span>玩家: {players.length}/{room.maxPlayers}</span>
          <span>状态: {gameStarted ? '游戏中' : '等待中'}</span>
        </div>
      </div>

      {!gameStarted ? (
        <div className="lobby">
          <div className="players-list">
            <h3>玩家列表</h3>
            {players.map(player => (
              <div key={player.id} className={`player-item ${player.userId === user?.id ? 'me' : ''}`}>
                <span>{player.username}</span>
                <span className={`ready-status ${player.isReady ? 'ready' : 'not-ready'}`}>
                  {player.isReady ? '准备' : '未准备'}
                </span>
              </div>
            ))}
          </div>

          <div className="room-actions">
            {myPlayer?.isRoomOwner && players.length >= 2 && (
              <button 
                className="btn btn-primary"
                onClick={startGame}
                disabled={players.some(p => !p.isReady)}
              >
                开始游戏
              </button>
            )}
            <button 
              className={`btn ${myPlayer?.isReady ? 'btn-secondary' : 'btn-primary'}`}
              onClick={toggleReady}
            >
              {myPlayer?.isReady ? '取消准备' : '准备'}
            </button>
            <button className="btn btn-danger" onClick={leaveRoom}>
              离开房间
            </button>
          </div>
        </div>
      ) : (
        <div className="game-board">
          <div className="game-info">
            <h3>当前回合: {currentPlayer?.username}</h3>
            {isMyTurn && (
              <div className="turn-actions">
                <button 
                  className="btn btn-primary"
                  onClick={rollDice}
                  disabled={isRolling}
                >
                  {isRolling ? '掷骰子中...' : '掷骰子'}
                </button>
                {diceValue && (
                  <button className="btn btn-secondary" onClick={endTurn}>
                    结束回合
                  </button>
                )}
              </div>
            )}
            {diceValue && <Dice value={diceValue} />}
          </div>

          <div className="players-area">
            <h3>玩家信息</h3>
            <div className="players-grid">
              {players.map(player => (
                <PlayerInfo 
                  key={player.id} 
                  player={player} 
                  isCurrent={currentPlayer?.id === player.id}
                />
              ))}
            </div>
          </div>

          <div className="properties-area">
            <h3>地产信息</h3>
            <div className="properties-grid">
              {properties.map(property => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <Modal 
          onClose={() => setShowModal(false)}
          title={gameStarted ? '游戏信息' : '房间信息'}
        >
          <p>{modalContent}</p>
        </Modal>
      )}

      <style jsx>{`
        .room-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          font-family: Arial, sans-serif;
        }

        .room-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding: 15px;
          background-color: #f5f5f5;
          border-radius: 8px;
        }

        .room-info {
          display: flex;
          gap: 20px;
        }

        .lobby {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .players-list {
          background-color: #f9f9f9;
          padding: 15px;
          border-radius: 8px;
        }

        .player-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px;
          margin: 5px 0;
          background-color: white;
          border-radius: 4px;
        }

        .player-item.me {
          background-color: #e3f2fd;
        }

        .ready-status {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
        }

        .ready {
          background-color: #4caf50;
          color: white;
        }

        .not-ready {
          background-color: #f44336;
          color: white;
        }

        .room-actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .game-board {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .game-info {
          background-color: #f9f9f9;
          padding: 15px;
          border-radius: 8px;
        }

        .turn-actions {
          display: flex;
          gap: 10px;
          margin-top: 10px;
        }

        .players-area, .properties-area {
          background-color: #f9f9f9;
          padding: 15px;
          border-radius: 8px;
        }

        .players-grid, .properties-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 10px;
          margin-top: 10px;
        }

        .btn {
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: background-color 0.3s;
        }

        .btn-primary {
          background-color: #2196f3;
          color: white;
        }

        .btn-primary:hover {
          background-color: #1976d2;
        }

        .btn-secondary {
          background-color: #757575;
          color: white;
        }

        .btn-secondary:hover {
          background-color: #616161;
        }

        .btn-danger {
          background-color: #f44336;
          color: white;
        }

        .btn-danger:hover {
          background-color: #d32f2f;
        }

        .loading {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          font-size: 18px;
        }
      `}</style>
    </div>
  );
};

export default Room;