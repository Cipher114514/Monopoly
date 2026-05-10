# 项目文件结构设计

## 后端文件

| 文件路径 | 职责 | 导出内容 |
|---------|------|---------|
| `server.js` | 应用入口，配置Express和Socket.io | Express应用，Socket.io服务器 |
| `db/connection.js` | 数据库连接管理 | 数据库连接对象 |
| `models/User.js` | 用户数据模型及CRUD操作 | User模型类 |
| `models/Room.js` | 房间数据模型及CRUD操作 | Room模型类 |
| `models/Player.js` | 玩家数据模型及CRUD操作 | Player模型类 |
| `models/Property.js` | 地产数据模型及CRUD操作 | Property模型类 |
| `models/Card.js` | 卡牌数据模型及CRUD操作 | Card模型类 |
| `models/GameEvent.js` | 游戏事件数据模型及CRUD操作 | GameEvent模型类 |
| `routes/auth.js` | 认证相关API路由 | 认证路由处理器 |
| `routes/rooms.js` | 房间相关API路由 | 房间路由处理器 |
| `routes/game.js` | 游戏相关API路由 | 游戏路由处理器 |
| `middleware/auth.js` | JWT认证中间件 | 认证中间件函数 |
| `utils/gameLogic.js` | 游戏核心逻辑处理 | 游戏逻辑工具函数 |
| `utils/validation.js` | 数据验证工具 | 验证函数 |
| `socket/handler.js` | Socket.io事件处理 | Socket事件处理器 |
| `socket/rooms.js` | 房间Socket事件处理 | 房间Socket事件 |
| `socket/game.js` | 游戏Socket事件处理 | 游戏Socket事件 |
| `config/db.js` | 数据库配置 | 数据库配置对象 |
| `config/jwt.js` | JWT配置 | JWT配置对象 |

## 前端文件

| 文件路径 | 职责 | 导出内容 |
|---------|------|---------|
| `src/App.js` | 应用根组件 | App组件 |
| `src/index.js` | 应用入口文件 | React渲染代码 |
| `src/components/Login.js` | 登录页面组件 | Login组件 |
| `src/components/Register.js` | 注册页面组件 | Register组件 |
| `src/components/Lobby.js` | 游戏大厅组件 | Lobby组件 |
| `src/components/RoomList.js` | 房间列表组件 | RoomList组件 |
| `src/components/CreateRoom.js` | 创建房间组件 | CreateRoom组件 |
| `src/components/Room.js` | 房间页面组件 | Room组件 |
| `src/components/GameBoard.js` | 游戏棋盘组件 | GameBoard组件 |
| `src/components/Dice.js` | 骰子组件 | Dice组件 |
| `src/components/PlayerInfo.js` | 玩家信息面板组件 | PlayerInfo组件 |
| `src/components/PropertyCard.js` | 地产卡片组件 | PropertyCard组件 |
| `src/components/Chat.js` | 聊天组件 | Chat组件 |
| `src/components/Modal.js` | 通用弹窗组件 | Modal组件 |
| `src/hooks/useAuth.js` | 认证状态Hook | 认证状态管理 |
| `src/hooks/useSocket.js` | Socket连接Hook | Socket连接管理 |
| `src/hooks/useGame.js` | 游戏状态Hook | 游戏状态管理 |
| `src/services/api.js` | API服务 | API请求函数 |
| `services/socket.js` | Socket服务 | Socket事件处理 |
| `utils/gameConstants.js` | 游戏常量 | 游戏常量定义 |
| `utils/helpers.js` | 通用工具函数 | 工具函数 |
| `styles/App.css` | 全局样式 | CSS样式 |
| `styles/Board.css` | 棋盘样式 | CSS样式 |
| `styles/Components.css` | 组件样式 | CSS样式 |