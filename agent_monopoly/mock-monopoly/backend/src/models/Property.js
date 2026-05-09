const Database = require('better-sqlite3');
const db = new Database('./backend/data/monopoly.db');

class Property {
  static create(propertyData) {
    const { name, position, price, rent, color, house_cost } = propertyData;
    const stmt = db.prepare(`
      INSERT INTO properties (name, position, price, rent, color, house_cost, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `);
    const result = stmt.run(name, position, price, rent, color, house_cost);
    return result.lastInsertRowid;
  }

  static findById(id) {
    const stmt = db.prepare('SELECT * FROM properties WHERE id = ?');
    return stmt.get(id);
  }

  static findByPosition(position) {
    const stmt = db.prepare('SELECT * FROM properties WHERE position = ?');
    return stmt.get(position);
  }

  static findAll() {
    const stmt = db.prepare('SELECT * FROM properties ORDER BY position');
    return stmt.all();
  }

  static update(id, propertyData) {
    const { name, price, rent, color, house_cost } = propertyData;
    const stmt = db.prepare(`
      UPDATE properties 
      SET name = ?, price = ?, rent = ?, color = ?, house_cost = ? 
      WHERE id = ?
    `);
    const result = stmt.run(name, price, rent, color, house_cost, id);
    return result.changes > 0;
  }

  static delete(id) {
    const stmt = db.prepare('DELETE FROM properties WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  static buyProperty(playerId, propertyId) {
    const property = this.findById(propertyId);
    if (!property) return false;

    const stmt = db.prepare(`
      INSERT INTO player_properties (player_id, property_id, bought_at, houses)
      VALUES (?, ?, datetime('now'), 0)
    `);
    const result = stmt.run(playerId, propertyId);
    return result.changes > 0;
  }

  static sellProperty(playerId, propertyId) {
    const stmt = db.prepare(`
      DELETE FROM player_properties 
      WHERE player_id = ? AND property_id = ?
    `);
    const result = stmt.run(playerId, propertyId);
    return result.changes > 0;
  }

  static getOwner(propertyId) {
    const stmt = db.prepare(`
      SELECT player_id 
      FROM player_properties 
      WHERE property_id = ?
    `);
    const result = stmt.get(propertyId);
    return result ? result.player_id : null;
  }

  static getPropertiesByPlayer(playerId) {
    const stmt = db.prepare(`
      SELECT p.* 
      FROM properties p
      JOIN player_properties pp ON p.id = pp.property_id
      WHERE pp.player_id = ?
      ORDER BY p.position
    `);
    return stmt.all(playerId);
  }

  static getPropertiesByRoom(roomId) {
    const stmt = db.prepare(`
      SELECT p.*, pp.player_id, pp.houses
      FROM properties p
      LEFT JOIN player_properties pp ON p.id = pp.property_id
      WHERE pp.player_id IN (
        SELECT user_id FROM players WHERE room_id = ?
      )
      ORDER BY p.position
    `);
    return stmt.all(roomId);
  }

  static addHouse(propertyId) {
    const stmt = db.prepare(`
      UPDATE player_properties 
      SET houses = houses + 1 
      WHERE property_id = ?
    `);
    const result = stmt.run(propertyId);
    return result.changes > 0;
  }

  static removeHouse(propertyId) {
    const stmt = db.prepare(`
      UPDATE player_properties 
      SET houses = houses - 1 
      WHERE property_id = ? AND houses > 0
    `);
    const result = stmt.run(propertyId);
    return result.changes > 0;
  }

  static getHouseCount(propertyId) {
    const stmt = db.prepare(`
      SELECT houses 
      FROM player_properties 
      WHERE property_id = ?
    `);
    const result = stmt.get(propertyId);
    return result ? result.houses : 0;
  }

  static calculateRent(propertyId) {
    const property = this.findById(propertyId);
    if (!property) return 0;

    const houseCount = this.getHouseCount(propertyId);
    const rentMultiplier = Math.pow(2, houseCount);
    return property.rent * rentMultiplier;
  }
}

module.exports = Property;
```

```