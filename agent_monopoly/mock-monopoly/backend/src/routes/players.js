const express = require('express');
const router = express.Router();
const { db } = require('../db/connection');
const authMiddleware = require('../middleware/auth');
const Player = require('../models/Player');

// 获取指定玩家的状态信息
router.get('/:playerId', authMiddleware, async (req, res) => {
  try {
    const playerId = req.params.playerId;
    
    // 验证玩家ID格式
    if (!playerId) {
      return res.status(400).json({
        code: 400,
        message: '玩家ID不能为空'
      });
    }
    
    // 从数据库获取玩家信息
    const player = await Player.findById(playerId);
    
    if (!player) {
      return res.status(404).json({
        code: 404,
        message: '玩家不存在'
      });
    }
    
    // 获取玩家拥有的地产
    const propertiesQuery = `
      SELECT p.* FROM properties p 
      WHERE p.owner_id = ?
    `;
    const properties = await db.prepare(propertiesQuery).all(playerId);
    
    // 构建响应数据
    const playerData = {
      id: player.id,
      user_id: player.user_id,
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
    console.error('获取玩家信息失败:', error);
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
    
    // 验证房间ID格式
    if (!roomId) {
      return res.status(400).json({
        code: 400,
        message: '房间ID不能为空'
      });
    }
    
    // 检查房间是否存在
    const roomQuery = 'SELECT id FROM rooms WHERE id = ?';
    const room = await db.prepare(roomQuery).get(roomId);
    
    if (!room) {
      return res.status(404).json({
        code: 404,
        message: '房间不存在'
      });
    }
    
    // 获取房间内所有玩家
    const playersQuery = `
      SELECT p.*, u.username 
      FROM players p 
      JOIN users u ON p.user_id = u.id 
      WHERE p.room_id = ?
    `;
    const players = await db.prepare(playersQuery).all(roomId);
    
    // 为每个玩家获取其拥有的地产
    const playersWithProperties = await Promise.all(players.map(async (player) => {
      const propertiesQuery = `
        SELECT p.id FROM properties p 
        WHERE p.owner_id = ?
      `;
      const properties = await db.prepare(propertiesQuery).all(player.id);
      
      return {
        id: player.id,
        user_id: player.user_id,
        username: player.username,
        position: player.position,
        money: player.money,
        properties: properties.map(p => p.id),
        in_game: player.in_game,
        is_ready: player.is_ready
      };
    }));
    
    res.json({
      code: 200,
      data: {
        roomId: roomId,
        players: playersWithProperties
      }
    });
  } catch (error) {
    console.error('获取房间玩家列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
});

module.exports = router;
```