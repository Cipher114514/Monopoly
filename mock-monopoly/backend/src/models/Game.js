/**
 * Game 模型
 * 游戏数据结构和状态管理
 */

class Game {
    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.name = data.name || '新游戏';
        this.roomId = data.roomId || null;
        this.hostId = data.hostId || null;
        this.status = data.status || 'waiting'; // waiting, playing, finished
        this.maxPlayers = data.maxPlayers || 4;
        this.currentPlayerIndex = data.currentPlayerIndex || 0;
        this.round = data.round || 1;
        this.createdAt = data.createdAt || new Date();
        this.updatedAt = data.updatedAt || new Date();

        // 游戏地图（40个格子）
        this.map = this.initializeMap();

        // 玩家列表
        this.players = {};

        // 卡牌组
        this.chanceDeck = this.initializeChanceDeck();
        this.fateDeck = this.initializeFateDeck();

        // 游戏历史（用于回放）
        this.history = [];

        // 游戏设置
        this.settings = {
            startingMoney: data.settings?.startingMoney || 1500,
            passGoReward: data.settings?.passGoReward || 200,
            buildEvenly: data.settings?.buildEvenly !== false, // 是否必须均匀建设
            auctionOnUnowned: data.settings?.auctionOnUnowned || false
        };
    }

    generateId() {
        return 'game_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * 初始化游戏地图（标准大富翁40格）
     */
    initializeMap() {
        const map = [];

        // 0号：起点
        map.push({
            index: 0,
            type: 'start',
            name: '起点',
            description: '每次路过获得200元'
        });

        // 1-10号
        map.push({ index: 1, type: 'property', name: '曼谷', price: 60, baseRent: 2, group: 'brown' });
        map.push({ index: 2, type: 'fate', name: '命运' });
        map.push({ index: 3, type: 'property', name: '台北', price: 60, baseRent: 4, group: 'brown' });
        map.push({ index: 4, type: 'tax', name: '所得税', amount: 200 });
        map.push({ index: 5, type: 'station', name: '台北车站', price: 200, baseRent: 25 });
        map.push({ index: 6, type: 'property', name: '吉隆坡', price: 100, baseRent: 6, group: 'lightblue' });
        map.push({ index: 7, type: 'chance', name: '机会' });
        map.push({ index: 8, type: 'property', name: '雅加达', price: 100, baseRent: 6, group: 'lightblue' });
        map.push({ index: 9, type: 'property', name: '马尼拉', price: 120, baseRent: 8, group: 'lightblue' });
        map.push({ index: 10, type: 'jail', name: '监狱' });

        // 11-20号
        map.push({ index: 11, type: 'property', name: '新加坡', price: 140, baseRent: 10, group: 'pink' });
        map.push({ index: 12, type: 'utility', name: '电力公司', price: 150, baseRent: 20 });
        map.push({ index: 13, type: 'property', name: '河内', price: 140, baseRent: 10, group: 'pink' });
        map.push({ index: 14, type: 'property', name: '胡志明市', price: 160, baseRent: 12, group: 'pink' });
        map.push({ index: 15, type: 'station', name: '曼谷车站', price: 200, baseRent: 25 });
        map.push({ index: 16, type: 'property', name: ' Mumbai', price: 180, baseRent: 14, group: 'orange' });
        map.push({ index: 17, type: 'fate', name: '命运' });
        map.push({ index: 18, type: 'property', name: '新德里', price: 180, baseRent: 14, group: 'orange' });
        map.push({ index: 19, type: 'property', name: '班加罗尔', price: 200, baseRent: 16, group: 'orange' });
        map.push({ index: 20, type: 'parking', name: '免费停车' });

        // 21-30号
        map.push({ index: 21, type: 'property', name: '北京', price: 220, baseRent: 18, group: 'red' });
        map.push({ index: 22, type: 'chance', name: '机会' });
        map.push({ index: 23, type: 'property', name: '上海', price: 220, baseRent: 18, group: 'red' });
        map.push({ index: 24, type: 'property', name: '深圳', price: 240, baseRent: 20, group: 'red' });
        map.push({ index: 25, type: 'station', name: '新加坡车站', price: 200, baseRent: 25 });
        map.push({ index: 26, type: 'property', name: '香港', price: 260, baseRent: 22, group: 'yellow' });
        map.push({ index: 27, type: 'property', name: '东京', price: 260, baseRent: 22, group: 'yellow' });
        map.push({ index: 28, type: 'utility', name: '水务公司', price: 150, baseRent: 20 });
        map.push({ index: 29, type: 'property', name: '首尔', price: 280, baseRent: 24, group: 'yellow' });
        map.push({ index: 30, type: 'goto_jail', name: '去坐牢' });

        // 31-39号
        map.push({ index: 31, type: 'property', name: '伦敦', price: 300, baseRent: 26, group: 'green' });
        map.push({ index: 32, type: 'property', name: '巴黎', price: 300, baseRent: 26, group: 'green' });
        map.push({ index: 33, type: 'fate', name: '命运' });
        map.push({ index: 34, type: 'property', name: '纽约', price: 320, baseRent: 28, group: 'green' });
        map.push({ index: 35, type: 'station', name: '香港车站', price: 200, baseRent: 25 });
        map.push({ index: 36, type: 'chance', name: '机会' });
        map.push({ index: 37, type: 'property', name: '悉尼', price: 350, baseRent: 35, group: 'blue' });
        map.push({ index: 38, type: 'tax', name: '奢侈税', amount: 100 });
        map.push({ index: 39, type: 'property', name: '莫斯科', price: 400, baseRent: 50, group: 'blue' });

        // 初始化地产状态
        map.forEach(tile => {
            if (tile.type === 'property') {
                tile.ownerId = null;
                tile.buildings = 0;
                tile.isMortgaged = false;
                tile.group = tile.group || null;
            } else if (tile.type === 'station' || tile.type === 'utility') {
                tile.ownerId = null;
                tile.isMortgaged = false;
            }
        });

        return map;
    }

    /**
     * 初始化机会卡牌
     */
    initializeChanceDeck() {
        return [
            { id: 1, type: 'advance', description: '前进到起点', action: 'move_to_start' },
            { id: 2, type: 'advance', description: '前进到最近的车站', action: 'move_to_station' },
            { id: 3, type: 'money', amount: 50, description: '银行分红，获得50元' },
            { id: 4, type: 'money', amount: -50, description: '支付医院费用50元' },
            { id: 5, type: 'jail', description: '入狱', action: 'go_to_jail' },
            { id: 6, type: 'money', amount: 100, description: '人寿保险，获得100元' },
            { id: 7, type: 'move', steps: -3, description: '后退3步' },
            { id: 8, type: 'money', amount: -100, description: '支付学费100元' }
        ];
    }

    /**
     * 初始化命运卡牌
     */
    initializeFateDeck() {
        return [
            { id: 1, type: 'money', amount: 200, description: '中彩票，获得200元' },
            { id: 2, type: 'money', amount: -100, description: '房屋维修费100元' },
            { id: 3, type: 'money', amount: 50, description: '股票收益，获得50元' },
            { id: 4, type: 'jail_free', description: '出狱卡' },
            { id: 5, type: 'money', amount: -50, description: '医生诊费50元' },
            { id: 6, type: 'money', amount: 100, description: '退税，获得100元' }
        ];
    }

    /**
     * 添加玩家
     */
    addPlayer(player) {
        if (Object.keys(this.players).length >= this.maxPlayers) {
            throw new Error('游戏房间已满');
        }

        this.players[player.id] = {
            ...player,
            money: this.settings.startingMoney,
            position: 0,
            jailed: false,
            jailTurns: 0,
            bankrupt: false,
            jailFreeCards: 0,
            properties: [],
            canRoll: true,
            createdAt: new Date()
        };

        this.history.push({
            type: 'player_joined',
            playerId: player.id,
            timestamp: new Date()
        });

        return this.players[player.id];
    }

    /**
     * 移除玩家
     */
    removePlayer(playerId) {
        if (!this.players[playerId]) {
            throw new Error('玩家不存在');
        }

        // 返还所有地产
        this.map.forEach(tile => {
            if (tile.ownerId === playerId) {
                tile.ownerId = null;
                tile.buildings = 0;
                tile.isMortgaged = false;
            }
        });

        delete this.players[playerId];

        this.history.push({
            type: 'player_left',
            playerId: playerId,
            timestamp: new Date()
        });
    }

    /**
     * 获取当前玩家
     */
    getCurrentPlayer() {
        const playerIds = Object.keys(this.players);
        if (playerIds.length === 0) return null;
        const playerId = playerIds[this.currentPlayerIndex];
        return this.players[playerId];
    }

    /**
     * 下一个玩家
     */
    nextPlayer() {
        const playerIds = Object.keys(this.players);
        if (playerIds.length === 0) return null;

        do {
            this.currentPlayerIndex = (this.currentPlayerIndex + 1) % playerIds.length;
        } while (
            this.players[playerIds[this.currentPlayerIndex]].bankrupt &&
            !this.allPlayersBankrupt()
        );

        const currentPlayer = this.getCurrentPlayer();
        currentPlayer.canRoll = true;

        return currentPlayer;
    }

    /**
     * 检查是否所有玩家都破产
     */
    allPlayersBankrupt() {
        const players = Object.values(this.players);
        if (players.length === 0) return false;
        return players.every(p => p.bankrupt);
    }

    /**
     * 记录游戏历史
     */
    recordHistory(event) {
        this.history.push({
            ...event,
            timestamp: new Date(),
            round: this.round,
            currentPlayerIndex: this.currentPlayerIndex
        });
    }

    /**
     * 保存游戏状态
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            roomId: this.roomId,
            hostId: this.hostId,
            status: this.status,
            maxPlayers: this.maxPlayers,
            currentPlayerIndex: this.currentPlayerIndex,
            round: this.round,
            map: this.map,
            players: this.players,
            chanceDeck: this.chanceDeck,
            fateDeck: this.fateDeck,
            history: this.history,
            settings: this.settings,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

module.exports = Game;
