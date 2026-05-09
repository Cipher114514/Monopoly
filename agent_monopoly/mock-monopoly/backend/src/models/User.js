const { db } = require('../db/connection');

class User {
  static async create(userData) {
    const { username, email, passwordHash } = userData;
    const sql = `
      INSERT INTO users (username, email, password_hash, created_at)
      VALUES (?, ?, ?, datetime('now'))
    `;
    const result = db.prepare(sql).run(username, email, passwordHash);
    return this.findById(result.lastInsertRowid);
  }

  static async findById(id) {
    const sql = 'SELECT * FROM users WHERE id = ?';
    const user = db.prepare(sql).get(id);
    if (!user) return null;
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.created_at
    };
  }

  static async findByUsername(username) {
    const sql = 'SELECT * FROM users WHERE username = ?';
    const user = db.prepare(sql).get(username);
    if (!user) return null;
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      passwordHash: user.password_hash,
      createdAt: user.created_at
    };
  }

  static async findByEmail(email) {
    const sql = 'SELECT * FROM users WHERE email = ?';
    const user = db.prepare(sql).get(email);
    if (!user) return null;
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      passwordHash: user.password_hash,
      createdAt: user.created_at
    };
  }

  static async update(id, userData) {
    const { username, email } = userData;
    const sql = `
      UPDATE users 
      SET username = ?, email = ? 
      WHERE id = ?
    `;
    db.prepare(sql).run(username, email, id);
    return this.findById(id);
  }

  static async delete(id) {
    const sql = 'DELETE FROM users WHERE id = ?';
    db.prepare(sql).run(id);
    return true;
  }
}

module.exports = User;
```

```