const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../database/connection');

// 验证用户身份的中间件
function authenticateUser(socket, next) {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    socket.userId = decoded.userId;
    next();
  } catch (err) {
    next(new Error('Authentication error: Invalid token'));
  }
}

// 处理用户注册
function handleRegister(socket, data) {
  return new Promise((resolve, reject) => {
    const { username, password } = data;
    
    // 检查用户名是否已存在
    const checkUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    
    if (checkUser) {
      reject({ message: 'Username already exists' });
      return;
    }
    
    // 创建新用户
    const insertUser = db.prepare('INSERT INTO users (username, password, created_at) VALUES (?, ?, ?)');
    const result = insertUser.run(username, password, new Date().toISOString());
    
    if (result.changes > 0) {
      const userId = result.lastInsertRowid;
      const token = jwt.sign({ userId }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '24h' });
      
      resolve({ userId, token });
    } else {
      reject({ message: 'Failed to create user' });
    }
  });
}

// 处理用户登录
function handleLogin(socket, data) {
  return new Promise((resolve, reject) => {
    const { username, password } = data;
    
    const user = db.prepare('SELECT id, password FROM users WHERE username = ?').get(username);
    
    if (!user) {
      reject({ message: 'Invalid username or password' });
      return;
    }
    
    // 在实际应用中，这里应该使用密码哈希验证
    if (user.password !== password) {
      reject({ message: 'Invalid username or password' });
      return;
    }
    
    const userId = user.id;
    const token = jwt.sign({ userId }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '24h' });
    
    // 获取用户信息
    const userInfo = db.prepare('SELECT id, username, created_at FROM users WHERE id = ?').get(userId);
    
    resolve({ userId, token, userInfo });
  });
}

// 处理创建房间
function handleCreateRoom(socket, data) {
  return new Promise((resolve, reject) => {
    const { roomName } = data;
    const roomId = uuidv4();
    
    // 创建房间
    const insertRoom = db.prepare(`
      INSERT INTO rooms (id, name, created_by, created_at, status, max_players)
      VALUES (?, ?, ?, ?, 'waiting', 6)
    `);
    
    const result = insertRoom.run(roomId, roomName, socket.userId, new Date().toISOString());
    
    if (result.changes > 0) {
      // 创建者自动加入房间
      handleJoinRoom(socket, { roomId })
        .then(roomInfo => {
          resolve({ roomId, roomInfo });
        })
        .catch(err => {
          reject(err);
        });
    } else {
      reject({ message: 'Failed to create room' });
    }
  });
}

// 处理加入房间
function handleJoinRoom(socket, data) {
  return new Promise((resolve, reject) => {
    const { roomId } = data;
    
    // 检查房间是否存在
    const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(roomId);
    
    if (!room) {
      reject({ message: 'Room not found' });
      return;
    }
    
    // 检查房间是否已满
    const playerCount = db.prepare('SELECT COUNT(*) as count FROM room_players WHERE room_id = ?').get(roomId).count;
    
    if (playerCount >= room.max_players) {
      reject({ message: 'Room is full' });
      return;
    }
    
    // 检查用户是否已在房间中
    const existingPlayer = db.prepare('SELECT id FROM room_players WHERE room_id = ? AND user_id = ?').get(roomId, socket.userId);
    
    if (existingPlayer) {
      reject({ message: 'You are already in this room' });
      return;
    }
    
    // 添加玩家到房间
    const insertPlayer = db.prepare(`
      INSERT INTO room_players (room_id, user_id, joined_at, is_ready)
      VALUES (?, ?, ?, 0)
    `);
    
    const result = insertPlayer.run(roomId, socket.userId, new Date().toISOString());
    
    if (result.changes > 0) {
      // 获取房间信息
      const roomInfo = getRoomInfo(roomId);
      resolve(roomInfo);
    } else {
      reject({ message: 'Failed to join room' });
    }
  });
}

