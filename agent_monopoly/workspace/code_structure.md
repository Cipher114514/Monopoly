# 在线大富翁游戏 - 项目结构说明文档

## 项目概述

这是一个基于 Node.js + React + Socket.io 的在线多人大富翁游戏。支持用户注册登录、创建房间、实时游戏、聊天等功能。

## 项目结构

### 后端结构

```
backend/
├── server.js              # 服务器入口文件
├── src/
│   ├── config/            # 配置文件
│   │   ├── db.js          # 数据库配置
│   │   └── jwt.js         # JWT 配置
│   ├── db/                # 数据库连接
│   │   └── connection.js  # 数据库连接管理
│   ├── middleware/        # 中间件
│   │   └── auth.js        # JWT 认证中间件
│   ├── models/            # 数据模型
│   │   ├── User.js        # 用户模型
│   │   ├── Room.js        # 房间模型
│   │   ├── Player.js      # 玩家模型
│   │   ├── Property.js    # 地产模型
│   │   ├── Card.js        # 卡牌模型
│   │   └── GameEvent.js   # 游戏事件模型
│   ├── routes/            # API 路由
│   │   ├── auth.js        # 认证相关路由
│   │   ├── game.js        # 游戏相关路由
│   │   └── rooms.js       # 房间相关路由
│   ├── socket/            # Socket.io 事件处理
│   │   ├── handler.js     # Socket 主处理器
│   │   ├── game.js        # 游戏相关事件
│   │   └── rooms.js       # 房间相关事件
│   ├── utils/             # 工具函数
│   │   ├── gameLogic.js   # 游戏逻辑
│   │   └── validation.js  # 数据验证
│   └── server.js          # 服务器入口（同根目录）
```

### 前端结构

```
frontend/
├── index.html             # HTML 入口
├── src/
│   ├── components/        # React 组件
│   │   ├── Chat.js        # 聊天组件
│   │   ├── CreateRoom.js  # 创建房间组件
│   │   ├── Dice.js        # 骰子组件
│   │   ├── GameBoard.js   # 游戏棋盘组件
│   │   ├── Lobby.js       # 大厅组件
│   │   ├── Login.js       # 登录组件
│   │   ├── Modal.js       # 模态框组件
│   │   ├── PlayerInfo.js  # 玩家信息组件
│   │   ├── PropertyCard.js # 地产卡片组件
│   │   ├── Register.js    # 注册组件
│   │   ├── Room.js        # 房间组件
│   │   └── RoomList.js    # 房间列表组件
│   ├── hooks/             # 自定义 Hooks
│   │   ├── useAuth.js     # 认证相关 Hook
│   │   ├── useGame.js     # 游戏相关 Hook
│   │   └── useSocket.js   # Socket 相关 Hook
│   ├── services/          # API 服务
│   │   ├── api.js         # HTTP API 客户端
│   │   └── socket.js      # Socket 客户端
│   ├── utils/             # 工具函数
│   │   ├── gameConstants.js # 游戏常量
│   │   └── helpers.js     # 辅助函数
│   ├── App.js             # 主应用组件
│   ├── index.js           # 应用入口
│   └── styles/            # 样式文件
│       ├── App.css        # 全局样式
│       ├── Board.css      # 棋盘样式
│       └── Components.css # 组件样式
```

## 数据库结构

### 用户表 (users)
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 房间表 (rooms)
```sql
CREATE TABLE rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    max_players INTEGER DEFAULT 4,
    status TEXT DEFAULT 'waiting', -- waiting, playing, finished
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);
```

### 玩家表 (players)
```sql
CREATE TABLE players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    room_id INTEGER NOT NULL,
    color TEXT NOT NULL,
    position INTEGER DEFAULT 0,
    money INTEGER DEFAULT 1500,
    in_jail INTEGER DEFAULT 0,
    is_ready INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (room_id) REFERENCES rooms(id)
);
```

### 地产表 (properties)
```sql
CREATE TABLE properties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    position INTEGER NOT NULL,
    price INTEGER NOT NULL,
    rent INTEGER NOT NULL,
    owner_id INTEGER,
    house_count INTEGER DEFAULT 0,
    color_group TEXT NOT NULL,
    FOREIGN KEY (owner_id) REFERENCES users(id)
);
```

### 卡牌表 (cards)
```sql
CREATE TABLE cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL, -- chance, community_chest
    description TEXT NOT NULL,
    action TEXT NOT NULL, -- move, money, jail, etc.
    value INTEGER
);
```

### 游戏事件表 (game_events)
```sql
CREATE TABLE game_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id INTEGER NOT NULL,
    player_id INTEGER,
    event_type TEXT NOT NULL,
    event_data TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(id),
    FOREIGN KEY (player_id) REFERENCES players(id)
);
```

## 启动说明

### 后端启动

1. 确保已安装 Node.js (v16+)
2. 进入 backend 目录
3. 安装依赖：
   ```bash
   npm install
   ```
4. 启动服务器：
   ```bash
   npm start
   ```
   或
   ```bash
   node server.js
   ```
5. 服务器将在 http://localhost:3000 运行

### 前端启动

1. 确保已安装 Node.js (v16+)
2. 进入 frontend 目录
3. 安装依赖：
   ```bash
   npm install
   ```
4. 启动开发服务器：
   ```bash
   npm start
   ```
5. 前端应用将在 http://localhost:3001 运行

## API 接口

### 认证相关
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息

### 房间相关
- `GET /api/rooms` - 获取所有房间
- `POST /api/rooms` - 创建新房间
- `GET /api/rooms/:id` - 获取房间详情
- `POST /api/rooms/:id/join` - 加入房间
- `POST /api/rooms/:id/leave` - 离开房间

### 游戏相关
- `GET /api/game/properties` - 获取所有地产
- `POST /api/game/properties/:id/buy` - 购买地产
- `POST /api/game/properties/:id/build` - 建设房屋
- `GET /api/game/cards` - 获取卡牌

## Socket 事件

### 房间相关
- `join_room` - 加入房间
- `leave_room` - 离开房间
- `create_room` - 创建房间
- `player_ready` - 玩家准备状态切换

### 游戏相关
- `start_game` - 开始游戏
- `roll_dice` - 掷骰子
- `player_moved` - 玩家移动
- `buy_property` - 购买地产
- `build_house` - 建设房屋
- `end_turn` - 结束回合
- `game_event` - 游戏事件

### 聊天相关
- `chat_message` - 发送聊天消息
- `chat_history` - 获取聊天历史

## 核心游戏功能

1. **用户系统**：注册、登录、个人信息管理
2. **房间系统**：创建房间、加入房间、玩家准备状态管理
3. **游戏核心**：
   - 掷骰子移动
   - 地产购买与建设
   - 租金收取
   - 机会/命运卡
   - 破产判定
   - 回合管理
4. **实时通信**：通过 Socket.io 实现游戏状态同步和聊天
5. **数据持久化**：所有游戏数据保存在 SQLite 数据库中

## 技术栈

- **后端**：Node.js, Express, Socket.io, SQLite, JWT
- **前端**：React, React Router, Socket.io Client
- **样式**：CSS Modules, 响应式设计
- **数据库**：SQLite

## 开发注意事项

1. 所有数据库操作使用参数化查询防止 SQL 注入
2. JWT 用于 API 认证，Socket.io 使用相同的 JWT 进行身份验证
3. 前端状态管理使用 React Hooks
4. 游戏逻辑封装在 utils/gameLogic.js 中
5. 所有 API 响应使用 JSON 格式
6. 错误处理使用统一的错误中间件
7. 前端组件使用函数式组件和 Hooks