const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const Player = require('../models/Player');
const { authenticateToken } = require('../middleware/auth');

// 获取用户创建的所有房间
router.get('/my-rooms', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const rooms = await Room.findByOwner(userId);
        res.json({
            code: 200,
            data: rooms
        });
    } catch (error) {
        res.status(500).json({
            code: 500,
            message: '获取房间列表失败',
            error: error.message
        });
    }
});

// 获取所有可加入的房间
router.get('/available', authenticateToken, async (req, res) => {
    try {
        const rooms = await Room.findAvailable();
        res.json({
            code: 200,
            data: rooms
        });
    } catch (error) {
        res.status(500).json({
            code: 500,
            message: '获取可用房间失败',
            error: error.message
        });
    }
});

// 创建新房间
router.post('/create', authenticateToken, async (req, res) => {
    try {
        const { name, maxPlayers = 6 } = req.body;
        const userId = req.user.userId;
        
        if (!name || name.trim().length === 0) {
            return res.status(400).json({
                code: 400,
                message: '房间名称不能为空'
            });
        }
        
        if (maxPlayers < 2 || maxPlayers > 8) {
            return res.status(400).json({
                code: 400,
                message: '玩家数量必须在2-8之间'
            });
        }
        
        const room = await Room.create({
            name: name.trim(),
            maxPlayers,
            creatorId: userId
        });
        
        res.status(201).json({
            code: 201,
            message: '房间创建成功',
            data: room
        });
    } catch (error) {
        res.status(500).json({
            code: 500,
            message: '创建房间失败',
            error: error.message
        });
    }
});

// 加入房间
router.post('/join', authenticateToken, async (req, res) => {
    try {
        const { roomId } = req.body;
        const userId = req.user.userId;
        
        if (!roomId) {
            return res.status(400).json({
                code: 400,
                message: '房间ID不能为空'
            });
        }
        
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
                message: '游戏已开始，无法加入'
            });
        }
        
        // 检查玩家数量
        if (room.currentPlayers >= room.maxPlayers) {
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
                message: '您已在房间中'
            });
        }
        
        // 添加玩家到房间
        const player = await Player.create({
            userId,
            roomId,
            color: null, // 将在游戏开始时分配
            position: 0,
            money: 1500,
            inJail: 0,
            isReady: 0
        });
        
        // 更新房间玩家数量
        await Room.updatePlayerCount(roomId, room.currentPlayers + 1);
        
        res.json({
            code: 200,
            message: '加入房间成功',
            data: {
                roomId,
                playerId: player.id
            }
        });
    } catch (error) {
        res.status(500).json({
            code: 500,
            message: '加入房间失败',
            error: error.message
        });
    }
});

// 离开房间
router.post('/leave', authenticateToken, async (req, res) => {
    try {
        const { roomId } = req.body;
        const userId = req.user.userId;
        
        if (!roomId) {
            return res.status(400).json({
                code: 400,
                message: '房间ID不能为空'
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
        
        // 删除玩家
        await Player.delete(player.id);
        
        // 更新房间玩家数量
        const room = await Room.findById(roomId);
        await Room.updatePlayerCount(roomId, room.currentPlayers - 1);
        
        // 如果房间为空，删除房间
        if (room.currentPlayers - 1 === 0) {
            await Room.delete(roomId);
        }
        
        res.json({
            code: 200,
            message: '离开房间成功'
        });
    } catch (error) {
        res.status(500).json({
            code: 500,
            message: '离开房间失败',
            error: error.message
        });
    }
});

// 获取房间详情
router.get('/:roomId', authenticateToken, async (req, res) => {
    try {
        const { roomId } = req.params;
        const userId = req.user.userId;
        
        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({
                code: 404,
                message: '房间不存在'
            });
        }
        
        // 获取房间玩家列表
        const players = await Player.findByRoomId(roomId);
        
        res.json({
            code: 200,
            data: {
                ...room,
                players
            }
        });
    } catch (error) {
        res.status(500).json({
            code: 500,
            message: '获取房间详情失败',
            error: error.message
        });
    }
});

// 更新玩家准备状态
router.put('/ready', authenticateToken, async (req, res) => {
    try {
        const { roomId, isReady } = req.body;
        const userId = req.user.userId;
        
        if (!roomId || typeof isReady !== 'boolean') {
            return res.status(400).json({
                code: 400,
                message: '参数错误'
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
        
        // 更新准备状态
        await Player.update(player.id, { isReady });
        
        res.json({
            code: 200,
            message: '准备状态更新成功'
        });
    } catch (error) {
        res.status(500).json({
            code: 500,
            message: '更新准备状态失败',
            error: error.message
        });
    }
});

// 开始游戏（房主专用）
router.post('/start', authenticateToken, async (req, res) => {
    try {
        const { roomId } = req.body;
        const userId = req.user.userId;
        
        if (!roomId) {
            return res.status(400).json({
                code: 400,
                message: '房间ID不能为空'
            });
        }
        
        // 检查房间是否存在
        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({
                code: 404,
                message: '房间不存在'
            });
        }
        
        // 检查是否为房主
        if (room.creatorId !== userId) {
            return res.status(403).json({
                code: 403,
                message: '只有房主可以开始游戏'
            });
        }
        
        // 检查游戏状态
        if (room.status !== 'waiting') {
            return res.status(400).json({
                code: 400,
                message: '游戏已开始'
            });
        }
        
        // 检查玩家数量
        if (room.currentPlayers < 2) {
            return res.status(400).json({
                code: 400,
                message: '至少需要2名玩家才能开始游戏'
            });
        }
        
        // 检查所有玩家是否都准备好了
        const players = await Player.findByRoomId(roomId);
        const allReady = players.every(p => p.isReady === 1);
        if (!allReady) {
            return res.status(400).json({
                code: 400,
                message: '所有玩家必须都准备好才能开始游戏'
            });
        }
        
        // 开始游戏
        await Room.startGame(roomId);
        
        res.json({
            code: 200,
            message: '游戏开始'
        });
    } catch (error) {
        res.status(500).json({
            code: 500,
            message: '开始游戏失败',
            error: error.message
        });
    }
});

module.exports = router;