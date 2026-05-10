# 系统架构设计文档 - 总览

> 项目: 在线大富翁游戏
> 生成时间: C:\Users\Administrator\Desktop\软过\agent_monopoly

## 📋 文档索引

本文档分为多个模块，每个模块保存为独立文件以确保完整性。

### 核心模块

| 模块 | 文件 | 说明 |
|------|------|------|
| 数据库设计 | `architecture_db.md` | SQLite数据库Schema和创建语句 |
| 文件结构 | `architecture_structure.md` | 前后端文件结构和职责划分 |
| Socket.io事件 | `architecture_socketio.md` | 实时通信事件定义 |

### API模块

| 模块 | 文件 | 说明 |
|------|------|------|
| 用户系统API | `architecture_api_users.md` | 用户注册、登录、信息管理 |
| 房间系统API | `architecture_api_rooms.md` | 房间创建、加入、管理 |
| 玩家系统API | `architecture_api_players.md` | 玩家状态、准备机制 |
| 地产系统API | `architecture_api_properties.md` | 地产购买、建设、交易 |
| 卡牌系统API | `architecture_api_cards.md` | 卡牌抽取和效果 |

### 其他模块

| 模块 | 文件 | 说明 |
|------|------|------|
| 安全和性能 | `architecture_security.md` | 认证、加密、优化策略 |

## 📊 统计信息

- **数据表数量**: 6 个
- **API端点数量**: 5 个
- **文档总大小**: 34324 字符
- **模块文件数**: 9 个

## 🔍 快速导航

- 快速查看数据库设计: [architecture_db.md](architecture_db.md)
- 快速查看API列表: [architecture_api_users.md](architecture_api_users.md)
- 快速查看Socket.io事件: [architecture_socketio.md](architecture_socketio.md)

---

*本文档由 Architecture Agent 自动生成*
