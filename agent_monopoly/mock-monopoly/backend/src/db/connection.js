const Database = require('better-sqlite3');
const path = require('path');

// 数据库文件路径
const dbPath = path.join(__dirname, '../../data/monopoly.db');

// 初始化数据库
const initializeDatabase = () => {
  try {
    // 确保数据目录存在
    const fs = require('fs');
    const dataDir = path.dirname(dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // 创建数据库连接
    const db = new Database(dbPath);
    
    // 启用外键约束
    db.pragma('foreign_keys = ON');
    
    // 创建用户表
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 创建房间表
    db.exec(`
      CREATE TABLE IF NOT EXISTS rooms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        max_players INTEGER DEFAULT 6,
        status TEXT DEFAULT 'waiting',
        created_by INTEGER,
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
        in_jail BOOLEAN DEFAULT FALSE,
        jail_turns INTEGER DEFAULT 0,
        is_ready BOOLEAN DEFAULT FALSE,
        color TEXT,
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
        rent_1house INTEGER,
        rent_2houses INTEGER,
        rent_3houses INTEGER,
        rent_4houses INTEGER,
        rent_hotel INTEGER,
        house_price INTEGER,
        hotel_price INTEGER,
        position INTEGER NOT NULL,
        color_group TEXT NOT NULL,
        owner_id INTEGER,
        houses INTEGER DEFAULT 0,
        has_hotel BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (owner_id) REFERENCES players(id)
      )
    `);
    
    // 创建机会卡表
    db.exec(`
      CREATE TABLE IF NOT EXISTS chance_cards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        type TEXT NOT NULL,
        value INTEGER,
        position INTEGER
      )
    `);
    
    // 创建命运卡表
    db.exec(`
      CREATE TABLE IF NOT EXISTS community_chest_cards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        type TEXT NOT NULL,
        value INTEGER,
        position INTEGER
      )
    `);
    
    // 创建交易记录表
    db.exec(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        amount INTEGER NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (player_id) REFERENCES players(id)
      )
    `);
    
    // 创建游戏日志表
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
    
    console.log('Database initialized successfully');
    return db;
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
};

// 创建数据库连接
let db;
try {
  db = initializeDatabase();
} catch (error) {
  console.error('Failed to connect to database:', error);
  process.exit(1);
}

module.exports = { db, initializeDatabase };
```