const express = require('express');
const router = express.Router();
const roomService = require('../services/roomService');
const authMiddleware = require('../middleware/auth');

// 创建房间
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const { name, max_players = 6 } = req.body;
    const userId = req.user.id;
    
    if (!name) {
      return res.status(400).json({
        code: 400,
        message: '房间名称不能为空'
      });
    }
    
    if (max_players < 2 || max_players > 6) {
      return res.status(400).json({
        code: 400,
        message: '最大玩家数必须在2-6之间'
      });
    }
    
    const room = await roomService.createRoom(name, userId, max_players);
    
    res.json({
      code: 200,
      data: room
    });
  } catch (error) {
    console.error('创建房间失败:', error);
    res.status(500).json({
      code: 500,
      message: '创建房间失败'
    });
  }
});

// 获取房间列表
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, limit = 10, offset = 0 } = req.query;
    
    const result = await roomService.getRooms(status, parseInt(limit), parseInt(offset));
    
    res.json({
      code: 200,
      data: result
    });
  } catch (error) {
    console.error('获取房间列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取房间列表失败'
    });
  }
});

// 加入房间
router.post('/join', authMiddleware, async (req, res) => {
  try {
    const { room_id } = req.body;
    const userId = req.user.id;
    
    if (!room_id) {
      return res.status(400).json({
        code: 400,
        message: '房间ID不能为空'
      });
    }
    
    const result = await roomService.joinRoom(room_id, userId);
    
    res.json({
      code: 200,
      data: result
    });
  } catch (error) {
    console.error('加入房间失败:', error);
    res.status(500).json({
      code: 500,
      message: '加入房间失败'
    });
  }
});

// 离开房间
router.post('/leave', authMiddleware, async (req, res) => {
  try {
    const { room_id } = req.body;
    const userId = req.user.id;
    
    if (!room_id) {
      return res.status(400).json({
        code: 400,
        message: '房间ID不能为空'
      });
    }
    
    const result = await roomService.leaveRoom(room_id, userId);
    
    res.json({
      code: 200,
      data: result
    });
  } catch (error) {
    console.error('离开房间失败:', error);
    res.status(500).json({
      code: 500,
      message: '离开房间失败'
    });
  }
});

// 获取房间详情
router.get('/:roomId', authMiddleware, async (req, res) => {
  try {
    const { roomId } = req.params;
    
    const room = await roomService.getRoomById(roomId);
    
    if (!room) {
      return res.status(404).json({
        code: 404,
        message: '房间不存在'
      });
    }
    
    res.json({
      code: 200,
      data: room
    });
  } catch (error) {
    console.error('获取房间详情失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取房间详情失败'
    });
  }
});

module.exports = router;
```

```