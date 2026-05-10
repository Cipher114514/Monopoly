# 数据库设计文档

## 表清单

### users（用户表）
| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 用户唯一标识 |
| username | TEXT | NOT NULL UNIQUE | 用户名 |
| email | TEXT | UNIQUE | 邮箱地址 |
| password_hash | TEXT | NOT NULL | 密码哈希值 |
| created_at | INTEGER | DEFAULT (strftime('%s', 'now')) | 创建时间戳 |

### rooms（房间表）
| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 房间唯一标识 |
| name | TEXT | NOT NULL | 房间名称 |
| max_players | INTEGER | DEFAULT 6 | 最大玩家数 |
| creator_id | INTEGER | NOT NULL | 创建者ID（外键） |
| status | TEXT | DEFAULT 'waiting' | 房间状态（waiting/playing/finished） |
| current_turn | INTEGER | DEFAULT 0 | 当前回合玩家索引 |
| created_at | INTEGER | DEFAULT (strftime('%s', 'now')) | 创建时间戳 |

### players（玩家表）
| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 玩家唯一标识 |
| user_id | INTEGER | NOT NULL | 用户ID（外键） |
| room_id | INTEGER | NOT NULL | 房间ID（外键） |
| position | INTEGER | DEFAULT 0 | 当前位置 |
| money | INTEGER | DEFAULT 1500 | 当前资金 |
| in_jail | INTEGER | DEFAULT 0 | 是否在监狱（0/1） |
| jail_turns | INTEGER | DEFAULT 0 | 监狱剩余回合数 |
| is_ready | INTEGER | DEFAULT 0 | 是否准备就绪（0/1） |
| is_bankrupt | INTEGER | DEFAULT 0 | 是否破产（0/1） |
| color | TEXT | 棋子颜色 |
| created_at | INTEGER | DEFAULT (strftime('%s', 'now')) | 创建时间戳 |

### properties（地产表）
| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 地产唯一标识 |
| name | TEXT | NOT NULL | 地产名称 |
| position | INTEGER | NOT NULL UNIQUE | 棋盘位置 |
| price | INTEGER | NOT NULL | 购买价格 |
| base_rent | INTEGER | NOT NULL | 基础租金 |
| color_group | TEXT | 颜色分组 |
| house_count | INTEGER | DEFAULT 0 | 房屋数量 |
| owner_id | INTEGER | 所有者ID（外键） |
| created_at | INTEGER | DEFAULT (strftime('%s', 'now')) | 创建时间戳 |

### cards（卡牌表）
| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 卡牌唯一标识 |
| type | TEXT | NOT NULL | 卡牌类型（chance/community） |
| title | TEXT | NOT NULL | 卡牌标题 |
| description | TEXT | NOT NULL | 卡牌描述 |
| effect_type | TEXT | NOT NULL | 效果类型（move/money/goto_jail/get_out_jail等） |
| effect_value | INTEGER | 效果值（移动步数/金额等） |
| created_at | INTEGER | DEFAULT (strftime('%s', 'now')) | 创建时间戳 |

### game_records（游戏记录表）
| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 记录唯一标识 |
| room_id | INTEGER | NOT NULL | 房间ID（外键） |
| player_id | INTEGER | NOT NULL | 玩家ID（外键） |
| event_type | TEXT | NOT NULL | 事件类型（move/bankrupt/rent等） |
| event_data | TEXT | 事件数据（JSON格式） |
| created_at | INTEGER | DEFAULT (strftime('%s', 'now')) | 创建时间戳 |

## SQL创建语句

```sql
-- 用户表
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
);
CREATE INDEX idx_users_username ON users(username);

-- 房间表
CREATE TABLE rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    max_players INTEGER DEFAULT 6,
    creator_id INTEGER NOT NULL,
    status TEXT DEFAULT 'waiting',
    current_turn INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (creator_id) REFERENCES users(id)
);

-- 玩家表
CREATE TABLE players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    room_id INTEGER NOT NULL,
    position INTEGER DEFAULT 0,
    money INTEGER DEFAULT 1500,
    in_jail INTEGER DEFAULT 0,
    jail_turns INTEGER DEFAULT 0,
    is_ready INTEGER DEFAULT 0,
    is_bankrupt INTEGER DEFAULT 0,
    color TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (room_id) REFERENCES rooms(id),
    UNIQUE(user_id, room_id)
);
CREATE INDEX idx_players_user ON players(user_id);
CREATE INDEX idx_players_room ON players(room_id);

-- 地产表
CREATE TABLE properties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    position INTEGER NOT NULL UNIQUE,
    price INTEGER NOT NULL,
    base_rent INTEGER NOT NULL,
    color_group TEXT,
    house_count INTEGER DEFAULT 0,
    owner_id INTEGER,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (owner_id) REFERENCES players(id)
);
CREATE INDEX idx_properties_position ON properties(position);
CREATE INDEX idx_properties_owner ON properties(owner_id);

-- 卡牌表
CREATE TABLE cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    effect_type TEXT NOT NULL,
    effect_value INTEGER,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
);
CREATE INDEX idx_cards_type ON cards(type);

-- 游戏记录表
CREATE TABLE game_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id INTEGER NOT NULL,
    player_id INTEGER NOT NULL,
    event_type TEXT NOT NULL,
    event_data TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (room_id) REFERENCES rooms(id),
    FOREIGN KEY (player_id) REFERENCES players(id)
);
CREATE INDEX idx_game_records_room ON game_records(room_id);
CREATE INDEX idx_game_records_player ON game_records(player_id);
```