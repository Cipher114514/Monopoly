const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 数据库文件路径
const dbPath = path.join(__dirname, '../../data/database.sqlite');

// 确保数据目录存在
const fs = require('fs');
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 创建数据库连接
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

// 初始化数据库表
function initializeDatabase() {
  // 创建用户表
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT UNIQUE,
      password_hash TEXT NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);

  // 创建房间表
  db.run(`
    CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      max_players INTEGER DEFAULT 6,
      status TEXT DEFAULT 'waiting',
      creator_id INTEGER,
      current_players INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (creator_id) REFERENCES users(id)
    )
  `);

  // 创建玩家表
  db.run(`
    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      room_id INTEGER NOT NULL,
      color TEXT NOT NULL,
      position INTEGER DEFAULT 0,
      money INTEGER DEFAULT 1500,
      in_jail INTEGER DEFAULT 0,
      is_ready INTEGER DEFAULT 0,
      is_bankrupt INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (room_id) REFERENCES rooms(id),
      UNIQUE(user_id, room_id)
    )
  `);

  // 创建地产表
  db.run(`
    CREATE TABLE IF NOT EXISTS properties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      position INTEGER NOT NULL,
      price INTEGER NOT NULL,
      base_rent INTEGER NOT NULL,
      color_group TEXT NOT NULL,
      house_count INTEGER DEFAULT 0,
      owner_id INTEGER,
      room_id INTEGER NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (owner_id) REFERENCES users(id),
      FOREIGN KEY (room_id) REFERENCES rooms(id)
    )
  `);

  // 创建卡牌表
  db.run(`
    CREATE TABLE IF NOT EXISTS cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL, -- 'chance' or 'community'
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      action_type TEXT NOT NULL, -- 'money', 'move', 'jail', etc.
      action_value INTEGER,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);

  // 创建游戏事件表
  db.run(`
    CREATE TABLE IF NOT EXISTS game_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER NOT NULL,
      player_id INTEGER,
      event_type TEXT NOT NULL,
      event_data TEXT, -- JSON string
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (room_id) REFERENCES rooms(id),
      FOREIGN KEY (player_id) REFERENCES players(id)
    )
  `);

  console.log('Database tables initialized');
}

// 数据库操作辅助函数
const dbHelpers = {
  // 执行查询并返回所有结果
  all: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  },

  // 执行查询并返回单个结果
  get: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  },

  // 执行插入/更新/删除操作
  run: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ lastID: this.lastID, changes: this.changes });
        }
      });
    });
  },

  // 关闭数据库连接
  close: () => {
    return new Promise((resolve, reject) => {
      db.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
};

// 导出数据库连接和辅助函数
module.exports = {
  db,
  dbHelpers
};