const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

// 导入数据库连接
const { db, initializeDatabase } = require('./db/connection');

// 导入中间件
const authMiddleware = require('./middleware/auth');

// 导入路由
const authRoutes = require('./routes/users');
const roomRoutes = require('./routes/rooms');
const playerRoutes = require('./routes/players');
const propertyRoutes = require('./routes/properties');
const cardRoutes = require('./routes/cards');

// 导入Socket处理器
const socketHandler = require('./socket/handler');

// 创建Express应用
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// 中间件配置
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../frontend/dist')));

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/cards', cardRoutes);

// 健康检查端点
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Socket.io连接处理
io.on('connection', (socket) => {
  console.log('用户连接:', socket.id);
  
  // 使用统一的Socket处理器
  socketHandler(socket, io);
  
  socket.on('disconnect', () => {
    console.log('用户断开连接:', socket.id);
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误' });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({ error: '请求的资源不存在' });
});

// 初始化数据库并启动服务器
const PORT = process.env.PORT || 3001;

const startServer = async () => {
  try {
    // 初始化数据库
    await initializeDatabase();
    console.log('数据库初始化成功');
    
    // 启动服务器
    server.listen(PORT, () => {
      console.log(`服务器运行在端口 ${PORT}`);
      console.log(`Socket.io 服务器已启动`);
    });
  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
};

startServer();

module.exports = { app, server, io };
```