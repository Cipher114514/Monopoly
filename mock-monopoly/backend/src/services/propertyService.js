/**
 * PropertyService - 地产管理（完整版）
 * 处理购买、建设、抵押、赎回
 */

const db = require('../database/db');

class PropertyService {
    constructor() {
        this.db = db;
    }

    /**
     * 购买地产
     */
    async buyProperty(gameId, playerId, tileIndex) {
        const game = await this.db.getGame(gameId);
        if (!game) {
            throw new Error('游戏不存在');
        }

        const player = game.players[playerId];
        const tile = game.map[tileIndex];

        if (!tile) {
            throw new Error('地块不存在');
        }

        if (tile.type !== 'property' && tile.type !== 'station' && tile.type !== 'utility') {
            throw new Error('该地块不能购买');
        }

        if (tile.ownerId) {
            throw new Error('该地块已有主人');
        }

        if (player.money < tile.price) {
            throw new Error('资金不足');
        }

        player.money -= tile.price;
        tile.ownerId = playerId;

        game.recordHistory({
            type: 'buy_property',
            playerId: playerId,
            tileIndex: tileIndex,
            price: tile.price
        });

        await this.db.updateGame(gameId, game);
        return { success: true, money: player.money };
    }

    /**
     * 建设房屋/酒店
     * ❌ BUG #001: 不检查玩家位置
     * ❌ BUG #002: 不检查地块类型（特殊地块也能盖房）
     * ❌ BUG #003: 不按顺序建设
     */
    async buildHouse(gameId, playerId, tileIndex) {
        const game = await this.db.getGame(gameId);
        if (!game) {
            throw new Error('游戏不存在');
        }

        const player = game.players[playerId];
        const tile = game.map[tileIndex];

        // 检查是否是自己的地
        if (tile.ownerId !== playerId) {
            throw new Error('不是自己的地产');
        }

        // ❌ BUG #001: 没有检查玩家是否停在该地块上
        // 正确的代码应该是：
        // if (player.position !== tileIndex) {
        //     throw new Error('只能在停着的地产上盖房');
        // }

        // ❌ BUG #002: 没有检查地块类型
        // 特殊地块（电站、车站、水厂）不应该能盖房
        // if (tile.type !== 'property') {
        //     throw new Error('特殊地块不能盖房');
        // }

        // 检查是否可以建设
        if (tile.buildings >= 5) {
            throw new Error('已有酒店，不能继续建设');
        }

        // ❌ BUG #003: 不按顺序建设
        // 应该检查：0 -> 1 -> 2 -> 3 -> 4（酒店）
        // 但这里允许直接跳到任何级别
        if (tile.buildings === 0) {
            // 空地建房子
            const buildCost = 100;
            if (player.money < buildCost) {
                throw new Error('资金不足');
            }
            tile.buildings = 1;
            player.money -= buildCost;
        } else {
            // ❌ 错误：直接 +=1，没有检查是否符合顺序
            const buildCost = 100;
            if (player.money < buildCost) {
                throw new Error('资金不足');
            }
            tile.buildings += 1;  // 应该检查级别顺序
            player.money -= buildCost;
        }

        game.recordHistory({
            type: 'build_house',
            playerId: playerId,
            tileIndex: tileIndex,
            buildings: tile.buildings
        });

        await this.db.updateGame(gameId, game);
        return { success: true, buildings: tile.buildings };
    }

    /**
     * 出售房屋/酒店
     */
    async sellHouse(gameId, playerId, tileIndex) {
        const game = await this.db.getGame(gameId);
        const player = game.players[playerId];
        const tile = game.map[tileIndex];

        if (tile.ownerId !== playerId) {
            throw new Error('不是自己的地产');
        }

        if (tile.buildings === 0) {
            throw new Error('没有可出售的房屋');
        }

        // 半价出售
        const sellPrice = 50;
        tile.buildings -= 1;
        player.money += sellPrice;

        game.recordHistory({
            type: 'sell_house',
            playerId: playerId,
            tileIndex: tileIndex,
            buildings: tile.buildings,
            amount: sellPrice
        });

        await this.db.updateGame(gameId, game);
        return { success: true, money: player.money };
    }

