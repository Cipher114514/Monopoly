const Database = require('better-sqlite3');
const db = new Database('./backend/data/monopoly.db');

class User {
  static create(userData) {
    const { username, password, email } = userData;
    const stmt = db.prepare(`
      INSERT INTO users (username, password, email, created_at)
      VALUES (?, ?, ?, datetime('now'))
    `);
    const result = stmt.run(username, password, email);
    return result.lastInsertRowid;
  }

  static findById(id) {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id);
  }

  static findByUsername(username) {
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    return stmt.get(username);
  }

  static findByEmail(email) {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email);
  }

  static update(id, userData) {
    const { username, email } = userData;
    const stmt = db.prepare(`
      UPDATE users 
      SET username = ?, email = ? 
      WHERE id = ?
    `);
    const result = stmt.run(username, email, id);
    return result.changes > 0;
  }

  static updatePassword(id, hashedPassword) {
    const stmt = db.prepare(`
      UPDATE users 
      SET password = ? 
      WHERE id = ?
    `);
    const result = stmt.run(hashedPassword, id);
    return result.changes > 0;
  }

  static delete(id) {
    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  static getAll() {
    const stmt = db.prepare('SELECT id, username, email, created_at FROM users');
    return stmt.all();
  }
}

module.exports = User;
```

```