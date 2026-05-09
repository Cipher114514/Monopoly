const { db } = require('../db/connection');
const { v4: uuidv4 } = require('uuid');
const Room = require('../models/Room');
const Player = require('../models/Player');

class RoomService {
  // 创建房间
  async createRoom(name, creatorId, maxPlayers) {
    const roomId = uuidv4();
    const createdAt = Math.floor(Date.now() / 1000);
    
    // 插入房间数据
    const room = await Room.create({
      id: roomId,
      name,
      creator_id: creatorId,
      status: 'waiting',
      max_players: maxPlayers,
      created_at: createdAt
    });
    
    // 创建玩家记录
    await Player.create({
      user_id: creatorId,
      room_id: roomId,
      is_ready: false,
      joined_at: createdAt
    });
    
    return {
      roomId,
      name,
      creatorId,
      status: 'waiting',
      maxPlayers,
      createdAt
    };
  }
  
  // 获取房间列表
  async getRooms(status, limit, offset) {
    let query = 'SELECT r.*, COUNT(p.user_id) as currentPlayers FROM rooms r LEFT JOIN players p ON r.id = p.room_id WHERE 1=1';
    const params = [];
    
    if (status) {
      query += ' AND r.status = ?';
      params.push(status);
    }
    
    query += ' GROUP BY r.id ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const rooms = await db.prepare(query).all(...params);
    
    // 获取总数
    let countQuery = 'SELECT COUNT(DISTINCT id) as total FROM rooms WHERE 1=1';
    const countParams = [];
    
    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }
    
    const countResult = await db.prepare(countQuery).get(...countParams);
    const total = countResult.total;
    
    return {
      rooms,
      total,
      limit,
      offset
    };
  }
  
  // 加入房间
  async joinRoom(roomId, userId) {
    // 检查房间是否存在
    const room = await Room.findById(roomId);
    if (!room) {
      throw new Error('房间不存在');
    }
    
    // 检查房间状态
    if (room.status !== 'waiting') {
      throw new Error('游戏已经开始，无法加入');
    }
    
    // 检查是否已在房间中
    const existingPlayer = await Player.findByUserIdAndRoomId(userId, roomId);
    if (existingPlayer) {
      throw new Error('您已经在这个房间中');
    }
    
    // 检查房间人数
    const currentPlayers = await Player.countByRoomId(roomId);
    if (currentPlayers >= room.max_players) {
      throw new Error('房间已满');
    }
    
    // 添加玩家
    const joinedAt = Math.floor(Date.now() / 1000);
    await Player.create({
      user_id: userId,
      room_id: roomId,
      is_ready: false,
      joined_at: joinedAt
    });
    
    return {
      roomId,
      userId,
      status: 'joined',
      message: '成功加入房间'
    };
  }
  
  // 离开房间
  async leaveRoom(roomId, userId) {
    // 检查玩家是否在房间中
    const player = await Player.findByUserIdAndRoomId(userId, roomId);
    if (!player) {
      throw new Error('您不在这个房间中');
    }
    
    // 删除玩家记录
    await Player.deleteByUserIdAndRoomId(userId, roomId);
    
    // 如果是房主离开，解散房间
    const room = await Room.findById(roomId);
    if (room && room.creator_id === userId) {
      await Room.delete(roomId);
      return {
        roomId,
        userId,
        status: 'room_disbanded',
        message: '房主已离开，房间已解散'
      };
    }
    
    return {
      roomId,
      userId,
      status: 'left',
      message: '成功离开房间'
    };
  }
  
  // 获取房间详情
  async getRoomById(roomId) {
    // 获取房间基本信息
    const room = await Room.findById(roomId);
    if (!room) {
      return null;
    }
    
    // 获取房间玩家列表
    const players = await Player.findByRoomId(roomId);
    
    // 获取当前玩家数量
    const currentPlayers = players.length;
    
    return {
      roomId: room.id,
      name: room.name,
      creatorId: room.creator_id,
      status: room.status,
      maxPlayers: room.max_players,
      currentPlayers,
      players: players.map(p => ({
        userId: p.user_id,
        username: p.username || `玩家${p.id}`,
        isReady: p.is_ready,
        joinedAt: p.joined_at
      })),
      createdAt: room.created_at,
      updatedAt: room.updated_at
    };
  }
  
  // 更新房间状态
  async updateRoomStatus(roomId, status) {
    await Room.updateStatus(roomId, status);
  }
  
  // 设置玩家准备状态
  async setPlayerReady(roomId, userId, isReady) {
    await Player.updateReadyStatus(roomId, userId, isReady);
  }
}

module.exports = new RoomService();
```