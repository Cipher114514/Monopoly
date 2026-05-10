const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

// 导入路由
const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/rooms');
const gameRoutes = require('./routes/game');

// 导入中间件
const { authenticateToken } = require('./middleware/auth');

// 导入Socket处理器
const socketHandler = require('./socket/handler');

// 导入数据库连接
const { db } = require('./db/connection');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/game', authenticateToken, gameRoutes);

// 健康检查端点
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Socket.io连接处理
io.on('connection', (socket) => {
    console.log('用户连接:', socket.id);
    
    // 设置Socket处理器
    socketHandler(socket, io);
    
    // 断开连接处理
    socket.on('disconnect', () => {
        console.log('用户断开连接:', socket.id);
    });
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        code: 500, 
        message: '服务器内部错误' 
    });
});

// 404处理
app.use((req, res) => {
    res.status(404).json({ 
        code: 404, 
        message: '请求的资源不存在' 
    });
});

const PORT = process.env.PORT || 3001;

// 启动服务器
server.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
    
    // 测试数据库连接
    db.get('SELECT 1 as test', [], (err, row) => {
        if (err) {
            console.error('数据库连接失败:', err.message);
        } else {
            console.log('数据库连接成功');
        }
    });
});

module.exports = { app, server, io };