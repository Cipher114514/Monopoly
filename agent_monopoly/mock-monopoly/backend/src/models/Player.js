const { db } = require('../db/connection');

class Player {
  static async create(playerData) {
    const { userId, roomId, position, balance, isReady, isBankrupt } = playerData;
    const sql = `
      INSERT INTO players (user_id, room_id, position, balance, is_ready, is_bankrupt, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `;
    const result = db.prepare(sql).run(userId, roomId, position, balance, isReady, isBankrupt);
    return this.findById(result.lastInsertRowid);
  }

  static async findById(id) {
    const sql = `
      SELECT p.*, u.username
      FROM players p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `;
    const player = db.prepare(sql).get(id);
    if (!player) return null;
    
    return {
      id: player.id,
      userId: player.user_id,
      username: player.username,
      roomId: player.room_id,
      position: player.position,
      balance: player.balance,
      isReady: player.is_ready,
      isBankrupt: player.is_bankrupt,
      createdAt: player.created_at
    };
  }

  static async findByRoomAndUser(roomId, userId) {
    const sql = `
      SELECT p.*, u.username
      FROM players p
      JOIN users u ON p.user_id = u.id
      WHERE p.room_id = ? AND p.user_id = ?
    `;
    const player = db.prepare(sql).get(roomId, userId);
    if (!player) return null;
    
    return {
      id: player.id,
      userId: player.user_id,
      username: player.username,
      roomId: player.room_id,
      position: player.position,
      balance: player.balance,
      isReady: player.is_ready,
      isBankrupt: player.is_bankrupt,
      createdAt: player.created_at
    };
  }

  static async update(id, playerData) {
    const { position, balance, isReady, isBankrupt } = playerData;
    const sql = `
      UPDATE players 
      SET position = ?, balance = ?, is_ready = ?, is_bankrupt = ? 
      WHERE id = ?
    `;
    db.prepare(sql).run(position, balance, isReady, isBankrupt, id);
    return this.findById(id);
  }

  static async delete(id) {
    const sql = 'DELETE FROM players WHERE id = ?';
    db.prepare(sql).run(id);
    return true;
  }

  static async move(roomId, userId, steps) {
    const sql = `
      UPDATE players 
      SET position = (position + ?) % 40 
      WHERE room_id = ? AND user_id = ?
    `;
    db.prepare(sql).run(steps, roomId, userId);
    return this.findByRoomAndUser(roomId, userId);
  }

  static async addBalance(roomId, userId, amount) {
    const sql = `
      UPDATE players 
      SET balance = balance + ? 
      WHERE room_id = ? AND user_id = ?
    `;
    db.prepare(sql).run(amount, roomId, userId);
    return this.findByRoomAndUser(roomId, userId);
  }

  static async subtractBalance(roomId, userId, amount) {
    const sql = `
      UPDATE players 
      SET balance = balance - ? 
      WHERE room_id = ? AND user_id = ?
    `;
    db.prepare(sql).run(amount, roomId, userId);
    return this.findByRoomAndUser(roomId, userId);
  }

  static async setBankrupt(roomId, userId) {
    const sql = `
      UPDATE players 
      SET is_bankrupt = 1 
      WHERE room_id = ? AND user_id = ?
    `;
    db.prepare(sql).run(roomId, userId);
    return this.findByRoomAndUser(roomId, userId);
  }
}

module.exports = Player;
```

```