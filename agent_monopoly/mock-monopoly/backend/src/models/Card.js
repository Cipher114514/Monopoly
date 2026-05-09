const { db } = require('../db/connection');

class Card {
  static async create(cardData) {
    const { type, title, description, action, value } = cardData;
    const sql = `
      INSERT INTO cards (type, title, description, action, value, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `;
    const result = db.prepare(sql).run(type, title, description, action, value);
    return this.findById(result.lastInsertRowid);
  }

  static async findById(id) {
    const sql = 'SELECT * FROM cards WHERE id = ?';
    const card = db.prepare(sql).get(id);
    if (!card) return null;
    
    return {
      id: card.id,
      type: card.type,
      title: card.title,
      description: card.description,
      action: card.action,
      value: card.value,
      createdAt: card.created_at
    };
  }

  static async findByType(type) {
    const sql = 'SELECT * FROM cards WHERE type = ? ORDER BY RANDOM() LIMIT 1';
    const card = db.prepare(sql).get(type);
    if (!card) return null;
    
    return {
      id: card.id,
      type: card.type,
      title: card.title,
      description: card.description,
      action: card.action,
      value: card.value,
      createdAt: card.created_at
    };
  }

  static async findAll() {
    const sql = 'SELECT * FROM cards ORDER BY type, id';
    const cards = db.prepare(sql).all();
    return cards.map(card => ({
      id: card.id,
      type: card.type,
      title: card.title,
      description: card.description,
      action: card.action,
      value: card.value,
      createdAt: card.created_at
    }));
  }

  static async update(id, cardData) {
    const { type, title, description, action, value } = cardData;
    const sql = `
      UPDATE cards 
      SET type = ?, title = ?, description = ?, action = ?, value = ? 
      WHERE id = ?
    `;
    db.prepare(sql).run(type, title, description, action, value, id);
    return this.findById(id);
  }

  static async delete(id) {
    const sql = 'DELETE FROM cards WHERE id = ?';
    db.prepare(sql).run(id);
    return true;
  }

  static async drawChanceCard() {
    return this.findByType('chance');
  }

  static async drawCommunityChestCard() {
    return this.findByType('community_chest');
  }
}

module.exports = Card;
```