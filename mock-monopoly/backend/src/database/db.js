/**
 * 数据库连接和查询
 * 模拟 SQLite 数据库操作
 */

class Database {
    constructor() {
        // 内存数据库（模拟）
        this.games = new Map();
        this.rooms = new Map();
        this.users = new Map();
    }

    /**
     * 生成唯一ID
     */
    generateId(prefix = 'id') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // ==================== 游戏操作 ====================

    /**
     * 创建游戏
     */
    async createGame(gameData) {
        const gameId = gameData.id || this.generateId('game');
        this.games.set(gameId, gameData);
        return gameData;
    }

    /**
     * 获取游戏
     */
    async getGame(gameId) {
        return this.games.get(gameId);
    }

    /**
     * 更新游戏
     */
    async updateGame(gameId, updates) {
        const game = this.games.get(gameId);
        if (!game) {
            throw new Error('游戏不存在');
        }

        const updated = { ...game, ...updates, updatedAt: new Date() };
        this.games.set(gameId, updated);
        return updated;
    }

    /**
     * 删除游戏
     */
    async deleteGame(gameId) {
        return this.games.delete(gameId);
    }

    /**
     * 获取所有游戏
     */
    async getAllGames() {
        return Array.from(this.games.values());
    }

    // ==================== 房间操作 ====================

    /**
     * 创建房间
     */
    async createRoom(roomData) {
        const roomId = roomData.id || this.generateId('room');
        const room = {
            id: roomId,
            name: roomData.name,
            hostId: roomData.hostId,
            maxPlayers: roomData.maxPlayers || 4,
            players: [],
            status: 'waiting',
            settings: roomData.settings || {},
            createdAt: new Date()
        };
        this.rooms.set(roomId, room);
        return room;
    }

    /**
     * 获取房间
     */
    async getRoom(roomId) {
        return this.rooms.get(roomId);
    }

    /**
     * 更新房间
     */
    async updateRoom(roomId, updates) {
        const room = this.rooms.get(roomId);
        if (!room) {
            throw new Error('房间不存在');
        }

        const updated = { ...room, ...updates };
        this.rooms.set(roomId, updated);
        return updated;
    }

    /**
     * 删除房间
     */
    async deleteRoom(roomId) {
        return this.rooms.delete(roomId);
    }

    /**
     * 获取所有房间
     */
    async getAllRooms() {
        return Array.from(this.rooms.values());
    }

    // ==================== 用户操作 ====================

    /**
     * 创建用户
     */
    async createUser(userData) {
        const userId = userData.id || this.generateId('user');
        const user = {
            id: userId,
            username: userData.username,
            password: userData.password,
            email: userData.email,
            avatar: userData.avatar,
            stats: {
                gamesPlayed: 0,
                gamesWon: 0,
                totalMoney: 0
            },
            createdAt: new Date()
        };
        this.users.set(userId, user);
        return user;
    }

    /**
     * 获取用户
     */
    async getUser(userId) {
        return this.users.get(userId);
    }

    /**
     * 根据用户名获取用户
     */
    async getUserByUsername(username) {
        const users = Array.from(this.users.values());
        return users.find(u => u.username === username);
    }

    /**
     * 更新用户
     */
    async updateUser(userId, updates) {
        const user = this.users.get(userId);
        if (!user) {
            throw new Error('用户不存在');
        }

        const updated = { ...user, ...updates };
        this.users.set(userId, updated);
        return updated;
    }

    /**
     * 验证用户登录
     */
    async validateUser(username, password) {
        const user = await this.getUserByUsername(username);
        if (!user) {
            return { success: false, error: '用户不存在' };
        }

        if (user.password !== password) {
            return { success: false, error: '密码错误' };
        }

        return { success: true, user };
    }

    // ==================== 统计操作 ====================

    /**
     * 获取游戏统计
     */
    async getGameStats() {
        const games = Array.from(this.games.values());
        const activeGames = games.filter(g => g.status === 'playing').length;
        const waitingGames = games.filter(g => g.status === 'waiting').length;
        const finishedGames = games.filter(g => g.status === 'finished').length;

        return {
            total: games.length,
            active: activeGames,
            waiting: waitingGames,
            finished: finishedGames
        };
    }

    /**
     * 获取用户统计
     */
    async getUserStats(userId) {
        const user = await this.getUser(userId);
        if (!user) {
            throw new Error('用户不存在');
        }

        return user.stats;
    }

    /**
     * 更新用户统计
     */
    async updateUserStats(userId, statsUpdates) {
        const user = await this.getUser(userId);
        if (!user) {
            throw new Error('用户不存在');
        }

        user.stats = { ...user.stats, ...statsUpdates };
        await this.updateUser(userId, user);
        return user.stats;
    }
}

// 单例模式
const db = new Database();

module.exports = db;
