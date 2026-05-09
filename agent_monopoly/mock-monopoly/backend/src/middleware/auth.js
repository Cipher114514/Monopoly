const jwt = require('jsonwebtoken');

// JWT认证中间件
const authMiddleware = (req, res, next) => {
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

  // 提取令牌
  const token = authHeader.split(' ')[1];

  try {
    // 验证令牌
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // 将用户信息添加到请求对象
    req.user = decoded;
    
    // 继续处理请求
    next();
  } catch (error) {
    // 令牌无效或已过期
    return res.status(401).json({
      code: 401,
      message: '认证失败',
      errors: ['无效的认证令牌或令牌已过期']
    });
  }
};

// 可选的认证中间件（允许未认证的访问）
const optionalAuthMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // 没有提供令牌，继续处理请求但不添加用户信息
    return next();
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    // 令牌无效，继续处理请求但不添加用户信息
    next();
  }
};

module.exports = authMiddleware;
module.exports.optionalAuth = optionalAuthMiddleware;
```

```