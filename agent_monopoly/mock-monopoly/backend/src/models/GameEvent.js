const { db } = require('../db/connection');

class GameEvent {
    static create(eventData) {
        const { room_id, player_id, event_type, message, data } = eventData;
        const sql = `
            INSERT INTO game_events (room_id, player_id, event_type, message, data, created_at)
            VALUES (?, ?, ?, ?, ?, strftime('%s', 'now'))
        `;
        const result = db.run(sql, [room_id, player_id, event_type, message, JSON.stringify(data)]);
        return this.findById(result.lastID);
    }

    static findById(id) {
        const sql = 'SELECT * FROM game_events WHERE id = ?';
        const row = db.get(sql, [id]);
        if (!row) return null;
        return this._mapRowToGameEvent(row);
    }

    static getById(id) {
        return this.findById(id);
    }

    static findByRoomId(roomId) {
        const sql = 'SELECT * FROM game_events WHERE room_id = ? ORDER BY created_at DESC';
        const rows = db.all(sql, [roomId]);
        return rows.map(row => this._mapRowToGameEvent(row));
    }

    static getByRoomId(roomId) {
        return this.findByRoomId(roomId);
    }

    static findByPlayerId(playerId) {
        const sql = 'SELECT * FROM game_events WHERE player_id = ? ORDER BY created_at DESC';
        const rows = db.all(sql, [playerId]);
        return rows.map(row => this._mapRowToGameEvent(row));
    }

    static getByPlayerId(playerId) {
        return this.findByPlayerId(playerId);
    }

    static findByEventType(eventType) {
        const sql = 'SELECT * FROM game_events WHERE event_type = ? ORDER BY created_at DESC';
        const rows = db.all(sql, [eventType]);
        return rows.map(row => this._mapRowToGameEvent(row));
    }

    static getByEventType(eventType) {
        return this.findByEventType(eventType);
    }

    static findByRoomIdAndEventType(roomId, eventType) {
        const sql = 'SELECT * FROM game_events WHERE room_id = ? AND event_type = ? ORDER BY created_at DESC';
        const rows = db.all(sql, [roomId, eventType]);
        return rows.map(row => this._mapRowToGameEvent(row));
    }

    static getByRoomIdAndEventType(roomId, eventType) {
        return this.findByRoomIdAndEventType(roomId, eventType);
    }

    static update(id, eventData) {
        const { message, data } = eventData;
        const sql = `
            UPDATE game_events
            SET message = COALESCE(?, message),
                data = COALESCE(?, data)
            WHERE id = ?
        `;
        db.run(sql, [message, JSON.stringify(data), id]);
        return this.findById(id);
    }

    static delete(id) {
        const sql = 'DELETE FROM game_events WHERE id = ?';
        db.run(sql, [id]);
        return { success: true };
    }

    static deleteByRoomId(roomId) {
        const sql = 'DELETE FROM game_events WHERE room_id = ?';
        db.run(sql, [roomId]);
        return { success: true };
    }

    static deleteByPlayerId(playerId) {
        const sql = 'DELETE FROM game_events WHERE player_id = ?';
        db.run(sql, [playerId]);
        return { success: true };
    }

    static _mapRowToGameEvent(row) {
        return {
            id: row.id,
            roomId: row.room_id,
            playerId: row.player_id,
            eventType: row.event_type,
            message: row.message,
            data: row.data ? JSON.parse(row.data) : null,
            createdAt: row.created_at
        };
    }
}

module.exports = GameEvent;