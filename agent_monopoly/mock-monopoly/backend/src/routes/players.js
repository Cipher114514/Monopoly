const express = require('express');
const router = express.Router();
const { db } = require('../db/connection');
const authMiddleware = require('../middleware/auth');

// 获取指定玩家的状态信息
router.get('/:playerId', authMiddleware, async (req, res) => {
  try {
    const playerId = req.params.playerId;
    const userId = req.user.id; // 从认证中间件获取用户ID
    
    // 验证玩家ID是否存在且属于当前用户
    const playerQuery = `
      SELECT p.*, u.username 
      FROM players p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ? AND p.user_id = ?
    `;
    
    const player = db.prepare(playerQuery).get(playerId, userId);
    
    if (!player) {
      return res.status(404).json({
        code: 404,
        message: '玩家不存在或无权访问'
      });
    }
    
    // 获取玩家拥有的地产
    const propertiesQuery = `
      SELECT id FROM properties WHERE owner_id = ?
    `;
    const properties = db.prepare(propertiesQuery).all(playerId);
    
    // 构建响应数据
    const playerData = {
      id: player.id,
      user_id: player.user_id,
      username: player.username,
      room_id: player.room_id,
      position: player.position,
      money: player.money,
      properties: properties.map(p => p.id),
      in_game: player.in_game,
      is_ready: player.is_ready,
      created_at: player.created_at,
      updated_at: player.updated_at
    };
    
    res.json({
      code: 200,
      data: playerData
    });
  } catch (error) {
    console.error('获取玩家信息错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
});

// 获取指定房间内所有玩家的状态
router.get('/rooms/:roomId/players', authMiddleware, async (req, res) => {
  try {
    const roomId = req.params.roomId;
    const userId = req.user.id;
    
    // 验证用户是否在该房间中
    const roomQuery = `
      SELECT r.id 
      FROM rooms r
      JOIN players p ON r.id = p.room_id
      WHERE r.id = ? AND p.user_id = ?
    `;
    
    const room = db.prepare(roomQuery).get(roomId, userId);
    
    if (!room) {
      return res.status(403).json({
        code: 403,
        message: '无权访问该房间'
      });
    }
    
    // 获取房间内所有玩家信息
    const playersQuery = `
      SELECT p.*, u.username 
      FROM players p
      JOIN users u ON p.user_id = u.id
      WHERE p.room_id = ?
      ORDER BY p.created_at
    `;
    
    const players = db.prepare(playersQuery).all(roomId);
    
    // 构建响应数据
    const playersData = players.map(player => ({
      id: player.id,
      user_id: player.user_id,
      username: player.username,
      position: player.position,
      money: player.money,
      properties: [], // 这里可以扩展获取地产详情
      in_game: player.in_game,
      is_ready: player.is_ready
    }));
    
    res.json({
      code: 200,
      data: {
        roomId: roomId,
        players: playersData
      }
    });
  } catch (error) {
    console.error('获取房间玩家信息错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
});

module.exports = router;
```