import React from 'react';
import api from '../api/client';

const PlayerInfo = ({ player, roomId }) => {
  const [isOwner, setIsOwner] = React.useState(false);
  const [canBuild, setCanBuild] = React.useState(false);
  
  React.useEffect(() => {
    // 检查是否是房主
    const checkOwner = async () => {
      try {
        const room = await api.getRoom(roomId);
        setIsOwner(room.creatorId === player.userId);
      } catch (error) {
        console.error('Error checking owner:', error);
      }
    };
    
    // 检查是否可以建造房屋
    const checkBuildAbility = async () => {
      try {
        const properties = await api.getPropertiesByPlayer(player.userId);
        // 如果玩家拥有地产且资金足够，可以建造
        const canBuildProperty = properties.some(prop => 
          prop.ownerId === player.userId && 
          prop.house_count < 4 && 
          player.money >= prop.house_price
        );
        setCanBuild(canBuildProperty);
      } catch (error) {
        console.error('Error checking build ability:', error);
      }
    };
    
    if (roomId) {
      checkOwner();
      checkBuildAbility();
    }
  }, [player, roomId]);
  
  const formatMoney = (amount) => {
    return `$${amount.toLocaleString()}`;
  };
  
  if (!player) {
    return <div className="player-info">Loading player info...</div>;
  }
  
  return (
    <div className="player-info">
      <div className="player-header">
        <div className="player-avatar" style={{ backgroundColor: player.color }}>
          {player.username.charAt(0).toUpperCase()}
        </div>
        <div className="player-details">
          <h3>{player.username}</h3>
          <p>{formatMoney(player.money)}</p>
        </div>
      </div>
      
      <div className="player-stats">
        <div className="stat-item">
          <span className="stat-label">Position:</span>
          <span className="stat-value">{player.position}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Properties:</span>
          <span className="stat-value">{/* TODO: 显示拥有的地产数量 */}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Status:</span>
          <span className={`status ${player.inJail ? 'jail' : player.isReady ? 'ready' : 'waiting'}`}>
            {player.inJail ? 'In Jail' : player.isReady ? 'Ready' : 'Waiting'}
          </span>
        </div>
      </div>
      
      {isOwner && (
        <div className="owner-actions">
          <button 
            className="action-button primary"
            onClick={() => {
              // 开始游戏逻辑
              api.startGame(roomId);
            }}
            disabled={!player.isReady}
          >
            Start Game
          </button>
        </div>
      )}
      
      <div className="player-actions">
        <button 
          className="action-button secondary"
          onClick={() => {
            // 准备/取消准备
            api.toggleReady(roomId, !player.isReady);
          }}
        >
          {player.isReady ? 'Cancel Ready' : 'Ready'}
        </button>
        
        {canBuild && (
          <button 
            className="action-button build"
            onClick={() => {
              // 显示建造选项
              // TODO: 实现建造逻辑
            }}
          >
            Build House
          </button>
        )}
      </div>
    </div>
  );
};

export default PlayerInfo;