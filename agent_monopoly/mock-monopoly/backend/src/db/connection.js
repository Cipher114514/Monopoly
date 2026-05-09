const Database = require('better-sqlite3');
const path = require('path');

// 数据库文件路径
const dbPath = path.join(__dirname, '../../data/monopoly.db');

// 初始化数据库
const initializeDatabase = () => {
  const db = new Database(dbPath);
  
  // 启用外键约束
  db.pragma('foreign_keys = ON');
  
  // 创建用户表
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // 创建房间表
  db.exec(`
    CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      max_players INTEGER DEFAULT 4,
      status TEXT DEFAULT 'waiting',
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);
  
  // 创建玩家表
  db.exec(`
    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      room_id INTEGER NOT NULL,
      position INTEGER DEFAULT 0,
      money INTEGER DEFAULT 1500,
      is_ready BOOLEAN DEFAULT FALSE,
      is_bankrupt BOOLEAN DEFAULT FALSE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (room_id) REFERENCES rooms(id),
      UNIQUE(user_id, room_id)
    )
  `);
  
  // 创建地产表
  db.exec(`
    CREATE TABLE IF NOT EXISTS properties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price INTEGER NOT NULL,
      rent INTEGER NOT NULL,
      position INTEGER NOT NULL,
      color TEXT NOT NULL,
      owner_id INTEGER,
      houses INTEGER DEFAULT 0,
      hotel BOOLEAN DEFAULT FALSE,
      FOREIGN KEY (owner_id) REFERENCES players(id)
    )
  `);
  
  // 创建卡牌表
  db.exec(`
    CREATE TABLE IF NOT EXISTS cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      effect_value INTEGER DEFAULT 0,
      effect_target TEXT DEFAULT 'self',
      position INTEGER NOT NULL
    )
  `);
  
  // 创建游戏记录表
  db.exec(`
    CREATE TABLE IF NOT EXISTS game_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER NOT NULL,
      player_id INTEGER,
      action TEXT NOT NULL,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (room_id) REFERENCES rooms(id),
      FOREIGN KEY (player_id) REFERENCES players(id)
    )
  `);
  
  // 创建索引
  db.exec(`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_players_room_id ON players(room_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON properties(owner_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_cards_type ON cards(type)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_game_logs_room_id ON game_logs(room_id)`);
  
  return db;
};

// 初始化数据库连接
let db = initializeDatabase();

// 导出数据库连接和初始化函数
module.exports = { db, initializeDatabase };
```