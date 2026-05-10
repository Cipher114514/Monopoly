const { db } = require('../db/connection');
const Room = require('../models/Room');
const Player = require('../models/Player');
const Property = require('../models/Property');

// 创建房间
exports.createRoom = async (req, res) => {
    try {
        const { name, maxPlayers = 6 } = req.body;
        
        // 验证参数
        if (!name || name.length < 3 || name.length > 20) {
            return res.status(400).json({
                code: 400,
                message: '房间名称长度必须在3-20个字符之间'
            });
        }
        
        if (maxPlayers < 2 || maxPlayers > 6) {
            return res.status(400).json({
                code: 400,
                message: '最大玩家数必须在2-6之间'
            });
        }
        
        // 创建房间
        const room = await Room.create({
            name,
            maxPlayers,
            creatorId: req.user.userId,
            status: 'waiting'
        });
        
        // 创建玩家记录
        await Player.create({
            userId: req.user.userId,
            roomId: room.id,
            color: '#FF0000', // 默认红色
            position: 0,
            money: 1500,
            inJail: 0,
            isReady: 1,
            isBankrupt: 0
        });
        
        res.status(201).json({
            code: 201,
            message: '房间创建成功',
            data: {
                roomId: room.id,
                name: room.name,
                maxPlayers: room.maxPlayers,
                creatorId: room.creatorId,
                creatorName: req.user.username,
                status: room.status,
                playerCount: 1
            }
        });
    } catch (error) {
        console.error('创建房间错误:', error);
        res.status(500).json({
            code: 500,
            message: '创建房间失败',
            error: error.message
        });
    }
};

// 获取房间列表
exports.getRooms = async (req, res) => {
    try {
        const rooms = await Room.findAll();
        
        // 为每个房间添加玩家数量
        const roomsWithPlayerCount = await Promise.all(rooms.map(async (room) => {
            const players = await Player.findByRoomId(room.id);
            return {
                ...room,
                playerCount: players.length,
                canJoin: players.length < room.maxPlayers && room.status === 'waiting'
            };
        }));
        
        res.json({
            code: 200,
            message: '获取房间列表成功',
            data: roomsWithPlayerCount
        });
    } catch (error) {
        console.error('获取房间列表错误:', error);
        res.status(500).json({
            code: 500,
            message: '获取房间列表失败',
            error: error.message
        });
    }
};

// 加入房间
exports.joinRoom = async (req, res) => {
    try {
        const { roomId } = req.params;
        const userId = req.user.userId;
        
        // 检查房间是否存在
        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({
                code: 404,
                message: '房间不存在'
            });
        }
        
        // 检查房间状态
        if (room.status !== 'waiting') {
            return res.status(400).json({
                code: 400,
                message: '游戏已经开始，无法加入'
            });
        }
        
        // 检查玩家数量
        const players = await Player.findByRoomId(roomId);
        if (players.length >= room.maxPlayers) {
            return res.status(400).json({
                code: 400,
                message: '房间已满'
            });
        }
        
        // 检查玩家是否已在房间中
        const existingPlayer = await Player.findByUserIdAndRoom(userId, roomId);
        if (existingPlayer) {
            return res.status(400).json({
                code: 400,
                message: '您已在该房间中'
            });
        }
        
        // 为玩家分配颜色
        const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];
        const playerColor = colors[players.length] || '#888888';
        
        // 创建玩家记录
        const player = await Player.create({
            userId,
            roomId,
            color: playerColor,
            position: 0,
            money: 1500,
            inJail: 0,
            isReady: 0,
            isBankrupt: 0
        });
        
        // 更新房间玩家数量
        await Room.update(roomId, { 
            playerCount: players.length + 1 
        });
        
        res.json({
            code: 200,
            message: '加入房间成功',
            data: {
                player: {
                    id: player.id,
                    userId: player.userId,
                    color: player.color,
                    position: player.position,
                    money: player.money,
                    isReady: player.isReady
                },
                room: {
                    id: room.id,
                    name: room.name,
                    status: room.status,
                    playerCount: players.length + 1
                }
            }
        });
    } catch (error) {
        console.error('加入房间错误:', error);
        res.status(500).json({
            code: 500,
            message: '加入房间失败',
            error: error.message
        });
    }
};

