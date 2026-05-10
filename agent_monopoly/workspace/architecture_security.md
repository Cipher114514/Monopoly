# 在线大富翁游戏 - 安全与性能方案

## 1. 安全措施

### 1.1 用户认证（JWT）

**JWT实现方案**：
- 使用 `jsonwebtoken` 库生成和验证JWT
- JWT包含：`userId`、`username`、`exp`（过期时间）
- 默认过期时间：24小时
- 使用环境变量存储JWT密钥

**JWT中间件实现**：
```javascript
const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ code: 401, message: '未提供访问令牌' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ code: 403, message: '访问令牌无效' });
    }
    req.user = user;
    next();
  });
};
```

**路由保护**：
```javascript
// 需要认证的路由
router.post('/rooms', authenticateToken, createRoom);
router.post('/join-room', authenticateToken, joinRoom);
```

### 1.2 密码加密

**bcrypt实现方案**：
- 使用 `bcrypt` 库进行密码哈希
- 加密轮数：12轮（平衡安全性和性能）
- 密码验证时使用 `bcrypt.compare`

**密码处理实现**：
```javascript
const bcrypt = require('bcrypt');

// 注册时密码加密
const hashedPassword = await bcrypt.hash(password, 12);

// 登录时密码验证
const isValidPassword = await bcrypt.compare(password, user.password_hash);
```

### 1.3 输入验证

**验证方案**：
- 使用 `express-validator` 进行输入验证
- 对所有用户输入进行严格验证
- 使用白名单模式，拒绝未预期的输入

**验证中间件**：
```javascript
const { body, validationResult } = require('express-validator');

const validateUserInput = [
  body('username')
    .isLength({ min: 3, max: 20 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('用户名必须是3-20个字母、数字或下划线'),
    
  body('password')
    .isLength({ min: 6 })
    .withMessage('密码至少需要6个字符'),
    
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        code: 400, 
        message: '输入验证失败',
        errors: errors.array()
      });
    }
    next();
  }
];
```

### 1.4 Rate Limiting

**限流方案**：
- 使用 `express-rate-limit` 实现API限流
- 登录接口：5次/分钟
- 其他接口：100次/分钟
- Socket.io连接：30次/分钟

**限流配置**：
```javascript
const rateLimit = require('express-rate-limit');

// 登录限流
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5, // 限制5次请求
  message: { code: 429, message: '登录尝试过于频繁，请稍后再试' }
});

// API限流
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1分钟
  max: 100, // 限制100次请求
  message: { code: 429, message: '请求过于频繁，请稍后再试' }
});
```

### 1.5 SQL注入防护

**防护措施**：
- 使用参数化查询（`?`占位符）
- 禁止直接拼接SQL语句
- 使用 `sqlite3` 库的参数化查询

**安全查询示例**：
```javascript
// ❌ 危险：SQL注入
const sql = `SELECT * FROM users WHERE username = '${username}'`;

// ✅ 安全：参数化查询
const sql = 'SELECT * FROM users WHERE username = ?';
db.get(sql, [username], (err, row) => {
  // 处理结果
});
```

### 1.6 XSS防护

**防护措施**：
- 使用 `helmet` 设置安全HTTP头
- 对用户输出进行HTML转义
- 使用 `dompurify` 清理用户输入

**安全配置**：
```javascript
const helmet = require('helmet');
const DOMPurify = require('dompurify');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"]
    }
  }
}));

// 输出净化
const cleanOutput = (input) => {
  return DOMPurify.sanitize(input);
};
```

## 2. 性能优化

### 2.1 数据库查询优化

**优化策略**：
- 创建适当的索引
- 避免N+1查询问题
- 使用批量操作
- 优化JOIN查询

**索引优化**：
```sql
-- 用户表索引
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);

-- 房间表索引
CREATE INDEX idx_rooms_creator ON rooms(creator_id);
CREATE INDEX idx_rooms_status ON rooms(status);

-- 玩家表索引
CREATE INDEX idx_players_user ON players(user_id);
CREATE INDEX idx_players_room ON players(room_id);
CREATE INDEX idx_players_room_status ON players(room_id, is_ready);
```

**查询优化示例**：
```javascript
// ❌ 低效：N+1查询
async function getRoomsWithPlayers() {
  const rooms = await db.all('SELECT * FROM rooms');
  for (const room of rooms) {
    room.players = await db.all('SELECT * FROM players WHERE room_id = ?', [room.id]);
  }
  return rooms;
}

// ✅ 高效：批量查询
async function getRoomsWithPlayers() {
  const rooms = await db.all('SELECT * FROM rooms');
  const roomIds = rooms.map(r => r.id);
  const players = await db.all('SELECT * FROM players WHERE room_id IN (' + roomIds.join(',') + ')');
  
  // 构建映射关系
  const playersByRoomId = {};
  players.forEach(p => {
    if (!playersByRoomId[p.room_id]) playersByRoomId[p.room_id] = [];
    playersByRoomId[p.room_id].push(p);
  });
  
  // 关联玩家到房间
  return rooms.map(room => ({
    ...room,
    players: playersByRoomId[room.id] || []
  }));
}
```

### 2.2 缓存策略

**缓存方案**：
- 使用内存缓存（Redis或Node.js内置Map）
- 缓存热点数据：用户信息、房间列表
- 设置合理的缓存过期时间

**缓存实现**：
```javascript
const NodeCache = require('node-cache');

const cache = new NodeCache({
  stdTTL: 300, // 5分钟过期
  checkperiod: 600, // 10分钟检查一次
  useClones: false // 禁用克隆以提高性能
});

// 缓存房间列表
async function getCachedRooms() {
  let rooms = cache.get('rooms');
  if (!rooms) {
    rooms = await db.all('SELECT * FROM rooms WHERE status = "waiting"');
    cache.set('rooms', rooms);
  }
  return rooms;
}

// 清除缓存
function clearRoomCache(roomId) {
  cache.del('rooms');
  cache.del(`room_${roomId}`);
}
```

