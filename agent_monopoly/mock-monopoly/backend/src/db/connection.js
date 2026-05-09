const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../../data/monopoly.db');
let db = null;

// 初始化数据库
async function initDatabase() {
  // 创建数据目录
  const dataDir = path.join(__dirname, '../../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // 加载数据库文件（如果存在）
  let SQL;
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    SQL = await initSqlJs();
    db = new SQL.Database(buffer);
  } else {
    SQL = await initSqlJs();
    db = new SQL.Database();
    // 创建表结构
    createTables(db);
    // 保存到文件
    saveDatabase();
  }

  return db;
}

// 创建表结构
function createTables(db) {
  // users表
  db.run(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_login TIMESTAMP,
      avatar_url VARCHAR(255),
      total_games INTEGER DEFAULT 0,
      wins INTEGER DEFAULT 0,
      losses INTEGER DEFAULT 0,
      total_earnings INTEGER DEFAULT 0
    )
  `);

  // friends表
  db.run(`
    CREATE TABLE friends (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      friend_id INTEGER NOT NULL,
      status INTEGER DEFAULT 1, -- 1: pending, 2: accepted, 3: blocked
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (friend_id) REFERENCES users(id)
    )
  `);

  // rooms表
  db.run(`
    CREATE TABLE rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(100) NOT NULL,
      creator_id INTEGER NOT NULL,
      max_players INTEGER NOT NULL DEFAULT 6,
      min_players INTEGER NOT NULL DEFAULT 2,
      initial_money INTEGER NOT NULL DEFAULT 15000,
      is_private BOOLEAN DEFAULT FALSE,
      password_hash VARCHAR(255),
      status INTEGER DEFAULT 1, -- 1: waiting, 2: playing, 3: finished
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      started_at TIMESTAMP,
      finished_at TIMESTAMP,
      FOREIGN KEY (creator_id) REFERENCES users(id)
    )
  `);

  // players表
  db.run(`
    CREATE TABLE players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      position INTEGER NOT NULL DEFAULT 0,
      money INTEGER NOT NULL DEFAULT 15000,
      in_jail BOOLEAN DEFAULT FALSE,
      jail_turns INTEGER DEFAULT 0,
      bankruptcy BOOLEAN DEFAULT FALSE,
      order INTEGER NOT NULL,
      color VARCHAR(7) NOT NULL,
      FOREIGN KEY (room_id) REFERENCES rooms(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // properties表
  db.run(`
    CREATE TABLE properties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER NOT NULL,
      position INTEGER NOT NULL,
      name VARCHAR(100) NOT NULL,
      price INTEGER NOT NULL,
      owner_id INTEGER,
      houses INTEGER DEFAULT 0,
      hotel BOOLEAN DEFAULT FALSE,
      mortgage BOOLEAN DEFAULT FALSE,
      rent_base INTEGER NOT NULL,
      rent_house1 INTEGER NOT NULL,
      rent_house2 INTEGER NOT NULL,
      rent_house3 INTEGER NOT NULL,
      rent_house4 INTEGER NOT NULL,
      rent_hotel INTEGER NOT NULL,
      color_group VARCHAR(20) NOT NULL,
      FOREIGN KEY (room_id) REFERENCES rooms(id),
      FOREIGN KEY (owner_id) REFERENCES players(id)
    )
  `);

  // game_actions表
  db.run(`
    CREATE TABLE game_actions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER NOT NULL,
      player_id INTEGER NOT NULL,
      action_type INTEGER NOT NULL, -- 1: move, 2: buy, 3: pay, 4: collect, 5: jail, etc.
      action_data TEXT, -- JSON data for additional details
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (room_id) REFERENCES rooms(id),
      FOREIGN KEY (player_id) REFERENCES players(id)
    )
  `);

  // chat_messages表
  db.run(`
    CREATE TABLE chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER NOT NULL,
      player_id INTEGER NOT NULL,
      message TEXT NOT NULL,
      message_type INTEGER DEFAULT 1, -- 1: text, 2: emoji, 3: system
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (room_id) REFERENCES rooms(id),
      FOREIGN KEY (player_id) REFERENCES players(id)
    )
  `);

  // cards表
  db.run(`
    CREATE TABLE cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER NOT NULL,
      card_type INTEGER NOT NULL, -- 1: chance, 2: community
      card_text TEXT NOT NULL,
      card_action TEXT, -- JSON data for card actions
      FOREIGN KEY (room_id) REFERENCES rooms(id)
    )
  `);

  // 初始化游戏数据
  initializeGameData(db);
}

