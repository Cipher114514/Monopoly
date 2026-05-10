const { db } = require('../db/connection');

class User {
    static create(userData) {
        const { username, email, password_hash } = userData;
        const sql = `
            INSERT INTO users (username, email, password_hash, created_at)
            VALUES (?, ?, ?, strftime('%s', 'now'))
        `;
        const result = db.run(sql, [username, email, password_hash]);
        return this.findById(result.lastID);
    }

    static findById(id) {
        const sql = 'SELECT * FROM users WHERE id = ?';
        const row = db.get(sql, [id]);
        if (!row) return null;
        return this._mapRowToUser(row);
    }

    // 别名 - 路由可能调用
    static getById(id) {
        return this.findById(id);
    }

    static findByUsername(username) {
        const sql = 'SELECT * FROM users WHERE username = ?';
        const row = db.get(sql, [username]);
        if (!row) return null;
        return this._mapRowToUser(row);
    }

    // 别名 - 路由可能调用
    static getByUsername(username) {
        return this.findByUsername(username);
    }

    static findByEmail(email) {
        const sql = 'SELECT * FROM users WHERE email = ?';
        const row = db.get(sql, [email]);
        if (!row) return null;
        return this._mapRowToUser(row);
    }

    // 别名 - 路由可能调用
    static getByEmail(email) {
        return this.findByEmail(email);
    }

    static findAll() {
        const sql = 'SELECT * FROM users ORDER BY created_at DESC';
        const rows = db.all(sql);
        return rows.map(row => this._mapRowToUser(row));
    }

    static update(id, userData) {
        const { username, email } = userData;
        const sql = `
            UPDATE users
            SET username = COALESCE(?, username),
                email = COALESCE(?, email)
            WHERE id = ?
        `;
        db.run(sql, [username, email, id]);
        return this.findById(id);
    }

    static delete(id) {
        const sql = 'DELETE FROM users WHERE id = ?';
        db.run(sql, [id]);
        return { success: true };
    }

    // 私有方法：行映射 (snake_case -> camelCase)
    static _mapRowToUser(row) {
        return {
            id: row.id,
            username: row.username,
            email: row.email,
            passwordHash: row.password_hash,
            createdAt: row.created_at
        };
    }
}

module.exports = User;