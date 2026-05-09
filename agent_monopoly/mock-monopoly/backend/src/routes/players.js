const express = require('express');
const router = express.Router();
const db = require('../database');
const auth = require('../middleware/auth');

// 获取指定玩家的状态信息
router.get('/:playerId', auth, async (req, res) => {
  try {
    const playerId = req.params.playerId;
    const userId = req.user.id;
    
    // 查询玩家信息
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
        message: 'Player not found'
      });
    }
    
    // 查询玩家拥有的地产
    const propertiesQuery = `
      SELECT property_id 
      FROM player_properties 
      WHERE player_id = ?
    `;
    
    const properties = db.prepare(propertiesQuery).all(playerId);
    
    // 格式化响应数据
    const playerData = {
      id: player.id,
      user_id: player.user_id,
      username: player.username,
      room_id: player.room_id,
      position: player.position,
      money: player.money,
      properties: properties.map(p => p.property_id),
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
    console.error('Error fetching player:', error);
    res.status(500).json({
      code: 500,
      message: 'Internal server error'
    });
  }
});

// 获取指定房间内所有玩家的状态
router.get('/rooms/:roomId/players', auth, async (req, res) => {
  try {
    const roomId = req.params.roomId;
    const userId = req.user.id;
    
    // 验证用户是否有权限访问该房间
    const roomQuery = `
      SELECT id 
      FROM rooms 
      WHERE id = ? AND (creator_id = ? OR id IN (
        SELECT room_id FROM room_players WHERE user_id = ?
      ))
    `;
    
    const room = db.prepare(roomQuery).get(roomId, userId, userId);
    
    if (!room) {
      return res.status(403).json({
        code: 403,
        message: 'Access denied to this room'
      });
    }
    
    // 查询房间内所有玩家
    const playersQuery = `
      SELECT p.*, u.username 
      FROM players p 
      JOIN users u ON p.user_id = u.id 
      WHERE p.room_id = ? AND p.in_game = true
    `;
    
    const players = db.prepare(playersQuery).all(roomId);
    
    // 格式化响应数据
    const playersData = players.map(player => {
      // 查询每个玩家的地产
      const propertiesQuery = `
        SELECT property_id 
        FROM player_properties 
        WHERE player_id = ?
      `;
      
      const properties = db.prepare(propertiesQuery).all(player.id);
      
      return {
        id: player.id,
        user_id: player.user_id,
        username: player.username,
        position: player.position,
        money: player.money,
        properties: properties.map(p => p.property_id),
        in_game: player.in_game,
        is_ready: player.is_ready
      };
    });
    
    res.json({
      code: 200,
      data: {
        roomId: roomId,
        players: playersData
      }
    });
  } catch (error) {
    console.error('Error fetching room players:', error);
    res.status(500).json({
      code: 500,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
```