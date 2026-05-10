const { db } = require('../db/connection');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Room = require('../models/Room');
const Player = require('../models/Player');

const roomSockets = new Map(); // 存储房间ID到socket.io房间对象的映射

module.exports = (io) => {
  return (socket) => {
    // 处理用户登录
    socket.on('user_login', async (data, callback) => {
      try {
        const { username, password } = data;
        
        // 验证用户凭据
        const user = User.findByUsername(username);
        if (!user || !User.verifyPassword(user, password)) {
          return callback({ 
            code: 401, 
            message: '用户名或密码错误' 
          });
        }
        
        // 生成JWT
        const token = jwt.sign(
          { userId: user.id, username: user.username },
          process.env.JWT_SECRET,
          { expiresIn: '24h' }
        );
        
        // 存储用户token
        socket.userId = user.id;
        socket.username = user.username;
        socket.token = token;
        
        // 加入用户个人房间（用于接收私人消息）
        socket.join(`user_${user.id}`);
        
        callback({ 
          code: 200, 
          message: '登录成功',
          data: {
            token,
            user: {
              id: user.id,
              username: user.username,
              email: user.email
            }
          }
        });
      } catch (error) {
        console.error('登录错误:', error);
        callback({ code: 500, message: '服务器错误' });
      }
    });

    // 处理用户注册
    socket.on('user_register', async (data, callback) => {
      try {
        const { username, email, password } = data;
        
        // 验证输入
        if (!username || !email || !password) {
          return callback({ 
            code: 400, 
            message: '所有字段都是必填的' 
          });
        }
        
        if (password.length < 6) {
          return callback({ 
            code: 400, 
            message: '密码长度至少为6位' 
          });
        }
        
        // 检查用户名是否已存在
        const existingUser = User.findByUsername(username);
        if (existingUser) {
          return callback({ 
            code: 409, 
            message: '用户名已存在' 
          });
        }
        
        // 创建新用户
        const newUser = User.create({
          username,
          email,
          password
        });
        
        callback({ 
          code: 201, 
          message: '注册成功',
          data: {
            user: {
              id: newUser.id,
              username: newUser.username,
              email: newUser.email
            }
          }
        });
      } catch (error) {
        console.error('注册错误:', error);
        callback({ code: 500, message: '服务器错误' });
      }
    });

    // 创建房间
    socket.on('create_room', async (data, callback) => {
      try {
        // 鎷取用户ID（通过认证中间件，这里简化处理）
        const userId = socket.userId;
        if (!userId) {
          return callback({ code: 401, message: '请先登录' });
        }
        
        const { roomName, maxPlayers = 6 } = data;
        
        // 验证房间名称
        if (!roomName || roomName.trim().length === 0) {
          return callback({ code: 400, message: '房间名称不能为空' });
        }
        
        // 验证最大玩家数
        if (maxPlayers < 2 || maxPlayers > 6) {
          return callback({ 
            code: 400, 
            message: '玩家数必须在2-6之间' 
          });
        }
        
        // 创建房间
        const room = Room.create({
          name: roomName.trim(),
          maxPlayers,
          creatorId: userId
        });
        
        // 创建玩家记录
        const player = Player.create({
          user_id: userId,
          room_id: room.id,
          color: '#FF0000', // 默认红色
          position: 0,
          money: 1500,
          in_jail: 0,
          is_ready: 1,
          is_bankrupt: 0
        });
        
        // 加入socket.io房间
        socket.join(`room_${room.id}`);
        
        // 存储房间socket映射
        roomSockets.set(room.id, `room_${room.id}`);
        
        // 通知房间内所有玩家
        io.to(`room_${room.id}`).emit('room_created', {
          code: 200,
          data: {
            room: {
              id: room.id,
              name: room.name,
              maxPlayers: room.max_players,
              creatorId: room.creator_id,
              status: 'waiting',
              currentPlayers: 1,
              createdAt: room.created_at
            },
            player: {
              id: player.id,
              userId: player.user_id,
              roomId: player.room_id,
              color: player.color,
              position: player.position,
              money: player.money,
              isReady: player.is_ready,
              createdAt: player.created_at
            }
          }
        });
        
        callback({ 
          code: 200, 
          message: '房间创建成功',
          data: {
            roomId: room.id
          }
        });
      } catch (error) {
        console.error('创建房间错误:', error);
        callback({ code: 500, message: '服务器错误' });
      }
    });

    // 加入房间
    socket.on('join_room', async (data, callback) => {
      try {
        const userId = socket.userId;
        if (!userId) {
          return callback({ code: 401, message: '请先登录' });
        }
        
        const { roomId } = data;
        
        // 验证房间是否存在
        const room = Room.findById(roomId);
        if (!room) {
          return callback({ code: 404, message: '房间不存在' });
        }
        
        // 检查房间状态
        if (room.status !== 'waiting') {
          return callback({ 
            code: 400, 
            message: '游戏已经开始，无法加入' 
          });
        }
        
        // 检查玩家数量
        if (room.current_players >= room.max_players) {
          return callback({ 
            code: 400, 
            message: '房间已满' 
          });
        }
        
        // 检查玩家是否已经在房间中
        const existingPlayer = Player.findByUserIdAndRoom(userId, roomId);
        if (existingPlayer) {
          return callback({ 
            code: 400, 
            message: '您已经在这个房间中' 
          });
        }
        
        // 为新玩家分配颜色
        const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];
        const existingPlayers = Player.findByRoomId(roomId);
        const usedColors = existingPlayers.map(p => p.color);
        const availableColors = colors.filter(color => !usedColors.includes(color));
        const playerColor = availableColors[0] || '#FF0000';
        
        // 创建玩家记录
        const player = Player.create({
          user_id: userId,
          room_id: roomId,
          color: playerColor,
          position: 0,
          money: 1500,
          in_jail: 0,
          is_ready: 1,
          is_bankrupt: 0
        });
        
        // 更新房间玩家数量
        room.current_players += 1;
        Room.update(room.id, { current_players: room.current_players });
        
        // 加入socket.io房间
        socket.join(`room_${roomId}`);
        
        // 通知房间内所有玩家
        io.to(`room_${roomId}`).emit('player_joined', {
          code: 200,
          data: {
            player: {
              id: player.id,
              userId: player.user_id,
              username: socket.username,
              roomId: player.room_id,
              color: player.color,
              position: player.position,
              money: player.money,
              isReady: player.is_ready,
              createdAt: player.created_at
            },
            room: {
              id: room.id,
              name: room.name,
              maxPlayers: room.max_players,
              creatorId: room.creator_id,
              status: room.status,
              currentPlayers: room.current_players,
              createdAt: room.created_at
            }
          }
        });
        
        callback({ 
          code: 200, 
          message: '加入房间成功',
          data: {
            playerId: player.id,
            roomId: room.id
          }
        });
      } catch (error) {
        console.error('加入房间错误:', error);
        callback({ code: 500, message: '服务器错误' });
      }
    });

    // 离开房间
    socket.on('leave_room', async (data, callback) => {
      try {
        const userId = socket.userId;
        if (!userId) {
          return callback({ code: 401, message: '请先登录' });
        }
        
        const { roomId } = data;
        
        // 验证房间是否存在
        const room = Room.findById(roomId);
        if (!room) {
          return callback({ code: 404, message: '房间不存在' });
        }
        
        // 查找玩家记录
        const player = Player.findByUserIdAndRoom(userId, roomId);
        if (!player) {
          return callback({ code: 404, message: '您不在这个房间中' });
        }
        
        // 如果游戏已经开始，标记玩家为破产
        if (room.status === 'playing') {
          Player.update(player.id, { is_bankrupt: 1 });
          
          // 通知房间内所有玩家
          io.to(`room_${roomId}`).emit('player_bankrupt', {
            code: 200,
            data: {
              playerId: player.id,
              userId: player.user_id,
              username: socket.username,
              message: `${socket.username} 已破产退出游戏`
            }
          });
        } else {
          // 如果游戏未开始，直接删除玩家记录
          Player.delete(player.id);
          
          // 更新房间玩家数量
          room.current_players -= 1;
          Room.update(room.id, { current_players: room.current_players });
          
          // 如果房间为空，删除房间
          if (room.current_players === 0) {
            Room.delete(room.id);
            roomSockets.delete(roomId);
          }
        }
        
        // 离开socket.io房间
        socket.leave(`room_${roomId}`);
        
        // 通知房间内所有玩家
        io.to(`room_${roomId}`).emit('player_left', {
          code: 200,
          data: {
            playerId: player.id,
            userId: player.user_id,
            username: socket.username,
            message: `${socket.username} 离开了房间`
          }
        });
        
        callback({ 
          code: 200, 
          message: '离开房间成功'
        });
      } catch (error) {
        console.error('离开房间错误:', error);
        callback({ code: 500, message: '服务器错误' });
      }
    });

    // 玩家准备/取消准备
    socket.on('player_ready', async (data, callback) => {
      try {
        const userId = socket.userId;
        if (!userId) {
          return callback({ code: 401, message: '请先登录' });
        }
        
        const { roomId, isReady } = data;
        
        // 验证房间是否存在
        const room = Room.findById(roomId);
        if (!room) {
          return callback({ code: 404, message: '房间不存在' });
        }
        
        // 查找玩家记录
        const player = Player.findByUserIdAndRoom(userId, roomId);
        if (!player) {
          return callback({ code: 404, message: '您不在这个房间中' });
        }
        
        // 更新玩家准备状态
        const updatedPlayer = Player.update(player.id, { is_ready: isReady ? 1 : 0 });
        
        // 通知房间内所有玩家
        io.to(`room_${roomId}`).emit('player_ready_changed', {
          code: 200,
          data: {
            playerId: updatedPlayer.id,
            userId: updatedPlayer.user_id,
            username: socket.username,
            isReady: updatedPlayer.is_ready,
            message: `${socket.username} ${isReady ? '准备' : '取消准备'}了游戏`
          }
        });
        
        callback({ 
          code: 200, 
          message: isReady ? '准备成功' : '取消准备成功'
        });
      } catch (error) {
        console.error('准备状态变更错误:', error);
        callback({ code: 500, message: '服务器错误' });
      }
    });

    // 房主开始游戏
    socket.on('start_game', async (data, callback) => {
      try {
        const userId = socket.userId;
        if (!userId) {
          return callback({ code: 401, message: '请先登录' });
        }
        
        const { roomId } = data;
        
        // 验证房间是否存在
        const room = Room.findById(roomId);
        if (!room) {
          return callback({ code: 404, message: '房间不存在' });
        }
        
        // 检查是否是房主
        if (room.creator_id !== userId) {
          return callback({ 
            code: 403, 
            message: '只有房主可以开始游戏' 
          });
        }
        
        // 检查房间状态
        if (room.status !== 'waiting') {
          return callback({ 
            code: 400, 
            message: '游戏已经开始' 
          });
        }
        
        // 检查所有玩家是否都准备好了
        const players = Player.findByRoomId(roomId);
        const allReady = players.every(player => player.is_ready === 1);
        if (!allReady) {
          return callback({ 
            code: 400, 
            message: '所有玩家必须都准备好才能开始游戏' 
          });
        }
        
        // 更新房间状态
        Room.update(roomId, { status: 'playing' });
        
        // 初始化游戏状态
        // 这里可以添加更多游戏初始化逻辑
        
        // 通知房间内所有玩家游戏开始
        io.to(`room_${roomId}`).emit('game_started', {
          code: 200,
          data: {
            roomId: room.id,
            name: room.name,
            players: players.map(p => ({
              id: p.id,
              userId: p.user_id,
              username: socket.username,
              color: p.color,
              position: p.position,
              money: p.money,
              isReady: p.is_ready
            }))
          }
        });
        
        callback({ 
          code: 200, 
          message: '游戏开始'
        });
      } catch (error) {
        console.error('开始游戏错误:', error);
        callback({ code: 500, message: '服务器错误' });
      }
    });

    // 处理断开连接
    socket.on('disconnect', () => {
      // 如果用户已登录，处理断开连接逻辑
      if (socket.userId) {
        console.log(`用户 ${socket.username} (ID: ${socket.userId}) 断开连接`);
        
        // 遍历所有房间，查找用户所在的房间
        roomSockets.forEach((roomName, roomId) => {
          const room = Room.findById(roomId);
          if (room) {
            const player = Player.findByUserIdAndRoom(socket.userId, roomId);
            if (player) {
              // 离开房间逻辑（简化版）
              socket.leave(roomName);
              
              // 通知其他玩家
              io.to(roomName).emit('player_disconnected', {
                code: 200,
                data: {
                  playerId: player.id,
                  userId: player.user_id,
                  username: socket.username,
                  message: `${socket.username} 断开了连接`
                }
              });
            }
          }
        });
      }
    });
  };
};