const Database = require('better-sqlite3');
const db = new Database('./backend/data/monopoly.db');

class Player {
  static create(playerData) {
    const { userId, roomId, position, money, inJail, jailTurns, bankrupt } = playerData;
    const stmt = db.prepare(`
      INSERT INTO players (user_id, room_id, position, money, in_jail, jail_turns, bankrupt, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);
    const result = stmt.run(userId, roomId, position, money, inJail, jailTurns, bankrupt);
    return result.lastInsertRowid;
  }

  static findById(id) {
    const stmt = db.prepare('SELECT * FROM players WHERE id = ?');
    return stmt.get(id);
  }

  static findByUserIdAndRoom(userId, roomId) {
    const stmt = db.prepare('SELECT * FROM players WHERE user_id = ? AND room_id = ?');
    return stmt.get(userId, roomId);
  }

  static updatePosition(id, position) {
    const stmt = db.prepare(`
      UPDATE players 
      SET position = ? 
      WHERE id = ?
    `);
    const result = stmt.run(position, id);
    return result.changes > 0;
  }

  static updateMoney(id, amount) {
    const stmt = db.prepare(`
      UPDATE players 
      SET money = ? 
      WHERE id = ?
    `);
    const result = stmt.run(amount, id);
    return result.changes > 0;
  }

  static addMoney(id, amount) {
    const stmt = db.prepare(`
      UPDATE players 
      SET money = money + ? 
      WHERE id = ?
    `);
    const result = stmt.run(amount, id);
    return result.changes > 0;
  }

  static subtractMoney(id, amount) {
    const stmt = db.prepare(`
      UPDATE players 
      SET money = money - ? 
      WHERE id = ?
    `);
    const result = stmt.run(amount, id);
    return result.changes > 0;
  }

  static setInJail(id, inJail, jailTurns = 0) {
    const stmt = db.prepare(`
      UPDATE players 
      SET in_jail = ?, jail_turns = ? 
      WHERE id = ?
    `);
    const result = stmt.run(inJail, jailTurns, id);
    return result.changes > 0;
  }

  static incrementJailTurns(id) {
    const stmt = db.prepare(`
      UPDATE players 
      SET jail_turns = jail_turns + 1 
      WHERE id = ?
    `);
    const result = stmt.run(id);
    return result.changes > 0;
  }

  static setBankrupt(id, bankrupt) {
    const stmt = db.prepare(`
      UPDATE players 
      SET bankrupt = ? 
      WHERE id = ?
    `);
    const result = stmt.run(bankrupt, id);
    return result.changes > 0;
  }

  static getPlayersByRoom(roomId) {
    const stmt = db.prepare(`
      SELECT p.*, u.username 
      FROM players p
      JOIN users u ON p.user_id = u.id
      WHERE p.room_id = ? 
      ORDER BY p.id
    `);
    return stmt.all(roomId);
  }

  static getCurrentTurn(roomId) {
    const stmt = db.prepare(`
      SELECT current_turn 
      FROM rooms 
      WHERE id = ?
    `);
    const result = stmt.get(roomId);
    return result ? result.current_turn : null;
  }

  static setCurrentTurn(roomId, playerId) {
    const stmt = db.prepare(`
      UPDATE rooms 
      SET current_turn = ? 
      WHERE id = ?
    `);
    const result = stmt.run(playerId, roomId);
    return result.changes > 0;
  }

  static incrementTurn(roomId) {
    const stmt = db.prepare(`
      UPDATE rooms 
      SET current_turn = current_turn + 1 
      WHERE id = ?
    `);
    const result = stmt.run(roomId);
    return result.changes > 0;
  }

  static resetTurn(roomId) {
    const stmt = db.prepare(`
      UPDATE rooms 
      SET current_turn = 0 
      WHERE id = ?
    `);
    const result = stmt.run(roomId);
    return result.changes > 0;
  }
}

module.exports = Player;
```

```