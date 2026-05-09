const Database = require('better-sqlite3');
const path = require('path');

// 数据库文件路径
const dbPath = path.join(__dirname, '../../data/monopoly.db');

// 确保数据目录存在
const fs = require('fs');
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 创建数据库连接
const db = new Database(dbPath, {
  fileMustExist: false, // 如果文件不存在则创建
  verbose: console.log
});

// 初始化数据库表
function initializeDatabase() {
  // 创建用户表
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    );
  `);

  // 创建房间表
  db.exec(`
    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      status TEXT DEFAULT 'waiting', -- waiting, playing, finished
      max_players INTEGER DEFAULT 6,
      created_by TEXT NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );
  `);

  // 创建玩家表
  db.exec(`
    CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      room_id TEXT NOT NULL,
      position INTEGER DEFAULT 0,
      money INTEGER DEFAULT 1500, -- 初始资金
      is_ready INTEGER DEFAULT 0, -- 0=未准备, 1=已准备
      in_game INTEGER DEFAULT 1, -- 0=已破产, 1=游戏中
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (room_id) REFERENCES rooms(id)
    );
  `);

  // 创建地产表
  db.exec(`
    CREATE TABLE IF NOT EXISTS properties (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      price INTEGER NOT NULL,
      rent INTEGER NOT NULL,
      rent_with_house INTEGER NOT NULL DEFAULT 0,
      rent_with_hotel INTEGER NOT NULL DEFAULT 0,
      position INTEGER NOT NULL,
      color_group TEXT NOT NULL,
      owner_id TEXT,
      houses INTEGER DEFAULT 0,
      has_hotel INTEGER DEFAULT 0,
      FOREIGN KEY (owner_id) REFERENCES players(id)
    );
  `);

  // 创建卡牌表
  db.exec(`
    CREATE TABLE IF NOT EXISTS cards (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL, -- chance, community
      description TEXT NOT NULL,
      effect_type TEXT NOT NULL, -- money, move, jail, etc.
      effect_value INTEGER DEFAULT 0,
      is_used INTEGER DEFAULT 0
    );
  `);

  // 创建游戏记录表
  db.exec(`
    CREATE TABLE IF NOT EXISTS game_records (
      id TEXT PRIMARY KEY,
      room_id TEXT NOT NULL,
      player_id TEXT NOT NULL,
      action TEXT NOT NULL,
      amount INTEGER DEFAULT 0,
      details TEXT,
      timestamp INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (room_id) REFERENCES rooms(id),
      FOREIGN KEY (player_id) REFERENCES players(id)
    );
  `);

  // 创建索引
  db.exec(`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_players_room ON players(room_id);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_players_user ON players(user_id);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_properties_owner ON properties(owner_id);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_properties_position ON properties(position);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_cards_type ON cards(type);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_game_records_room ON game_records(room_id);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_game_records_timestamp ON game_records(timestamp);`);

  // 初始化卡牌数据
  initializeCards();
  
  // 初始化地产数据
  initializeProperties();
}

// 初始化卡牌数据
function initializeCards() {
  // 检查是否已有卡牌数据
  const chanceCards = db.prepare('SELECT COUNT(*) as count FROM cards WHERE type = "chance"').get();
  const communityCards = db.prepare('SELECT COUNT(*) as count FROM cards WHERE type = "community"').get();
  
  if (chanceCards.count === 0) {
    // 机会卡
    const chanceCardsData = [
      { id: 'chance-1', type: 'chance', description: '前进到起点', effect_type: 'move', effect_value: 0 },
      { id: 'chance-2', type: 'chance', description: '获得150元', effect_type: 'money', effect_value: 150 },
      { id: 'chance-3', type: 'chance', description: '银行错误支付你200元', effect_type: 'money', effect_value: 200 },
      { id: 'chance-4', type: 'chance', description: '支付修理费，每间房屋25元，每间旅馆100元', effect_type: 'money', effect_value: -25 },
      { id: 'chance-5', type: 'chance', description: '前进到伊利诺伊大道', effect_type: 'move', effect_value: 24 },
      { id: 'chance-6', type: 'chance', description: '前进到圣查尔斯广场', effect_type: 'move', effect_value: 11 },
      { id: 'chance-7', type: 'chance', description: '退回3格', effect_type: 'move', effect_value: -3 },
      { id: 'chance-8', type: 'chance', description: '立即出狱', effect_type: 'jail', effect_value: 0 },
      { id: 'chance-9', type: 'chance', description: '到最近的铁路。如果路过起点，获得200元', effect_type: 'move', effect_value: 5 },
      { id: 'chance-10', type: 'chance', description: '到最近的公用事业。如果路过起点，获得200元', effect_type: 'move', effect_value: 12 }
    ];
    
    const insertChance = db.prepare(`
      INSERT INTO cards (id, type, description, effect_type, effect_value)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    db.transaction(() => {
      for (const card of chanceCardsData) {
        insertChance.run(card.id, card.type, card.description, card.effect_type, card.effect_value);
      }
    })();
  }
  
  if (communityCards.count === 0) {
    // 命运卡
    const communityCardsData = [
      { id: 'community-1', type: 'community', description: '从银行获得100元', effect_type: 'money', effect_value: 100 },
      { id: 'community-2', type: 'community', description: '从银行获得200元', effect_type: 'money', effect_value: 200 },
      { id: 'community-3', type: 'community', description: '医生收费，支付50元', effect_type: 'money', effect_value: -50 },
      { id: 'community-4', type: 'community', description: '从银行获得50元', effect_type: 'money', effect_value: 50 },
      { id: 'community-5', type: 'community', description: '支付学校费用，支付150元', effect_type: 'money', effect_value: -150 },
      { id: 'community-6', type: 'community', description: '收到10股股票，支付100元', effect_type: 'money', effect_value: -100 },
      { id: 'community-7', type: 'community', description: '获得20元', effect_type: 'money', effect_value: 20 },
      { id: 'community-8', type: 'community', description: '生日快乐！每位玩家支付你10元', effect_type: 'money', effect_value: 10 },
      { id: 'community-9', type: 'community', description: '继承100元', effect_type: 'money', effect_value: 100 },
      { id: 'community-10', type: 'community', description: '立即出狱', effect_type: 'jail', effect_value: 0 }
    ];
    
    const insertCommunity = db.prepare(`
      INSERT INTO cards (id, type, description, effect_type, effect_value)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    db.transaction(() => {
      for (const card of communityCardsData) {
        insertCommunity.run(card.id, card.type, card.description, card.effect_type, card.effect_value);
      }
    })();
  }
}

// 初始化地产数据
function initializeProperties() {
  // 检查是否已有地产数据
  const properties = db.prepare('SELECT COUNT(*) as count FROM properties').get();
  
  if (properties.count === 0) {
    // 地产数据
    const propertiesData = [
      // 普通地产
      { id: 'prop-1', name: '地中海大道', price: 600, rent: 50, position: 1, color_group: 'brown' },
      { id: 'prop-2', name: '波士顿大道', price: 600, rent: 50, position: 3, color_group: 'brown' },
      { id: 'prop-3', name: '阅读电车站', price: 200, rent: 25, position: 5, color_group: 'utility' },
      { id: 'prop-4', name: '康乃狄克大道', price: 800, rent: 60, position: 6, color_group: 'lightblue' },
      { id: 'prop-5', name: '佛蒙特大道', price: 1000, rent: 70, position: 8, color_group: 'lightblue' },
      { id: 'prop-6', name: '东方大道', price: 1000, rent: 70, position: 9, color_group: 'lightblue' },
      { id: 'prop-7', name: '圣查尔斯广场', price: 1200, rent: 80, position: 11, color_group: 'pink' },
      { id: 'prop-8', name: '州监狱', price: 0, rent: 0, position: 10, color_group: 'special' },
      { id: 'prop-9', name: '詹姆斯大道', price: 1400, rent: 90, position: 13, color_group: 'pink' },
      { id: 'prop-10', name: '田纳西大道', price: 1400, rent: 90, position: 14, color_group: 'pink' },
      { id: 'prop-11', name: '纽约大道', price: 1600, rent: 100, position: 15, color_group: 'orange' },
      { id: 'prop-12', name: '免费停车', price: 0, rent: 0, position: 20, color_group: 'special' },
      { id: 'prop-13', name: '肯塔基大道', price: 1800, rent: 110, position: 16, color_group: 'orange' },
      { id: 'prop-14', name: '印第安纳大道', price: 1800, rent: 110, position: 18, color_group: 'orange' },
      { id: 'prop-15', name: '伊利诺伊大道', price: 2000, rent: 120, position: 19, color_group: 'orange' },
      { id: 'prop-16', name: 'B&O铁路', price: 200, rent: 25, position: 25, color_group: 'railroad' },
      { id: 'prop-17', name: '大西洋大道', price: 2200, rent: 130, position: 21, color_group: 'red' },
      { id: 'prop-18', name: '文特诺大道', price: 2200, rent: 130, position: 23, color_group: 'red' },
      { id: 'prop-19', name: '水公司', price: 150, rent: 12, position: 28, color_group: 'utility' },
      { id: 'prop-20', name: '马里兰大道', price: 2400, rent: 140, position: 24, color_group: 'red' },
      { id: 'prop-21', name: '北卡罗来纳大道', price: 2600, rent: 150, position: 26, color_group: 'yellow' },
      { id: 'prop-22', name: '太平洋大道', price: 2600, rent: 150, position: 27, color_group: 'yellow' },
      { id: 'prop-23', name: '宾夕法尼亚大道', price: 2800, rent: 160, position: 29, color_group: 'yellow' },
      { id: 'prop-24', name: '短途铁路', price: 200, rent: 25, position: 35, color_group: 'railroad' },
      { id: 'prop-25', name: '公园广场', price: 3000, rent: 170, position: 31, color_group: 'green' },
      { id: 'prop-26', name: '董事会', price: 0, rent: 0, position: 30, color_group: 'special' },
      { id: 'prop-27', name: '北大道', price: 3000, rent: 170, position: 32, color_group: 'green' },
      { id: 'prop-28', name: '宾夕法尼亚铁路', price: 200, rent: 25, position: 36, color_group: 'railroad' },
      { id: 'prop-29', name: '漫步大道', price: 3200, rent: 180, position: 34, color_group: 'green' },
      { id: 'prop-30', name: '前往监狱', price: 0, rent: 0, position: 40, color_group: 'special' },
      { id: 'prop-31', name: '公园广场', price: 3500, rent: 200, position: 37, color_group: 'darkblue' },
      { id: 'prop-32', name: '利维坦大道', price: 4000, rent: 220, position: 39, color_group: 'darkblue' }
    ];
    
    const insertProperty = db.prepare(`
      INSERT INTO properties (id, name, price, rent, position, color_group)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    db.transaction(() => {
      for (const prop of propertiesData) {
        insertProperty.run(prop.id, prop.name, prop.price, prop.rent, prop.position, prop.color_group);
      }
    })();
  }
}

// 数据库操作辅助函数
function run(sql, params = []) {
  return db.prepare(sql).run(params);
}

function get(sql, params = []) {
  return db.prepare(sql).get(params);
}

function all(sql, params = []) {
  return db.prepare(sql).all(params);
}

// 导出数据库连接和辅助函数
module.exports = {
  db,
  initializeDatabase,
  run,
  get,
  all
};