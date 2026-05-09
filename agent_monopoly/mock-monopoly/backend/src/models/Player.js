const { db } = require('../db/connection');

class Player {
  static async create(playerData) {
    const { user_id, room_id, position, balance } = playerData;
    const sql = `
      INSERT INTO players (user_id, room_id, position, balance, is_ready, created_at)
      VALUES (?, ?, ?, ?, 0, datetime('now'))
    `;
    
    try {
      const result = db.prepare(sql).run(user_id, room_id, position, balance);
      return { id: result.lastInsertRowid, ...playerData, is_ready: false };
    } catch (error) {
      throw new Error(`Failed to create player: ${error.message}`);
    }
  }

  static async findById(id) {
    const sql = 'SELECT * FROM players WHERE id = ?';
    try {
      const player = db.prepare(sql).get(id);
      return player || null;
    } catch (error) {
      throw new Error(`Failed to find player by ID: ${error.message}`);
    }
  }

  static async findByUserIdAndRoom(userId, roomId) {
    const sql = 'SELECT * FROM players WHERE user_id = ? AND room_id = ?';
    try {
      const player = db.prepare(sql).get(userId, roomId);
      return player || null;
    } catch (error) {
      throw new Error(`Failed to find player by user ID and room ID: ${error.message}`);
    }
  }

  static async update(id, playerData) {
    const { position, balance, is_ready, final_balance, is_bankrupt } = playerData;
    const sql = `
      UPDATE players 
      SET position = ?, balance = ?, is_ready = ?, final_balance = ?, is_bankrupt = ?, updated_at = datetime('now')
      WHERE id = ?
    `;
    
    try {
      const result = db.prepare(sql).run(position, balance, is_ready, final_balance, is_bankrupt, id);
      return result.changes > 0;
    } catch (error) {
      throw new Error(`Failed to update player: ${error.message}`);
    }
  }

  static async delete(id) {
    const sql = 'DELETE FROM players WHERE id = ?';
    try {
      const result = db.prepare(sql).run(id);
      return result.changes > 0;
    } catch (error) {
      throw new Error(`Failed to delete player: ${error.message}`);
    }
  }

  static async getOwnedProperties(playerId) {
    const sql = `
      SELECT p.*, pr.name as property_name, pr.price, pr.rent
      FROM property_ownership po
      JOIN properties pr ON po.property_id = pr.id
      WHERE po.player_id = ?
    `;
    try {
      const properties = db.prepare(sql).all(playerId);
      return properties;
    } catch (error) {
      throw new Error(`Failed to get owned properties: ${error.message}`);
    }
  }

  static async rollDice(playerId) {
    const sql = `
      INSERT INTO dice_rolls (player_id, dice1, dice2, created_at)
      VALUES (?, ?, ?, datetime('now'))
    `;
    
    try {
      const dice1 = Math.floor(Math.random() * 6) + 1;
      const dice2 = Math.floor(Math.random() * 6) + 1;
      const result = db.prepare(sql).run(playerId, dice1, dice2);
      return { id: result.lastInsertRowid, dice1, dice2, total: dice1 + dice2 };
    } catch (error) {
      throw new Error(`Failed to roll dice: ${error.message}`);
    }
  }

  static async getDiceRolls(playerId) {
    const sql = `
      SELECT * FROM dice_rolls 
      WHERE player_id = ? 
      ORDER BY created_at DESC 
      LIMIT 10
    `;
    try {
      const rolls = db.prepare(sql).all(playerId);
      return rolls;
    } catch (error) {
      throw new Error(`Failed to get dice rolls: ${error.message}`);
    }
  }
}

module.exports = Player;
```