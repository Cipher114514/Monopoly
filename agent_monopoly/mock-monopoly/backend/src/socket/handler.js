const jwt = require('jsonwebtoken');
const { db } = require('../db/connection');
const User = require('../models/User');
const Room = require('../models/Room');
const Player = require('../models/Player');
const Property = require('../models/Property');
const Card = require('../models/Card');
const gameService = require('../services/gameService');
const roomService = require('../services/roomService');

// 验证JWT token的中间件
const authenticateToken = (socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }
  
  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return next(new Error('Authentication error: Invalid token'));
    }
    
    socket.userId = user.id;
    next();
  });
};

// 处理socket连接
const handleConnection = (socket) => {
  console.log(`User ${socket.userId} connected`);
  
  // 处理断开连接
  socket.on('disconnect', () => {
    console.log(`User ${socket.userId} disconnected`);
    
    // 如果用户在房间中，离开房间
    if (socket.currentRoomId) {
      socket.leave(socket.currentRoomId);
      roomService.handlePlayerLeave(socket.currentRoomId, socket.userId);
    }
  });
};

// 处理用户注册
const handleRegister = async (socket, data) => {
  try {
    const { username, password } = data;
    
    // 检查用户名是否已存在
    const existingUser = await User.findByUsername(username);
    if (existingUser) {
      socket.emit('register_error', { message: 'Username already exists' });
      return;
    }
    
    // 创建新用户
    const user = await User.create(username, password);
    
    // 生成JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    socket.emit('register_success', { userId: user.id, token });
  } catch (error) {
    console.error('Registration error:', error);
    socket.emit('register_error', { message: 'Registration failed' });
  }
};

// 处理用户登录
const handleLogin = async (socket, data) => {
  try {
    const { username, password } = data;
    
    // 验证用户
    const user = await User.findByUsername(username);
    if (!user || !user.verifyPassword(password)) {
      socket.emit('login_error', { message: 'Invalid username or password' });
      return;
    }
    
    // 生成JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    socket.emit('login_success', { 
      userId: user.id, 
      token, 
      userInfo: { 
        id: user.id, 
        username: user.username 
      } 
    });
  } catch (error) {
    console.error('Login error:', error);
    socket.emit('login_error', { message: 'Login failed' });
  }
};

// 处理创建房间
const handleCreateRoom = async (socket, data) => {
  try {
    const { roomName } = data;
    
    // 创建新房间
    const room = await roomService.createRoom(roomName, socket.userId);
    
    // 加入房间
    await socket.join(room.id);
    socket.currentRoomId = room.id;
    
    // 发送房间创建成功事件
    socket.emit('room_created', { roomId: room.id, roomInfo: room });
    
    // 更新房间列表
    const rooms = await roomService.getAllRooms();
    socket.emit('room_list_updated', { rooms });
  } catch (error) {
    console.error('Create room error:', error);
    socket.emit('error', { code: 'CREATE_ROOM_ERROR', message: 'Failed to create room' });
  }
};

// 处理加入房间
const handleJoinRoom = async (socket, data) => {
  try {
    const { roomId } = data;
    
    // 验证房间是否存在
    const room = await Room.findById(roomId);
    if (!room) {
      socket.emit('error', { code: 'ROOM_NOT_FOUND', message: 'Room not found' });
      return;
    }
    
    // 检查房间是否已满
    if (room.players.length >= 6) {
      socket.emit('error', { code: 'ROOM_FULL', message: 'Room is full' });
      return;
    }
    
    // 加入房间
    await socket.join(roomId);
    socket.currentRoomId = roomId;
    
    // 添加玩家到房间
    await roomService.addPlayerToRoom(roomId, socket.userId);
    
    // 获取更新后的房间信息
    const updatedRoom = await Room.findById(roomId);
    
    // 发送加入房间成功事件
    socket.emit('room_joined', { roomId, roomInfo: updatedRoom });
    
    // 通知房间内其他玩家
    socket.to(roomId).emit('player_joined', { 
      playerInfo: updatedRoom.players.find(p => p.userId === socket.userId) 
    });
    
    // 更新房间列表
    const rooms = await roomService.getAllRooms();
    socket.emit('room_list_updated', { rooms });
  } catch (error) {
    console.error('Join room error:', error);
    socket.emit('error', { code: 'JOIN_ROOM_ERROR', message: 'Failed to join room' });
  }
};

