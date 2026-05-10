import React from 'react';
import api from '../api/client';

const PlayerInfo = ({ player, roomId }) => {
  const { user, position, money, inJail, isReady, color } = player;

  const handleReadyToggle = async () => {
    try {
      const response = await api.put(`/api/rooms/${roomId}/players/${player.id}/ready`, {
        isReady: !isReady
      });
      
      if (response.data.code === 200) {
        // 状态更新由父组件处理
      }
    } catch (error) {
      console.error('Failed to toggle ready status:', error);
    }
  };

  const getJailStatus = () => {
    if (inJail) {
      return <span className="text-red-500 font-semibold">在监狱中</span>;
    }
    return null;
  };

  const getReadyStatus = () => {
    return isReady ? (
      <span className="text-green-500 font-semibold">准备就绪</span>
    ) : (
      <span className="text-gray-500">未准备</span>
    );
  };

  return (
    <div className={`player-info p-4 rounded-lg border-2 ${color} bg-white shadow-md`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-bold text-gray-800">{user.username}</h3>
        <div className="flex items-center space-x-2">
          {getReadyStatus()}
          <button
            onClick={handleReadyToggle}
            className={`px-3 py-1 rounded text-sm font-medium ${
              isReady 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {isReady ? '取消准备' : '准备'}
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="font-medium text-gray-600">位置:</span>
          <span className="ml-1">{position}</span>
        </div>
        <div>
          <span className="font-medium text-gray-600">资金:</span>
          <span className="ml-1 font-bold text-green-600">${money}</span>
        </div>
        <div className="col-span-2">
          {getJailStatus()}
        </div>
      </div>
    </div>
  );
};

export default PlayerInfo;