// 处理离开房间
function handleLeaveRoom(socket, data) {
  return new Promise((resolve, reject) => {
    const { roomId } = data;
    
    // 检查用户是否在房间中
    const player = db.prepare('SELECT id FROM room_players WHERE room_id = ? AND user_id = ?').get(roomId, socket.userId);
    
    if (!player) {
      reject({ message: 'You are not in this room' });
      return;
    }
    
    // 从房间中移除玩家
    const deletePlayer = db.prepare('DELETE FROM room_players WHERE room_id = ? AND user_id = ?');
    const result = deletePlayer.run(roomId, socket.userId);
    
    if (result.changes > 0) {
      // 如果房间为空，删除房间
      const remainingPlayers = db.prepare('SELECT COUNT(*) as count FROM room_players WHERE room_id = ?').get(roomId).count;
      
      if (remainingPlayers === 0) {
        db.prepare('DELETE FROM rooms WHERE id = ?').run(roomId);
      }
      
      resolve({ roomId });
    } else {
      reject({ message: 'Failed to leave room' });
    }
  });
}

// 处理切换准备状态
function handleToggleReady(socket, data) {
  return new Promise((resolve, reject) => {
    const { roomId } = data;
    
    // 检查用户是否在房间中
    const player = db.prepare('SELECT id, is_ready FROM room_players WHERE room_id = ? AND user_id = ?').get(roomId, socket.userId);
    
    if (!player) {
      reject({ message: 'You are not in this room' });
      return;
    }
    
    // 切换准备状态
    const newReadyStatus = player.is_ready ? 0 : 1;
    const updatePlayer = db.prepare('UPDATE room_players SET is_ready = ? WHERE room_id = ? AND user_id = ?');
    const result = updatePlayer.run(newReadyStatus, roomId, socket.userId);
    
    if (result.changes > 0) {
      // 获取房间信息
      const roomInfo = getRoomInfo(roomId);
      
      // 检查是否所有玩家都准备好了
      const allPlayers = db.prepare('SELECT is_ready FROM room_players WHERE room_id = ?').all(roomId);
      const allReady = allPlayers.every(p => p.is_ready === 1);
      
      resolve({ 
        roomId, 
        roomInfo, 
        allPlayersReady: allReady 
      });
    } else {
      reject({ message: 'Failed to update ready status' });
    }
  });
}

// 处理开始游戏
function handleStartGame(socket, data) {
  return new Promise((resolve, reject) => {
    const { roomId } = data;
    
    // 检查用户是否在房间中
    const player = db.prepare('SELECT id FROM room_players WHERE room_id = ? AND user_id = ?').get(roomId, socket.userId);
    
    if (!player) {
      reject({ message: 'You are not in this room' });
      return;
    }
    
    // 检查房间状态是否为等待中
    const room = db.prepare('SELECT status, max_players FROM rooms WHERE id = ?').get(roomId);
    
    if (room.status !== 'waiting') {
      reject({ message: 'Game is already in progress' });
      return;
    }
    
    // 检查是否所有玩家都准备好了
    const allPlayers = db.prepare('SELECT is_ready FROM room_players WHERE room_id = ?').all(roomId);
    const allReady = allPlayers.every(p => p.is_ready === 1);
    
    if (!allReady) {
      reject({ message: 'Not all players are ready' });
      return;
    }
    
    // 更新房间状态为游戏中
    const updateRoom = db.prepare('UPDATE rooms SET status = ? WHERE id = ?');
    updateRoom.run('playing', roomId);
    
    // 初始化游戏状态
    initializeGame(roomId)
      .then(gameState => {
        resolve({ roomId, gameState });
      })
      .catch(err => {
        reject(err);
      });
  });
}

// 初始化游戏
function initializeGame(roomId) {
  return new Promise((resolve, reject) => {
    // 获取房间中的所有玩家
    const players = db.prepare(`
      SELECT u.id, u.username, rp.joined_at
      FROM room_players rp
      JOIN users u ON rp.user_id = u.id
      WHERE rp.room_id = ?
      ORDER BY rp.joined_at
    `).all(roomId);
    
    if (players.length < 2) {
      reject({ message: 'At least 2 players are required to start the game' });
      return;
    }
    
    // 为每个玩家创建游戏状态
    const insertPlayerState = db.prepare(`
      INSERT INTO game_states (room_id, user_id, position, money, in_game, created_at)
      VALUES (?, ?, 0, 1500, 1, ?)
    `);
    
    for (const player of players) {
      insertPlayerState.run(roomId, player.id, new Date().toISOString());
    }
    
    // 获取初始化后的游戏状态
    const gameState = getGameState(roomId);
    resolve(gameState);
  });
}

