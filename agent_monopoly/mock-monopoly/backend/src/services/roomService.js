const { db } = require('../db/connection');
const Room = require('../models/Room');
const Player = require('../models/Player');
const { v4: uuidv4 } = require('uuid');

// 创建房间
exports.createRoom = async ({ name, max_players, creatorId }) => {
  const roomId = uuidv4();
  const createdAt = Math.floor(Date.now() / 1000);
  
  // 开始事务
  const transaction = db.transaction(() => {
    // 创建房间
    const room = Room.create({
      id: roomId,
      name,
      creatorId,
      status: 'waiting',
      maxPlayers: max_players,
      currentPlayers: 1,
      createdAt,
      updatedAt: createdAt
    });
    
    // 创建玩家记录
    Player.create({
      userId: creatorId,
      roomId,
      isReady: false,
      joinedAt: createdAt
    });
    
    return room;
  });
  
  return transaction;
};

// 获取房间列表
exports.getRooms = async ({ status, limit, offset }) => {
  let query = 'SELECT * FROM rooms';
  let countQuery = 'SELECT COUNT(*) as total FROM rooms';
  const params = [];
  
  // 添加状态过滤
  if (status) {
    query += ' WHERE status = ?';
    countQuery += ' WHERE status = ?';
    params.push(status);
  }
  
  // 添加排序
  query += ' ORDER BY createdAt DESC';
  
  // 添加分页
  if (limit) {
    query += ' LIMIT ?';
    params.push(limit);
  }
  
  if (offset) {
    query += ' OFFSET ?';
    params.push(offset);
  }
  
  // 执行查询
  const roomsQuery = db.prepare(query);
  const rooms = roomsQuery.all(...params);
  
  const countQueryStmt = db.prepare(countQuery);
  const countResult = countQueryStmt.get(...params);
  const total = countResult.total;
  
  // 获取每个房间的当前玩家数
  const roomsWithPlayerCount = rooms.map(room => {
    const playerCountQuery = db.prepare('SELECT COUNT(*) as count FROM players WHERE roomId = ?');
    const playerCountResult = playerCountQuery.get(room.id);
    return {
      ...room,
      currentPlayers: playerCountResult.count
    };
  });
  
  return {
    rooms: roomsWithPlayerCount,
    total,
    limit,
    offset
  };
};

// 加入房间
exports.joinRoom = async ({ roomId, userId }) => {
  // 检查房间是否存在
  const room = Room.findById(roomId);
  if (!room) {
    throw new Error('房间不存在');
  }
  
  // 检查房间状态
  if (room.status !== 'waiting') {
    throw new Error('游戏已经开始，无法加入');
  }
  
  // 检查房间人数
  const playerCountQuery = db.prepare('SELECT COUNT(*) as count FROM players WHERE roomId = ?');
  const playerCountResult = playerCountQuery.get(roomId);
  
  if (playerCountResult.count >= room.maxPlayers) {
    throw new Error('房间已满');
  }
  
  // 检查用户是否已在房间中
  const existingPlayerQuery = db.prepare('SELECT * FROM players WHERE userId = ? AND roomId = ?');
  const existingPlayer = existingPlayerQuery.get(userId, roomId);
  
  if (existingPlayer) {
    throw new Error('您已在房间中');
  }
  
  // 开始事务
  const transaction = db.transaction(() => {
    // 添加玩家
    Player.create({
      userId,
      roomId,
      isReady: false,
      joinedAt: Math.floor(Date.now() / 1000)
    });
    
    // 更新房间当前玩家数
    Room.update(roomId, {
      currentPlayers: playerCountResult.count + 1,
      updatedAt: Math.floor(Date.now() / 1000)
    });
    
    return {
      roomId,
      userId,
      status: 'joined',
      message: '成功加入房间'
    };
  });
  
  return transaction;
};

// 离开房间
exports.leaveRoom = async ({ roomId, userId }) => {
  // 检查房间是否存在
  const room = Room.findById(roomId);
  if (!room) {
    throw new Error('房间不存在');
  }
  
  // 检查用户是否在房间中
  const playerQuery = db.prepare('SELECT * FROM players WHERE userId = ? AND roomId = ?');
  const player = playerQuery.get(userId, roomId);
  
  if (!player) {
    throw new Error('您不在此房间中');
  }
  
  // 开始事务
  const transaction = db.transaction(() => {
    // 删除玩家
    const deletePlayerQuery = db.prepare('DELETE FROM players WHERE userId = ? AND roomId = ?');
    deletePlayerQuery.run(userId, roomId);
    
    // 更新房间当前玩家数
    const playerCountQuery = db.prepare('SELECT COUNT(*) as count FROM players WHERE roomId = ?');
    const playerCountResult = playerCountQuery.get(roomId);
    
    // 如果房间没有玩家了，删除房间
    if (playerCountResult.count === 0) {
      Room.delete(roomId);
    } else {
      // 更新房间当前玩家数
      Room.update(roomId, {
        currentPlayers: playerCountResult.count,
        updatedAt: Math.floor(Date.now() / 1000)
      });
      
      // 如果离开的是房主，转移房主身份
      if (room.creatorId === userId) {
        const newCreatorQuery = db.prepare('SELECT userId FROM players WHERE roomId = ? LIMIT 1');
        const newCreator = newCreatorQuery.get(roomId);
        
        if (newCreator) {
          Room.update(roomId, {
            creatorId: newCreator.userId,
            updatedAt: Math.floor(Date.now() / 1000)
          });
        }
      }
    }
    
    return {
      roomId,
      userId,
      status: 'left',
      message: '成功离开房间'
    };
  });
  
  return transaction;
};

// 获取房间详情
exports.getRoomById = async (roomId) => {
  // 获取房间信息
  const room = Room.findById(roomId);
  if (!room) {
    throw new Error('房间不存在');
  }
  
  // 获取房间玩家列表
  const playersQuery = db.prepare(`
    SELECT p.userId, u.username, p.isReady, p.joinedAt 
    FROM players p 
    JOIN users u ON p.userId = u.id 
    WHERE p.roomId = ?
    ORDER BY p.joinedAt ASC
  `);
  const players = playersQuery.all(roomId);
  
  return {
    roomId: room.id,
    name: room.name,
    creatorId: room.creatorId,
    status: room.status,
    maxPlayers: room.maxPlayers,
    currentPlayers: room.currentPlayers,
    players,
    createdAt: room.createdAt,
    updatedAt: room.updatedAt
  };
};
```