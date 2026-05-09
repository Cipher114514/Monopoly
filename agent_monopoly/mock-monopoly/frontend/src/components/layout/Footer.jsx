import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import apiClient from '../../utils/apiClient';

const Footer = () => {
  const { user } = useAuth();
  const [gameStats, setGameStats] = useState({
    totalGames: 0,
    wins: 0,
    losses: 0,
    winRate: 0
  });

  React.useEffect(() => {
    const fetchGameStats = async () => {
      if (user) {
        try {
          const response = await apiClient.get(`/users/${user.id}/stats`);
          setGameStats(response.data);
        } catch (error) {
          console.error('Failed to fetch game stats:', error);
        }
      }
    };

    fetchGameStats();
  }, [user]);

  const calculateWinRate = () => {
    if (gameStats.totalGames === 0) return 0;
    return Math.round((gameStats.wins / gameStats.totalGames) * 100);
  };

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>游戏规则</h3>
          <ul>
            <li>每位玩家初始资金 $1500</li>
            <li>掷骰子决定移动步数</li>
            <li>经过无人拥有的地产可选择购买</li>
            <li>落在他人地产需支付租金</li>
            <li>集齐同色地块可建设房屋</li>
            <li>资金归零则破产出局</li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h3>玩家统计</h3>
          {user ? (
            <div className="user-stats">
              <p>总游戏数: {gameStats.totalGames}</p>
              <p>胜利次数: {gameStats.wins}</p>
              <p>失败次数: {gameStats.losses}</p>
              <p>胜率: {calculateWinRate()}%</p>
            </div>
          ) : (
            <p>请登录查看个人统计</p>
          )}
        </div>
        
        <div className="footer-section">
          <h3>关于游戏</h3>
          <p>大富翁在线是一个基于经典大富翁规则开发的多人在线游戏。</p>
          <p>支持2-6名玩家同时在线，实时对战。</p>
          <p>© 2023 大富翁在线. 保留所有权利.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
```