// 处理离开房间
const handleLeaveRoom = async (socket, data) => {
  try {
    const { roomId } = data;
    
    // 离开房间
    await socket.leave(roomId);
    socket.currentRoomId = null;
    
    // 从房间中移除玩家
    await roomService.handlePlayerLeave(roomId, socket.userId);
    
    // 发送离开房间成功事件
    socket.emit('room_left', { roomId });
    
    // 通知房间内其他玩家
    socket.to(roomId).emit('player_left', { userId: socket.userId });
    
    // 更新房间列表
    const rooms = await roomService.getAllRooms();
    socket.emit('room_list_updated', { rooms });
  } catch (error) {
    console.error('Leave room error:', error);
    socket.emit('error', { code: 'LEAVE_ROOM_ERROR', message: 'Failed to leave room' });
  }
};

// 处理切换准备状态
const handleToggleReady = async (socket, data) => {
  try {
    const { roomId } = data;
    
    // 更新玩家准备状态
    await roomService.togglePlayerReady(roomId, socket.userId);
    
    // 获取更新后的房间信息
    const updatedRoom = await Room.findById(roomId);
    
    // 发送准备状态更新事件
    socket.emit('player_ready_updated', { userId: socket.userId, isReady: updatedRoom.players.find(p => p.userId === socket.userId).isReady });
    
    // 通知房间内其他玩家
    socket.to(roomId).emit('player_ready_updated', { userId: socket.userId, isReady: updatedRoom.players.find(p => p.userId === socket.userId).isReady });
    
    // 检查是否所有玩家都准备好了
    const allReady = updatedRoom.players.every(p => p.isReady);
    if (allReady) {
      socket.to(roomId).emit('all_players_ready', { canStart: true });
    }
  } catch (error) {
    console.error('Toggle ready error:', error);
    socket.emit('error', { code: 'TOGGLE_READY_ERROR', message: 'Failed to toggle ready status' });
  }
};

// 处理开始游戏
const handleStartGame = async (socket, data) => {
  try {
    const { roomId } = data;
    
    // 开始游戏
    const gameState = await gameService.startGame(roomId);
    
    // 发送游戏开始事件
    socket.to(roomId).emit('game_started', { gameState });
    socket.emit('game_started', { gameState });
  } catch (error) {
    console.error('Start game error:', error);
    socket.emit('error', { code: 'START_GAME_ERROR', message: 'Failed to start game' });
  }
};

