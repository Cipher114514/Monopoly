import React from 'react';
function RoomPage({ user }) {
  return (
    <div className="room-page">
      <h1>房间等待</h1>
      <div className="players">
        <div>玩家1: {user?.email || 'Guest'}</div>
      </div>
      <button>开始游戏</button>
    </div>
  );
}
export default RoomPage;