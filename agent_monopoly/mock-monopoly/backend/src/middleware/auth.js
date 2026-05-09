const jwt = require('jsonwebtoken');
const { db } = require('../db/connection');
const User = require('../models/User');

// JWT认证中间件
const authMiddleware = (req, res, next) => {
  try {
    // 获取Authorization头
    const authHeader = req.headers.authorization;
    
    // 检查是否存在Authorization头
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        code: 401,
        message: '认证失败',
        errors: ['未提供认证令牌']
      });
    }

    // 提取token
    const token = authHeader.split(' ')[1];

    // 验证token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // 将用户信息添加到请求对象
    req.user = decoded;
    
    // 继续处理请求
    next();
  } catch (error) {
    // token无效或过期
    return res.status(401).json({
      code: 401,
      message: '认证失败',
      errors: ['无效的认证令牌或令牌已过期']
    });
  }
};

// 可选的JWT认证中间件（不要求用户必须登录）
const optionalAuthMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      req.user = decoded;
    }
    
    next();
  } catch (error) {
    // 如果token无效，继续处理但不设置用户信息
    next();
  }
};

// 检查用户是否为房主的中间件
const isRoomOwnerMiddleware = async (req, res, next) => {
  try {
    // 确保已经通过JWT认证
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        code: 401,
        message: '认证失败',
        errors: ['未提供认证令牌']
      });
    }

    const { roomId } = req.params;
    const userId = req.user.userId;

    // 检查房间是否存在以及用户是否是房主
    const room = await db.get(
      'SELECT owner_id FROM rooms WHERE id = ?',
      [roomId]
    );

    if (!room) {
      return res.status(404).json({
        code: 404,
        message: '房间不存在',
        errors: ['找不到指定的房间']
      });
    }

    if (room.owner_id !== userId) {
      return res.status(403).json({
        code: 403,
        message: '权限不足',
        errors: ['只有房主才能执行此操作']
      });
    }

    next();
  } catch (error) {
    console.error('权限检查错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      errors: [error.message]
    });
  }
};

module.exports = {
  authMiddleware,
  optionalAuthMiddleware,
  isRoomOwnerMiddleware
};
```