// 获取房间信息
function getRoomInfo(roomId) {
  // 获取房间基本信息
  const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(roomId);
  
  if (!room) {
    return null;
  }
  
  // 获取房间中的玩家
  const players = db.prepare(`
    SELECT u.id, u.username, rp.is_ready, rp.joined_at
    FROM room_players rp
    JOIN users u ON rp.user_id = u.id
    WHERE rp.room_id = ?
    ORDER BY rp.joined_at
  `).all(roomId);
  
  // 获取游戏状态（如果游戏已经开始）
  let gameState = null;
  if (room.status === 'playing') {
    gameState = getGameState(roomId);
  }
  
  return {
    ...room,
    players,
    gameState
  };
}

// 获取游戏状态
function getGameState(roomId) {
  // 获取所有玩家的游戏状态
  const playerStates = db.prepare(`
    SELECT u.id, u.username, gs.position, gs.money, gs.in_game
    FROM game_states gs
    JOIN users u ON gs.user_id = u.id
    WHERE gs.room_id = ?
    ORDER BY gs.id
  `).all(roomId);
  
  // 获取所有地产的所有权
  const properties = db.prepare(`
    SELECT p.id, p.name, p.price, p.rent, p.owner_id, p.house_count
    FROM properties p
    LEFT JOIN property_ownership po ON p.id = po.property_id AND po.room_id = ?
    WHERE po.room_id = ?
  `).all(roomId, roomId);
  
  // 获取当前回合的玩家
  const currentTurn = db.prepare('SELECT current_turn_user_id FROM game_turns WHERE room_id = ?').get(roomId);
  
  return {
    players: playerStates,
    properties,
    currentTurn: currentTurn ? currentTurn.current_turn_user_id : null
  };
}

