-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    avatar TEXT DEFAULT 'default',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建房间表
CREATE TABLE IF NOT EXISTS rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    max_players INTEGER DEFAULT 4,
    status TEXT DEFAULT 'waiting', -- waiting, playing, finished
    host_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (host_id) REFERENCES users(id)
);

-- 创建游戏表
CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id INTEGER NOT NULL,
    current_player INTEGER NOT NULL,
    status TEXT DEFAULT 'waiting', -- waiting, playing, finished
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(id),
    FOREIGN KEY (current_player) REFERENCES users(id)
);

-- 创建玩家表
CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    game_id INTEGER NOT NULL,
    piece_color TEXT NOT NULL,
    position INTEGER DEFAULT 0,
    money INTEGER DEFAULT 1500,
    in_jail BOOLEAN DEFAULT FALSE,
    jail_turns INTEGER DEFAULT 0,
    bankrupt BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (game_id) REFERENCES games(id),
    UNIQUE(user_id, game_id)
);

-- 创建地产表
CREATE TABLE IF NOT EXISTS properties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    position INTEGER NOT NULL,
    price INTEGER NOT NULL,
    rent INTEGER NOT NULL,
    rent_with_house INTEGER NOT NULL,
    rent_with_hotel INTEGER NOT NULL,
    house_price INTEGER NOT NULL,
    hotel_price INTEGER NOT NULL,
    color_group TEXT NOT NULL,
    owner_id INTEGER,
    houses INTEGER DEFAULT 0,
    hotel BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (owner_id) REFERENCES users(id)
);

-- 创建交易记录表
CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER NOT NULL,
    from_user_id INTEGER NOT NULL,
    to_user_id INTEGER,
    amount INTEGER NOT NULL,
    type TEXT NOT NULL, -- rent, purchase, transfer, fine, etc.
    property_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id),
    FOREIGN KEY (from_user_id) REFERENCES users(id),
    FOREIGN KEY (to_user_id) REFERENCES users(id),
    FOREIGN KEY (property_id) REFERENCES properties(id)
);

-- 创建索引优化查询
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);
CREATE INDEX IF NOT EXISTS idx_games_room_id ON games(room_id);
CREATE INDEX IF NOT EXISTS idx_players_game_id ON players(game_id);
CREATE INDEX IF NOT EXISTS idx_properties_owner ON properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_transactions_game_id ON transactions(game_id);

-- 插入初始地产数据
INSERT OR IGNORE INTO properties (name, position, price, rent, rent_with_house, rent_with_hotel, house_price, hotel_price, color_group) VALUES
('Go', 0, 0, 0, 0, 0, 0, 0, 'none'),
('Mediterranean Avenue', 1, 60, 2, 10, 30, 50, 50, 'brown'),
('Community Chest', 2, 0, 0, 0, 0, 0, 0, 'none'),
('Baltic Avenue', 3, 60, 4, 20, 60, 50, 50, 'brown'),
('Income Tax', 4, 0, 0, 0, 0, 0, 0, 'none'),
('Reading Railroad', 5, 200, 25, 50, 100, 0, 0, 'railroad'),
('Oriental Avenue', 6, 100, 6, 30, 90, 50, 50, 'light blue'),
('Chance', 7, 0, 0, 0, 0, 0, 0, 'none'),
('Vermont Avenue', 8, 100, 6, 30, 90, 50, 50, 'light blue'),
('Connecticut Avenue', 9, 120, 8, 40, 100, 50, 50, 'light blue'),
('Jail', 10, 0, 0, 0, 0, 0, 0, 'none'),
('St. Charles Place', 11, 140, 10, 50, 150, 100, 100, 'pink'),
('Electric Company', 12, 150, 0, 0, 0, 0, 0, 'utility'),
('States Avenue', 13, 140, 10, 50, 150, 100, 100, 'pink'),
('Virginia Avenue', 14, 160, 12, 60, 180, 100, 100, 'pink'),
('Pennsylvania Railroad', 15, 200, 25, 50, 100, 0, 0, 'railroad'),
('St. James Place', 16, 180, 14, 70, 200, 100, 100, 'orange'),
('Community Chest', 17, 0, 0, 0, 0, 0, 0, 'none'),
('Tennessee Avenue', 18, 180, 14, 70, 200, 100, 100, 'orange'),
('New York Avenue', 19, 200, 16, 80, 220, 100, 100, 'orange'),
('Free Parking', 20, 0, 0, 0, 0, 0, 0, 'none'),
('Kentucky Avenue', 21, 220, 18, 90, 250, 150, 150, 'red'),
('Chance', 22, 0, 0, 0, 0, 0, 0, 'none'),
('Indiana Avenue', 23, 220, 18, 90, 250, 150, 150, 'red'),
('Illinois Avenue', 24, 240, 20, 100, 300, 150, 150, 'red'),
('B. & O. Railroad', 25, 200, 25, 50, 100, 0, 0, 'railroad'),
('Atlantic Avenue', 26, 260, 22, 110, 330, 150, 150, 'yellow'),
('Ventnor Avenue', 27, 260, 22, 110, 330, 150, 150, 'yellow'),
('Water Works', 28, 150, 0, 0, 0, 0, 0, 'utility'),
('Marvin Gardens', 29, 280, 24, 120, 360, 150, 150, 'yellow'),
('Go to Jail', 30, 0, 0, 0, 0, 0, 0, 'none'),
('Pacific Avenue', 31, 300, 26, 130, 390, 200, 200, 'green'),
('North Carolina Avenue', 32, 300, 26, 130, 390, 200, 200, 'green'),
('Community Chest', 33, 0, 0, 0, 0, 0, 0, 'none'),
('Pennsylvania Avenue', 34, 320, 28, 150, 450, 200, 200, 'green'),
('Short Line', 35, 200, 25, 50, 100, 0, 0, 'railroad'),
('Chance', 36, 0, 0, 0, 0, 0, 0, 'none'),
('Park Place', 37, 350, 35, 175, 500, 200, 200, 'dark blue'),
('Luxury Tax', 38, 0, 0, 0, 0, 0, 0, 'none'),
('Boardwalk', 39, 400, 50, 200, 600, 200, 200, 'dark blue');