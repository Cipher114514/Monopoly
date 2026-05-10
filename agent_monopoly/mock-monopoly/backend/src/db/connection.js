const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 数据库文件路径
const dbPath = path.join(__dirname, '../../../database.sqlite');

// 创建数据库连接
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to the database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

// 初始化数据库表
const initializeDatabase = () => {
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
      color TEXT,
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
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (owner_id) REFERENCES users(id)
    )
  `);

  // 创建卡牌表
  db.run(`
    CREATE TABLE IF NOT EXISTS cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      effect TEXT NOT NULL,
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
      event_data TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (room_id) REFERENCES rooms(id),
      FOREIGN KEY (player_id) REFERENCES players(id)
    )
  `);

  console.log('Database tables initialized successfully.');
};

// 初始化数据库
initializeDatabase();

// 导出数据库连接
module.exports = { db };