// 处理掷骰子
function handleRollDice(socket, data) {
  return new Promise((resolve, reject) => {
    const { roomId } = data;
    
    // 检查用户是否在房间中
    const player = db.prepare('SELECT id FROM room_players WHERE room_id = ? AND user_id = ?').get(roomId, socket.userId);
    
    if (!player) {
      reject({ message: 'You are not in this room' });
      return;
    }
    
    // 检查游戏是否正在进行
    const room = db.prepare('SELECT status FROM rooms WHERE id = ?').get(roomId);
    
    if (room.status !== 'playing') {
      reject({ message: 'Game is not in progress' });
      return;
    }
    
    // 检查是否是当前玩家的回合
    const currentTurn = db.prepare('SELECT current_turn_user_id FROM game_turns WHERE room_id = ?').get(roomId);
    
    if (currentTurn.current_turn_user_id !== socket.userId) {
      reject({ message: 'It is not your turn' });
      return;
    }
    
    // 生成1-6的随机数
    const diceValue = Math.floor(Math.random() * 6) + 1;
    
    // 更新玩家位置
    const playerState = db.prepare('SELECT position, money FROM game_states WHERE room_id = ? AND user_id = ?').get(roomId, socket.userId);
    
    let newPosition = playerState.position + diceValue;
    
    // 如果经过起点，给予奖励
    if (newPosition >= 40) {
      newPosition = newPosition % 40;
      
      // 给予200元起点奖励
      const updateMoney = db.prepare('UPDATE game_states SET money = money + 200 WHERE room_id = ? AND user_id = ?');
      updateMoney.run(roomId, socket.userId);
    }
    
    // 更新玩家位置
    const updatePosition = db.prepare('UPDATE game_states SET position = ? WHERE room_id = ? AND user_id = ?');
    updatePosition.run(newPosition, roomId, socket.userId);
    
    // 检查是否落在地产上
    const property = db.prepare('SELECT * FROM properties WHERE position = ?').get(newPosition);
    
    if (property) {
      // 检查地产是否已被拥有
      const ownership = db.prepare('SELECT owner_id FROM property_ownership WHERE room_id = ? AND property_id = ?').get(roomId, property.id);
      
      if (ownership && ownership.owner_id !== socket.userId) {
        // 计算租金
        let rent = property.rent;
        
        // 如果有房屋，增加租金
        const houseCount = db.prepare('SELECT house_count FROM property_ownership WHERE room_id = ? AND property_id = ?').get(roomId, property.id).house_count || 0;
        rent = rent * Math.pow(2, houseCount);
        
        // 检查玩家是否有足够资金支付租金
        const payerMoney = db.prepare('SELECT money FROM game_states WHERE room_id = ? AND user_id = ?').get(roomId, socket.userId).money;
        
        if (payerMoney >= rent) {
          // 支付租金
          const updatePayerMoney = db.prepare('UPDATE game_states SET money = money - ? WHERE room_id = ? AND user_id = ?');
          updatePayerMoney.run(rent, roomId, socket.userId);
          
          const updateOwnerMoney = db.prepare('UPDATE game_states SET money = money + ? WHERE room_id = ? AND user_id = ?');
          updateOwnerMoney.run(rent, roomId, ownership.owner_id);
          
          // 记录租金支付
          const insertRentRecord = db.prepare(`
            INSERT INTO rent_records (room_id, property_id, payer_id, receiver_id, amount, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
          `);
          insertRentRecord.run(roomId, property.id, socket.userId, ownership.owner_id, rent, new Date().toISOString());
          
          resolve({
            roomId,
            diceValue,
            newPosition,
            rentPaid: {
              amount: rent,
              propertyId: property.id,
              fromUserId: socket.userId,
              toUserId: ownership.owner_id
            }
          });
        } else {
          // 玩家破产
          handleBankruptcy(socket, { roomId, reason: 'insufficient_funds' })
            .then(() => {
              resolve({
                roomId,
                diceValue,
                newPosition,
                bankruptcy: {
                  userId: socket.userId,
                  reason: 'insufficient_funds'
                }
              });
            })
            .catch(err => {
              reject(err);
            });
        }
      } else {
        resolve({
          roomId,
          diceValue,
          newPosition,
          propertyAvailable: property.id
        });
      }
    } else {
      resolve({
        roomId,
        diceValue,
        newPosition
      });
    }
  });
}

// 处理购买地产
function handleBuyProperty(socket, data) {
  return new Promise((resolve, reject) => {
    const { roomId, propertyId } = data;
    
    // 检查用户是否在房间中
    const player = db.prepare('SELECT id FROM room_players WHERE room_id = ? AND user_id = ?').get(roomId, socket.userId);
    
    if (!player) {
      reject({ message: 'You are not in this room' });
      return;
    }
    
    // 检查游戏是否正在进行
    const room = db.prepare('SELECT status FROM rooms WHERE id = ?').get(roomId);
    
    if (room.status !== 'playing') {
      reject({ message: 'Game is not in progress' });
      return;
    }
    
    // 检查是否是当前玩家的回合
    const currentTurn = db.prepare('SELECT current_turn_user_id FROM game_turns WHERE room_id = ?').get(roomId);
    
    if (currentTurn.current_turn_user_id !== socket.userId) {
      reject({ message: 'It is not your turn' });
      return;
    }
    
    // 检查地产是否存在
    const property = db.prepare('SELECT * FROM properties WHERE id = ?').get(propertyId);
    
    if (!property) {
      reject({ message: 'Property not found' });
      return;
    }
    
    // 检查玩家是否已经拥有该地产
    const ownership = db.prepare('SELECT owner_id FROM property_ownership WHERE room_id = ? AND property_id = ?').get(roomId, propertyId);
    
    if (ownership && ownership.owner_id === socket.userId) {
      reject({ message: 'You already own this property' });
      return;
    }
    
    // 检查玩家是否有足够资金购买
    const playerMoney = db.prepare