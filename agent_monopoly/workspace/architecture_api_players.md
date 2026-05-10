# 玩家系统 RESTful API

## 1. 获取玩家信息

### [GET] /api/players/:id

**描述**: 根据玩家ID获取玩家详细信息

**路径参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | string | 是 | 玩家ID |

**响应示例**:
```json
{
  "code": 200,
  "data": {
    "id": "player_123",
    "userId": "user_456",
    "roomId": "room_789",
    "position": 5,
    "money": 1500,
    "inJail": 0,
    "isReady": 1,
    "isBankrupt": 0,
    "color": "#FF0000",
    "createdAt": 1634567890
  }
}
```

## 2. 玩家准备/取消准备

### [PUT] /api/players/:id/ready

**描述**: 设置玩家准备状态，准备/取消准备游戏

**路径参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | string | 是 | 玩家ID |

**请求体**:
```json
{
  "isReady": true
}
```

**响应示例**:
```json
{
  "code": 200,
  "data": {
    "id": "player_123",
    "isReady": true,
    "message": "玩家已准备"
  }
}
```

## 3. 获取玩家状态

### [GET] /api/players/:id/status

**描述**: 获取玩家当前游戏状态（是否在监狱、破产状态等）

**路径参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | string | 是 | 玩家ID |

**响应示例**:
```json
{
  "code": 200,
  "data": {
    "id": "player_123",
    "inJail": false,
    "jailTurns": 0,
    "isBankrupt": false,
    "isReady": true,
    "position": 5,
    "money": 1500,
    "propertiesCount": 2
  }
}
```

## 4. 更新玩家位置

### [PUT] /api/players/:id/position

**描述**: 更新玩家在棋盘上的位置

**路径参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | string | 是 | 玩家ID |

**请求体**:
```json
{
  "position": 10
}
```

**响应示例**:
```json
{
  "code": 200,
  "data": {
    "id": "player_123",
    "position": 10,
    "message": "玩家位置已更新"
  }
}
```

## 5. 更新玩家资金

### [PUT] /api/players/:id/money

**描述**: 更新玩家资金（支付或收取）

**路径参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | string | 是 | 玩家ID |

**请求体**:
```json
{
  "amount": -200,
  "reason": "支付过路费"
}
```

**响应示例**:
```json
{
  "code": 200,
  "data": {
    "id": "player_123",
    "money": 1300,
    "message": "玩家资金已更新"
  }
}
```

## 6. 将玩家送入监狱

### [PUT] /api/players/:id/jail

**描述**: 将玩家送入监狱

**路径参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | string | 是 | 玩家ID |

**请求体**:
```json
{
  "jailTurns": 3,
  "reason": "经过监狱格子"
}
```

**响应示例**:
```json
{
  "code": 200,
  "data": {
    "id": "player_123",
    "inJail": true,
    "jailTurns": 3,
    "message": "玩家已被送入监狱"
  }
}
```

## 7. 释放玩家出狱

### [PUT] /api/players/:id/release

**描述**: 释放玩家出监狱

**路径参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | string | 是 | 玩家ID |

**响应示例**:
```json
{
  "code": 200,
  "data": {
    "id": "player_123",
    "inJail": false,
    "jailTurns": 0,
    "message": "玩家已出狱"
  }
}
```

## 8. 宣布玩家破产

### [PUT] /api/players/:id/bankrupt

**描述**: 宣布玩家破产

**路径参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | string | 是 | 玩家ID |

**请求体**:
```json
{
  "reason": "资金不足"
}
```

**响应示例**:
```json
{
  "code": 200,
  "data": {
    "id": "player_123",
    "isBankrupt": true,
    "message": "玩家已破产"
  }
}
```

## 9. 获取房间内所有玩家

### [GET] /api/rooms/:roomId/players

**描述**: 获取指定房间内所有玩家信息

**路径参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| roomId | string | 是 | 房间ID |

**响应示例**:
```json
{
  "code": 200,
  "data": [
    {
      "id": "player_123",
      "userId": "user_456",
      "position": 5,
      "money": 1500,
      "inJail": 0,
      "isReady": 1,
      "color": "#FF0000"
    },
    {
      "id": "player_124",
      "userId": "user_457",
      "position": 12,
      "money": 1300,
      "inJail": 0,
      "isReady": 1,
      "color": "#00FF00"
    }
  ]
}
```