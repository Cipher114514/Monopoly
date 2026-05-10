# 卡牌系统 API 文档

## 1. 抽取卡牌

**HTTP方法**: POST  
**路径**: /api/cards/draw  
**描述**: 从指定类型的卡牌堆中随机抽取一张卡牌  

**请求参数**:
| 参数名 | 类型 | 必填 | 位置 | 说明 |
|--------|------|------|------|------|
| cardType | string | 是 | Query | 卡牌类型（"chance" 或 "community"） |
| roomId | integer | 是 | Query | 房间ID |

**请求示例**:
```json
// 请求头
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <jwt_token>"
}

// 请求体 (空)
```

**响应示例**:
```json
{
  "code": 200,
  "message": "Card drawn successfully",
  "data": {
    "cardId": 1,
    "cardType": "chance",
    "title": "前进3格",
    "description": "请前进到距离当前位置3格的位置",
    "effectType": "move",
    "effectValue": 3
  }
}
```

## 2. 获取卡牌列表

**HTTP方法**: GET  
**路径**: /api/cards  
**描述**: 获取指定类型的所有卡牌列表  

**请求参数**:
| 参数名 | 类型 | 必填 | 位置 | 说明 |
|--------|------|------|------|------|
| cardType | string | 否 | Query | 卡牌类型（"chance" 或 "community"），不传则返回所有类型 |

**请求示例**:
```json
// 请求头
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <jwt_token>"
}

// 查询参数: ?cardType=chance
```

**响应示例**:
```json
{
  "code": 200,
  "message": "Cards retrieved successfully",
  "data": [
    {
      "cardId": 1,
      "cardType": "chance",
      "title": "前进3格",
      "description": "请前进到距离当前位置3格的位置",
      "effectType": "move",
      "effectValue": 3
    },
    {
      "cardId": 2,
      "cardType": "chance",
      "title": "银行付款",
      "description": "从银行获得150元",
      "effectType": "money",
      "effectValue": 150
    },
    {
      "cardId": 3,
      "cardType": "community",
      "title": "生日快乐",
      "description": "所有玩家每人给你50元",
      "effectType": "money",
      "effectValue": 50
    }
  ]
}
```

## 3. 执行卡牌效果

**HTTP方法**: POST  
**路径**: /api/cards/execute  
**描述**: 执行抽取到的卡牌效果  

**请求参数**:
| 参数名 | 类型 | 必填 | 位置 | 说明 |
|--------|------|------|------|------|
| cardId | integer | 是 | Path | 卡牌ID |
| roomId | integer | 是 | Query | 房间ID |

**请求示例**:
```json
// 请求头
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <jwt_token>"
}

// 请求体
{
  "userId": 123,
  "currentPosition": 5
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "Card effect executed successfully",
  "data": {
    "cardId": 1,
    "effectType": "move",
    "effectValue": 3,
    "newPosition": 8,
    "gameState": {
      "players": [
        {
          "id": 123,
          "userId": 1,
          "roomId": 456,
          "position": 8,
          "money": 1350
        }
      ],
      "currentTurn": 1
    }
  }
}
```