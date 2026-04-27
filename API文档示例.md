# 在线大富翁游戏 API 文档示例

## API 规范
- 协议: HTTPS
- 格式: JSON
- 认证: JWT Token (Bearer)
- 版本: v1
- 基础路径: `/api/v1`

---

## 全局规范

### 认证方式
所有需要登录的接口必须在请求头携带:
```
Authorization: Bearer <JWT_TOKEN>
```

### 响应格式
```json
{
  "code": 200,
  "message": "success",
  "data": {},
  "timestamp": 1714120000
}
```

### 错误码定义
| 错误码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未授权/Token无效 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 409 | 资源冲突 |
| 500 | 服务器内部错误 |

---

## 一、用户认证接口

### 1. 用户注册
```
POST /auth/register
```

**请求参数:**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| username | string | 是 | 用户名 (3-50字符) |
| email | string | 是 | 邮箱地址 |
| password | string | 是 | 密码 (6-32字符) |

**响应示例:**
```json
{
  "code": 200,
  "data": {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "player1",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 2. 用户登录
```
POST /auth/login
```

**请求参数:**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| username | string | 是 | 用户名/邮箱 |
| password | string | 是 | 密码 |

---

## 二、游戏房间接口

### 1. 创建房间
```
POST /rooms
```
**认证**: 需要登录

**请求参数:**
| 参数名 | 类型 | 必填 | 默认 | 说明 |
|--------|------|------|--------|------|
| name | string | 是 | | 房间名称 |
| max_players | integer | 否 | 4 | 最大玩家数 (2-8) |
| starting_balance | integer | 否 | 1500 | 初始资金 |
| turn_time_limit | integer | 否 | 60 | 回合时间限制(秒) |
| is_public | boolean | 否 | true | 是否公开 |
| password | string | 否 | | 房间密码 |

---

### 2. 获取房间列表
```
GET /rooms
```

**查询参数:**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| status | string | 否 | 筛选状态: waiting/playing |
| page | integer | 否 | 页码 |
| limit | integer | 否 | 每页数量 |

---

### 3. 加入房间
```
POST /rooms/{room_id}/join
```
**认证**: 需要登录

**请求参数:**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| password | string | 否 | 房间密码(私有房间) |

---

### 4. 离开房间
```
POST /rooms/{room_id}/leave
```
**认证**: 需要登录

---

## 三、游戏操作接口

### 1. 开始游戏
```
POST /games/{room_id}/start
```
**认证**: 需要登录 (房主权限)

---

### 2. 掷骰子
```
POST /games/{room_id}/roll
```
**认证**: 需要登录 (当前回合玩家)

**响应示例:**
```json
{
  "code": 200,
  "data": {
    "dice1": 3,
    "dice2": 4,
    "total": 7,
    "new_position": 12,
    "property_name": "Park Place",
    "action_required": "buy_or_auction"
  }
}
```

---

### 3. 购买地产
```
POST /games/{room_id}/buy-property
```
**认证**: 需要登录

**请求参数:**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| property_id | integer | 是 | 地产ID |

---

### 4. 建造房屋
```
POST /games/{room_id}/build-house
```
**认证**: 需要登录

**请求参数:**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| property_id | integer | 是 | 地产ID |
| houses | integer | 是 | 建造房屋数量 |

---

## 四、WebSocket 实时通信

### 连接地址
```
wss://api.monopoly.game/ws/game/{room_id}
```

### 事件类型
| 事件名 | 发送方向 | 说明 |
|--------|----------|------|
| `player_joined` | 服务器 | 玩家加入通知 |
| `turn_started` | 服务器 | 回合开始通知 |
| `dice_rolled` | 服务器 | 骰子结果广播 |
| `property_purchased` | 服务器 | 地产购买通知 |
| `chat_message` | 双向 | 聊天消息 |
| `game_ended` | 服务器 | 游戏结束通知 |

### 消息格式
```json
{
  "event": "dice_rolled",
  "data": {
    "player_id": "uuid",
    "dice1": 3,
    "dice2": 4,
    "position": 12
  },
  "timestamp": 1714120000
}
```

---

## 接口设计原则

1. **RESTful规范**: 符合HTTP语义, 资源导向设计
2. **幂等性**: GET/PUT/DELETE接口保证幂等
3. **版本管理**: URL包含版本号, 平滑升级
4. **限流策略**: 每个用户100次/分钟, 防止滥用
5. **请求校验**: 所有输入参数严格校验
6. **日志审计**: 所有接口操作留下审计日志

---

## 安全措施

✅ JWT 无状态认证, 有效期2小时
✅ 密码使用 bcrypt 加密存储
✅ 所有输入参数XSS过滤
✅ SQL注入防护
✅ CORS跨域限制
✅ 敏感操作二次验证
✅ 接口访问频率限制
✅ 所有操作可追溯审计