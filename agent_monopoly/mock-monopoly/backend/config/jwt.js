const jwt = require('jsonwebtoken');

// JWT配置
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// 生成JWT令牌
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// 验证JWT令牌
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('无效的访问令牌');
  }
};

// JWT中间件 - 验证用户身份
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ 
      code: 401, 
      message: '未提供访问令牌' 
    });
  }
  
  try {
    const decoded = verifyToken(token);
    req.user = decoded; // 将用户信息附加到请求对象
    next();
  } catch (error) {
    return res.status(403).json({ 
      code: 403, 
      message: '访问令牌已过期或无效' 
    });
  }
};

// Socket.io认证中间件
const socketAuth = (socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error('未提供访问令牌'));
  }
  
  try {
    const decoded = verifyToken(token);
    socket.user = decoded; // 将用户信息附加到socket对象
    next();
  } catch (error) {
    next(new Error('无效的访问令牌'));
  }
};

module.exports = {
  generateToken,
  verifyToken,
  authenticateToken,
  socketAuth,
  JWT_SECRET,
  JWT_EXPIRES_IN
};