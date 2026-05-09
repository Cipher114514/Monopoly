const { db } = require('../db/connection');

class Room {
  static async create(roomData) {
    const { name, max_players, creator_id } = roomData;
    const sql = `
      INSERT INTO rooms (name, max_players, creator_id, status, created_at)
      VALUES (?, ?, ?, 'waiting', datetime('now'))
    `;
    
    try {
      const result = db.prepare(sql).run(name, max_players, creator_id);
      return { id: result.lastInsertRowid, ...roomData, status: 'waiting' };
    } catch (error) {
      throw new Error(`Failed to create room: ${error.message}`);
    }
  }

  static async findById(id) {
    const sql = 'SELECT * FROM rooms WHERE id = ?';
    try {
      const room = db.prepare(sql).get(id);
      return room || null;
    } catch (error) {
      throw new Error(`Failed to find room by ID: ${error.message}`);
    }
  }

  static async findAll() {
    const sql = 'SELECT * FROM rooms ORDER BY created_at DESC';
    try {
      const rooms = db.prepare(sql).all();
      return rooms;
    } catch (error) {
      throw new Error(`Failed to find all rooms: ${error.message}`);
    }
  }

  static async update(id, roomData) {
    const { name, max_players, status, winner_id } = roomData;
    const sql = `
      UPDATE rooms 
      SET name = ?, max_players = ?, status = ?, winner_id = ?, updated_at = datetime('now')
      WHERE id = ?
    `;
    
    try {
      const result = db.prepare(sql).run(name, max_players, status, winner_id, id);
      return result.changes > 0;
    } catch (error) {
      throw new Error(`Failed to update room: ${error.message}`);
    }
  }

  static async delete(id) {
    const sql = 'DELETE FROM rooms WHERE id = ?';
    try {
      const result = db.prepare(sql).run(id);
      return result.changes > 0;
    } catch (error) {
      throw new Error(`Failed to delete room: ${error.message}`);
    }
  }

  static async getPlayers(roomId) {
    const sql = `
      SELECT p.*, u.username 
      FROM players p
      JOIN users u ON p.user_id = u.id
      WHERE p.room_id = ?
      ORDER BY p.position
    `;
    try {
      const players = db.prepare(sql).all(roomId);
      return players;
    } catch (error) {
      throw new Error(`Failed to get room players: ${error.message}`);
    }
  }

  static async getProperties(roomId) {
    const sql = `
      SELECT pr.*, p.username as owner_name
      FROM properties pr
      LEFT JOIN players p ON pr.owner_id = p.id
      WHERE pr.room_id = ?
    `;
    try {
      const properties = db.prepare(sql).all(roomId);
      return properties;
    } catch (error) {
      throw new Error(`Failed to get room properties: ${error.message}`);
    }
  }

  static async getCards(roomId) {
    const sql = `
      SELECT c.*, p.username as drawn_by_name
      FROM cards c
      LEFT JOIN players p ON c.drawn_by_player_id = p.id
      WHERE c.room_id = ?
    `;
    try {
      const cards = db.prepare(sql).all(roomId);
      return cards;
    } catch (error) {
      throw new Error(`Failed to get room cards: ${error.message}`);
    }
  }
}

module.exports = Room;
```