### 2.3 连接池管理

**连接池配置**：
- SQLite连接池：保持10个连接
- Socket.io连接管理：限制最大连接数
- 数据库连接复用

**连接池实现**：
```javascript
const sqlite3 = require('sqlite3');
const { promisify } = require('util');

// 创建连接池
const dbPool = new sqlite3.Database('./monopoly.db', sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error('数据库连接失败:', err);
  }
});

// 将回调API转换为Promise
dbPool.get = promisify(dbPool.get);
dbPool.all = promisify(dbPool.all);
dbPool.run = promisify(dbPool.run);

// Socket.io连接限制
const io = require('socket.io')(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  },
  maxHttpSocket: 1000 // 最大HTTP连接数
});
```

## 3. 其他考虑

### 3.1 错误处理

**错误处理策略**：
- 统一错误处理中间件
- 区分业务错误和系统错误
- 记录错误日志
- 返回友好的错误信息

**错误处理实现**：
```javascript
// 统一错误处理
const errorHandler = (err, req, res, next) => {
  console.error('错误:', err);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      code: 400,
      message: '输入验证失败',
      errors: err.details
    });
  }
  
  if (err.code === 'SQLITE_CONSTRAINT') {
    return res.status(409).json({
      code: 409,
      message: '数据冲突'
    });
  }
  
  // 系统错误
  res.status(500).json({
    code: 500,
    message: '服务器内部错误'
  });
};

// 业务错误类
class GameError extends Error {
  constructor(message, code = 400) {
    super(message);
    this.code = code;
  }
}

// 使用示例
async function buyProperty(playerId, propertyId) {
  const player = await Player.findById(playerId);
  if (!player || player.money < property.price) {
    throw new GameError('资金不足', 400);
  }
  // 继续逻辑...
}
```

### 3.2 日志记录

**日志方案**：
- 使用 `winston` 进行日志记录
- 分级日志：error、warn、info、debug
- 记录关键操作和错误
- 日志轮转和归档

**日志配置**：
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// 记录游戏事件
function logGameEvent(eventType, data) {
  logger.info('游戏事件', {
    type: eventType,
    data: data,
    timestamp: new Date().toISOString()
  });
}

// 记录用户操作
function logUserAction(userId, action, details) {
  logger.info('用户操作', {
    userId: userId,
    action: action,
    details: details,
    timestamp: new Date().toISOString()
  });
}
```

### 3.3 部署建议

**部署方案**：
- 使用Docker容器化部署
- Nginx作为反向代理
- PM2进程管理
- 环境变量配置

**Docker配置**：
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["pm2-runtime", "start", "ecosystem.config.js"]
```

**Nginx配置**：
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**PM2配置**：
```json
{
  "apps": [{
    "name": "monopoly-server",
    "script": "server.js",
    "instances": "max",
    "exec_mode": "cluster",
    "env": {
      "NODE_ENV": "production",
      "PORT": 3000
    }
  }]
}
```

**环境变量配置**：
```bash
# .env
NODE_ENV=production
PORT=3000
JWT_SECRET=your-super-secret-jwt-key
DB_PATH=./data/monopoly.db
FRONTEND_URL=https://your-frontend-domain.com
LOG_LEVEL=info
```

## 4. 监控与维护

### 4.1 性能监控

**监控方案**：
- 使用 `express-prometheus-middleware` 收集指标
- 监控API响应时间、错误率
- 监控数据库查询性能
- 监控内存和CPU使用情况

**监控实现**：
```javascript
const promBundle = require('express-prometheus-bundle');

app.use(promBundle({
  includeMethod: true,
  includePath: true,
  promClient: {
    collectDefaultMetrics: {
      timeout: 5000
    }
  }
}));
```

### 4.2 健康检查

**健康检查端点**：
```javascript
app.get('/health', (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: 'connected' // 可以添加数据库连接检查
  };
  
  res.json(health);
});
```

### 4.3 备份策略

**数据备份**：
- 定期备份SQLite数据库
- 备份频率：每天一次
- 保留最近7天的备份
- 自动化备份脚本

**备份脚本**：
```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"
DB_FILE="./data/monopoly.db"

mkdir -p $BACKUP_DIR

cp $DB_FILE "$BACKUP_DIR/monopoly_$DATE.db"

# 删除7天前的备份
find $BACKUP_DIR -name "monopoly_*.db" -mtime +7 -delete

echo "数据库备份完成: $BACKUP_DIR/monopoly_$DATE.db"
```

## 5. 安全最佳实践总结

### 5.1 安全检查清单
- [ ] 所有用户输入都经过验证
- [ ] 所有数据库查询都使用参数化
- [ ] 敏感数据（密码）使用bcrypt加密
- [ ] 所有API都经过认证（JWT）
- [ ] 实现了适当的速率限制
- [ ] 设置了安全HTTP头（helmet）
- [ ] 输出经过HTML转义
- [ ] 错误信息不泄露敏感信息

### 5.2 性能优化清单
- [ ] 创建了适当的数据库索引
- [ ] 避免了N+1查询问题
- [ ] 实现了热点数据缓存
- [ ] 使用了连接池
- [ ] 实现了错误处理和日志记录
- [ ] 配置了进程管理（PM2）
- [ ] 设置了性能监控

通过实施以上安全与性能方案，可以确保在线大富翁游戏的安全性、稳定性和良好的用户体验。