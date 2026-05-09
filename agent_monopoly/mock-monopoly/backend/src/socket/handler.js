const jwt = require('jsonwebtoken');
const { db } = require('../db/connection');
const User = require('../models/User');
const Room = require('../models/Room');
const Player = require('../models/Player');
const Property = require('../models/Property');
const Card = require('../models/Card');
const gameService = require('../services/gameService');
const roomService = require('../services/roomService');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const socketHandler = (io) => {
  const connectedUsers = new Map(); // userId -> socketId

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.userId = decoded.userId;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User ${socket.userId} connected`);

    // Store socket ID for user
    connectedUsers.set(socket.userId, socket.id);

    // Register user
    socket.on('register', async (data) => {
      try {
        const { username, password } = data;
        
        // Check if user already exists
        const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
        if (existingUser) {
          socket.emit('register_error', { message: 'Username already exists' });
          return;
        }

        // Create new user
        const stmt = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)');
        const result = stmt.run(username, password);
        
        const token = jwt.sign({ userId: result.lastInsertRowid }, JWT_SECRET);
        
        socket.emit('register_success', { 
          userId: result.lastInsertRowid, 
          token,
          username 
        });
      } catch (error) {
        console.error('Registration error:', error);
        socket.emit('register_error', { message: 'Registration failed' });
      }
    });

    // Login user
    socket.on('login', async (data) => {
      try {
        const { username, password } = data;
        
        const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password);
        
        if (!user) {
          socket.emit('login_error', { message: 'Invalid credentials' });
          return;
        }

        const token = jwt.sign({ userId: user.id }, JWT_SECRET);
        
        socket.emit('login_success', { 
          userId: user.id, 
          token,
          userInfo: { username: user.username }
        });
      } catch (error) {
        console.error('Login error:', error);
        socket.emit('login_error', { message: 'Login failed' });
      }
    });

    // Create room
    socket.on('create_room', async (data) => {
      try {
        const { roomName } = data;
        const userId = socket.userId;
        
        const room = await roomService.createRoom(roomName, userId);
        
        // Add user to the room as a player
        await roomService.joinRoom(room.id, userId);
        
        socket.join(room.id);
        socket.emit('room_created', { roomId: room.id, roomInfo: room });
        
        // Update room list for all clients
        const rooms = await roomService.getAllRooms();
        io.emit('room_list_updated', { rooms });
      } catch (error) {
        console.error('Create room error:', error);
        socket.emit('error', { code: 'CREATE_ROOM_ERROR', message: 'Failed to create room' });
      }
    });

    // Join room
    socket.on('join_room', async (data) => {
      try {
        const { roomId } = data;
        const userId = socket.userId;
        
        const room = await roomService.joinRoom(roomId, userId);
        
        socket.join(roomId);
        socket.emit('room_joined', { roomId, roomInfo: room });
        
        // Notify other players in the room
        socket.to(roomId).emit('player_joined', { 
          userId, 
          username: db.prepare('SELECT username FROM users WHERE id = ?').get(userId).username 
        });
        
        // Update room list for all clients
        const rooms = await roomService.getAllRooms();
        io.emit('room_list_updated', { rooms });
      } catch (error) {
        console.error('Join room error:', error);
        socket.emit('error', { code: 'JOIN_ROOM_ERROR', message: 'Failed to join room' });
      }
    });

    // Leave room
    socket.on('leave_room', async (data) => {
      try {
        const { roomId } = data;
        const userId = socket.userId;
        
        await roomService.leaveRoom(roomId, userId);
        
        socket.leave(roomId);
        socket.emit('room_left', { roomId });
        
        // Notify other players in the room
        socket.to(roomId).emit('player_left', { userId });
        
        // Update room list for all clients
        const rooms = await roomService.getAllRooms();
        io.emit('room_list_updated', { rooms });
      } catch (error) {
        console.error('Leave room error:', error);
        socket.emit('error', { code: 'LEAVE_ROOM_ERROR', message: 'Failed to leave room' });
      }
    });

    // Toggle ready
    socket.on('toggle_ready', async (data) => {
      try {
        const { roomId } = data;
        const userId = socket.userId;
        
        const room = await roomService.toggleReady(roomId, userId);
        
        socket.to(roomId).emit('player_ready_updated', { userId, isReady: room.players.find(p => p.userId === userId).isReady });
        
        // Check if all players are ready
        const allReady = room.players.every(player => player.isReady);
        if (allReady && room.players.length >= 2) {
          io.to(roomId).emit('all_players_ready', { canStart: true });
        }
      } catch (error) {
        console.error('Toggle ready error:', error);
        socket.emit('error', { code: 'TOGGLE_READY_ERROR', message: 'Failed to toggle ready status' });
      }
    });

    // Start game
    socket.on('start_game', async (data) => {
      try {
        const { roomId } = data;
        const userId = socket.userId;
        
        const room = await roomService.startGame(roomId);
        
        // Initialize game state
        const gameState = await gameService.initializeGame(roomId);
        
        io.to(roomId).emit('game_started', { gameState });
      } catch (error) {
        console.error('Start game error:', error);
        socket.emit('error', { code: 'START_GAME_ERROR', message: 'Failed to start game' });
      }
    });

    // Roll dice
    socket.on('roll_dice', async (data) => {
      try {
        const { roomId } = data;
        const userId = socket.userId;
        
        const result = await gameService.rollDice(roomId, userId);
        
        io.to(roomId).emit('dice_rolled', { userId, value: result.diceValue });
        
        // Move player after a short delay
        setTimeout(async () => {
          const moveResult = await gameService.movePlayer(roomId, userId, result.diceValue);
          
          io.to(roomId).emit('player_moved', { 
            userId, 
            newPosition: moveResult.newPosition, 
            diceValue: result.diceValue 
          });
          
          // Handle landing on property
          if (moveResult.landedOnProperty) {
            const property = moveResult.landedOnProperty;
            
            if (property.ownerId === null) {
              // Property is available for purchase
              io.to(roomId).emit('property_available', { 
                propertyId: property.id, 
                propertyInfo: property 
              });
            } else if (property.ownerId !== userId) {
              // Property is owned by another player
              const rentAmount = gameService.calculateRent(property);
              const rentResult = await gameService.payRent(roomId, userId, property.ownerId, rentAmount, property.id);
              
              io.to(roomId).emit('rent_paid', { 
                fromUserId: userId, 
                toUserId: property.ownerId, 
                amount: rentAmount, 
                propertyId: property.id 
              });
              
              // Check if player is bankrupt after paying rent
              if (rentResult.payerBankrupted) {
                io.to(roomId).emit('player_bankrupted', { userId: rentResult.payerId });
                
                // Check if game should end
                const remainingPlayers = await gameService.getRemainingPlayers(roomId);
                if (remainingPlayers.length === 1) {
                  const winner = remainingPlayers[0];
                  const gameStats = await gameService.getGameStats(roomId);
                  io.to(roomId).emit('game_ended', { winner, gameStats });
                }
              }
            }
          }
          
          // Handle chance/community cards
          if (moveResult.drawCard) {
            const card = moveResult.drawCard;
            io.to(roomId).emit('card_drawn', { cardInfo: card });
            
            // Execute card effect after a short delay
            setTimeout(async () => {
              const effectResult = await gameService.executeCardEffect(roomId, userId, card);
              
              io.to(roomId).emit('card_effect', { 
                effectType: effectResult.type, 
                effectData: effectResult.data 
              });
              
              // Check if card effect caused bankruptcy
              if (effectResult.playerBankrupted) {
                io.to(roomId).emit('player_bankrupted', { userId: effectResult.playerId });
                
                // Check if game should end
                const remainingPlayers = await gameService.getRemainingPlayers(roomId);
                if (remainingPlayers.length === 1) {
                  const winner = remainingPlayers[0];
                  const gameStats = await gameService.getGameStats(roomId);
                  io.to(roomId).emit('game_ended', { winner, gameStats });
                }
              }
            }, 2000);
          }
          
          // End turn after handling all effects
          setTimeout(async () => {
            const nextPlayer = await gameService.endTurn(roomId);
            io.to(roomId).emit('turn_changed', { currentUserId: nextPlayer.userId });
          }, 3000);
          
        }, 1000);
      } catch (error) {
        console.error('Roll dice error:', error);
        socket.emit('error', { code: 'ROLL_DICE_ERROR', message: 'Failed to roll dice' });
      }
    });

    // Buy property
    socket.on('buy_property', async (data) => {
      try {
        const { roomId, propertyId } = data;
        const userId = socket.userId;
        
        const result = await gameService.buyProperty(roomId, userId, propertyId);
        
        io.to(roomId).emit('property_purchased', { 
          propertyId, 
          ownerId: userId 
        });
      } catch (error) {
        console.error('Buy property error:', error);
        socket.emit('error', { code: 'BUY_PROPERTY_ERROR', message: 'Failed to buy property' });
      }
    });

    // Build house
    socket.on('build_house', async (data) => {
      try {
        const { roomId, propertyId } = data;
        const userId = socket.userId;
        
        const result = await gameService.buildHouse(roomId, userId, propertyId);
        
        io.to(roomId).emit('house_built', { 
          propertyId, 
          houseCount: result.houseCount 
        });
      } catch (error) {
        console.error('Build house error:', error);
        socket.emit('error', { code: 'BUILD_HOUSE_ERROR', message: 'Failed to build house' });
      }
    });

    // Draw card
    socket.on('draw_card', async (data) => {
      try {
        const { roomId } = data;
        const userId = socket.userId;
        
        const card = await gameService.drawCard(roomId, userId);
        
        io.to(roomId).emit('card_drawn', { cardInfo: card });
      } catch (error) {
        console.error('Draw card error:', error);
        socket.emit('error', { code: 'DRAW_CARD_ERROR', message: 'Failed to draw card' });
      }
    });

    // Bankrupt
    socket.on('bankrupt', async (data) => {
      try {
        const { roomId } = data;
        const userId = socket.userId;
        
        await gameService.declareBankruptcy(roomId, userId);
        
        io.to(roomId).emit('bankruptcy_declared', { userId, reason: 'Player declared bankruptcy' });
        io.to(roomId).emit('player_bankrupted', { userId });
        
        // Check if game should end
        const remainingPlayers = await gameService.getRemainingPlayers(roomId);
        if (remainingPlayers.length === 1) {
          const winner = remainingPlayers[0];
          const gameStats = await gameService.getGameStats(roomId);
          io.to(roomId).emit('game_ended', { winner, gameStats });
        }
      } catch (error) {
        console.error('Bankrupt error:', error);
        socket.emit('error', { code: 'BANKRUPT_ERROR', message: 'Failed to declare bankruptcy' });
      }
    });

    // Send message
    socket.on('send_message', async (data) => {
      try {
        const { roomId, message } = data;
        const userId = socket.userId;
        
        const user = db.prepare('SELECT username FROM users WHERE id = ?').get(userId);
        
        const messageData = {
          userId,
          username: user.username,
          message,
          timestamp: new Date().toISOString()
        };
        
        // Save message to database if needed
        // const stmt = db.prepare('INSERT INTO messages (room_id, user_id, message, timestamp) VALUES (?, ?, ?, ?)');
        // stmt.run(roomId, userId, message, new Date().toISOString());
        
        io.to(roomId).emit('message_received', messageData);
      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { code: 'SEND_MESSAGE_ERROR', message: 'Failed to send message' });
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`User ${socket.userId} disconnected`);
      
      // Remove user from connected users
      connectedUsers.delete(socket.userId);
      
      // Handle room cleanup if needed
      // This could include notifying other players, handling timeouts, etc.
    });
  });

  return io;
};

module.exports = socketHandler;
```