// 初始化游戏数据
function initializeGameData(db) {
  // 创建机会卡
  const chanceCards = [
    { text: "向前移动到起点", action: '{"type": "move", "target": 0, "collect": 2000}' },
    { text: "银行错误收取你50元", action: '{"type": "pay", "amount": 50}' },
    { text: "获得150元", action: '{"type": "collect", "amount": 150}' },
    { text: "退回3格", action: '{"type": "move", "steps": -3}' },
    { text: "立即出狱", action: '{"type": "jail", "action": "free"}' },
    { text: "支付10元维修费", action: '{"type": "pay", "amount": 10}' },
    { text: "向前移动到最贵的地产", action: '{"type": "move", "target": "expensive"}' },
    { text: "获得100元", action: '{"type": "collect", "amount": 100}' },
    { text: "支付所有玩家50元", action: '{"type": "pay_all", "amount": 50}' },
    { text: "向前移动5格", action: '{"type": "move", "steps": 5}' }
  ];

  const communityCards = [
    { text: "从银行获得200元", action: '{"type": "collect", "amount": 200}' },
    { text: "支付150元医院费", action: '{"type": "pay", "amount": 150}' },
    { text: "从银行获得100元", action: '{"type": "collect", "amount": 100}' },
    { text: "支付20元", action: '{"type": "pay", "amount": 20}' },
    { text: "获得50元", action: '{"type": "collect", "amount": 50}' },
    { text: "支付10元每间房屋，每间酒店115元", action: '{"type": "pay_houses", "house": 10, "hotel": 115}' },
    { text: "所有玩家给你50元", action: '{"type": "collect_all", "amount": 50}' },
    { text: "获得100元", action: '{"type": "collect", "amount": 100}' }
  ];

  // 创建机会卡
  chanceCards.forEach(card => {
    db.run(`
      INSERT INTO cards (room_id, card_type, card_text, card_action)
      VALUES (-1, 1, ?, ?)
    `, [card.text, card.action]);
  });

  // 创建命运卡
  communityCards.forEach(card => {
    db.run(`
      INSERT INTO cards (room_id, card_type, card_text, card_action)
      VALUES (-1, 2, ?, ?)
    `, [card.text, card.action]);
  });

  // 创建地产
  const properties = [
    // 普通地产
    { name: "上海", price: 600, rent: 50, color: "pink", position: 1 },
    { name: "北京", price: 600, rent: 50, color: "pink", position: 3 },
    { name: "广州", price: 1000, rent: 90, color: "orange", position: 6 },
    { name: "深圳", price: 1000, rent: 90, color: "orange", position: 8 },
    { name: "成都", price: 1200, rent: 100, color: "orange", position: 9 },
    { name: "杭州", price: 1400, rent: 110, color: "red", position: 11 },
    { name: "武汉", price: 1400, rent: 110, color: "red", position: 13 },
    { name: "南京", price: 1600, rent: 120, color: "red", position: 14 },
    { name: "重庆", price: 1800, rent: 140, color: "yellow", position: 16 },
    { name: "天津", price: 1800, rent: 140, color: "yellow", position: 18 },
    { name: "西安", price: 2000, rent: 160, color: "yellow", position: 19 },
    { name: "青岛", price: 2200, rent: 180, color: "green", position: 21 },
    { name: "大连", price: 2200, rent: 180, color: "green", position: 23 },
    { name: "厦门", price: 2400, rent: 200, color: "green", position: 24 },
    { name: "苏州", price: 2600, rent: 220, color: "blue", position: 26 },
    { name: "长沙", price: 2600, rent: 220, color: "blue", position: 27 },
    { name: "哈尔滨", price: 2800, rent: 240, color: "blue", position: 29 },
    { name: "沈阳", price: 3000, rent: 260, color: "darkblue", position: 31 },
    { name: "郑州", price: 3500, rent: 350, color: "darkblue", position: 32 },
    
    // 电站
    { name: "电力公司", price: 1500, rent: 75, color: "utility", position: 12 },
    { name: "自来水公司", price: 1500, rent: 75, color: "utility", position: 28 },
    
    // 车站
    { name: "火车站", price: 2000, rent: 100, color: "railroad", position: 5 },
    { name: "东站", price: 2000, rent: 100, color: "railroad", position: 15 },
    { name: "南站", price: 2000, rent: 100, color: "railroad", position: 25 },
    { name: "北站", price: 2000, rent: 100, color: "railroad", position: 35 }
  ];

  properties.forEach(prop => {
    db.run(`
      INSERT INTO properties (room_id, position, name, price, rent_base, color_group)
      VALUES (-1, ?, ?, ?, ?, ?)
    `, [prop.position, prop.name, prop.price, prop.rent, prop.color]);
  });
}

// 保存数据库到文件
function saveDatabase() {
  if (!db) return;
  
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

// 获取数据库实例
function getDatabase() {
  return db;
}

module.exports = { initDatabase, getDatabase };