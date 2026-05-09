import React, { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../hooks/useAuth';
import { useGame } from '../hooks/useGame';
import apiClient from '../utils/apiClient';

const GamePage = () => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const { gameState, currentPlayer, properties, players, messages } = useGame();
  const [diceValue, setDiceValue] = useState(0);
  const [isRolling, setIsRolling] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [cardInfo, setCardInfo] = useState(null);

  // 处理掷骰子
  const handleRollDice = useCallback(() => {
    if (isRolling || currentPlayer?.id !== user?.id) return;
    
    setIsRolling(true);
    socket.emit('roll_dice', { roomId: gameState.roomId });
  }, [isRolling, currentPlayer, user, gameState.roomId, socket]);

  // 处理结束回合
  const handleEndTurn = useCallback(() => {
    if (currentPlayer?.id !== user?.id) return;
    
    socket.emit('end_turn', { roomId: gameState.roomId });
  }, [currentPlayer, user, gameState.roomId, socket]);

  // 处理购买地产
  const handleBuyProperty = useCallback((propertyId) => {
    if (currentPlayer?.id !== user?.id) return;
    
    socket.emit('buy_property', { roomId: gameState.roomId, propertyId });
    setShowPropertyModal(false);
  }, [currentPlayer, user, gameState.roomId, socket]);

  // 处理建设房屋
  const handleBuildHouse = useCallback((propertyId) => {
    if (currentPlayer?.id !== user?.id) return;
    
    socket.emit('build_house', { roomId: gameState.roomId, propertyId });
    setShowPropertyModal(false);
  }, [currentPlayer, user, gameState.roomId, socket]);

  // 处理抽卡
  const handleDrawCard = useCallback(() => {
    if (currentPlayer?.id !== user?.id) return;
    
    socket.emit('draw_card', { roomId: gameState.roomId });
  }, [currentPlayer, user, gameState.roomId, socket]);

  // 处理破产
  const handleBankrupt = useCallback(() => {
    if (currentPlayer?.id !== user?.id) return;
    
    if (window.confirm('确定要宣布破产吗？这将结束你的游戏。')) {
      socket.emit('bankrupt', { roomId: gameState.roomId });
    }
  }, [currentPlayer, user, gameState.roomId, socket]);

  // 处理发送消息
  const handleSendMessage = useCallback((message) => {
    if (!message.trim()) return;
    
    socket.emit('send_message', { 
      roomId: gameState.roomId, 
      message: message.trim() 
    });
  }, [gameState.roomId, socket]);

  // 监听骰子结果
  useEffect(() => {
    const handleDiceRolled = (data) => {
      setDiceValue(data.value);
      setIsRolling(false);
    };

    socket.on('dice_rolled', handleDiceRolled);
    return () => socket.off('dice_rolled', handleDiceRolled);
  }, [socket]);

  // 监听地产购买事件
  useEffect(() => {
    const handlePropertyAvailable = (data) => {
      setSelectedProperty(data.propertyInfo);
      setShowPropertyModal(true);
    };

    const handlePropertyPurchased = (data) => {
      setShowPropertyModal(false);
    };

    socket.on('property_available', handlePropertyAvailable);
    socket.on('property_purchased', handlePropertyPurchased);
    return () => {
      socket.off('property_available', handlePropertyAvailable);
      socket.off('property_purchased', handlePropertyPurchased);
    };
  }, [socket]);

  // 监听抽卡事件
  useEffect(() => {
    const handleCardDrawn = (data) => {
      setCardInfo(data.cardInfo);
      setShowCardModal(true);
    };

    const handleCardEffect = (data) => {
      // 处理卡牌效果
      if (data.effectType === 'move') {
        // 移动效果已在服务端处理，这里可以添加UI反馈
      } else if (data.effectType === 'money') {
        // 金钱效果已在服务端处理，这里可以添加UI反馈
      }
      setShowCardModal(false);
    };

    socket.on('card_drawn', handleCardDrawn);
    socket.on('card_effect', handleCardEffect);
    return () => {
      socket.off('card_drawn', handleCardDrawn);
      socket.off('card_effect', handleCardEffect);
    };
  }, [socket]);

  // 监听破产事件
  useEffect(() => {
    const handleBankruptcyDeclared = (data) => {
      if (data.userId === user?.id) {
        // 跳转到游戏结束页面
        window.location.href = '/game-over';
      }
    };

    const handlePlayerBankrupted = (data) => {
      // 更新游戏状态
    };

    socket.on('bankruptcy_declared', handleBankruptcyDeclared);
    socket.on('player_bankrupted', handlePlayerBankrupted);
    return () => {
      socket.off('bankruptcy_declared', handleBankruptcyDeclared);
      socket.off('player_bankrupted', handlePlayerBankrupted);
    };
  }, [user, socket]);

  // 监听回合切换
  useEffect(() => {
    const handleTurnChanged = (data) => {
      // 重置骰子值
      setDiceValue(0);
    };

    socket.on('turn_changed', handleTurnChanged);
    return () => socket.off('turn_changed', handleTurnChanged);
  }, [socket]);

  // 监听聊天消息
  useEffect(() => {
    const handleMessageReceived = (data) => {
      // 消息已通过useGame hook更新
    };

    socket.on('message_received', handleMessageReceived);
    return () => socket.off('message_received', handleMessageReceived);
  }, [socket]);

  // 渲染棋盘格子
  const renderBoardCell = (position, cellData) => {
    // 根据位置确定格子类型和样式
    let cellClass = 'board-cell';
    
    if (cellData.type === 'property') {
      cellClass += ' property-cell';
      // 根据所有权添加样式
      const owner = players.find(p => p.id === cellData.ownerId);
      if (owner) {
        cellClass += ` owned-by-${owner.id}`;
      }
    } else if (cellData.type === 'chance') {
      cellClass += ' chance-cell';
    } else if (cellData.type === 'community') {
      cellClass += ' community-cell';
    } else if (cellData.type === 'start') {
      cellClass += ' start-cell';
    } else if (cellData.type === 'jail') {
      cellClass += ' jail-cell';
    } else if (cellData.type === 'tax') {
      cellClass += ' tax-cell';
    } else if (cellData.type === 'free') {
      cellClass += ' free-cell';
    }

    return (
      <div key={position} className={cellClass}>
        <div className="cell-position">{position}</div>
        <div className="cell-name">{cellData.name}</div>
        
        {/* 显示该位置的玩家 */}
        {players
          .filter(player => player.position === position)
          .map(player => (
            <div 
              key={player.id} 
              className={`player-token ${player.id === user?.id ? 'current-player' : ''}`}
              style={{ backgroundColor: player.color }}
            >
              {player.initials}
            </div>
          ))}
      </div>
    );
  };

  // 渲染玩家信息
  const renderPlayerInfo = (player) => {
    const isCurrentPlayer = currentPlayer?.id === player.id;
    
    return (
      <div 
        key={player.id} 
        className={`player-info ${isCurrentPlayer ? 'current-player' : ''}`}
      >
        <div className="player-avatar" style={{ backgroundColor: player.color }}>
          {player.initials}
        </div>
        <div className="player-details">
          <div className="player-name">{player.username}</div>
          <div className="player-money">${player.money}</div>
          <div className="player-properties">{player.propertiesCount} 地产</div>
        </div>
        {isCurrentPlayer && (
          <div className="current-indicator">当前回合</div>
        )}
      </div>
    );
  };

  // 渲染聊天消息
  const renderMessage = (message) => (
    <div key={message.timestamp} className="chat-message">
      <span className="message-user">{message.username}: </span>
      <span className="message-text">{message.message}</span>
      <span className="message-time">{new Date(message.timestamp).toLocaleTimeString()}</span>
    </div>
  );

  if (!gameState || !players || players.length === 0) {
    return <div>加载游戏中...</div>;
  }

  return (
    <div className="game-page">
      <div className="game-container">
        {/* 游戏棋盘 */}
        <div className="game-board">
          {/* 这里简化了棋盘渲染，实际应该根据大富翁棋盘布局 */}
          {Array.from({ length: 40 }, (_, i) => {
            const cellData = gameState.board[i] || { 
              type: 'empty', 
              name: `位置 ${i}` 
            };
            return renderBoardCell(i, cellData);
          })}
        </div>

        {/* 游戏控制面板 */}
        <div className="control-panel">
          <div className="current-player-info">
            <h3>当前玩家: {currentPlayer?.username}</h3>
            <div className="dice-container">
              {diceValue > 0 && (
                <div className="dice-value">{diceValue}</div>
              )}
              <button 
                onClick={handleRollDice}
                disabled={isRolling || currentPlayer?.id !== user?.id}
                className="roll-dice-btn"
              >
                {isRolling ? '掷骰中...' : '掷骰子'}
              </button>
            </div>
            <button 
              onClick={handleEndTurn}
              disabled={currentPlayer?.id !== user?.id}
              className="end-turn-btn"
            >
              结束回合
            </button>
          </div>

          <div className="player-list">
            <h3>玩家列表</h3>
            {players.map(renderPlayerInfo)}
          </div>

          <div className="action-buttons">
            <button 
              onClick={handleDrawCard}
              disabled={currentPlayer?.id !== user?.id}
              className="draw-card-btn"
            >
              抽卡
            </button>
            <button 
              onClick={handleBankrupt}
              disabled={currentPlayer?.id !== user?.id}
              className="bankrupt-btn"
            >
              宣布破产
            </button>
          </div>
        </div>

        {/* 聊天区域 */}
        <div className="chat-container">
          <div className="chat-messages">
            {messages.map(renderMessage)}
          </div>
          <div className="chat-input">
            <input 
              type="text" 
              placeholder="输入消息..." 
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSendMessage(e.target.value);
                  e.target.value = '';
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* 地产购买模态框 */}
      {showPropertyModal && selectedProperty && (
        <div className="modal property-modal">
          <div className="modal-content">
            <h3>{selectedProperty.name}</h3>
            <p>价格: ${selectedProperty.price}</p>
            <p>租金: ${selectedProperty.rent}</p>
            <div className="modal-actions">
              <button 
                onClick={() => handleBuyProperty(selectedProperty.id)}
                className="buy-btn"
              >
                购买
              </button>
              <button 
                onClick={() => setShowPropertyModal(false)}
                className="cancel-btn"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 卡牌模态框 */}
      {showCardModal && cardInfo && (
        <div className="modal card-modal">
          <div className="modal-content">
            <h3>{cardInfo.type === 'chance' ? '机会卡' : '命运卡'}</h3>
            <p>{cardInfo.description}</p>
            <div className="modal-actions">
              <button 
                onClick={() => setShowCardModal(false)}
                className="close-btn"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GamePage;
```

```