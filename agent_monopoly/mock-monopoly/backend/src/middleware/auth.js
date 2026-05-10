const jwt = require('jsonwebtoken');
const { db } = require('../db/connection');

// JWT配置
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * 生成JWT令牌
 * @param {Object} user - 用户对象
 * @returns {string} JWT令牌
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      username: user.username
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

/**
 * 验证JWT令牌的中间件
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      code: 401,
      message: '未提供访问令牌'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({
        code: 403,
        message: '令牌无效或已过期'
      });
    }

    // 将解码后的用户信息添加到请求对象
    req.user = decoded;
    next();
  });
};

/**
 * 检查用户是否为房主的中间件
 */
const isRoomOwner = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.userId;

    // 查询房间信息
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        code: 404,
        message: '房间不存在'
      });
    }

    // 检查用户是否为房主
    if (room.creator_id !== userId) {
      return res.status(403).json({
        code: 403,
        message: '只有房主才能执行此操作'
      });
    }

    next();
  } catch (error) {
    console.error('房主验证错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

/**
 * 检查玩家是否在房间中的中间件
 */
const isPlayerInRoom = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.userId;

    // 查询玩家信息
    const player = await Player.findByUserIdAndRoom(userId, roomId);
    if (!player) {
      return res.status(403).json({
        code: 403,
        message: '您不在此房间中'
      });
    }

    // 将玩家信息添加到请求对象
    req.player = player;
    next();
  } catch (error) {
    console.error('玩家验证错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

/**
 * 检查游戏是否已经开始的中间件
 */
const isGameStarted = async (req, res, next) => {
  try {
    const { roomId } = req.params;

    // 查询房间信息
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        code: 404,
        message: '房间不存在'
      });
    }

    // 检查游戏状态
    if (room.status !== 'playing') {
      return res.status(400).json({
        code: 400,
        message: '游戏尚未开始'
      });
    }

    next();
  } catch (error) {
    console.error('游戏状态验证错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

module.exports = {
  generateToken,
  authenticateToken,
  isRoomOwner,
  isPlayerInRoom,
  isGameStarted
};