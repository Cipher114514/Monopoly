import React, { useState, useEffect } from 'react';
import api from '../api/client';

const Dice = ({ roomId, onRoll }) => {
  const [diceValue, setDiceValue] = useState(null);
  const [isRolling, setIsRolling] = useState(false);
  const [canRoll, setCanRoll] = useState(true);
  const [playerPosition, setPlayerPosition] = useState(null);
  const [playerMoney, setPlayerMoney] = useState(null);

  // 获取玩家信息
  useEffect(() => {
    const fetchPlayerInfo = async () => {
      try {
        const response = await api.get(`/api/players/me?roomId=${roomId}`);
        if (response.data) {
          setPlayerPosition(response.data.position);
          setPlayerMoney(response.data.money);
          setCanRoll(response.data.canRoll);
        }
      } catch (error) {
        console.error('获取玩家信息失败:', error);
      }
    };

    if (roomId) {
      fetchPlayerInfo();
    }
  }, [roomId]);

  // 掷骰子
  const handleRollDice = async () => {
    if (!canRoll || isRolling) return;

    setIsRolling(true);
    setCanRoll(false);

    try {
      // 发送掷骰子请求
      const response = await api.post('/api/game/roll-dice', { roomId });
      
      if (response.data.success) {
        const { dice, newPosition, newMoney } = response.data;
        setDiceValue(dice);
        setPlayerPosition(newPosition);
        setPlayerMoney(newMoney);

        // 触发回调函数
        if (onRoll) {
          onRoll(dice, newPosition, newMoney);
        }

        // 3秒后重置骰子显示
        setTimeout(() => {
          setDiceValue(null);
          setIsRolling(false);
        }, 3000);
      }
    } catch (error) {
      console.error('掷骰子失败:', error);
      setIsRolling(false);
      setCanRoll(true);
    }
  };

  // 渲染骰子点数
  const renderDice = () => {
    if (!diceValue) return null;

    const dots = [];
    for (let i = 0; i < diceValue; i++) {
      dots.push(<div key={i} className="dice-dot" />);
    }

    return (
      <div className="dice-display">
        <div className={`dice ${isRolling ? 'rolling' : ''}`}>
          {dots}
        </div>
        <div className="dice-value">{diceValue}</div>
      </div>
    );
  };

  return (
    <div className="dice-container">
      <div className="player-info">
        <div>位置: {playerPosition}</div>
        <div>资金: ${playerMoney}</div>
      </div>
      
      {renderDice()}
      
      <button 
        onClick={handleRollDice}
        disabled={!canRoll || isRolling}
        className={`roll-button ${!canRoll || isRolling ? 'disabled' : ''}`}
      >
        {isRolling ? '掷骰子中...' : '掷骰子'}
      </button>
      
      {!canRoll && (
        <div className="waiting-message">
          请等待其他玩家行动...
        </div>
      )}
    </div>
  );
};

export default Dice;