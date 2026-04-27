"""
Architecture Agent Mock 数据

根据需求规格说明书设计的系统架构
"""

MOCK_ARCHITECTURE = {
    "content": """# 系统架构设计文档

## 高层架构

**架构模式**: 模块化单体架构
**通信模式**: REST API + WebSocket
**数据模式**: 服务端权威 + 传统CRUD
**部署模式**: 本地开发环境

## 技术选型

### 后端技术栈
- **Node.js + Express**: 简单易学，快速开发
- **SQLite**: 轻量级数据库，适合课程作业
- **Socket.io**: WebSocket库，实现实时通信
- **JWT**: 令牌认证
- **Bcrypt**: 密码加密

### 前端技术栈
- **React + Vite**: 快速开发
- **Socket.io Client**: WebSocket客户端
- **CSS Modules**: 简单的样式管理

## 数据库设计

### 核心表结构

**users (用户表)**
```sql
- id: INTEGER PRIMARY KEY
- email: VARCHAR(100) UNIQUE
- password_hash: VARCHAR(255)
- nickname: VARCHAR(50)
- avatar_url: VARCHAR(255)
- created_at: TIMESTAMP
```

**rooms (房间表)**
```sql
- id: INTEGER PRIMARY KEY
- name: VARCHAR(100)
- owner_id: INTEGER
- max_players: INTEGER
- initial_money: INTEGER
- map_theme: VARCHAR(50)
- invite_code: VARCHAR(10)
- status: VARCHAR(20) -- waiting/playing/finished
- created_at: TIMESTAMP
```

**games (游戏表)**
```sql
- id: INTEGER PRIMARY KEY
- room_id: INTEGER
- status: VARCHAR(20)
- current_player_index: INTEGER
- game_state_json: TEXT -- JSON格式存储完整游戏状态
- created_at: TIMESTAMP
```

**players (玩家表)**
```sql
- id: INTEGER PRIMARY KEY
- game_id: INTEGER
- user_id: INTEGER (NULL表示AI玩家)
- position: INTEGER
- money: INTEGER
- status: VARCHAR(20) -- active/jailed/suspended/bankrupt
- jail_turns: INTEGER
- created_at: TIMESTAMP
```

**properties (地产表)**
```sql
- id: INTEGER PRIMARY KEY
- game_id: INTEGER
- tile_index: INTEGER
- owner_id: INTEGER (NULL表示无人拥有)
- building_level: INTEGER -- 0-4 (0=空地, 1-3=房子, 4=旅馆)
- is_mortgaged: BOOLEAN
```

**chance_fate_cards (卡牌表)**
```sql
- id: INTEGER PRIMARY KEY
- type: VARCHAR(10) -- chance/fate
- content: TEXT
- effect_type: VARCHAR(20)
- effect_value: INTEGER
- order_in_queue: INTEGER
```

## API接口设计

### 认证接口
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户

### 房间接口
- `POST /api/rooms` - 创建房间
- `GET /api/rooms` - 获取房间列表
- `POST /api/rooms/:id/join` - 加入房间
- `POST /api/rooms/:id/leave` - 离开房间
- `POST /api/rooms/:id/start` - 开始游戏

### 游戏接口
- `POST /api/games/:id/roll` - 掷骰子
- `POST /api/games/:id/buy-property` - 购买地产
- `POST /api/games/:id/build` - 建设房屋
- `POST /api/games/:id/mortgage` - 抵押地产
- `POST /api/games/:id/redeem` - 赎回地产
- `POST /api/games/:id/end-turn` - 结束回合

### WebSocket事件
- `join_room` - 加入房间
- `game_update` - 游戏状态更新
- `player_action` - 玩家操作
- `chat_message` - 聊天消息
- `emoji` - 表情互动

## 核心架构决策

### 1. 服务端权威架构
- 所有游戏逻辑在服务端执行
- 防止客户端作弊
- 确保游戏公平性

### 2. 游戏状态管理
- 完整游戏状态存储在game_state_json字段
- 支持断线重连和回放
- 事务保证关键操作

### 3. 实时通信
- Socket.io房间机制
- 自动重连机制
- 消息队列处理

### 4. 扩展性考虑
- 模块化设计
- 易于未来微服务拆分
""",

    "tech_stack": [
        "Node.js",
        "Express",
        "SQLite",
        "Socket.io",
        "React",
        "Vite",
        "JWT",
        "Bcrypt"
    ],

    "database_schema": {
        "users": "用户表 - id, email, password_hash, nickname, avatar_url",
        "rooms": "房间表 - id, name, owner_id, max_players, initial_money, status",
        "games": "游戏表 - id, room_id, status, current_player_index, game_state_json",
        "players": "玩家表 - id, game_id, user_id, position, money, status, jail_turns",
        "properties": "地产表 - id, game_id, tile_index, owner_id, building_level, is_mortgaged",
        "chance_fate_cards": "卡牌表 - id, type, content, effect_type, effect_value, order_in_queue",
        "game_records": "游戏记录表 - id, game_id, players_json, actions_json"
    },

    "api_endpoints": {
        "auth": [
            "POST /api/auth/register",
            "POST /api/auth/login",
            "GET /api/auth/me"
        ],
        "rooms": [
            "POST /api/rooms",
            "GET /api/rooms",
            "POST /api/rooms/:id/join",
            "POST /api/rooms/:id/leave",
            "POST /api/rooms/:id/start"
        ],
        "games": [
            "POST /api/games/:id/roll",
            "POST /api/games/:id/buy-property",
            "POST /api/games/:id/build",
            "POST /api/games/:id/mortgage",
            "POST /api/games/:id/redeem",
            "POST /api/games/:id/end-turn",
            "GET /api/games/:id/history"
        ],
        "websocket": [
            "join_room",
            "leave_room",
            "game_update",
            "player_action",
            "chat_message",
            "emoji"
        ]
    },

    "architecture_pattern": "模块化单体 + 服务端权威",
    "communication_pattern": "REST API + WebSocket",
    "data_pattern": "服务端计算 + 状态存储",
    "deployment_pattern": "本地开发",

    "performance_targets": {
        "api_response_time": "< 200ms",
        "websocket_latency": "< 100ms",
        "ui_response_time": "< 200ms",
        "animation_time": "< 3s",
        "concurrent_users": "1000人",
        "concurrent_rooms": "100个房间"
    },

    "key_design_decisions": {
        "server_authority": "所有游戏逻辑在服务端执行，防作弊",
        "state_management": "完整游戏状态序列化存储，支持回放",
        "realtime_sync": "WebSocket + 服务端广播",
        "transaction_integrity": "关键操作使用事务保证一致性"
    }
}