// 处理掷骰子
const handleRollDice = async (socket, data) => {
  try {
    const { roomId } = data;
    
    // 掷骰子
    const diceValue = await gameService.rollDice(roomId, socket.userId);
    
    // 发送骰子结果事件
    socket.emit('dice_rolled', { userId: socket.userId, value: diceValue });
    socket.to(roomId).emit('dice_rolled', { userId: socket.userId, value: diceValue });
    
    // 移动玩家
    const moveResult = await gameService.movePlayer(roomId, socket.userId, diceValue);
    
    // 发送玩家移动事件
    socket.emit('player_moved', { 
      userId: socket.userId, 
      newPosition: moveResult.newPosition, 
      diceValue: diceValue 
    });
    socket.to(roomId).emit('player_moved', { 
      userId: socket.userId, 
      newPosition: moveResult.newPosition, 
      diceValue: diceValue 
    });
    
    // 检查是否经过起点
    if (moveResult.passedGo) {
      socket.emit('card_effect', { effectType: 'pass_go', effectData: { amount: 200 } });
      socket.to(roomId).emit('card_effect', { effectType: 'pass_go', effectData: { amount: 200 } });
    }
    
    // 检查是否落在地产上
    const property = await Property.findByPosition(moveResult.newPosition);
    if (property && property.ownerId !== socket.userId) {
      if (!property.ownerId) {
        // 地产可购买
        socket.emit('property_available', { propertyId: property.id, propertyInfo: property });
      } else {
        // 需要支付租金
        const rentAmount = await gameService.calculateRent(property.id);
        const paymentResult = await gameService.payRent(roomId, socket.userId, property.ownerId, rentAmount, property.id);
        
        socket.emit('rent_paid', { 
          fromUserId: socket.userId, 
          toUserId: property.ownerId, 
          amount: rentAmount, 
          propertyId: property.id 
        });
        socket.to(roomId).emit('rent_paid', { 
          fromUserId: socket.userId, 
          toUserId: property.ownerId, 
          amount: rentAmount, 
          propertyId: property.id 
        });
        
        // 检查是否破产
        if (paymentResult.bankrupt) {
          socket.emit('bankruptcy_declared', { userId: socket.userId, reason: 'insufficient_funds' });
          socket.to(roomId).emit('player_bankrupted', { userId: socket.userId });
        }
      }
    }
    
    // 检查是否落在机会/命运卡上
    if (moveResult.isChance || moveResult.isCommunityChest) {
      const card = await gameService.drawCard(roomId, socket.userId, moveResult.isChance ? 'chance' : 'community_chest');
      
      socket.emit('card_drawn', { cardInfo: card });
      socket.to(roomId).emit('card_drawn', { cardInfo: card });
      
      // 执行卡牌效果
      const effectResult = await gameService.executeCardEffect(roomId, socket.userId, card);
      
      socket.emit('card_effect', { effectType: card.type, effectData: effectResult });
      socket.to(roomId).emit('card_effect', { effectType: card.type, effectData: effectResult });
      
      // 检查是否破产
      if (effectResult.bankrupt) {
        socket.emit('bankruptcy_declared', { userId: socket.userId, reason: 'card_effect' });
        socket.to(roomId).emit('player_bankrupted', { userId: socket.userId });
      }
    }
  } catch (error) {
    console.error('Roll dice error:', error);
    socket.emit('error', { code: 'ROLL_DICE_ERROR', message: 'Failed to roll dice' });
  }
};

// 处理结束回合
const handleEndTurn = async (socket, data) => {
  try {
    const { roomId } = data;
    
    // 结束当前回合
    const nextPlayer = await gameService.endTurn(roomId, socket.userId);
    
    // 发送回合切换事件
    socket.emit('turn_changed', { currentUserId: nextPlayer.userId });
    socket.to(roomId).emit('turn_changed', { currentUserId: nextPlayer.userId });
  } catch (error) {
    console.error('End turn error:', error);
    socket.emit('error', { code: 'END_TURN_ERROR', message: 'Failed to end turn' });
  }
};

// 处理购买地产
const handleBuyProperty = async (socket, data) => {
  try {
    const { roomId, propertyId } = data;
    
    // 获取地产信息
    const property = await Property.findById(propertyId);
    
    // 检查玩家是否有足够的钱
    const player = await Player.findByUserIdAndRoomId(socket.userId, roomId);
    if (player.money < property.price) {
      socket.emit('error', { code: 'INSUFFICIENT_FUNDS', message: 'Not enough money to buy property' });
      return;
    }
    
    // 购买地产
    await gameService.buyProperty(roomId, socket.userId, propertyId);
    
    // 发送地产购买事件
    socket.emit('property_purchased', { propertyId, ownerId: socket.userId });
    socket.to(roomId).emit('property_purchased', { propertyId, ownerId: socket.userId });
  } catch (error) {
    console.error('Buy property error:', error);
    socket.emit('error', { code: 'BUY_PROPERTY_ERROR', message: 'Failed to buy property' });
  }
};