// 离开房间
exports.leaveRoom = async (req, res) => {
    try {
        const { roomId } = req.params;
        const userId = req.user.userId;
        
        // 检查房间是否存在
        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({
                code: 404,
                message: '房间不存在'
            });
        }
        
        // 查找玩家
        const player = await Player.findByUserIdAndRoom(userId, roomId);
        if (!player) {
            return res.status(404).json({
                code: 404,
                message: '您不在此房间中'
            });
        }
        
        // 删除玩家记录
        await Player.delete(player.id);
        
        // 如果是房主离开，解散房间
        if (room.creatorId === userId) {
            // 删除房间内所有玩家
            const allPlayers = await Player.findByRoomId(roomId);
            for (const p of allPlayers) {
                await Player.delete(p.id);
            }
            
            // 删除房间
            await Room.delete(roomId);
            
            res.json({
                code: 200,
                message: '房主已离开，房间已解散'
            });
        } else {
            // 更新房间玩家数量
            const remainingPlayers = await Player.findByRoomId(roomId);
            await Room.update(roomId, { 
                playerCount: remainingPlayers.length 
            });
            
            res.json({
                code: 200,
                message: '离开房间成功'
            });
        }
    } catch (error) {
        console.error('离开房间错误:', error);
        res.status(500).json({
            code: 500,
            message: '离开房间失败',
            error: error.message
        });
    }
};

// 设置玩家准备状态
exports.setPlayerReady = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { isReady } = req.body;
        const userId = req.user.userId;
        
        // 检查房间是否存在
        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({
                code: 404,
                message: '房间不存在'
            });
        }
        
        // 查找玩家
        const player = await Player.findByUserIdAndRoom(userId, roomId);
        if (!player) {
            return res.status(404).json({
                code: 404,
                message: '您不在此房间中'
            });
        }
        
        // 更新玩家准备状态
        await Player.update(player.id, { isReady });
        
        // 检查是否所有玩家都准备好了
        const players = await Player.findByRoomId(roomId);
        const allReady = players.every(p => p.isReady === 1);
        
        if (allReady && players.length >= 2) {
            // 开始游戏
            await Room.update(roomId, { status: 'playing' });
            
            // 重置所有玩家状态
            for (const p of players) {
                await Player.update(p.id, { 
                    position: 0,
                    money: 1500,
                    inJail: 0,
                    isReady: 1,
                    isBankrupt: 0
                });
            }
        }
        
        res.json({
            code: 200,
            message: '准备状态更新成功',
            data: {
                isReady,
                allPlayersReady: allReady,
                canStart: allReady && players.length >= 2
            }
        });
    } catch (error) {
        console.error('设置准备状态错误:', error);
        res.status(500).json({
            code: 500,
            message: '设置准备状态失败',
            error: error.message
        });
    }
};

// 获取房间信息
exports.getRoomInfo = async (req, res) => {
    try {
        const { roomId } = req.params;
        
        // 检查房间是否存在
        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({
                code: 404,
                message: '房间不存在'
            });
        }
        
        // 获取房间内的玩家
        const players = await Player.findByRoomId(roomId);
        
        // 获取房间内的地产
        const properties = await Property.findByRoomId(roomId);
        
        res.json({
            code: 200,
            message: '获取房间信息成功',
            data: {
                room: {
                    id: room.id,
                    name: room.name,
                    status: room.status,
                    maxPlayers: room.maxPlayers,
                    playerCount: players.length,
                    creatorId: room.creatorId,
                    createdAt: room.createdAt
                },
                players: players.map(p => ({
                    id: p.id,
                    userId: p.userId,
                    username: '', // 需要从users表获取
                    color: p.color,
                    position: p.position,
                    money: p.money,
                    inJail: p.inJail,
                    isReady: p.isReady,
                    isBankrupt: p.isBankrupt
                })),
                properties: properties.map(prop => ({
                    id: prop.id,
                    name: prop.name,
                    position: prop.position,
                    price: prop.price,
                    baseRent: prop.baseRent,
                    colorGroup: prop.colorGroup,
                    houseCount: prop.houseCount,
                    ownerId: prop.ownerId,
                    mortgaged: prop.mortgaged
                }))
            }
        });
    } catch (error) {
        console.error('获取房间信息错误:', error);
        res.status(500).json({
            code: 500,
            message: '获取房间信息失败',
            error: error.message
        });
    }
};