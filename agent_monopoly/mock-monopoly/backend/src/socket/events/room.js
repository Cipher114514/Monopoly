const { getRoomById, createRoom, updateRoom, joinRoom, leaveRoom } = require('../../controllers/roomController');
const { verifyToken } = require('../../middleware/auth');

/**
 * 房间相关 Socket 事件处理
 * @param {Socket} socket - Socket 实例
 * @param {SocketIO} io - Socket.IO 实例
 */
module.exports = (socket, io) => {
  // 验证用户身份
  const userId = socket.handshake.auth.token ? verifyToken(socket.handshake.auth.token).userId : null;
  if (!userId) {
    socket.emit('error', { message: '请先登录' });
    return;
  }

  // 创建房间
  socket.on('create_room', async (data) => {
    try {
      const { name, maxPlayers = 6 } = data;
      if (!name || typeof name !== 'string') {
        socket.emit('error', { message: '房间名称不能为空' });
        return;
      }

      if (maxPlayers < 2 || maxPlayers > 6) {
        socket.emit('error', { message: '玩家数量必须在2-6之间' });
        return;
      }

      const room = await createRoom(name, maxPlayers, userId);
      socket.join(room.roomId);
      socket.emit('room_created', {
        code: 200,
        message: '房间创建成功',
        data: room
      });
    } catch (error) {
      console.error('创建房间失败:', error);
      socket.emit('error', { message: '创建房间失败' });
    }
  });

  // 加入房间
  socket.on('join_room', async (data) => {
    try {
      const { roomId } = data;
      if (!roomId) {
        socket.emit('error', { message: '房间ID不能为空' });
        return;
      }

      const room = await getRoomById(roomId);
      if (!room) {
        socket.emit('error', { message: '房间不存在' });
        return;
      }

      if (room.players.length >= room.maxPlayers) {
        socket.emit('error', { message: '房间已满' });
        return;
      }

      const player = await joinRoom(roomId, userId);
      if (!player) {
        socket.emit('error', { message: '加入房间失败' });
        return;
      }

      socket.join(roomId);
      
      // 通知房间内所有玩家
      io.to(roomId).emit('player_joined', {
        code: 200,
        message: `${player.username} 加入了房间`,
        data: player
      });

      // 发送房间信息给加入的玩家
      socket.emit('room_joined', {
        code: 200,
        message: '成功加入房间',
        data: room
      });

      // 如果房间已满，通知所有玩家游戏可以开始
      if (room.players.length === room.maxPlayers) {
        io.to(roomId).emit('room_full', {
          code: 200,
          message: '房间已满，游戏可以开始'
        });
      }
    } catch (error) {
      console.error('加入房间失败:', error);
      socket.emit('error', { message: '加入房间失败' });
    }
  });

  // 离开房间
  socket.on('leave_room', async (data) => {
    try {
      const { roomId } = data;
      if (!roomId) {
        socket.emit('error', { message: '房间ID不能为空' });
        return;
      }

      const room = await getRoomById(roomId);
      if (!room) {
        socket.emit('error', { message: '房间不存在' });
        return;
      }

      const player = await leaveRoom(roomId, userId);
      if (!player) {
        socket.emit('error', { message: '离开房间失败' });
        return;
      }

      socket.leave(roomId);
      
      // 通知房间内所有玩家
      io.to(roomId).emit('player_left', {
        code: 200,
        message: `${player.username} 离开了房间`,
        data: player
      });

      // 如果房间为空，删除房间
      if (room.players.length === 0) {
        await updateRoom(roomId, { status: 'deleted' });
        io.to(roomId).emit('room_deleted', {
          code: 200,
          message: '房间已删除'
        });
      }
    } catch (error) {
      console.error('离开房间失败:', error);
      socket.emit('error', { message: '离开房间失败' });
    }
  });

  // 玩家准备状态
  socket.on('player_ready', async (data) => {
    try {
      const { roomId, isReady } = data;
      if (!roomId) {
        socket.emit('error', { message: '房间ID不能为空' });
        return;
      }

      const room = await getRoomById(roomId);
      if (!room) {
        socket.emit('error', { message: '房间不存在' });
        return;
      }

      // 更新玩家准备状态
      const updatedRoom = await updateRoom(roomId, {
        players: room.players.map(player => 
          player.userId === userId ? { ...player, isReady } : player
        )
      });

      // 通知房间内所有玩家
      io.to(roomId).emit('player_ready_updated', {
        code: 200,
        message: `玩家准备状态已更新`,
        data: {
          userId,
          isReady
        }
      });

      // 检查是否所有玩家都准备好了
      const allReady = updatedRoom.players.every(player => player.isReady);
      if (allReady && updatedRoom.players.length >= 2) {
        io.to(roomId).emit('all_players_ready', {
          code: 200,
          message: '所有玩家已准备，游戏可以开始'
        });
      }
    } catch (error) {
      console.error('更新玩家准备状态失败:', error);
      socket.emit('error', { message: '更新准备状态失败' });
    }
  });

  // 开始游戏
  socket.on('start_game', async (data) => {
    try {
      const { roomId } = data;
      if (!roomId) {
        socket.emit('error', { message: '房间ID不能为空' });
        return;
      }

      const room = await getRoomById(roomId);
      if (!room) {
        socket.emit('error', { message: '房间不存在' });
        return;
      }

      // 检查是否有权限开始游戏（创建者或所有玩家都准备）
      if (room.creatorId !== userId && !room.players.every(p => p.isReady)) {
        socket.emit('error', { message: '没有权限开始游戏' });
        return;
      }

      // 更新房间状态为游戏中
      const updatedRoom = await updateRoom(roomId, { status: 'playing' });
      
      // 通知房间内所有玩家游戏开始
      io.to(roomId).emit('game_started', {
        code: 200,
        message: '游戏开始',
        data: updatedRoom
      });

      // 随机选择第一个玩家
      const randomIndex = Math.floor(Math.random() * room.players.length);
      const firstPlayer = room.players[randomIndex];

      io.to(roomId).emit('turn_changed', {
        code: 200,
        message: `${firstPlayer.username} 的回合`,
        data: {
          currentPlayerId: firstPlayer.userId,
          currentPlayerName: firstPlayer.username
        }
      });
    } catch (error) {
      console.error('开始游戏失败:', error);
      socket.emit('error', { message: '开始游戏失败' });
    }
  });

  // 处理断开连接
  socket.on('disconnect', async () => {
    try {
      // 查找玩家所在的所有房间
      const rooms = await require('../../controllers/roomController').getPlayerRooms(userId);
      
      for (const room of rooms) {
        await leaveRoom(room.roomId, userId);
        
        // 通知房间内其他玩家
        io.to(room.roomId).emit('player_disconnected', {
          code: 200,
          message: '玩家断开连接',
          data: { userId }
        });

        // 如果房间为空，删除房间
        const updatedRoom = await getRoomById(room.roomId);
        if (updatedRoom && updatedRoom.players.length === 0) {
          await updateRoom(room.roomId, { status: 'deleted' });
          io.to(room.roomId).emit('room_deleted', {
            code: 200,
            message: '房间已删除'
          });
        }
      }
    } catch (error) {
      console.error('处理断开连接失败:', error);
    }
  });
};