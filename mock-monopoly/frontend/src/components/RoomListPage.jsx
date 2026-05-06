import React, { useState } from 'react';
function RoomListPage({ user }) {
  const [rooms, setRooms] = useState([
    { id: '1', name: '房间1', players: 2 },
    { id: '2', name: '房间2', players: 3 }
  ]);
  return (
    <div className="room-list">
      <h1>房间列表</h1>
      <button>创建房间</button>
      {rooms.map(room => (
        <div key={room.id}>
          <h3>{room.name}</h3>
          <p>{room.players}/6 玩家</p>
          <button>加入</button>
        </div>
      ))}
    </div>
  );
}
export default RoomListPage;