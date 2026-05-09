const jwt = require('jsonwebtoken');
const { db } = require('../db/connection');

// JWT认证中间件
const authMiddleware = (req, res, next) => {
  // 从请求头获取token
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      code: 401,
      message: '认证失败',
      errors: ['未提供认证令牌']
    });
  }

  // 提取token
  const token = authHeader.split(' ')[1];

  try {
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

// 可选：检查用户是否存在的中间件
const checkUserExists = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    
    // 检查用户是否存在
    const user = await db.get('SELECT id FROM users WHERE id = ?', [userId]);
    
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在',
        errors: ['找不到指定的用户']
      });
    }
    
    next();
  } catch (error) {
    console.error('检查用户存在性错误:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      errors: ['验证用户存在性时发生错误']
    });
  }
};

module.exports = authMiddleware;
module.exports.checkUserExists = checkUserExists;
```