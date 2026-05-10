const { authenticateToken } = require('../middleware/auth');
const Room = require('../models/Room');
const Player = require('../models/Player');
const Property = require('../models/Property');
const Card = require('../models/Card');
const GameEvent = require('../models/GameEvent');

/**
 * Socket.io 事件处理器
 * @param {Socket} socket - Socket 实例
 * @param {Server} io - Socket.io 服务器实例
 */
module.exports = (socket, io) => {
  // 用户认证
  socket.on('authenticate', (data) => {
    try {
      const { token } = data;
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      socket.username = decoded.username;
      socket.emit('authenticated', { success: true });
    } catch (error) {
      socket.emit('authenticated', { success: false, message: '认证失败' });
    }
  });

  // 创建房间
  socket.on('create_room', async (data) => {
    try {
      const { name, maxPlayers = 6 } = data;
      const room = await Room.create({ name, max_players: maxPlayers, creator_id: socket.userId });
      
      // 创建房间后自动加入
      await socket.join(`room_${room.id}`);
      
      // 创建玩家记录
      const player = await Player.create({
        user_id: socket.userId,
        room_id: room.id,
        color: '#FF0000', // 默认红色
        position: 0,
        money: 1500,
        is_ready: false
      });

      socket.currentRoom = room.id;
      socket.playerId = player.id;

      // 广播房间更新
      io.to(`room_${room.id}`).emit('room_created', {
        room: {
          id: room.id,
          name: room.name,
          maxPlayers: room.max_players,
          status: room.status,
          currentPlayers: 1
        },
        player: {
          id: player.id,
          userId: player.userId,
          color: player.color,
          isReady: player.is_ready
        }
      });

      socket.emit('room_created', {
        success: true,
        roomId: room.id,
        playerId: player.id
      });
    } catch (error) {
      socket.emit('error', { message: '创建房间失败: ' + error.message });
    }
  });

  // 加入房间
  socket.on('join_room', async (data) => {
    try {
      const { roomId } = data;
      
      // 验证房间是否存在
      const room = await Room.findById(roomId);
      if (!room) {
        throw new Error('房间不存在');
      }

      // 验证房间是否已满
      if (room.current_players >= room.max_players) {
        throw new Error('房间已满');
      }

      // 检查是否已在房间中
      const existingPlayer = await Player.findByUserIdAndRoom(socket.userId, roomId);
      if (existingPlayer) {
        throw new Error('您已在该房间中');
      }

      // 加入房间
      await socket.join(`room_${roomId}`);
      socket.currentRoom = roomId;

      // 创建玩家记录
      const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];
      const playerCount = room.current_players;
      const player = await Player.create({
        user_id: socket.userId,
        room_id: roomId,
        color: colors[playerCount],
        position: 0,
        money: 1500,
        is_ready: false
      });

      socket.playerId = player.id;

      // 更新房间玩家数量
      await Room.updatePlayerCount(roomId, room.current_players + 1);

      // 广播新玩家加入
      const players = await Player.findByRoomId(roomId);
      io.to(`room_${roomId}`).emit('player_joined', {
        player: {
          id: player.id,
          userId: player.userId,
          username: socket.username,
          color: player.color,
          isReady: player.is_ready
        },
        players: players.map(p => ({
          id: p.id,
          userId: p.userId,
          username: socket.username,
          color: p.color,
          isReady: p.is_ready
        }))
      });

      socket.emit('room_joined', {
        success: true,
        roomId,
        playerId: player.id,
        players: players
      });
    } catch (error) {
      socket.emit('error', { message: '加入房间失败: ' + error.message });
    }
  });

  // 离开房间
  socket.on('leave_room', async (data) => {
    try {
      const { roomId } = data;
      
      if (!socket.currentRoom || socket.currentRoom !== roomId) {
        throw new Error('您不在此房间中');
      }

      // 更新房间玩家数量
      const room = await Room.findById(roomId);
      await Room.updatePlayerCount(roomId, Math.max(0, room.current_players - 1));

      // 删除玩家记录
      await Player.delete(socket.playerId);

      // 离开 Socket 房间
      await socket.leave(`room_${roomId}`);
      socket.currentRoom = null;

      // 广播玩家离开
      io.to(`room_${roomId}`).emit('player_left', {
        playerId: socket.playerId,
        message: `${socket.username} 离开了房间`
      });

      socket.emit('room_left', { success: true });
    } catch (error) {
      socket.emit('error', { message: '离开房间失败: ' + error.message });
    }
  });

  // 玩家准备状态切换
  socket.on('player_ready', async (data) => {
    try {
      const { roomId, isReady } = data;
      
      if (!socket.currentRoom || socket.currentRoom !== roomId) {
        throw new Error('您不在此房间中');
      }

      // 更新玩家准备状态
      await Player.update(socket.playerId, { is_ready: isReady });

      // 获取更新后的玩家列表
      const players = await Player.findByRoomId(roomId);
      
      // 广播准备状态更新
      io.to(`room_${roomId}`).emit('player_ready_updated', {
        playerId: socket.playerId,
        isReady,
        players: players.map(p => ({
          id: p.id,
          userId: p.userId,
          username: socket.username,
          color: p.color,
          isReady: p.is_ready
        }))
      });
    } catch (error) {
      socket.emit('error', { message: '更新准备状态失败: ' + error.message });
    }
  });

  // 开始游戏
  socket.on('start_game', async (data) => {
    try {
      const { roomId } = data;
      
      // 检查是否是房主
      const room = await Room.findById(roomId);
      if (room.creator_id !== socket.userId) {
        throw new Error('只有房主可以开始游戏');
      }

      // 检查是否所有玩家都准备好了
      const players = await Player.findByRoomId(roomId);
      const allReady = players.every(p => p.is_ready);
      if (!allReady) {
        throw new Error('所有玩家必须准备才能开始游戏');
      }

      // 更新房间状态
      await Room.update(roomId, { status: 'playing' });

      // 广播游戏开始
      io.to(`room_${roomId}`).emit('game_started', {
        message: '游戏开始！',
        players: players
      });

      // 初始化游戏状态
      const properties = await Property.findAll(roomId);
      const cards = await Card.findAll(roomId);
      
      io.to(`room_${roomId}`).emit('game_state_initialized', {
        properties,
        cards,
        players
      });
    } catch (error) {
      socket.emit('error', { message: '开始游戏失败: ' + error.message });
    }
  });

  // 掷骰子
  socket.on('roll_dice', async (data) => {
    try {
      const { roomId } = data;
      
      if (!socket.currentRoom || socket.currentRoom !== roomId) {
        throw new Error('您不在此房间中');
      }

      // 获取当前玩家
      const player = await Player.findById(socket.playerId);
      if (!player) {
        throw new Error('玩家不存在');
      }

      // 生成随机骰子点数
      const dice1 = Math.floor(Math.random() * 6) + 1;
      const dice2 = Math.floor(Math.random() * 6) + 1;
      const total = dice1 + dice2;

      // 更新玩家位置
      let newPosition = player.position + total;
      if (newPosition >= 40) {
        newPosition -= 40;
        // 经过起点奖励
        await Player.update(socket.playerId, { 
          position: newPosition,
          money: player.money + 200
        });
      } else {
        await Player.update(socket.playerId, { position: newPosition });
      }

      // 获取更新后的玩家
      const updatedPlayer = await Player.findById(socket.playerId);

      // 广播掷骰子结果
      io.to(`room_${roomId}`).emit('dice_rolled', {
        playerId: socket.playerId,
        dice1,
        dice2,
        total,
        newPosition: updatedPlayer.position
      });

      // 记录游戏事件
      await GameEvent.create({
        room_id: roomId,
        event_type: 'dice_rolled',
        player_id: socket.playerId,
        data: {
          dice1,
          dice2,
          total,
          position: updatedPlayer.position
        }
      });

      // 检查是否触发卡牌或地产事件
      const property = await Property.findByPosition(newPosition);
      if (property) {
        if (property.owner_id === null) {
          // 地产无人购买，可以购买
          io.to(`room_${roomId}`).emit('property_available', {
            playerId: socket.playerId,
            property
          });
        } else if (property.owner_id !== socket.userId) {
          // 需要支付租金
          const owner = await Player.findById(property.owner_id);
          const rent = calculateRent(property, updatedPlayer.position);
          
          await Player.update(socket.playerId, { money: updatedPlayer.money - rent });
          await Player.update(property.owner_id, { money: owner.money + rent });

          io.to(`room_${roomId}`).emit('rent_paid', {
            payerId: socket.playerId,
            ownerId: property.owner_id,
            propertyId: property.id,
            rent,
            newMoney: updatedPlayer.money - rent
          });
        }
      } else {
        // 抽卡事件
        const cardType = newPosition % 2 === 0 ? 'chance' : 'community';
        const card = await Card.draw(roomId, cardType);
        
        await GameEvent.create({
          room_id: roomId,
          event_type: 'card_drawn',
          player_id: socket.playerId,
          data: {
            cardType,
            card
          }
        });

        io.to(`room_${roomId}`).emit('card_drawn', {
          playerId: socket.playerId,
          cardType,
          card
        });
      }
    } catch (error) {
      socket.emit('error', { message: '掷骰子失败: ' + error.message });
    }
  });

  // 购买地产
  socket.on('buy_property', async (data) => {
    try {
      const { roomId, propertyId } = data;
      
      if (!socket.currentRoom || socket.currentRoom !== roomId) {
        throw new Error('您不在此房间中');
      }

      // 获取玩家和地产
      const player = await Player.findById(socket.playerId);
      const property = await Property.findById(propertyId);

      if (!property || property.owner_id !== null) {
        throw new Error('地产不可购买');
      }

      if (player.money < property.price) {
        throw new Error('资金不足');
      }

      // 扣除资金，更新地产所有权
      await Player.update(socket.playerId, { money: player.money - property.price });
      await Property.update(propertyId, { owner_id: socket.userId });

      // 广播购买成功
      io.to(`room_${roomId}`).emit('property_bought', {
        playerId: socket.playerId,
        propertyId,
        price: property.price,
        newMoney: player.money - property.price
      });

      // 记录事件
      await GameEvent.create({
        room_id: roomId,
        event_type: 'property_bought',
        player_id: socket.playerId,
        data: {
          propertyId,
          price: property.price
        }
      });
    } catch (error) {
      socket.emit('error', { message: '购买地产失败: ' + error.message });
    }
  });

  // 建造房屋
  socket.on('build_house', async (data) => {
    try {
      const { roomId, propertyId } = data;
      
      if (!socket.currentRoom || socket.currentRoom !== roomId) {
        throw new Error('您不在此房间中');
      }

      // 获取玩家和地产
      const player = await Player.findById(socket.playerId);
      const property = await Property.findById(propertyId);

      if (!property || property.owner_id !== socket.userId) {
        throw new Error('您不是该地产的所有者');
      }

      if (property.house_count >= 4) {
        throw new Error('房屋数量已达上限');
      }

      const housePrice = property.house_price || 50;
      if (player.money < housePrice) {
        throw new Error('资金不足');
      }

      // 扣除资金，增加房屋数量
      await Player.update(socket.playerId, { money: player.money - housePrice });
      await Property.update(propertyId, { house_count: property.house_count + 1 });

      // 广播建造成功
      io.to(`room_${roomId}`).emit('house_built', {
        playerId: socket.playerId,
        propertyId,
        houseCount: property.house_count + 1,
        cost: housePrice
      });

      // 记录事件
      await GameEvent.create({
        room_id: roomId,
        event_type: 'house_built',
        player_id: socket.playerId,
        data: {
          propertyId,
          houseCount: property.house_count + 1,
          cost: housePrice
        }
      });
    } catch (error) {
      socket.emit('error', { message: '建造房屋失败: ' + error.message });
    }
  });

  // 结束回合
  socket.on('end_turn', async (data) => {
    try {
      const { roomId } = data;
      
      if (!socket.currentRoom || socket.currentRoom !== roomId) {
        throw new Error('您不在此房间中');
      }

      // 获取当前玩家和所有玩家
      const currentPlayer = await Player.findById(socket.playerId);
      const players = await Player.findByRoomId(roomId);

      // 找到下一个玩家
      const currentIndex = players.findIndex(p => p.id === socket.playerId);
      const nextIndex = (currentIndex + 1) % players.length;
      const nextPlayer = players[nextIndex];

      // 广播回合切换
      io.to(`room_${roomId}`).emit('turn_ended', {
        currentTurn: socket.playerId,
        nextTurn: nextPlayer.id
      });

      // 记录事件
      await GameEvent.create({
        room_id: roomId,
        event_type: 'turn_ended',
        player_id: socket.playerId,
        data: {
          nextPlayerId: nextPlayer.id
        }
      });
    } catch (error) {
      socket.emit('error', { message: '结束回合失败: ' + error.message });
    }
  });

  // 处理断开连接
  socket.on('disconnect', async () => {
    try {
      if (socket.currentRoom) {
        // 更新房间玩家数量
        const room = await Room.findById(socket.currentRoom);
        await Room.updatePlayerCount(socket.currentRoom, Math.max(0, room.current_players - 1));

        // 广播玩家离开
        io.to(`room_${socket.currentRoom}`).emit('player_disconnected', {
          playerId: socket.playerId,
          message: `${socket.username} 断开连接`
        });

        // 删除玩家记录
        await Player.delete(socket.playerId);
      }
    } catch (error) {
      console.error('处理断开连接时出错:', error);
    }
  });
};

// 辅助函数：计算租金
function calculateRent(property, position) {
  if (property.house_count === 0) {
    return property.base_rent;
  } else if (property.house_count === 1) {
    return property.rent_with_house;
  } else if (property.house_count === 2) {
    return property.rent_with_two_houses;
  } else if (property.house_count === 3) {
    return property.rent_with_three_houses;
  } else {
    return property.rent_with_hotel;
  }
}