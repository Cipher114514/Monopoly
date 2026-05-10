const { db } = require('../db/connection');

class Player {
    static create(playerData) {
        const { user_id, room_id, color, position, money } = playerData;
        const sql = `
            INSERT INTO players (user_id, room_id, color, position, money, created_at)
            VALUES (?, ?, ?, ?, ?, strftime('%s', 'now'))
        `;
        const result = db.run(sql, [user_id, room_id, color, position, money]);
        return this.findById(result.lastID);
    }

    static findById(id) {
        const sql = 'SELECT * FROM players WHERE id = ?';
        const row = db.get(sql, [id]);
        if (!row) return null;
        return this._mapRowToPlayer(row);
    }

    // 别名 - 路由可能调用
    static getById(id) {
        return this.findById(id);
    }

    static findByUserId(userId) {
        const sql = 'SELECT * FROM players WHERE user_id = ?';
        const row = db.get(sql, [userId]);
        if (!row) return null;
        return this._mapRowToPlayer(row);
    }

    static findByUserIdAndRoom(userId, roomId) {
        const sql = 'SELECT * FROM players WHERE user_id = ? AND room_id = ?';
        const row = db.get(sql, [userId, roomId]);
        if (!row) return null;
        return this._mapRowToPlayer(row);
    }

    // 别名 - 路由可能调用
    static getByUserIdAndRoom(userId, roomId) {
        return this.findByUserIdAndRoom(userId, roomId);
    }

    static findByRoomId(roomId) {
        const sql = 'SELECT * FROM players WHERE room_id = ?';
        const rows = db.all(sql, [roomId]);
        return rows.map(row => this._mapRowToPlayer(row));
    }

    // 别名 - 路由可能调用
    static getByRoomId(roomId) {
        return this.findByRoomId(roomId);
    }

    static update(id, playerData) {
        const { position, money, in_jail, is_ready, is_bankrupt } = playerData;
        const sql = `
            UPDATE players
            SET position = COALESCE(?, position),
                money = COALESCE(?, money),
                in_jail = COALESCE(?, in_jail),
                is_ready = COALESCE(?, is_ready),
                is_bankrupt = COALESCE(?, is_bankrupt)
            WHERE id = ?
        `;
        db.run(sql, [position, money, in_jail, is_ready, is_bankrupt, id]);
        return this.findById(id);
    }

    static delete(id) {
        const sql = 'DELETE FROM players WHERE id = ?';
        db.run(sql, [id]);
        return true;
    }

    // 私有方法：行映射 (snake_case -> camelCase)
    static _mapRowToPlayer(row) {
        return {
            id: row.id,
            userId: row.user_id,
            roomId: row.room_id,
            position: row.position,
            money: row.money,
            inJail: row.in_jail,
            isReady: row.is_ready,
            isBankrupt: row.is_bankrupt,
            color: row.color,
            createdAt: row.created_at
        };
    }
}

module.exports = Player;