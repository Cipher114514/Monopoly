# 房间系统 API 文档

## 创建房间

**HTTP方法**: POST  
**路径**: /api/rooms/create  
**描述**: 创建新的游戏房间  
**权限**: 已登录用户  
**请求参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| name | string | 是 | 房间名称 |
| maxPlayers | integer | 否 | 最大玩家数，默认为6 |

**请求体示例**:
```json
{
  "name": "新手房间",
  "maxPlayers": 4
}
```

**响应示例**:
```json
{
  "code": 200,
  "data": {
    "roomId": "room_12345",
    "name": "新手房间",
    "maxPlayers": 4,
    "creatorId": 1,
    "status": "waiting",
    "currentPlayers": 1,
    "createdAt": 1634567890
  }
}
```

## 获取房间列表

**HTTP方法**: GET  
**路径**: /api/rooms/list  
**描述**: 获取可加入的房间列表  
**权限**: 已登录用户  
**请求参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| status | string | 否 | 房间状态，默认为"waiting" |

**响应示例**:
```json
{
  "code": 200,
  "data": [
    {
      "roomId": "room_12345",
      "name": "新手房间",
      "maxPlayers": 4,
      "currentPlayers": 2,
      "status": "waiting",
      "createdAt": 1634567890
    },
    {
      "roomId": "room_67890",
      "name": "高手对决",
      "maxPlayers": 6,
      "currentPlayers": 6,
      "status": "playing",
      "createdAt": 1634567800
    }
  ]
}
```

## 加入房间

**HTTP方法**: POST  
**路径**: /api/rooms/:roomId/join  
**描述**: 加入指定房间  
**权限**: 已登录用户  
**请求参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| roomId | string | 是 | 房间ID |

**请求体示例**:
```json
{
  "userId": 1
}
```

**响应示例**:
```json
{
  "code": 200,
  "data": {
    "roomId": "room_12345",
    "playerId": 1,
    "position": 0,
    "money": 1500,
    "color": "red",
    "isReady": false
  }
}
```

## 离开房间

**HTTP方法**: POST  
**路径**: /api/rooms/:roomId/leave  
**描述**: 离开指定房间  
**权限**: 已登录用户  
**请求参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| roomId | string | 是 | 房间ID |

**请求体示例**:
```json
{
  "userId": 1
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "成功离开房间"
}
```

## 获取房间详情

**HTTP方法**: GET  
**路径**: /api/rooms/:roomId  
**描述**: 获取指定房间的详细信息  
**权限**: 已登录用户  
**请求参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| roomId | string | 是 | 房间ID |

**响应示例**:
```json
{
  "code": 200,
  "data": {
    "roomId": "room_12345",
    "name": "新手房间",
    "maxPlayers": 4,
    "creatorId": 1,
    "status": "waiting",
    "currentPlayers": 2,
    "players": [
      {
        "playerId": 1,
        "userId": 1,
        "username": "玩家1",
        "position": 0,
        "money": 1500,
        "color": "red",
        "isReady": false
      },
      {
        "playerId": 2,
        "userId": 2,
        "username": "玩家2",
        "position": 5,
        "money": 1400,
        "color": "blue",
        "isReady": true
      }
    ],
    "createdAt": 1634567890
  }
}
```