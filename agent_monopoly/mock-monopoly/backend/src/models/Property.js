const { db } = require('../db/connection');

class Property {
  static async create(propertyData) {
    const { name, position, price, rent, color, ownerUserId } = propertyData;
    const sql = `
      INSERT INTO properties (name, position, price, rent, color, owner_user_id, houses, hotel, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, 0, datetime('now'))
    `;
    const result = db.prepare(sql).run(name, position, price, rent, color, ownerUserId);
    return this.findById(result.lastInsertRowid);
  }

  static async findById(id) {
    const sql = 'SELECT * FROM properties WHERE id = ?';
    const property = db.prepare(sql).get(id);
    if (!property) return null;
    
    return {
      id: property.id,
      name: property.name,
      position: property.position,
      price: property.price,
      rent: property.rent,
      color: property.color,
      ownerUserId: property.owner_user_id,
      houses: property.houses,
      hotel: property.hotel,
      createdAt: property.created_at
    };
  }

  static async findByPosition(position) {
    const sql = 'SELECT * FROM properties WHERE position = ?';
    const property = db.prepare(sql).get(position);
    if (!property) return null;
    
    return {
      id: property.id,
      name: property.name,
      position: property.position,
      price: property.price,
      rent: property.rent,
      color: property.color,
      ownerUserId: property.owner_user_id,
      houses: property.houses,
      hotel: property.hotel,
      createdAt: property.created_at
    };
  }

  static async findAll() {
    const sql = 'SELECT * FROM properties ORDER BY position';
    const properties = db.prepare(sql).all();
    return properties.map(property => ({
      id: property.id,
      name: property.name,
      position: property.position,
      price: property.price,
      rent: property.rent,
      color: property.color,
      ownerUserId: property.owner_user_id,
      houses: property.houses,
      hotel: property.hotel,
      createdAt: property.created_at
    }));
  }

  static async update(id, propertyData) {
    const { ownerUserId, houses, hotel } = propertyData;
    const sql = `
      UPDATE properties 
      SET owner_user_id = ?, houses = ?, hotel = ? 
      WHERE id = ?
    `;
    db.prepare(sql).run(ownerUserId, houses, hotel, id);
    return this.findById(id);
  }

  static async delete(id) {
    const sql = 'DELETE FROM properties WHERE id = ?';
    db.prepare(sql).run(id);
    return true;
  }

  static async setOwner(id, ownerUserId) {
    const sql = 'UPDATE properties SET owner_user_id = ? WHERE id = ?';
    db.prepare(sql).run(ownerUserId, id);
    return this.findById(id);
  }

  static async addHouse(id) {
    const sql = 'UPDATE properties SET houses = houses + 1 WHERE id = ?';
    db.prepare(sql).run(id);
    return this.findById(id);
  }

  static async addHotel(id) {
    const sql = 'UPDATE properties SET hotel = 1 WHERE id = ?';
    db.prepare(sql).run(id);
    return this.findById(id);
  }

  static async calculateRent(propertyId) {
    const sql = 'SELECT rent, houses, hotel FROM properties WHERE id = ?';
    const property = db.prepare(sql).get(propertyId);
    if (!property) return 0;
    
    let rent = property.rent;
    if (property.houses > 0) {
      rent = property.rent * Math.pow(2, property.houses);
    } else if (property.hotel) {
      rent = property.rent * 5;
    }
    
    return rent;
  }
}

module.exports = Property;
```

```