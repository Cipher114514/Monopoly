# 地产系统 API 文档

## 1. 获取所有地产

### GET /api/properties

**描述**: 获取游戏棋盘上所有地产的列表信息

**请求参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| room_id | integer | 是 | 房间ID，用于过滤特定房间的地产 |

**响应示例**:
```json
{
  "code": 200,
  "data": [
    {
      "id": 1,
      "name": "地中海大道",
      "position": 1,
      "price": 60,
      "base_rent": 2,
      "color_group": "紫色",
      "house_count": 0,
      "owner_id": null,
      "created_at": 1625097600
    },
    {
      "id": 2,
      "name": "波罗的海大道",
      "position": 3,
      "price": 60,
      "base_rent": 4,
      "color_group": "紫色",
      "house_count": 0,
      "owner_id": 2,
      "created_at": 1625097600
    }
  ]
}
```

## 2. 获取地产详情

### GET /api/properties/:id

**描述**: 获取指定地产的详细信息，包括当前状态和租金计算规则

**请求参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | integer | 是 | 地产ID |

**响应示例**:
```json
{
  "code": 200,
  "data": {
    "id": 1,
    "name": "地中海大道",
    "position": 1,
    "price": 60,
    "base_rent": 2,
    "color_group": "紫色",
    "house_count": 0,
    "owner_id": null,
    "rent_schedule": [
      {"houses": 0, "rent": 2},
      {"houses": 1, "rent": 10},
      {"houses": 2, "rent": 30},
      {"houses": 3, "rent": 90},
      {"houses": 4, "rent": 160},
      {"houses": "hotel", "rent": 250}
    ],
    "house_price": 50,
    "created_at": 1625097600
  }
}
```

## 3. 购买地产

### POST /api/properties/:id/purchase

**描述**: 购买指定地产，需要玩家有足够资金且地产当前无人拥有

**请求参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | integer | 是 | 地产ID（路径参数）|
| user_id | integer | 是 | 购买用户ID（请求体）|
| room_id | integer | 是 | 房间ID（请求体）|

**请求体示例**:
```json
{
  "user_id": 1,
  "room_id": 101
}
```

**响应示例**:
```json
{
  "code": 200,
  "data": {
    "property_id": 1,
    "owner_id": 1,
    "purchase_price": 60,
    "player_balance": 1440,
    "message": "成功购买地中海大道"
  }
}
```

## 4. 建设房屋

### POST /api/properties/:id/houses

**描述**: 在指定地产上建设房屋，需要玩家拥有该地产且资金充足

**请求参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | integer | 是 | 地产ID（路径参数）|
| user_id | integer | 是 | 建设房屋的用户ID（请求体）|
| room_id | integer | 是 | 房间ID（请求体）|
| house_count | integer | 是 | 要建设的房屋数量（请求体）|

**请求体示例**:
```json
{
  "user_id": 1,
  "room_id": 101,
  "house_count": 1
}
```

**响应示例**:
```json
{
  "code": 200,
  "data": {
    "property_id": 1,
    "house_count": 1,
    "construction_cost": 50,
    "player_balance": 1390,
    "new_rent": 10,
    "message": "成功在地中海大道上建设1座房屋"
  }
}
```

## 5. 出售地产

### POST /api/properties/:id/sell

**描述**: 出售指定地产及其上的所有房屋，将资金返还给原所有者

**请求参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | integer | 是 | 地产ID（路径参数）|
| user_id | integer | 是 | 出售用户ID（请求体）|
| room_id | integer | 是 | 房间ID（请求体）|

**请求体示例**:
```json
{
  "user_id": 1,
  "room_id": 101
}
```

**响应示例**:
```json
{
  "code": 200,
  "data": {
    "property_id": 1,
    "sold_price": 60,
    "house_refund": 100,
    "total_refund": 160,
    "player_balance": 1600,
    "new_owner_id": null,
    "message": "成功出售地中海大道及其上的房屋"
  }
}
```

## 错误响应示例

### 购买地产失败
```json
{
  "code": 400,
  "error": "Cannot purchase property",
  "message": "该地产已被其他玩家拥有"
}
```

### 建设房屋失败
```json
{
  "code": 400,
  "error": "Cannot build houses",
  "message": "玩家资金不足以建设房屋"
}
```

### 出售地产失败
```json
{
  "code": 400,
  "error": "Cannot sell property",
  "message": "玩家不是该地产的所有者"
}
```