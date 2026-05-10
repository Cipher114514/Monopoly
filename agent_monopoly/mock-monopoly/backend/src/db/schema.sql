-- 在线大富翁游戏数据库结构
-- 创建时间: 2024

-- 用户表
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    avatar_url TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- 房间表
CREATE TABLE rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    max_players INTEGER DEFAULT 6,
    status TEXT DEFAULT 'waiting', -- waiting, playing, finished
    creator_id INTEGER NOT NULL,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 玩家表
CREATE TABLE players (
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
    updated_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
    UNIQUE(user_id, room_id)
);

-- 地产表
CREATE TABLE properties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    position INTEGER NOT NULL,
    price INTEGER NOT NULL,
    base_rent INTEGER NOT NULL,
    color_group TEXT NOT NULL,
    house_price INTEGER,
    rent_with_house INTEGER,
    rent_with_two_houses INTEGER,
    rent_with_three_houses INTEGER,
    rent_with_four_houses INTEGER,
    rent_with_hotel INTEGER,
    house_count INTEGER DEFAULT 0,
    owner_id INTEGER,
    room_id INTEGER NOT NULL,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

-- 卡牌表
CREATE TABLE cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL, -- chance, community_chest
    title TEXT NOT NULL,
    description TEXT,
    effect_type TEXT NOT NULL, -- move, money, property
    effect_value TEXT, -- JSON格式存储效果参数
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- 游戏记录表
CREATE TABLE game_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    action_type TEXT NOT NULL, -- roll_dice, buy_property, pay_rent, etc.
    action_details TEXT, -- JSON格式存储详细信息
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_rooms_status ON rooms(status);
CREATE INDEX idx_players_room_id ON players(room_id);
CREATE INDEX idx_players_user_id ON players(user_id);
CREATE INDEX idx_properties_owner_id ON properties(owner_id);
CREATE INDEX idx_properties_room_id ON properties(room_id);
CREATE INDEX idx_cards_type ON cards(type);
CREATE INDEX idx_game_records_room_id ON game_records(room_id);
CREATE INDEX idx_game_records_user_id ON game_records(user_id);