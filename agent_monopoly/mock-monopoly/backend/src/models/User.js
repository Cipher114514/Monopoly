const { db } = require('../db/connection');

class User {
  static async create(userData) {
    const { username, email, passwordHash } = userData;
    const sql = `
      INSERT INTO users (username, email, password_hash, created_at)
      VALUES (?, ?, ?, datetime('now'))
    `;
    
    try {
      const result = db.prepare(sql).run(username, email, passwordHash);
      return { id: result.lastInsertRowid, ...userData };
    } catch (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  static async findById(id) {
    const sql = 'SELECT * FROM users WHERE id = ?';
    try {
      const user = db.prepare(sql).get(id);
      return user || null;
    } catch (error) {
      throw new Error(`Failed to find user by ID: ${error.message}`);
    }
  }

  static async findByUsername(username) {
    const sql = 'SELECT * FROM users WHERE username = ?';
    try {
      const user = db.prepare(sql).get(username);
      return user || null;
    } catch (error) {
      throw new Error(`Failed to find user by username: ${error.message}`);
    }
  }

  static async findByEmail(email) {
    const sql = 'SELECT * FROM users WHERE email = ?';
    try {
      const user = db.prepare(sql).get(email);
      return user || null;
    } catch (error) {
      throw new Error(`Failed to find user by email: ${error.message}`);
    }
  }

  static async update(id, userData) {
    const { username, email } = userData;
    const sql = `
      UPDATE users 
      SET username = ?, email = ?, updated_at = datetime('now')
      WHERE id = ?
    `;
    
    try {
      const result = db.prepare(sql).run(username, email, id);
      return result.changes > 0;
    } catch (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }

  static async delete(id) {
    const sql = 'DELETE FROM users WHERE id = ?';
    try {
      const result = db.prepare(sql).run(id);
      return result.changes > 0;
    } catch (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }

  static async getStats(id) {
    const sql = `
      SELECT 
        COUNT(DISTINCT r.id) as games_played,
        SUM(CASE WHEN r.winner_id = ? THEN 1 ELSE 0 END) as games_won,
        AVG(p.final_balance) as avg_balance
      FROM rooms r
      LEFT JOIN players p ON r.id = p.room_id
      WHERE p.user_id = ?
    `;
    
    try {
      const stats = db.prepare(sql).get(id, id);
      return stats || { games_played: 0, games_won: 0, avg_balance: 0 };
    } catch (error) {
      throw new Error(`Failed to get user stats: ${error.message}`);
    }
  }
}

module.exports = User;
```