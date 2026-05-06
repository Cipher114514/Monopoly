const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
// 中间件
app.use(cors());
app.use(express.json());
// 路由
const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/rooms');
const gameRoutes = require('./routes/games');
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/rooms', roomRoutes);
app.use('/api/v1/games', gameRoutes);
io.on('connection', (socket) => {
  console.log('用户连接:', socket.id);
  socket.on('disconnect', () => console.log('用户断开'));
});
server.listen(3002, () => console.log('服务器运行在端口3002'));