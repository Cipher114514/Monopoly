const { db } = require('../db/connection');

class Card {
  static async create(cardData) {
    const { type, title, description, effect, room_id } = cardData;
    const sql = `
      INSERT INTO cards (type, title, description, effect, room_id, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `;
    
    try {
      const result = db.prepare(sql).run(type, title, description, effect, room_id);
      return { id: result.lastInsertRowid, ...cardData };
    } catch (error) {
      throw new Error(`Failed to create card: ${error.message}`);
    }
  }

  static async findById(id) {
    const sql = 'SELECT * FROM cards WHERE id = ?';
    try {
      const card = db.prepare(sql).get(id);
      return card || null;
    } catch (error) {
      throw new Error(`Failed to find card by ID: ${error.message}`);
    }
  }

  static async findByRoomId(roomId) {
    const sql = 'SELECT * FROM cards WHERE room_id = ? ORDER BY created_at';
    try {
      const cards = db.prepare(sql).all(roomId);
      return cards;
    } catch (error) {
      throw new Error(`Failed to find cards by room ID: ${error.message}`);
    }
  }

  static async drawCard(roomId, cardType, playerId) {
    const sql = `
      SELECT * FROM cards 
      WHERE room_id = ? AND type = ? AND drawn_by_player_id IS NULL
      ORDER BY RANDOM()
      LIMIT 1
    `;
    
    try {
      const card = db.prepare(sql).get(roomId, cardType);
      
      if (card) {
        const updateSql = `
          UPDATE cards 
          SET drawn_by_player_id = ?, drawn_at = datetime('now')
          WHERE id = ?
        `;
        db.prepare(updateSql).run(playerId, card.id);
        return card;
      }
      
      return null;
    } catch (error) {
      throw new Error(`Failed to draw card: ${error.message}`);
    }
  }

  static async resetCard(id) {
    const sql = `
      UPDATE cards 
      SET drawn_by_player_id = NULL, drawn_at = NULL
      WHERE id = ?
    `;
    
    try {
      const result = db.prepare(sql).run(id);
      return result.changes > 0;
    } catch (error) {
      throw new Error(`Failed to reset card: ${error.message}`);
    }
  }

  static async getCardHistory(roomId, limit = 10) {
    const sql = `
      SELECT c.*, p.username as drawn_by_name
      FROM cards c
      JOIN players p ON c.drawn_by_player_id = p.id
      WHERE c.room_id = ?
      ORDER BY c.drawn_at DESC
      LIMIT ?
    `;
    try {
      const history = db.prepare(sql).all(roomId, limit);
      return history;
    } catch (error) {
      throw new Error(`Failed to get card history: ${error.message}`);
    }
  }

  static async shuffleCards(roomId) {
    const sql = `
      UPDATE cards