/**
 * PlayerService - 玩家管理
 * 处理玩家状态、资金等
 */

class PlayerService {
    constructor(db) {
        this.db = db;
    }

    /**
     * 创建玩家
     */
    async createPlayer(gameId, playerId, name) {
        const game = await this.db.games.findById(gameId);

        const player = {
            id: playerId,
            name: name,
            money: 1500,
            position: 0,
            jailed: false,
            jailTurns: 0,
            bankrupt: false,
            properties: [],
            canBuy: false
        };

        game.players[playerId] = player;
        await this.db.games.update(gameId, game);

        return player;
    }

    /**
     * 检查玩家是否破产
     * ⚠️ 不完整的实现：只是简单判断
     */
    async checkBankruptcy(gameId, playerId) {
        const game = await this.db.games.findById(gameId);
        const player = game.players[playerId];

        if (player.money < 0) {
            // ⚠️ 应该先变卖资产，但这里直接破产
            player.bankrupt = true;
            await this.db.games.update(gameId, game);
            return { bankrupt: true };
        }

        return { bankrupt: false };
    }
}

module.exports = PlayerService;
