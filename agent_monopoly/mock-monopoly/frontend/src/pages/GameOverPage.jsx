import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import apiClient from '../utils/apiClient';

const GameOverPage = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [gameStats, setGameStats] = useState(null);
  const [winner, setWinner] = useState(null);
  const [playerStats, setPlayerStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // 获取游戏统计信息
  useEffect(() => {
    const fetchGameStats = async () => {
      try {
        const response = await apiClient.get('/api/game/stats');
        setGameStats(response.data.gameStats);
        setWinner(response.data.winner);
        
        // 找到当前玩家的统计信息
        const currentPlayerStats = response.data.playersStats.find(
          p => p.userId === user?.id
        );
        setPlayerStats(currentPlayerStats);
      } catch (error) {
        console.error('获取游戏统计失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGameStats();
  }, [user]);

  // 处理返回大厅
  const handleBackToLobby = () => {
    window.location.href = '/lobby';
  };

  // 处理重新开始
  const handleRestart = () => {
    window.location.href = '/lobby';
  };

  if (loading) {
    return <div>加载中...</div>;
  }

  return (
    <div className="game-over-page">
      <div className="game-over-container">
        <h1 className="game-over-title">游戏结束</h1>
        
        {winner && (
          <div className="winner-announcement">
            <h2>🎉 恭喜 {winner.username} 获胜！ 🎉</h2>
            <div className="winner-avatar" style={{ backgroundColor: winner.color }}>
              {winner.initials}
            </div>
          </div>
        )}

        {playerStats && (
          <div className="player-stats">
            <h3>你的游戏统计</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-label">最终排名</div>
                <div className="stat-value">#{playerStats.rank}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">剩余资金</div>
                <div className="stat-value">${playerStats.money}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">拥有地产</div>
                <div className="stat-value">{playerStats.propertiesCount} 处</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">建设房屋</div>
                <div className="stat-value">{playerStats.housesCount} 栋</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">支付租金</div>
                <div className="stat-value">${playerStats.totalRentPaid}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">收取租金</div>
                <div className="stat-value">${playerStats.totalRentReceived}</div>
              </div>
            </div>
          </div>
        )}

        {gameStats && (
          <div className="game-stats">
            <h3>游戏总览</h3>
            <div className="game-stats-grid">
              <div className="stat-item">
                <div className="stat-label">游戏时长</div>
                <div className="stat-value">{gameStats.duration} 分钟</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">总回合数</div>
                <div className="stat-value">{gameStats.totalTurns}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">交易次数</div>
                <div className="stat-value">{gameStats.totalTransactions}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">房屋建设</div>
                <div className="stat-value">{gameStats.totalHouses} 栋</div>
              </div>
            </div>
          </div>
        )}

        <div className="game-over-actions">
          <button 
            onClick={handleBackToLobby}
            className="back-to-lobby-btn"
          >
            返回大厅
          </button>
          <button 
            onClick={handleRestart}
            className="restart-btn"
          >
            开始新游戏
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameOverPage;
```