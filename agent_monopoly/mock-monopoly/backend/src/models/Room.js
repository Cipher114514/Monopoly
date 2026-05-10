const { db } = require('../db/connection');

class Room {
    static create(roomData) {
        const { name, max_players, creator_id } = roomData;
        const sql = `
            INSERT INTO rooms (name, max_players, creator_id, status, created_at)
            VALUES (?, ?, ?, 'waiting', strftime('%s', 'now'))
        `;
        const result = db.run(sql, [name, max_players, creator_id]);
        return this.findById(result.lastID);
    }

    static findById(id) {
        const sql = 'SELECT * FROM rooms WHERE id = ?';
        const row = db.get(sql, [id]);
        if (!row) return null;
        return this._mapRowToRoom(row);
    }

    // 别名 - 路由可能调用
    static getById(id) {
        return this.findById(id);
    }

    static findAll() {
        const sql = 'SELECT * FROM rooms ORDER BY created_at DESC';
        const rows = db.all(sql);
        return rows.map(row => this._mapRowToRoom(row));
    }

    static findByCreator(creatorId) {
        const sql = 'SELECT * FROM rooms WHERE creator_id = ?';
        const rows = db.all(sql, [creatorId]);
        return rows.map(row => this._mapRowToRoom(row));
    }

    // 别名 - 路由可能调用
    static getByCreator(creatorId) {
        return this.findByCreator(creatorId);
    }

    static findByStatus(status) {
        const sql = 'SELECT * FROM rooms WHERE status = ?';
        const rows = db.all(sql, [status]);
        return rows.map(row => this._mapRowToRoom(row));
    }

    // 别名 - 路由可能调用
    static getByStatus(status) {
        return this.findByStatus(status);
    }

    static update(id, roomData) {
        const { name, max_players, status, current_players } = roomData;
        const sql = `
            UPDATE rooms
            SET name = COALESCE(?, name),
                max_players = COALESCE(?, max_players),
                status = COALESCE(?, status),
                current_players = COALESCE(?, current_players)
            WHERE id = ?
        `;
        db.run(sql, [name, max_players, status, current_players, id]);
        return this.findById(id);
    }

    static delete(id) {
        const sql = 'DELETE FROM rooms WHERE id = ?';
        db.run(sql, [id]);
        return { id };
    }

    static getPlayers(roomId) {
        const sql = 'SELECT * FROM players WHERE room_id = ?';
        const rows = db.all(sql, [roomId]);
        return rows.map(row => ({
            id: row.id,
            userId: row.user_id,
            roomId: row.room_id,
            position: row.position,
            money: row.money,
            inJail: row.in_jail,
            isReady: row.is_ready,
            color: row.color,
            createdAt: row.created_at
        }));
    }

    static getProperties(roomId) {
        const sql = 'SELECT * FROM properties WHERE room_id = ?';
        const rows = db.all(sql, [roomId]);
        return rows.map(row => ({
            id: row.id,
            roomId: row.room_id,
            position: row.position,
            name: row.name,
            price: row.price,
            baseRent: row.base_rent,
            colorGroup: row.color_group,
            houseCount: row.house_count,
            ownerId: row.owner_id,
            createdAt: row.created_at
        }));
    }

    static getCards(roomId, cardType) {
        const sql = 'SELECT * FROM cards WHERE room_id = ? AND type = ?';
        const rows = db.all(sql, [roomId, cardType]);
        return rows.map(row => ({
            id: row.id,
            roomId: row.room_id,
            type: row.type,
            title: row.title,
            description: row.description,
            action: row.action,
            value: row.value,
            createdAt: row.created_at
        }));
    }

    // 私有方法：行映射 (snake_case -> camelCase)
    static _mapRowToRoom(row) {
        return {
            id: row.id,
            name: row.name,
            maxPlayers: row.max_players,
            creatorId: row.creator_id,
            status: row.status,
            currentPlayers: row.current_players,
            createdAt: row.created_at
        };
    }
}

module.exports = Room;