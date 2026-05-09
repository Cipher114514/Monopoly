const rateLimit = require('express-rate-limit');

// 全局速率限制
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制每个IP每15分钟最多100次请求
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    code: 429,
    message: '请求过于频繁',
    errors: ['您的请求过于频繁，请稍后再试']
  }
});

// 登录端点特殊限制
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5, // 限制每个IP每15分钟最多5次登录尝试
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    code: 429,
    message: '登录尝试过于频繁',
    errors: ['您的登录尝试过于频繁，请15分钟后再试']
  }
});

// 注册端点限制
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 3, // 限制每个IP每15分钟最多3次注册尝试
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    code: 429,
    message: '注册尝试过于频繁',
    errors: ['您的注册尝试过于频繁，请15分钟后再试']
  }
});

module.exports = {
  global: globalLimiter,
  login: loginLimiter,
  register: registerLimiter
};
```