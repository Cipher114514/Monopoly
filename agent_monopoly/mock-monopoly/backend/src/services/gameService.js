const Database = require('better-sqlite3');
const db = new Database('./data/monopoly.db', { verbose: console.log });

class GameService {
    constructor() {
        this.initializeDatabase();
    }

    initializeDatabase() {
        // 创建游戏相关表
        db.exec(`
            CREATE TABLE IF NOT EXISTS games (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                status TEXT NOT NULL CHECK(status IN ('waiting', 'playing', 'finished')),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                started_at DATETIME,
                finished_at DATETIME
            );
        `);

        db.exec(`
            CREATE TABLE IF NOT EXISTS players (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                game_id INTEGER NOT NULL,
                position INTEGER NOT NULL DEFAULT 0,
                money INTEGER NOT NULL DEFAULT 1500,
                in_jail BOOLEAN DEFAULT FALSE,
                jail_turns INTEGER DEFAULT 0,
                bankrupt BOOLEAN DEFAULT FALSE,
                order INTEGER NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (game_id) REFERENCES games(id),
                UNIQUE(user_id, game_id)
            );
        `);

        db.exec(`
            CREATE TABLE IF NOT EXISTS properties (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                game_id INTEGER NOT NULL,
                position INTEGER NOT NULL,
                name TEXT NOT NULL,
                price INTEGER NOT NULL,
                rent INTEGER NOT NULL,
                owner_id INTEGER,
                houses INTEGER DEFAULT 0,
                hotel BOOLEAN DEFAULT FALSE,
                FOREIGN KEY (game_id) REFERENCES games(id),
                FOREIGN KEY (owner_id) REFERENCES players(id)
            );
        `);

        db.exec(`
            CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                game_id INTEGER NOT NULL,
                player_id INTEGER NOT NULL,
                amount INTEGER NOT NULL,
                type TEXT NOT NULL CHECK(type IN ('rent', 'purchase', 'pass_go', 'card', 'fine')),
                description TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (game_id) REFERENCES games(id),
                FOREIGN KEY (player_id) REFERENCES players(id)
            );
        `);

        db.exec(`
            CREATE TABLE IF NOT EXISTS cards (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                type TEXT NOT NULL CHECK(type IN ('chance', 'community')),
                position INTEGER NOT NULL,
                description TEXT NOT NULL,
                action TEXT NOT NULL,
                value INTEGER
            );
        `);

        // 初始化机会卡和命运卡
        this.initializeCards();
    }

