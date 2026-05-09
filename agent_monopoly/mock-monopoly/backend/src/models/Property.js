const { db } = require('../db/connection');

class Property {
  static async create(propertyData) {
    const { name, price, rent, position, room_id } = propertyData;
    const sql = `
      INSERT INTO properties (name, price, rent, position, room_id, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `;
    
    try {
      const result = db.prepare(sql).run(name, price, rent, position, room_id);
      return { id: result.lastInsertRowid, ...propertyData };
    } catch (error) {
      throw new Error(`Failed to create property: ${error.message}`);
    }
  }

  static async findById(id) {
    const sql = 'SELECT * FROM properties WHERE id = ?';
    try {
      const property = db.prepare(sql).get(id);
      return property || null;
    } catch (error) {
      throw new Error(`Failed to find property by ID: ${error.message}`);
    }
  }

  static async findByRoomId(roomId) {
    const sql = 'SELECT * FROM properties WHERE room_id = ? ORDER BY position';
    try {
      const properties = db.prepare(sql).all(roomId);
      return properties;
    } catch (error) {
      throw new Error(`Failed to find properties by room ID: ${error.message}`);
    }
  }

  static async update(id, propertyData) {
    const { name, price, rent, house_count } = propertyData;
    const sql = `
      UPDATE properties 
      SET name = ?, price = ?, rent = ?, house_count = ?, updated_at = datetime('now')
      WHERE id = ?
    `;
    
    try {
      const result = db.prepare(sql).run(name, price, rent, house_count, id);
      return result.changes > 0;
    } catch (error) {
      throw new Error(`Failed to update property: ${error.message}`);
    }
  }

  static async delete(id) {
    const sql = 'DELETE FROM properties WHERE id = ?';
    try {
      const result = db.prepare(sql).run(id);
      return result.changes > 0;
    } catch (error) {
      throw new Error(`Failed to delete property: ${error.message}`);
    }
  }

  static async getOwner(propertyId) {
    const sql = `
      SELECT p.*, u.username 
      FROM property_ownership po
      JOIN players p ON po.player_id = p.id
      JOIN users u ON p.user_id = u.id
      WHERE po.property_id = ?
    `;
    try {
      const owner = db.prepare(sql).get(propertyId);
      return owner || null;
    } catch (error) {
      throw new Error(`Failed to get property owner: ${error.message}`);
    }
  }

  static async setOwner(propertyId, playerId) {
    const sql = `
      INSERT OR REPLACE INTO property_ownership (property_id, player_id, created_at)
      VALUES (?, ?, datetime('now'))
    `;
    
    try {
      const result = db.prepare(sql).run(propertyId, playerId);
      return result.changes > 0;
    } catch (error) {
      throw new Error(`Failed to set property owner: ${error.message}`);
    }
  }

  static async removeOwner(propertyId) {
    const sql = 'DELETE FROM property_ownership WHERE property_id = ?';
    try {
      const result = db.prepare(sql).run(propertyId);
      return result.changes > 0;
    } catch (error) {
      throw new Error(`Failed to remove property owner: ${error.message}`);
    }
  }

  static async getRent(propertyId) {
    const sql = `
      SELECT p.rent, po.player_id
      FROM properties p
      LEFT JOIN property_ownership po ON p.id = po.property_id
      WHERE p.id = ?
    `;
    try {
      const result = db.prepare(sql).get(propertyId);
      return result ? result.rent : 0;
    } catch (error) {
      throw new Error(`Failed to get property rent: ${error.message}`);
    }
  }

  static async canBuildHouse(propertyId) {
    const sql = `
      SELECT p.house_count, po.player_id
      FROM properties p
      JOIN property_ownership po ON p.id = po.property_id
      WHERE p.id = ? AND po.player_id IS NOT NULL
    `;
    try {
      const property = db.prepare(sql).get(propertyId);
      return property && property.house_count < 4;
    } catch (error) {
      throw new Error(`Failed to check house build eligibility: ${error.message}`);
    }
  }

  static async buildHouse(propertyId) {
    const sql = `
      UPDATE properties 
      SET house_count = house_count + 1, rent = rent * 1.5, updated_at = datetime('now')
      WHERE id = ?
    `;
    
    try {
      const result = db.prepare(sql).run(propertyId);
      return result.changes > 0;
    } catch (error) {
      throw new Error(`Failed to build house: ${error.message}`);
    }
  }
}

module.exports = Property;
```