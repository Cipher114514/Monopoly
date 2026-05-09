const express = require('express');
const router = express.Router();
const roomService = require('../services/roomService');
const authMiddleware = require('../middleware/auth');

// 创建房间
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const { name, max_players } = req.body;
    const userId = req.user.id;
    
    // 验证参数
    if (!name) {
      return res.status(400).json({
        code: 400,
        message: '房间名称不能为空'
      });
    }
    
    // 设置默认最大玩家数为6
    const maxPlayers = max_players || 6;
    if (maxPlayers < 2 || maxPlayers > 6) {
      return res.status(400).json({
        code: 400,
        message: '最大玩家数必须在2-6之间'
      });
    }
    
    const result = await roomService.createRoom({
      name,
      maxPlayers,
      creatorId: userId
    });
    
    res.json({
      code: 200,
      data: result
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
    const { status, limit, offset } = req.query;
    
    // 验证参数
    const validStatuses = ['waiting', 'playing', 'finished'];
    const roomStatus = status && validStatuses.includes(status) ? status : null;
    
    const pageLimit = parseInt(limit) || 10;
    const pageOffset = parseInt(offset) || 0;
    
    if (pageLimit > 50) {
      return res.status(400).json({
        code: 400,
        message: '每页最多返回50条记录'
      });
    }
    
    const result = await roomService.getRooms({
      status: roomStatus,
      limit: pageLimit,
      offset: pageOffset
    });
    
    res.json({
      code: 200,
      data: {
        rooms: result.rooms,
        total: result.total,
        limit: pageLimit,
        offset: pageOffset
      }
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
    
    const result = await roomService.joinRoom({
      roomId: room_id,
      userId
    });
    
    res.json({
      code: 200,
      data: result
    });
  } catch (error) {
    console.error('加入房间失败:', error);
    
    // 根据错误类型返回不同的状态码
    if (error.message === '房间不存在') {
      return res.status(404).json({
        code: 404,
        message: '房间不存在'
      });
    } else if (error.message === '房间已满') {
      return res.status(400).json({
        code: 400,
        message: '房间已满'
      });
    } else if (error.message === '玩家已在房间中') {
      return res.status(400).json({
        code: 400,
        message: '玩家已在房间中'
      });
    } else if (error.message === '游戏已开始') {
      return res.status(400).json({
        code: 400,
        message: '游戏已开始，无法加入'
      });
    }
    
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
    
    const result = await roomService.leaveRoom({
      roomId: room_id,
      userId
    });
    
    res.json({
      code: 200,
      data: result
    });
  } catch (error) {
    console.error('离开房间失败:', error);
    
    // 根据错误类型返回不同的状态码
    if (error.message === '玩家不在房间中') {
      return res.status(400).json({
        code: 400,
        message: '玩家不在房间中'
      });
    }
    
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
    const userId = req.user.id;
    
    if (!roomId) {
      return res.status(400).json({
        code: 400,
        message: '房间ID不能为空'
      });
    }
    
    const result = await roomService.getRoomDetails({
      roomId,
      userId
    });
    
    res.json({
      code: 200,
      data: result
    });
  } catch (error) {
    console.error('获取房间详情失败:', error);
    
    // 根据错误类型返回不同的状态码
    if (error.message === '房间不存在') {
      return res.status(404).json({
        code: 404,
        message: '房间不存在'
      });
    } else if (error.message === '无权限访问房间') {
      return res.status(403).json({
        code: 403,
        message: '无权限访问房间'
      });
    }
    
    res.status(500).json({
      code: 500,
      message: '获取房间详情失败'
    });
  }
});

module.exports = router;
```