    initializeCards() {
        // 清空现有卡片
        db.prepare('DELETE FROM cards').run();

        // 添加机会卡
        const chanceCards = [
            { type: 'chance', position: 7, description: '前进到起点', action: 'move', value: 0 },
            { type: 'chance', position: 22, description: '前进到伊利诺伊大道', action: 'move', value: 24 },
            { type: 'chance', position: 36, description: '前进到圣查尔斯广场', action: 'move', value: 11 },
            { type: 'chance', position: 7, description: '银行支付你$50', action: 'money', value: 50 },
            { type: 'chance', position: 22, description: '获得$150', action: 'money', value: 150 },
            { type: 'chance', position: 36, description: '获得$100', action: 'money', value: 100 },
            { type: 'chance', position: 7, description: '支付$15修理费', action: 'fine', value: 15 },
            { type: 'chance', position: 22, description: '支付$40修理费', action: 'fine', value: 40 },
            { type: 'chance', position: 36, description: '支付$25修理费', action: 'fine', value: 25 },
            { type: 'chance', position: 7, description: '出狱卡', action: 'jail_free', value: null },
            { type: 'chance', position: 22, description: '退回3格', action: 'move_back', value: 3 },
            { type: 'chance', position: 36, description: '去监狱', action: 'go_to_jail', value: null },
            { type: 'chance', position: 7, description: '每人支付你$50', action: 'collect_from_all', value: 50 },
            { type: 'chance', position: 22, description: '你被选为市委会主席', action: 'chairman', value: 50 },
            { type: 'chance', position: 36, description: '建设费', action: 'building_fine', value: 115 }
        ];

        // 添加命运卡
        const communityCards = [
            { type: 'community', position: 2, description: '从银行获得$200', action: 'money', value: 200 },
            { type: 'community', position: 17, description: '从银行获得$100', action: 'money', value: 100 },
            { type: 'community', position: 33, description: '医生费用，支付$50', action: 'fine', value: 50 },
            { type: 'community', position: 2, description: '医院费用，支付$100', action: 'fine', value: 100 },
            { type: 'community', position: 17, description: '收到$20利息', action: 'money', value: 20 },
            { type: 'community', position: 33, description: '收入退税，获得$20', action: 'money', value: 20 },
            { type: 'community', position: 2, description: '出狱卡', action: 'jail_free', value: null },
            { type: 'community', position: 17, description: '去监狱', action: 'go_to_jail', value: null },
            { type: 'community', position: 33, description: '所有人付给你$50', action: 'collect_from_all', value: 50 },
            { type: 'community', position: 2, description: '生日快乐，每个人给你$10', action: 'collect_from_all', value: 10 },
            { type: 'community', position: 17, description: '你继承了$100', action: 'money', value: 100 },
            { type: 'community', position: 33, description: '股票分红，获得$50', action: 'money', value: 50 },
            { type: 'community', position: 2, description: '支付$150修理费', action: 'fine', value: 150 },
            { type: 'community', position: 17, description: '支付$40修理费', action: 'fine', value: 40 },
            { type: 'community', position: 33, description: '支付$25修理费', action: 'fine', value: 25 },
            { type: 'community', position: 2, description: '错误，从银行获得$200', action: 'money', value: 200 }
        ];

        // 插入机会卡
        const insertChanceCard = db.prepare(`
            INSERT INTO cards (type, position, description, action, value)
            VALUES (?, ?, ?, ?, ?)
        `);

        for (const card of chanceCards) {
            insertChanceCard.run(card.type, card.position, card.description, card.action, card.value);
        }

        // 插入命运卡
        const insertCommunityCard = db.prepare(`
            INSERT INTO cards (type, position, description, action, value)
            VALUES (?, ?, ?, ?, ?)
        `);

        for (const card of communityCards) {
            insertCommunityCard.run(card.type, card.position, card.description, card.action, card.value);
        }
    }

    // 创建新游戏
    createGame(gameName) {
        const stmt = db.prepare(`
            INSERT INTO games (name, status)
            VALUES (?, 'waiting')
        `);
        const result = stmt.run(gameName);
        return result.lastInsertRowid;
    }

    // 加入游戏
    joinGame(gameId, userId) {
        // 检查游戏是否存在且状态为等待中
        const game = db.prepare('SELECT * FROM games WHERE id = ? AND status = "waiting"').get(gameId);
        if (!game) {
            throw new Error('游戏不存在或已开始');
        }

        // 检查玩家是否已在游戏中
        const existingPlayer = db.prepare('SELECT * FROM players WHERE user_id = ? AND game_id = ?').get(userId, gameId);
        if (existingPlayer) {
            throw new Error('玩家已在游戏中');
        }

        // 检查游戏是否已满
        const playerCount = db.prepare('SELECT COUNT(*) as count FROM players WHERE game_id = ?').get(gameId).count;
        if (playerCount >= 6) {
            throw new Error('游戏已满');
        }

        // 添加玩家到游戏
        const stmt = db.prepare(`
            INSERT INTO players (user_id, game_id, position, money, order)
            VALUES (?, ?, 0, 1500, ?)
        `);
        stmt.run(userId, gameId, playerCount + 1);

        return true;
    }

    // 开始游戏
    startGame(gameId) {
        // 检查游戏状态
        const game = db.prepare('SELECT * FROM games WHERE id = ?').get(gameId);
        if (!game || game.status !== 'waiting') {
            throw new Error('游戏无法开始');
        }

        // 检查玩家数量
        const playerCount = db.prepare('SELECT COUNT(*) as count FROM players WHERE game_id = ? AND bankrupt = 0').get(gameId).count;
        if (playerCount < 2) {
            throw new Error('至少需要2名玩家才能开始游戏');
        }

        // 初始化地产
        this.initializeProperties(gameId);

        // 更新游戏状态
        const stmt = db.prepare(`
            UPDATE games
            SET status = 'playing', started_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `);
        stmt.run(gameId);

        return true;
    }

    // 初始化地产
    initializeProperties(gameId) {
        // 清空现有地产
        db.prepare('DELETE FROM properties WHERE game_id = ?').run(gameId);

        // 地产数据
        const properties = [
            { position: 1, name: '地中海大道', price: 60, rent: 2 },
            { position: 3, name: '波罗的海大道', price: 60, rent: 4 },
            { position: 6, name: '东方大道', price: 100, rent: 6 },
            { position: 8, name: '佛蒙特大道', price: 100, rent: 6 },
            { position: 9, name: '康涅狄格大道', price: 120, rent: 8 },
            { position: 11, name: '圣查尔斯广场', price: 140, rent: 10 },
            { position: 13, name: '州大道', price: 140, rent: 10 },
            { position: 14, name: '弗吉尼亚大道', price: 160, rent: 12 },
            { position: 16, name: '詹姆斯大道', price: 180, rent: 14 },
            { position: 18, name: '田纳西大道', price: 180, rent: 14 },
            { position: 19, name: '纽约大道', price: 200, rent: 16 },
            { position: 21, name: '肯塔基大道', price: 220, rent: 18 },
            { position: 23, name: '印第安纳大道', price: 220, rent: 18 },
            { position: 24, name: '伊利诺伊大道', price: 240, rent: 20 },
            { position: 26, name: '亚特兰大道', price: 260, rent: 22 },
            { position: 27, name: '马文花园', price: 280, rent: 24 },
            { position: 29, name: '太平洋大道', price: 300, rent: 26 },
            { position: 31, name: '北卡罗来纳大道', price: 300, rent: 26 },
            { position: 32, name: '宾夕法尼亚大道', price: 320, rent: 28 },
            { position: 34, name: '公园广场', price: 350, rent: 35 },
            { position: 37, name: '板栗大道', price: 350, rent: 35 },
            { position: 39, name: '百老汇大道', price: 400, rent: 50 }
        ];

        // 插入地产
        const insertProperty = db.prepare(`
            INSERT INTO properties (game_id, position, name, price, rent)
            VALUES (?, ?, ?, ?, ?)
        `);

        for (const property of properties) {
            insertProperty.run(gameId, property.position, property.name, property.price, property.rent);
        }
    }

    // 掷骰子
    rollDice(gameId, userId) {
        // 检查游戏状态
        const game = db.prepare('SELECT * FROM games WHERE id = ?').get(gameId);
        if (!game || game.status !== 'playing') {
            throw new Error('游戏未开始');
        }

        // 检查玩家是否在游戏中
        const player = db.prepare('SELECT * FROM players WHERE user_id = ? AND game_id = ? AND bankrupt = 0').get(userId, gameId);
        if (!player) {
            throw new Error('玩家不在游戏中或已破产');
        }

        // 检查玩家是否在监狱中
        if (player.in_jail) {
            throw new Error('玩家在监狱中，无法掷骰子');
        }

        // 生成随机骰子点数
        const dice1 = Math.floor(Math.random() * 6) + 1;
        const dice2 = Math.floor(Math.random() * 6) + 1;
        const total = dice1 + dice2;

        // 记录掷骰子结果
        const rollResult = {
            dice1,
            dice2,
            total,
            player: {
                id: player.id,
                user_id: player.user_id,
                position: player.position,
                money: player.money,
                in_jail: player.in_jail
            }
        };

        // 移动玩家
        const newPosition = this.movePlayer(gameId, player.id, total);

        // 检查是否经过起点
        if (newPosition < player.position) {
            this.passGo(player.id);
        }

        // 处理格子效果
        const spaceEffect = this.handleSpaceEffect(gameId, player.id, newPosition);

        // 更新返回结果
        rollResult.player.position = newPosition;
        rollResult.player.money = db.prepare('SELECT money FROM players WHERE id = ?').get(player.id).money;
        rollResult.spaceEffect = spaceEffect;

        // 检查是否掷出双骰子
        rollResult.isDouble = dice1 === dice2;

        return rollResult;
    }

    // 移动玩家
    movePlayer(gameId, playerId, steps) {
        const player = db.prepare('SELECT * FROM players WHERE id = ?').get(playerId);
        let newPosition = player.position + steps;

        // 如果超过40格（一圈），回到起点并经过起点
        if (newPosition >= 40) {
            newPosition = newPosition % 40;
        }

        // 更新玩家位置
        const stmt = db.prepare(`
            UPDATE players
            SET position = ?
            WHERE id = ?
        `);
        stmt.run(newPosition, playerId);

        return newPosition;
    }

    // 经过起点
    passGo(playerId) {
        const amount = 200;
        const stmt = db.prepare(`
            UPDATE players
            SET money = money + ?
            WHERE id = ?
        `);
        stmt.run(amount, playerId);

        // 记录交易
        const transactionStmt = db.prepare(`
            INSERT INTO transactions (player_id, amount, type, description)
            VALUES (?, ?, 'pass_go', '经过起点获得$200')
        `);
        transactionStmt.run(playerId, amount);

        return amount;
    }

    // 处理格子效果
    handleSpaceEffect(gameId, playerId, position) {
        // 获取格子信息
        const space = db.prepare('SELECT * FROM properties WHERE game_id = ? AND position = ?').get(gameId, position);

        if (!space) {
            // 特殊格子（机会卡、命运卡、税收等）
            return this.handleSpecialSpace(gameId, playerId, position);
        } else {
            // 地产格子
            return this.handlePropertySpace(gameId, playerId, space);
        }
    }

    // 处理特殊格子
    handleSpecialSpace(gameId, playerId, position) {
        // 起点格子
        if (position === 0) {
            return { type: 'start', message: '欢迎回到起点！' };
        }

        // 税收格子
        if (position === 4) {
            const tax = 200;
            this.updatePlayerMoney(playerId, -tax);
            
            // 记录交易
            const transactionStmt = db.prepare(`
                INSERT INTO transactions (player_id, amount, type, description)
                VALUES (?, ?, 'tax', '所得税 $200')
            `);
            transactionStmt.run(playerId, tax);

            return { type: 'tax', amount: tax, message: `支付所得税 $200` };
        }

        if (position === 38) {
            const tax = 100;
            this.updatePlayerMoney(playerId, -tax);
            
            // 记录交易
            const transactionStmt = db.prepare(`
                INSERT INTO transactions (player_id, amount, type, description)
                VALUES (?, ?, 'tax', '豪华税 $100')
            `);
            transactionStmt.run(playerId, tax);

            return { type: 'tax', amount: tax, message: `支付豪华税 $100` };
        }

        // 监狱格子
        if (position === 30) {
            const stmt = db.prepare(`
                UPDATE players
                SET in_jail = TRUE, jail_turns = 3
                WHERE id = ?
            `);
            stmt.run(playerId);

            return { type: 'go_to_jail', message: '你去监狱了！' };
        }

        // 机会卡格子
        if (position === 7 || position === 22 || position === 36) {
            return this.drawCard(gameId, playerId, 'chance');