// 处理建设房屋
const handleBuildHouse = async (socket, data) => {
  try {
    const { roomId, propertyId } = data;
    
    // 获取地产信息
    const property = await Property.findById(propertyId);
    
    // 检查玩家是否拥有该地产
    if (property.ownerId !== socket.userId) {
      socket.emit('error', { code: 'NOT_OWNER', message: 'You do not own this property' });
      return;
    }
    
    // 检查玩家是否有足够的钱
    const player = await Player.findByUserIdAndRoomId(socket.userId, roomId);
    const houseCost = property.housePrice;
    if (player.money < houseCost) {
      socket.emit('error', { code: 'INSUFFICIENT_FUNDS', message: 'Not enough money to build house' });
      return;
    }
    
    // 建设房屋
    await gameService.buildHouse(roomId, socket.userId, propertyId);
    
    // 发送房屋建设事件
    socket.emit('house_built', { propertyId, houseCount: property.houseCount + 1 });
    socket.to(roomId).emit('house_built', { propertyId, houseCount: property.houseCount + 1 });
  } catch (error) {
    console.error('Build house error:', error);
    socket.emit('error', { code: 'BUILD_HOUSE_ERROR', message: 'Failed to build house' });
  }
};

// 处理抽取卡牌
const handleDrawCard = async (socket, data) => {
  try {
    const { roomId } = data;
    
    // 抽取卡牌
    const card = await gameService.drawCard(roomId, socket.userId, 'manual');
    
    // 发送卡牌信息
    socket.emit('card_drawn', { cardInfo: card });
    socket.to(roomId).emit('card_drawn', { cardInfo: card });
    
    // 执行卡牌效果
    const effectResult = await gameService.executeCardEffect(roomId, socket.userId, card);
    
    socket.emit('card_effect', { effectType: card.type, effectData: effectResult });
    socket.to(roomId).emit('card_effect', { effectType: card.type, effectData: effectResult });
    
    // 检查是否破产
    if (effectResult.bankrupt) {
      socket.emit('bankruptcy_declared', { userId: socket.userId, reason: 'card_effect' });
      socket.to(roomId).emit('player_bankrupted', { userId: socket.userId });
    }
  } catch (error) {
    console.error('Draw card error:', error);
    socket.emit('error', { code: 'DRAW_CARD_ERROR', message: 'Failed to draw card' });
  }
};

// 处理宣布破产
const handleBankrupt = async (socket, data) => {
  try {
    const { roomId } = data;
    
    // 宣布破产
    await gameService.declareBankruptcy(roomId, socket.userId);
    
    // 发送破产声明事件
    socket.emit('bankruptcy_declared', { userId: socket.userId, reason: 'player_declared' });
    socket.to(roomId).emit('player_bankrupted', { userId: socket.userId });
    
    // 检查游戏是否结束
    const remainingPlayers = await gameService.getRemainingPlayers(roomId);
    if (remainingPlayers.length === 1) {
      const winner = remainingPlayers[0];
      const gameStats = await gameService.getGameStats(roomId);
      
      socket.emit('game_ended', { winner, gameStats });
      socket.to(roomId).emit('game_ended', { winner, gameStats });
    }
  } catch (error) {
    console.error('Bankrupt error:', error);
    socket.emit('error', { code: 'BANKRUPT_ERROR', message: 'Failed to declare bankruptcy' });
  }
};

// 处理发送聊天消息
const handleSendMessage = async (socket, data) => {
  try {
    const { roomId, message } = data;
    
    // 获取用户信息
    const user = await User.findById(socket.userId);
    
    // 创建消息对象
    const messageData = {
      userId: socket.userId,
      username: user.username,
      message,
      timestamp: new Date().toISOString()
    };
    
    // 广播消息给房间内所有玩家
    socket.to(roomId).emit('message_received', messageData);
    socket.emit('message_received', messageData);
  } catch (error) {
    console.error('Send message error:', error);
    socket.emit('error', { code: 'SEND_MESSAGE_ERROR', message: 'Failed to send message' });
  }
};

// 主socket事件处理器
const socketHandler = (io) => {
  io.use(authenticateToken);
  
  io.on('connection', (socket) => {
    handleConnection(socket);
    
    // 用户认证相关事件
    socket