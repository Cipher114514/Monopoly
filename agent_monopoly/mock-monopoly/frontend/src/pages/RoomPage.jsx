import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import { useGame } from '../hooks/useGame';
import Room from '../components/Room';
import GameBoard from '../components/GameBoard';
import PlayerInfo from '../components/PlayerInfo';
import Dice from '../components/Dice';
import Chat from '../components/Chat';

const RoomPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { socket, connected } = useSocket(user);
  const { 
    room, 
    players, 
    properties, 
    currentPlayer, 
    gameState, 
    error,
    loading: gameLoading,
    joinRoom,
    leaveRoom,
    startGame,
    rollDice,
    buyProperty,
    buildHouse,
    endTurn,
    sendMessage
  } = useGame(roomId);

  const [isOwner, setIsOwner] = useState(false);
  const [showGameBoard, setShowGameBoard] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
  }, [user, navigate]);

  useEffect(() => {
    if (room && user) {
      setIsOwner(room.creatorId === user.id);
    }
  }, [room, user]);

  useEffect(() => {
    if (room && room.status === 'playing') {
      setShowGameBoard(true);
    }
  }, [room]);

  const handleJoinRoom = async () => {
    try {
      await joinRoom(user.id);
    } catch (err) {
      console.error('Failed to join room:', err);
    }
  };

  const handleLeaveRoom = async () => {
    try {
      await leaveRoom();
      navigate('/lobby');
    } catch (err) {
      console.error('Failed to leave room:', err);
    }
  };

  const handleStartGame = async () => {
    try {
      await startGame();
    } catch (err) {
      console.error('Failed to start game:', err);
    }
  };

  const handleRollDice = async () => {
    try {
      await rollDice();
    } catch (err) {
      console.error('Failed to roll dice:', err);
    }
  };

  const handleBuyProperty = async (propertyId) => {
    try {
      await buyProperty(propertyId);
    } catch (err) {
      console.error('Failed to buy property:', err);
    }
  };

  const handleBuildHouse = async (propertyId) => {
    try {
      await buildHouse(propertyId);
    } catch (err) {
      console.error('Failed to build house:', err);
    }
  };

  const handleEndTurn = async () => {
    try {
      await endTurn();
    } catch (err) {
      console.error('Failed to end turn:', err);
    }
  };

  const handleSendMessage = (message) => {
    if (message.trim()) {
      sendMessage(message, user.id, user.username);
    }
  };

  if (loading || gameLoading) {
    return (
      <div className="room-loading">
        <div className="spinner"></div>
        <p>Loading room...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="room-error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={handleLeaveRoom}>Back to Lobby</button>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="room-not-found">
        <h2>Room Not Found</h2>
        <p>The room you're looking for doesn't exist.</p>
        <button onClick={() => navigate('/lobby')}>Back to Lobby</button>
      </div>
    );
  }

  return (
    <div className="room-page">
      <div className="room-header">
        <h1>{room.name}</h1>
        <div className="room-info">
          <span>Players: {room.currentPlayers}/{room.maxPlayers}</span>
          <span>Status: {room.status}</span>
        </div>
        <div className="room-actions">
          {!showGameBoard && (
            <>
              <button 
                onClick={handleJoinRoom}
                disabled={room.currentPlayers >= room.maxPlayers}
                className={room.currentPlayers >= room.maxPlayers ? 'disabled' : ''}
              >
                Join Room
              </button>
              {isOwner && room.status === 'waiting' && (
                <button 
                  onClick={handleStartGame}
                  disabled={room.currentPlayers < 2}
                >
                  Start Game
                </button>
              )}
              <button onClick={handleLeaveRoom}>Leave Room</button>
            </>
          )}
        </div>
      </div>

      {showGameBoard ? (
        <div className="game-container">
          <div className="game-sidebar">
            <PlayerInfo 
              players={players} 
              currentPlayer={currentPlayer}
              isMyTurn={gameState.currentPlayerId === user.id}
            />
            <div className="game-controls">
              {gameState.currentPlayerId === user.id && (
                <>
                  <Dice onRoll={handleRollDice} disabled={gameState.diceRolled} />
                  <button 
                    onClick={handleEndTurn}
                    disabled={!gameState.diceRolled}
                  >
                    End Turn
                  </button>
                </>
              )}
            </div>
            <Chat 
              messages={gameState.messages || []}
              onSendMessage={handleSendMessage}
              disabled={gameState.currentPlayerId !== user.id}
            />
          </div>
          
          <div className="game-board-container">
            <GameBoard 
              properties={properties}
              players={players}
              currentPlayer={currentPlayer}
              onBuyProperty={handleBuyProperty}
              onBuildHouse={handleBuildHouse}
            />
          </div>
        </div>
      ) : (
        <div className="room-lobby">
          <div className="players-list">
            <h2>Players in Room</h2>
            <div className="players">
              {players.map(player => (
                <div key={player.id} className="player-item">
                  <div className="player-avatar" style={{ backgroundColor: player.color }}>
                    {player.username.charAt(0)}
                  </div>
                  <div className="player-info">
                    <span className="player-name">{player.username}</span>
                    <span className="player-status">
                      {player.isReady ? 'Ready' : 'Not Ready'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="room-chat">
            <h2>Chat</h2>
            <Chat 
              messages={gameState.messages || []}
              onSendMessage={handleSendMessage}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomPage;