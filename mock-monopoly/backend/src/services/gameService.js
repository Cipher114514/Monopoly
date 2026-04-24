/**
 * GameService - 游戏核心逻辑（完整版）
 * 包含回合管理、掷骰子、移动、事件处理等
 */

const db = require('../database/db');

class GameService {
    constructor() {
        this.db = db;
    }

    /**
     * 创建新游戏
     */
    async createGame(hostId, gameData) {
        const Game = require('../models/Game');
        const game = new Game({
            ...gameData,
            hostId: gameId,
            status: 'waiting'
        });

        await this.db.createGame(game);
        return game;
    }

    /**
     * 加入游戏
     */
    async joinGame(gameId, playerData) {
        const game = await this.db.getGame(gameId);
        if (!game) {
            throw new Error('游戏不存在');
        }

        if (game.status !== 'waiting') {
            throw new Error('游戏已开始或已结束');
        }

        const player = game.addPlayer(playerData);
        await this.db.updateGame(gameId, game);

        return { game, player };
    }

    /**
     * 开始游戏
     */
    async startGame(gameId) {
        const game = await this.db.getGame(gameId);
        if (!game) {
            throw new Error('游戏不存在');
        }

        const playerCount = Object.keys(game.players).length;
        if (playerCount < 2) {
            throw new Error('至少需要2名玩家才能开始游戏');
        }

        game.status = 'playing';
        game.round = 1;
        game.currentPlayerIndex = 0;

        // 给第一个玩家设置可以掷骰子
        const firstPlayer = game.getCurrentPlayer();
        firstPlayer.canRoll = true;

        game.recordHistory({
            type: 'game_started',
            playerCount: playerCount
        });

        await this.db.updateGame(gameId, game);
        return game;
    }

    /**
     * 掷骰子移动
     * ✅ 正确实现起点规则：路过发钱，停着不发
     */
    async rollDice(gameId, playerId) {
        const game = await this.db.getGame(gameId);
        if (!game) {
            throw new Error('游戏不存在');
        }

        if (game.status !== 'playing') {
            throw new Error('游戏未开始');
        }

        const player = game.players[playerId];
        if (!player) {
            throw new Error('玩家不在游戏中');
        }

        if (!player.canRoll) {
            throw new Error('不是你的回合');
        }

        if (player.jailed) {
            throw new Error('你在坐牢中');
        }

        if (player.bankrupt) {
            throw new Error('你已破产');
        }

        // 掷骰子（1-6）
        const dice1 = Math.floor(Math.random() * 6) + 1;
        const dice2 = Math.floor(Math.random() * 6) + 1;
        const dice = dice1 + dice2;

        // 计算移动
        const oldPos = player.position;
        let newPos = (oldPos + dice) % 40;

        // ✅ 正确：判断是否路过起点
        let passedStart = false;
        if (oldPos < 40 && newPos < oldPos) {
            passedStart = true;
        } else if (oldPos >= 40 && newPos < oldPos - 40) {
            passedStart = true;
        }

        // ✅ 正确：路过起点发钱，停在起点不发
        if (passedStart && newPos !== 0) {
            const reward = game.settings.passGoReward;
            player.money += reward;
            game.recordHistory({
                type: 'pass_start',
                playerId: playerId,
                amount: reward
            });
        }

        player.position = newPos;
        player.canRoll = false;

        game.recordHistory({
            type: 'roll_dice',
            playerId: playerId,
            dice1: dice1,
            dice2: dice2,
            total: dice,
            oldPos: oldPos,
            newPos: newPos,
            passedStart: passedStart
        });

        // 触发地块事件
        await this.handleTileEvent(game, player, newPos);

        await this.db.updateGame(gameId, game);

        return {
            dice1,
            dice2,
            total: dice,
            newPos,
            passedStart,
            money: player.money
        };
    }

    /**
     * 处理地块事件
     */
    async handleTileEvent(game, player, tileIndex) {
        const tile = game.map[tileIndex];

        switch (tile.type) {
            case 'property':
            case 'station':
            case 'utility':
                await this.handlePropertyTile(game, player, tile);
                break;

            case 'chance':
            case 'fate':
                await this.drawCard(game, player, tile.type);
                break;

            case 'jail':
                player.jailed = true;
                player.jailTurns = 1;
                game.recordHistory({
                    type: 'jail_visit',
                    playerId: playerId
                });
                break;

            case 'goto_jail':
                player.position = 10; // 坐牢格位置
                player.jailed = true;
                player.jailTurns = 2;
                game.recordHistory({
                    type: 'goto_jail',
                    playerId: playerId
                });
                break;

            case 'tax':
                await this.payTax(game, player, tile);
                break;

            case 'parking':
                // 免费停车，什么都不做
                break;
        }
    }

    /**
     * 处理地产类地块
     */
    async handlePropertyTile(game, player, tile) {
        if (!tile.ownerId) {
            // 空地，可以购买
            player.canBuy = true;
        } else if (tile.ownerId === player.id) {
            // 自己的地，什么都不做
        } else {
            // 别人的地，付过路费
            await this.payRent(game, player, tile);
        }
    }

    /**
     * 支付过路费
     * ✅ 正确实现：抵押期间不收过路费
     */
    async payRent(gameId, playerId, tileIndex) {
        const game = await this.db.getGame(gameId);
        const player = game.players[playerId];
        const tile = game.map[tileIndex];

        // ✅ 正确：抵押期间不收过路费
        if (tile.isMortgaged) {
            game.recordHistory({
                type: 'rent_waived',
                playerId: playerId,
                reason: 'mortgaged'
            });
            return;
        }

        const owner = game.players[tile.ownerId];
        if (!owner || owner.bankrupt) {
            // 地主破产了，不需要付过路费
            return;
        }

        const rent = this.calculateRent(tile);

        if (player.money < rent) {
            // 触发破产流程
            await this.handleBankruptcy(gameId, playerId, tile.ownerId, rent);
        } else {
            player.money -= rent;
            owner.money += rent;

            game.recordHistory({
                type: 'pay_rent',
                playerId: playerId,
                ownerId: tile.ownerId,
                amount: rent
            });
        }

        await this.db.updateGame(gameId, game);
    }

    /**
     * 计算过路费
     */
    calculateRent(tile) {
        // 基础租金
        let rent = tile.baseRent;

        if (tile.type === 'property') {
            // 根据建筑数量计算租金
            if (tile.buildings === 1) {
                rent = tile.baseRent * 5;
            } else if (tile.buildings === 2) {
                rent = tile.baseRent * 10;
            } else if (tile.buildings === 3) {
                rent = tile.baseRent * 15;
            } else if (tile.buildings === 4) {
                rent = tile.baseRent * 20;
            } else if (tile.buildings === 5) {
                rent = tile.baseRent * 25;
            }

            // 检查是否拥有同色组所有地产
            // （简化版本，实际需要检查）
        } else if (tile.type === 'station') {
            // 车站租金根据拥有的车站数量
            // （简化版本）
            rent = tile.baseRent;
        } else if (tile.type === 'utility') {
            // 水电公司租金
            // （简化版本）
            rent = tile.baseRent;
        }

        return rent;
    }

    /**
     * 抽卡
     * ❌ BUG #004: 卡牌用完不循环（应该移到队尾）
     */
    async drawCard(game, player, cardType) {
        const deck = cardType === 'chance' ? game.chanceDeck : game.fateDeck;

        if (deck.length === 0) {
            // ❌ 错误：卡牌用完了，没有重新洗牌
            game.recordHistory({
                type: 'deck_empty',
                cardType: cardType
            });
            return;
        }

        const card = deck[0]; // 取队首
        deck.shift(); // 移除队首

        // ❌ 错误：应该移到队尾（循环），但没有做
        // deck.push(card);  // 这行被注释掉了！

        // 执行卡牌效果
        await this.executeCardEffect(game, player, card);
    }

    /**
     * 执行卡牌效果
     */
    async executeCardEffect(game, player, card) {
        switch (card.type) {
            case 'money':
                player.money += card.amount;
                break;

            case 'jail_free':
                player.jailFreeCards += 1;
                break;

            case 'jail':
                player.position = 10;
                player.jailed = true;
                player.jailTurns = 2;
                break;

            case 'move_to_start':
                player.position = 0;
                player.money += game.settings.passGoReward;
                break;

            case 'advance':
                // 前进到指定类型的地块
                // （简化实现）
                break;

            case 'move':
                const newPos = (player.position + card.steps + 40) % 40;
                player.position = newPos;
                await this.handleTileEvent(game, player, newPos);
                break;
        }

        game.recordHistory({
            type: 'card_drawn',
            playerId: player.id,
            card: card
        });
    }

    /**
     * 支付税款
     */
    async payTax(game, player, tile) {
        const amount = tile.amount || 200;

        if (player.money < amount) {
            await this.handleBankruptcy(game.id, player.id, null, amount);
        } else {
            player.money -= amount;

            game.recordHistory({
                type: 'pay_tax',
                playerId: player.id,
                amount: amount
            });
        }
    }

    /**
     * 破产处理
     * ❌ BUG #005: 只变卖房子，没抵押土地
     */
    async handleBankruptcy(gameId, playerId, creditorId, amount) {
        const game = await this.db.getGame(gameId);
        const player = game.players[playerId];

        game.recordHistory({
            type: 'bankruptcy_started',
            playerId: playerId,
            amount: amount
        });

        // 变卖所有房子（半价）
        for (const tile of game.map) {
            if (tile.ownerId === playerId && tile.buildings > 0) {
                const sellPrice = tile.buildings * 50; // 半价变卖
                player.money += sellPrice;
                tile.buildings = 0;

                game.recordHistory({
                    type: 'sell_house',
                    playerId: playerId,
                    tileIndex: tile.index,
                    buildings: tile.buildings,
                    amount: sellPrice
                });
            }
        }

        // ❌ 错误：缺少抵押土地的逻辑
        // 应该继续变卖土地，但这里直接判断破产了
        if (player.money < amount) {
            player.bankrupt = true;

            game.recordHistory({
                type: 'player_bankrupt',
                playerId: playerId,
                creditorId: creditorId
            });

            // 清空所有地产
            for (const tile of game.map) {
                if (tile.ownerId === playerId) {
                    tile.ownerId = null;
                    tile.isMortgaged = false;
                }
            }

            // 如果有债权人，转移地产
            if (creditorId) {
                const creditor = game.players[creditorId];
                for (const tile of game.map) {
                    if (tile.ownerId === playerId) {
                        tile.ownerId = creditorId;
                    }
                }
            }
        }

        await this.db.updateGame(gameId, game);
    }

    /**
     * 结束回合
     */
    async endTurn(gameId, playerId) {
        const game = await this.db.getGame(gameId);
        const player = game.players[playerId];

        if (game.getCurrentPlayer().id !== playerId) {
            throw new Error('不是你的回合');
        }

        game.recordHistory({
            type: 'turn_end',
            playerId: playerId
        });

        // 检查是否所有玩家都破产了（只剩一个赢家）
        const activePlayers = Object.values(game.players).filter(p => !p.bankrupt);
        if (activePlayers.length === 1) {
            game.status = 'finished';
            game.winnerId = activePlayers[0].id;

            game.recordHistory({
                type: 'game_finished',
                winnerId: activePlayers[0].id
            });
        } else {
            // 下一个玩家
            game.nextPlayer();
        }

        await this.db.updateGame(gameId, game);
        return game;
    }
}

module.exports = GameService;
