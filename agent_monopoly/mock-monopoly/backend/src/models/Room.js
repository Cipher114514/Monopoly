const Database = require('better-sqlite3');
const db = new Database('./backend/data/monopoly.db');

class Room {
  static create(roomData) {
    const { name, maxPlayers, createdBy } = roomData;
    const stmt = db.prepare(`
      INSERT INTO rooms (name, max_players, created_by, created_at, status)
      VALUES (?, ?, ?, datetime('now'), 'waiting')
    `);
    const result = stmt.run(name, maxPlayers, createdBy);
    return result.lastInsertRowid;
  }

  static findById(id) {
    const stmt = db.prepare('SELECT * FROM rooms WHERE id = ?');
    return stmt.get(id);
  }

  static findAll() {
    const stmt = db.prepare('SELECT * FROM rooms WHERE status = "waiting" ORDER BY created_at DESC');
    return stmt.all();
  }

  static update(id, roomData) {
    const { name, maxPlayers, status } = roomData;
    const stmt = db.prepare(`
      UPDATE rooms 
      SET name = ?, max_players = ?, status = ? 
      WHERE id = ?
    `);
    const result = stmt.run(name, maxPlayers, status, id);
    return result.changes > 0;
  }

  static delete(id) {
    const stmt = db.prepare('DELETE FROM rooms WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  static addPlayer(roomId, userId) {
    const stmt = db.prepare(`
      INSERT INTO room_players (room_id, user_id, joined_at)
      VALUES (?, ?, datetime('now'))
    `);
    const result = stmt.run(roomId, userId);
    return result.changes > 0;
  }

  static removePlayer(roomId, userId) {
    const stmt = db.prepare(`
      DELETE FROM room_players 
      WHERE room_id = ? AND user_id = ?
    `);
    const result = stmt.run(roomId, userId);
    return result.changes > 0;
  }

  static getPlayers(roomId) {
    const stmt = db.prepare(`
      SELECT u.id, u.username, rp.ready 
      FROM room_players rp
      JOIN users u ON rp.user_id = u.id
      WHERE rp.room_id = ?
    `);
    return stmt.all(roomId);
  }

  static setPlayerReady(roomId, userId, ready) {
    const stmt = db.prepare(`
      UPDATE room_players 
      SET ready = ? 
      WHERE room_id = ? AND user_id = ?
    `);
    const result = stmt.run(ready, roomId, userId);
    return result.changes > 0;
  }

  static isPlayerInRoom(roomId, userId) {
    const stmt = db.prepare(`
      SELECT COUNT(*) as count 
      FROM room_players 
      WHERE room_id = ? AND user_id = ?
    `);
    const result = stmt.get(roomId, userId);
    return result.count > 0;
  }

  static getPlayerCount(roomId) {
    const stmt = db.prepare(`
      SELECT COUNT(*) as count 
      FROM room_players 
      WHERE room_id = ?
    `);
    const result = stmt.get(roomId);
    return result.count;
  }

  static isRoomFull(roomId) {
    const room = this.findById(roomId);
    if (!room) return false;
    
    const playerCount = this.getPlayerCount(roomId);
    return playerCount >= room.max_players;
  }

  static startGame(roomId) {
    const stmt = db.prepare(`
      UPDATE rooms 
      SET status = 'playing', started_at = datetime('now') 
      WHERE id = ?
    `);
    const result = stmt.run(roomId);
    return result.changes > 0;
  }

  static endGame(roomId) {
    const stmt = db.prepare(`
      UPDATE rooms 
      SET status = 'finished', ended_at = datetime('now') 
      WHERE id = ?
    `);
    const result = stmt.run(roomId);
    return result.changes > 0;
  }
}

module.exports = Room;
```

```