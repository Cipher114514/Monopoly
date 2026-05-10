const { db } = require('../db/connection');

class Property {
    static create(propertyData) {
        const { name, position, price, base_rent, color_group, owner_id } = propertyData;
        const sql = `
            INSERT INTO properties (name, position, price, base_rent, color_group, owner_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?, strftime('%s', 'now'))
        `;
        const result = db.run(sql, [name, position, price, base_rent, color_group, owner_id]);
        return this.findById(result.lastID);
    }

    static findById(id) {
        const sql = 'SELECT * FROM properties WHERE id = ?';
        const row = db.get(sql, [id]);
        if (!row) return null;
        return this._mapRowToProperty(row);
    }

    // 别名 - 路由可能调用
    static getById(id) {
        return this.findById(id);
    }

    static findAll() {
        const sql = 'SELECT * FROM properties ORDER BY position';
        const rows = db.all(sql);
        return rows.map(row => this._mapRowToProperty(row));
    }

    static findByRoomId(roomId) {
        const sql = 'SELECT * FROM properties WHERE room_id = ?';
        const rows = db.all(sql, [roomId]);
        return rows.map(row => this._mapRowToProperty(row));
    }

    // 别名 - 路由可能调用
    static getByRoomId(roomId) {
        return this.findByRoomId(roomId);
    }

    static findByOwner(ownerId) {
        const sql = 'SELECT * FROM properties WHERE owner_id = ?';
        const rows = db.all(sql, [ownerId]);
        return rows.map(row => this._mapRowToProperty(row));
    }

    // 别名 - 路由可能调用
    static getByOwner(ownerId) {
        return this.findByOwner(ownerId);
    }

    static findByPosition(position) {
        const sql = 'SELECT * FROM properties WHERE position = ?';
        const row = db.get(sql, [position]);
        if (!row) return null;
        return this._mapRowToProperty(row);
    }

    // 别名 - 路由可能调用
    static getByPosition(position) {
        return this.findByPosition(position);
    }

    static update(id, propertyData) {
        const { name, position, price, base_rent, color_group, owner_id, house_count, mortgage } = propertyData;
        const sql = `
            UPDATE properties
            SET name = COALESCE(?, name),
                position = COALESCE(?, position),
                price = COALESCE(?, price),
                base_rent = COALESCE(?, base_rent),
                color_group = COALESCE(?, color_group),
                owner_id = COALESCE(?, owner_id),
                house_count = COALESCE(?, house_count),
                mortgage = COALESCE(?, mortgage)
            WHERE id = ?
        `;
        db.run(sql, [name, position, price, base_rent, color_group, owner_id, house_count, mortgage, id]);
        return this.findById(id);
    }

    static delete(id) {
        const sql = 'DELETE FROM properties WHERE id = ?';
        db.run(sql, [id]);
        return { id };
    }

    // 私有方法：行映射 (snake_case -> camelCase)
    static _mapRowToProperty(row) {
        return {
            id: row.id,
            name: row.name,
            position: row.position,
            price: row.price,
            baseRent: row.base_rent,
            colorGroup: row.color_group,
            ownerId: row.owner_id,
            houseCount: row.house_count,
            mortgage: row.mortgage,
            createdAt: row.created_at
        };
    }
}

module.exports = Property;