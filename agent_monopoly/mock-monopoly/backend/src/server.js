const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/rooms');
const gameRoutes = require('./routes/game');

// Import middleware
const authMiddleware = require('./middleware/auth');

// Import socket handlers
const roomHandlers = require('./socketHandlers/roomHandlers');
const gameHandlers = require('./socketHandlers/gameHandlers');
const propertyHandlers = require('./socketHandlers/propertyHandlers');
const cardHandlers = require('./socketHandlers/cardHandlers');

// Import database connection
const { connectDatabase } = require('./database');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Connect to database
connectDatabase();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomMiddleware, roomRoutes);
app.use('/api/game', authMiddleware, gameRoutes);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Room handlers
  socket.on('createRoom', (data) => roomHandlers.createRoom(socket, data, io));
  socket.on('joinRoom', (data) => roomHandlers.joinRoom(socket, data, io));
  socket.on('leaveRoom', (data) => roomHandlers.leaveRoom(socket, data, io));
  socket.on('toggleReady', (data) => roomHandlers.toggleReady(socket, data, io));
  socket.on('startGame', (data) => roomHandlers.startGame(socket, data, io));

  // Game handlers
  socket.on('rollDice', (data) => gameHandlers.rollDice(socket, data, io));
  socket.on('movePlayer', (data) => gameHandlers.movePlayer(socket, data, io));
  socket.on('endTurn', (data) => gameHandlers.endTurn(socket, data, io));

  // Property handlers
  socket.on('buyProperty', (data) => propertyHandlers.buyProperty(socket, data, io));
  socket.on('payRent', (data) => propertyHandlers.payRent(socket, data, io));
  socket.on('buildHouse', (data) => propertyHandlers.buildHouse(socket, data, io));

  // Card handlers
  socket.on('drawCard', (data) => cardHandlers.drawCard(socket, data, io));
  socket.on('executeCardEffect', (data) => cardHandlers.executeCardEffect(socket, data, io));

  // Disconnect handler
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    // Handle player leaving game/room on disconnect
    roomHandlers.handleDisconnect(socket, io);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```