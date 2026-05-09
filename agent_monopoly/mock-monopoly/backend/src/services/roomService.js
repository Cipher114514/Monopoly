const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class RoomService {
  // 创建房间
  async createRoom({ name, maxPlayers, creatorId }) {
    // 生成房间ID
    const roomId = uuidv4();
    
    // 插入房间数据
    const insertRoomQuery = `
      INSERT INTO rooms (id, name, creator_id, max_players, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    const now = Math.floor(Date.now() / 1000);
    await db.run(insertRoomQuery, [
      roomId,
      name,
      creatorId,
      maxPlayers,
      'waiting',
      now,
      now
    ]);
    
    // 插入玩家数据
    const insertPlayerQuery = `
      INSERT INTO room_players (room_id, user_id, is_ready, joined_at)
      VALUES (?, ?, ?, ?)
    `;
    
    await db.run(insertPlayerQuery, [
      roomId,
      creatorId,
      false,
      now
    ]);
    
    // 返回创建的房间信息
    return {
      roomId,
      name,
      creatorId,
      status: 'waiting',
      maxPlayers,
      createdAt: now
    };
  }
  
  // 获取房间列表
  async getRooms({ status, limit, offset }) {
    let query = `
      SELECT 
        r.id as roomId,
        r.name,
        r.creator_id as creatorId,
        r.status,
        r.max_players as maxPlayers,
        COUNT(rp.user_id) as currentPlayers,
        r.created_at as createdAt,
        r.updated_at as updatedAt
      FROM rooms r
      LEFT JOIN room_players rp ON r.id = rp.room_id
    `;
    
    const queryParams = [];
    
    // 添加状态过滤
    if (status) {
      query += ' WHERE r.status = ?';
      queryParams.push(status);
    }
    
    // 添加分组
    query += ' GROUP BY r.id, r.name, r.creator_id, r.status, r.max_players, r.created_at, r.updated_at';
    
    // 添加排序
    query += ' ORDER BY r.created_at DESC';
    
    // 添加分页
    query += ' LIMIT ? OFFSET ?';
    queryParams.push(limit, offset);
    
    // 执行查询
    const rooms = await db.all(query, queryParams);
    
    // 获取总数
    let countQuery = `
      SELECT COUNT(DISTINCT r.id) as total
      FROM rooms r
    `;
    
    const countParams = [];
    
    if (status) {
      countQuery += ' WHERE r.status = ?';
      countParams.push(status);
    }
    
    const countResult = await db.get(countQuery, countParams);
    const total = countResult.total;
    
    return {
      rooms,
      total
    };
  }
  
  // 加入房间
  async joinRoom({ roomId, userId }) {
    // 检查房间是否存在
    const roomQuery = `
      SELECT id, status, max_players, creator_id
      FROM rooms
      WHERE id = ?
    `;
    
    const room = await db.get(roomQuery, [roomId]);
    
    if (!room) {
      throw new Error('房间不存在');
    }
    
    // 检查房间状态
    if (room.status !== 'waiting') {
      throw new Error('游戏已开始，无法加入');
    }
    
    // 检查玩家是否已在房间中
    const playerQuery = `
      SELECT user_id
      FROM room_players
      WHERE room_id = ? AND user_id = ?
    `;
    
    const existingPlayer = await db.get(playerQuery, [roomId, userId]);
    
    if (existingPlayer) {
      throw new Error('玩家已在房间中');
    }
    
    // 检查房间是否已满
    const playerCountQuery = `
      SELECT COUNT(*) as count
      FROM room_players
      WHERE room_id = ?
    `;
    
    const playerCountResult = await db.get(playerCountQuery, [roomId]);
    const currentPlayers = playerCountResult.count;
    
    if (currentPlayers >= room.max_players) {
      throw new Error('房间已满');
    }
    
    // 添加玩家到房间
    const insertPlayerQuery = `
      INSERT INTO room_players (room_id, user_id, is_ready, joined_at)
      VALUES (?, ?, ?, ?)
    `;
    
    const now = Math.floor(Date.now() / 1000);
    await db.run(insertPlayerQuery, [roomId, userId, false, now]);
    
    // 更新房间更新时间
    const updateRoomQuery = `
      UPDATE rooms
      SET updated_at = ?
      WHERE id = ?
    `;
    
    await db.run(updateRoomQuery, [now, roomId]);
    
    return {
      roomId,
      userId,
      status: 'joined',
      message: '成功加入房间'
    };
  }
  
  // 离开房间
  async leaveRoom({ roomId, userId }) {
    // 检查玩家是否在房间中
    const playerQuery = `
      SELECT user_id, is_ready
      FROM room_players
      WHERE room_id = ? AND user_id = ?
    `;
    
    const player = await db.get(playerQuery, [roomId, userId]);
    
    if (!player) {
      throw new Error('玩家不在房间中');
    }
    
    // 如果是房主且游戏未开始，解散房间
    const roomQuery = `
      SELECT creator_id, status
      FROM rooms
      WHERE id = ?
    `;
    
    const room = await db.get(roomQuery, [roomId]);
    
    if (room.creator_id === userId && room.status === 'waiting') {
      // 删除房间所有相关数据
      await this.deleteRoom(roomId);
      
      return {
        roomId,
        userId,
        status: 'room_disbanded',
        message: '房间已解散'
      };
    }
    
    // 删除玩家
    const deletePlayerQuery = `
      DELETE FROM room_players
      WHERE room_id = ? AND user_id = ?
    `;
    
    await db.run(deletePlayerQuery, [roomId, userId]);
    
    // 更新房间更新时间
    const updateRoomQuery = `
      UPDATE rooms
      SET updated_at = ?
      WHERE id = ?
    `;
    
    const now = Math.floor(Date.now() / 1000);
    await db.run(updateRoomQuery, [now, roomId]);
    
    return {
      roomId,
      userId,
      status: 'left',
      message: '成功离开房间'
    };
  }
  
  // 获取房间详情
  async getRoomDetails({ roomId, userId }) {
    // 检查房间是否存在
    const roomQuery = `
      SELECT 
        r.id as roomId,
        r.name,
        r.creator_id as creatorId,
        r.status,
        r.max_players as maxPlayers,
        r.created_at as createdAt,
        r.updated_at as updatedAt
      FROM rooms r
      WHERE r.id = ?
    `;
    
    const room = await db.get(roomQuery, [roomId]);
    
    if (!room) {
      throw new Error('房间不存在');
    }
    
    // 检查玩家是否有权限访问房间
    const playerQuery = `
      SELECT user_id
      FROM room_players
      WHERE room_id = ? AND user_id = ?
    `;
    
    const player = await db.get(playerQuery, [roomId, userId]);
    
    if (!player && room.status !== 'waiting') {
      throw new Error('无权限访问房间');
    }
    
    // 获取玩家列表
    const playersQuery = `
      SELECT 
        rp.user_id as userId,
        u.username,
        rp.is_ready as isReady,
        rp.joined_at as joinedAt
      FROM room_players rp
      JOIN users u ON rp.user_id = u.id
      WHERE rp.room_id = ?
      ORDER BY rp.joined_at ASC
    `;
    
    const players = await db.all(playersQuery, [roomId]);
    
    // 获取当前玩家数
    const playerCountQuery = `
      SELECT COUNT(*) as count
      FROM room_players
      WHERE room_id = ?
    `;
    
    const playerCountResult = await db.get(playerCountQuery, [roomId]);
    const currentPlayers = playerCountResult.count;
    
    return {
      ...room,
      currentPlayers,
      players
    };
  }
  
  // 删除房间（房主离开时使用）
  async deleteRoom(roomId) {
    // 删除房间玩家
    await db.run('DELETE FROM room_players WHERE room_id = ?', [roomId]);
    
    // 删除房间
    await db.run('DELETE FROM rooms WHERE id = ?', [roomId]);
  }
}

module.exports = new RoomService();
```