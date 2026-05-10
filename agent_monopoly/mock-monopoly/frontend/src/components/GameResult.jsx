import React from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

const GameResult = ({ result }) => {
  const navigate = useNavigate();
  const { winner, players, duration, finishedAt } = result;

  const handleBackToHome = () => {
    navigate('/');
  };

  const handlePlayAgain = async () => {
    try {
      // 可以在这里添加重新开始的逻辑
      navigate('/');
    } catch (error) {
      console.error('Failed to restart game:', error);
    }
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}小时 ${minutes}分钟`;
    } else if (minutes > 0) {
      return `${minutes}分钟 ${secs}秒`;
    } else {
      return `${secs}秒`;
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString('zh-CN');
  };

  return (
    <div className="game-result-container">
      <div className="result-header">
        <h1>游戏结束</h1>
        <div className="trophy-icon">🏆</div>
      </div>

      <div className="winner-section">
        <h2>获胜者</h2>
        <div className="winner-info">
          <div className="winner-avatar">{winner.username.charAt(0)}</div>
          <div className="winner-details">
            <h3>{winner.username}</h3>
            <p>最终财产: ${winner.money}</p>
          </div>
        </div>
      </div>

      <div className="game-stats">
        <div className="stat-item">
          <span className="stat-label">游戏时长:</span>
          <span className="stat-value">{formatDuration(duration)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">结束时间:</span>
          <span className="stat-value">{formatDate(finishedAt)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">参与玩家:</span>
          <span className="stat-value">{players.length}人</span>
        </div>
      </div>

      <div className="players-ranking">
        <h2>玩家排行</h2>
        <div className="ranking-list">
          {players.map((player, index) => (
            <div key={player.id} className={`ranking-item ${index === 0 ? 'first-place' : ''}`}>
              <div className="rank">{index + 1}</div>
              <div className="player-info">
                <div className="player-avatar">{player.username.charAt(0)}</div>
                <div className="player-details">
                  <span className="player-name">{player.username}</span>
                  <span className="player-money">${player.money}</span>
                </div>
              </div>
              {player.isBankrupt && (
                <div className="bankrupt-status">破产</div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="result-actions">
        <button onClick={handlePlayAgain} className="btn-primary">
          再来一局
        </button>
        <button onClick={handleBackToHome} className="btn-secondary">
          返回首页
        </button>
      </div>
    </div>
  );
};

export default GameResult;