    /**
     * 抵押地产
     * ✅ 正确：有建筑的土地不能抵押
     */
    async mortgageProperty(gameId, playerId, tileIndex) {
        const game = await this.db.getGame(gameId);
        if (!game) {
            throw new Error('游戏不存在');
        }

        const player = game.players[playerId];
        const tile = game.map[tileIndex];

        if (tile.ownerId !== playerId) {
            throw new Error('不是自己的地产');
        }

        // ✅ 正确：有建筑的土地不能抵押
        if (tile.buildings > 0) {
            throw new Error('有建筑的土地不能抵押');
        }

        if (tile.isMortgaged) {
            throw new Error('已经抵押');
        }

        const mortgageValue = Math.floor(tile.price / 2);
        player.money += mortgageValue;
        tile.isMortgaged = true;

        game.recordHistory({
            type: 'mortgage_property',
            playerId: playerId,
            tileIndex: tileIndex,
            amount: mortgageValue
        });

        await this.db.updateGame(gameId, game);
        return { success: true, mortgageValue };
    }

    /**
     * 赎回地产
     */
    async redeemProperty(gameId, playerId, tileIndex) {
        const game = await this.db.getGame(gameId);
        const player = game.players[playerId];
        const tile = game.map[tileIndex];

        if (tile.ownerId !== playerId) {
            throw new Error('不是自己的地产');
        }

        if (!tile.isMortgaged) {
            throw new Error('未抵押');
        }

        const redeemValue = Math.floor(tile.price * 0.6); // 需要付 60%
        if (player.money < redeemValue) {
            throw new Error('资金不足');
        }

        player.money -= redeemValue;
        tile.isMortgaged = false;

        game.recordHistory({
            type: 'redeem_property',
            playerId: playerId,
            tileIndex: tileIndex,
            amount: redeemValue
        });

        await this.db.updateGame(gameId, game);
        return { success: true, money: player.money };
    }

    /**
     * 与其他玩家交易地产
     */
    async tradeProperty(gameId, fromPlayerId, toPlayerId, tileIndex, price) {
        const game = await this.db.getGame(gameId);
        const fromPlayer = game.players[fromPlayerId];
        const toPlayer = game.players[toPlayerId];
        const tile = game.map[tileIndex];

        if (tile.ownerId !== fromPlayerId) {
            throw new Error('不是你的地产');
        }

        if (toPlayer.money < price) {
            throw new Error('对方资金不足');
        }

        // 扣除建筑后才能交易
        if (tile.buildings > 0) {
            // 先变卖所有建筑
            const refund = tile.buildings * 50;
            fromPlayer.money += refund;
            tile.buildings = 0;
        }

        // 抵押状态重置
        tile.isMortgaged = false;

        // 交易
        toPlayer.money -= price;
        fromPlayer.money += price;
        tile.ownerId = toPlayerId;

        game.recordHistory({
            type: 'trade_property',
            fromPlayerId: fromPlayerId,
            toPlayerId: toPlayerId,
            tileIndex: tileIndex,
            price: price
        });

        await this.db.updateGame(gameId, game);
        return { success: true };
    }

    /**
     * 获取玩家的所有地产
     */
    async getPlayerProperties(gameId, playerId) {
        const game = await this.db.getGame(gameId);
        const properties = [];

        for (const tile of game.map) {
            if (tile.ownerId === playerId) {
                properties.push({
                    index: tile.index,
                    name: tile.name,
                    type: tile.type,
                    price: tile.price,
                    buildings: tile.buildings,
                    isMortgaged: tile.isMortgaged
                });
            }
        }

        return properties;
    }

    /**
     * 计算玩家总资产
     */
    async calculatePlayerAssets(gameId, playerId) {
        const game = await this.db.getGame(gameId);
        const player = game.players[playerId];

        let totalAssets = player.money;

        for (const tile of game.map) {
            if (tile.ownerId === playerId) {
                // 地产价值
                totalAssets += tile.price;

                // 建筑价值
                totalAssets += tile.buildings * 100;

                // 如果未抵押，加上价值
                if (!tile.isMortgaged) {
                    totalAssets += tile.price * 0.5;
                }
            }
        }

        return {
            money: player.money,
            properties: totalAssets - player.money,
            total: totalAssets
        };
    }
}

module.exports = PropertyService;
