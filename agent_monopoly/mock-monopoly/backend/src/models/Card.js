const { db } = require('../db/connection');

class Card {
    static create(cardData) {
        const { type, title, description, effect, created_at } = cardData;
        const sql = `
            INSERT INTO cards (type, title, description, effect, created_at)
            VALUES (?, ?, ?, ?, strftime('%s', 'now'))
        `;
        const result = db.run(sql, [type, title, description, effect]);
        return this.findById(result.lastID);
    }

    static findById(id) {
        const sql = 'SELECT * FROM cards WHERE id = ?';
        const row = db.get(sql, [id]);
        if (!row) return null;
        return this._mapRowToCard(row);
    }

    // 别名 - 路由可能调用
    static getById(id) {
        return this.findById(id);
    }

    static findAll() {
        const sql = 'SELECT * FROM cards ORDER BY created_at DESC';
        const rows = db.all(sql);
        return rows.map(row => this._mapRowToCard(row));
    }

    static findByType(type) {
        const sql = 'SELECT * FROM cards WHERE type = ?';
        const rows = db.all(sql, [type]);
        return rows.map(row => this._mapRowToCard(row));
    }

    // 别名 - 路由可能调用
    static getByType(type) {
        return this.findByType(type);
    }

    static update(id, cardData) {
        const { title, description, effect } = cardData;
        const sql = `
            UPDATE cards
            SET title = COALESCE(?, title),
                description = COALESCE(?, description),
                effect = COALESCE(?, effect)
            WHERE id = ?
        `;
        db.run(sql, [title, description, effect, id]);
        return this.findById(id);
    }

    static delete(id) {
        const sql = 'DELETE FROM cards WHERE id = ?';
        const result = db.run(sql, [id]);
        return result.changes > 0;
    }

    // 私有方法：行映射 (snake_case -> camelCase)
    static _mapRowToCard(row) {
        return {
            id: row.id,
            type: row.type,
            title: row.title,
            description: row.description,
            effect: row.effect,
            createdAt: row.created_at
        };
    }

    // 随机抽取指定类型的卡牌
    static drawRandomCard(type, roomId) {
        const sql = `
            SELECT * FROM cards 
            WHERE type = ? 
            ORDER BY RANDOM() 
            LIMIT 1
        `;
        const row = db.get(sql, [type]);
        if (!row) return null;
        
        // 更新卡牌使用记录
        const updateSql = `
            INSERT INTO card_draws (card_id, room_id, drawn_at)
            VALUES (?, ?, strftime('%s', 'now'))
        `;
        db.run(updateSql, [row.id, roomId]);
        
        return this._mapRowToCard(row);
    }
}

module.exports = Card;