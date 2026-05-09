const Database = require('better-sqlite3');
const path = require('path');

// 确保数据目录存在
const fs = require('fs');
const dataDir = path.join(__dirname, '../../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 数据库文件路径
const dbPath = path.join(dataDir, 'monopoly.db');

// 创建数据库连接
const db = new Database(dbPath, { verbose: console.log });

// 初始化数据库表
function initializeDatabase() {
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

  // 创建房间玩家关联表
  db.exec(`
    CREATE TABLE IF NOT EXISTS room_players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      player_number INTEGER NOT NULL,
      is_ready BOOLEAN DEFAULT 0,
      balance INTEGER DEFAULT 1500,
      position INTEGER DEFAULT 0,
      bankrupt BOOLEAN DEFAULT 0,
      FOREIGN KEY (room_id) REFERENCES rooms(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE (room_id, user_id)
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
      color_group TEXT NOT NULL,
      house_count INTEGER DEFAULT 0,
      hotel_count INTEGER DEFAULT 0,
      owner_id INTEGER,
      FOREIGN KEY (owner_id) REFERENCES users(id)
    )
  `);

  // 创建交易记录表
  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER NOT NULL,
      from_user_id INTEGER,
      to_user_id INTEGER,
      amount INTEGER NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (room_id) REFERENCES rooms(id),
      FOREIGN KEY (from_user_id) REFERENCES users(id),
      FOREIGN KEY (to_user_id) REFERENCES users(id)
    )
  `);

  // 创建机会/命运卡表
  db.exec(`
    CREATE TABLE IF NOT EXISTS chance_cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      type TEXT NOT NULL,
      value INTEGER DEFAULT 0
    )
  `);

  // 创建游戏事件表
  db.exec(`
    CREATE TABLE IF NOT EXISTS game_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER NOT NULL,
      player_id INTEGER NOT NULL,
      event_type TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (room_id) REFERENCES rooms(id),
      FOREIGN KEY (player_id) REFERENCES users(id)
    )
  `);

  // 插入基础机会卡数据
  const insertChanceCards = db.prepare(`
    INSERT OR IGNORE INTO chance_cards (title, description, type, value) VALUES 
      ('前进3格', '前进3格', 'move', 3),
      ('后退2格', '后退2格', 'move', -2),
      ('获得200元', '从银行获得200元', 'money', 200),
      ('支付100元', '支付银行100元', 'money', -100),
      ('获得生日礼物', '每位玩家给你50元', 'money_players', 50),
      ('付医疗费', '支付医院100元', 'money', -100),
      ('付学费', '支付学校150元', 'money', -150),
      ('获得奖金', '获得100元奖金', 'money', 100),
      ('付修理费', '支付房屋修理费80元', 'money', -80),
      ('获得彩票', '获得彩票奖金200元', 'money', 200)
  `);
  insertChanceCards.run();

  // 插入基础命运卡数据
  const insertCommunityChestCards = db.prepare(`
    INSERT OR IGNORE INTO chance_cards (title, description, type, value) VALUES 
      ('获得100元', '从银行获得100元', 'money', 100),
      ('支付50元', '支付银行50元', 'money', -50),
      ('获得生日礼物', '每位玩家给你10元', 'money_players', 10),
      ('付医疗费', '支付医院100元', 'money', -100),
      ('付学费', '支付学校150元', 'money', -150),
      ('获得奖金', '获得50元奖金', 'money', 50),
      ('付修理费', '支付房屋修理费25元', 'money', -25),
      ('获得彩票', '获得彩票奖金100元', 'money', 100),
      ('继承100元', '继承100元', 'money', 100),
      ('付税金', '支付税金200元', 'money', -200)
  `);
  insertCommunityChestCards.run();

  // 插入基础地产数据
  const insertProperties = db.prepare(`
    INSERT OR IGNORE INTO properties (name, price, rent, position, color_group) VALUES 
      ('起点', 0, 0, 0, 'start'),
      ('地中海大道', 60, 2, 1, 'brown'),
      ('社区 chest', 0, 0, 2, 'chest'),
      ('Baltic Avenue', 60, 4, 3, 'brown'),
      ('收入税', 0, 0, 4, 'tax'),
      ('Reading Railroad', 200, 25, 5, 'railroad'),
      ('Oriental Avenue', 100, 6, 6, 'lightblue'),
      ('Chance', 0, 0, 7, 'chance'),
      ('Vermont Avenue', 100, 6, 8, 'lightblue'),
      ('Connecticut Avenue', 120, 8, 9, 'lightblue'),
      ('监狱', 0, 0, 10, 'jail'),
      ('St. Charles Place', 140, 10, 11, 'pink'),
      ('Electric Company', 150, 0, 12, 'utility'),
      ('States Avenue', 140, 10, 13, 'pink'),
      ('Virginia Avenue', 160, 12, 14, 'pink'),
      ('Pennsylvania Railroad', 200, 25, 15, 'railroad'),
      ('St. James Place', 180, 14, 16, 'orange'),
      ('Community Chest', 0, 0, 17, 'chest'),
      ('Tennessee Avenue', 180, 14, 18, 'orange'),
      ('New York Avenue', 200, 16, 19, 'orange'),
      ('自由停车', 0, 0, 20, 'free'),
      ('Kentucky Avenue', 220, 18, 21, 'red'),
      ('Chance', 0, 0, 22, 'chance'),
      ('Indiana Avenue', 220, 18, 23, 'red'),
      ('Illinois Avenue', 240, 20, 24, 'red'),
      ('B. & O. Railroad', 200, 25, 25, 'railroad'),
      ('Atlantic Avenue', 260, 22, 26, 'yellow'),
      ('Ventnor Avenue', 260, 22, 27, 'yellow'),
      ('Water Works', 150, 0, 28, 'utility'),
      ('Marvin Gardens', 280, 24, 29, 'yellow'),
      ('去监狱', 0, 0, 30, 'gotojail'),
      ('Pacific Avenue', 300, 26, 31, 'green'),
      ('North Carolina Avenue', 300, 26, 32, 'green'),
      ('Community Chest', 0, 0, 33, 'chest'),
      ('Pennsylvania Avenue', 320, 28, 34, 'green'),
      ('Short Line', 200, 25, 35, 'railroad'),
      ('Chance', 0, 0, 36, 'chance'),
      ('Park Place', 350, 35, 37, 'darkblue'),
      ('豪华税', 0, 0, 38, 'tax'),
      ('Boardwalk', 400, 50, 39, 'darkblue')
  `);
  insertProperties.run();
}

// 初始化数据库
initializeDatabase();

// 导出数据库连接和初始化函数
module.exports = {
  db,
  initializeDatabase
};
```