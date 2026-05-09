const { db } = require('../db/connection');

class Room {
  static async create(roomData) {
    const { name, maxPlayers, createdBy } = roomData;
    const sql = `
      INSERT INTO rooms (name, max_players, created_by, created_at, status)
      VALUES (?, ?, ?, datetime('now'), 'waiting')
    `;
    const result = db.prepare(sql).run(name, maxPlayers, createdBy);
    return this.findById(result.lastInsertRowid);
  }

  static async findById(id) {
    const sql = 'SELECT * FROM rooms WHERE id = ?';
    const room = db.prepare(sql).get(id);
    if (!room) return null;
    
    const playersSql = `
      SELECT p.id as player_id, p.user_id, p.room_id, p.position, p.balance, 
             p.is_ready, p.is_bankrupt, p.created_at as player_created_at,
             u.username
      FROM players p
      JOIN users u ON p.user_id = u.id
      WHERE p.room_id = ?
    `;
    const players = db.prepare(playersSql).all(id);
    
    return {
      id: room.id,
      name: room.name,
      maxPlayers: room.max_players,
      createdBy: room.created_by,
      status: room.status,
      currentTurn: room.current_turn,
      createdAt: room.created_at,
      players: players.map(p => ({
        id: p.player_id,
        userId: p.user_id,
        username: p.username,
        position: p.position,
        balance: p.balance,
        isReady: p.is_ready,
        isBankrupt: p.is_bankrupt,
        createdAt: p.player_created_at
      }))
    };
  }

  static async findAll() {
    const sql = 'SELECT * FROM rooms ORDER BY created_at DESC';
    const rooms = db.prepare(sql).all();
    return rooms.map(room => ({
      id: room.id,
      name: room.name,
      maxPlayers: room.max_players,
      createdBy: room.created_by,
      status: room.status,
      currentTurn: room.current_turn,
      createdAt: room.created_at,
      playerCount: room.player_count || 0
    }));
  }

  static async update(id, roomData) {
    const { name, status, currentTurn } = roomData;
    const sql = `
      UPDATE rooms 
      SET name = ?, status = ?, current_turn = ? 
      WHERE id = ?
    `;
    db.prepare(sql).run(name, status, currentTurn, id);
    return this.findById(id);
  }

  static async delete(id) {
    const sql = 'DELETE FROM rooms WHERE id = ?';
    db.prepare(sql).run(id);
    return true;
  }

  static async addPlayer(roomId, userId) {
    const sql = `
      INSERT INTO players (user_id, room_id, position, balance, is_ready, is_bankrupt, created_at)
      VALUES (?, ?, 0, 1500, 0, 0, datetime('now'))
    `;
    db.prepare(sql).run(userId, roomId);
    return this.findById(roomId);
  }

  static async removePlayer(roomId, userId) {
    const sql = 'DELETE FROM players WHERE room_id = ? AND user_id = ?';
    db.prepare(sql).run(roomId, userId);
    return this.findById(roomId);
  }

  static async updatePlayerStatus(roomId, userId, isReady) {
    const sql = `
      UPDATE players 
      SET is_ready = ? 
      WHERE room_id = ? AND user_id = ?
    `;
    db.prepare(sql).run(isReady, roomId, userId);
    return this.findById(roomId);
  }

  static async updatePlayerPosition(roomId, userId, position) {
    const sql = `
      UPDATE players 
      SET position = ? 
      WHERE room_id = ? AND user_id = ?
    `;
    db.prepare(sql).run(position, roomId, userId);
    return this.findById(roomId);
  }

  static async updatePlayerBalance(roomId, userId, balance) {
    const sql = `
      UPDATE players 
      SET balance = ? 
      WHERE room_id = ? AND user_id = ?
    `;
    db.prepare(sql).run(balance, roomId, userId);
    return this.findById(roomId);
  }

  static async setPlayerBankrupt(roomId, userId) {
    const sql = `
      UPDATE players 
      SET is_bankrupt = 1 
      WHERE room_id = ? AND user_id = ?
    `;
    db.prepare(sql).run(roomId, userId);
    return this.findById(roomId);
  }
}

module.exports = Room;
```

```