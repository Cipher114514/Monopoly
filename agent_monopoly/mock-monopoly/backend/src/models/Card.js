const Database = require('better-sqlite3');
const db = new Database('./backend/data/monopoly.db');

class Card {
  static create(cardData) {
    const { type, title, description, effect, position } = cardData;
    const stmt = db.prepare(`
      INSERT INTO cards (type, title, description, effect, position, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `);
    const result = stmt.run(type, title, description, effect, position);
    return result.lastInsertRowid;
  }

  static findById(id) {
    const stmt = db.prepare('SELECT * FROM cards WHERE id = ?');
    return stmt.get(id);
  }

  static findByType(type) {
    const stmt = db.prepare('SELECT * FROM cards WHERE type = ? ORDER BY RANDOM() LIMIT 1');
    return stmt.get(type);
  }

  static findAll() {
    const stmt = db.prepare('SELECT * FROM cards ORDER BY type, position');
    return stmt.all();
  }

  static update(id, cardData) {
    const { type, title, description, effect, position } = cardData;
    const stmt = db.prepare(`
      UPDATE cards 
      SET type = ?, title = ?, description = ?, effect = ?, position = ? 
      WHERE id = ?
    `);
    const result = stmt.run(type, title, description, effect, position, id);
    return result.changes > 0;
  }

  static delete(id) {
    const stmt = db.prepare('DELETE FROM cards WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  static drawChanceCard() {
    return this.findByType('chance');
  }

  static drawCommunityChestCard() {
    return this.findByType('community_chest');
  }

  static getCardsByType(type) {
    const stmt = db.prepare('SELECT * FROM cards WHERE type = ? ORDER BY position');
    return stmt.all(type);
  }

  static executeCardEffect(card, playerId) {
    const effect = JSON.parse(card.effect);
    let result = { success: true, message: card.description };

    switch (effect.type) {
      case 'money':
        const playerStmt = db.prepare('UPDATE players SET money = money + ? WHERE id = ?');
        playerStmt.run(effect.amount, playerId);
        result.message = `You ${effect.amount > 0 ? 'received' : 'paid'} $${Math.abs(effect.amount)}`;
        break;
      
      case 'move':
        const moveStmt = db.prepare('UPDATE players SET position = ? WHERE id = ?');
        moveStmt.run(effect.position, playerId);
        result.message = `You moved to position ${effect.position}`;
        break;
      
      case 'move_to_property':
        const movePropStmt = db.prepare('UPDATE players SET position = ? WHERE id = ?');
        movePropStmt.run(effect.position, playerId);
        result.message = `You moved to ${effect.property_name}`;
        break;
      
      case 'jail':
        const jailStmt = db.prepare('UPDATE players SET in_jail = 1, jail_turns = 0 WHERE id = ?');
        jailStmt.run(playerId);
        result.message = 'You went to jail!';
        break;
      
      case 'get_out_of_jail':
        const jailFreeStmt = db.prepare('UPDATE players SET in_jail = 0, jail_turns = 0 WHERE id = ?');
        jailFreeStmt.run(playerId);
        result.message = 'You got out of jail free!';
        break;
      
      case 'pay_each_player':
        const roomStmt = db.prepare('SELECT room_id FROM players WHERE id = ?');
        const room = roomStmt.get(playerId);
        
        if (room) {
          const playersStmt = db.prepare('SELECT id FROM players WHERE room_id = ? AND id != ?');
          const players = playersStmt.all(room.room_id, playerId);
          
          const amountStmt = db.prepare('UPDATE players SET money = money - ? WHERE id = ?');
          const receiveStmt = db.prepare('UPDATE players SET money = money + ? WHERE id = ?');
          
          players.forEach(p => {
            amountStmt.run(effect.amount, playerId);
            receiveStmt.run(effect.amount, p.id);