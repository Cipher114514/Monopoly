# Socket.io 事件设计

## 客户端 → 服务端事件

| 事件名 | 参数 | 说明 |
|--------|------|------|
| `user_login` | { username, password } | 用户登录 |
| `user_register` | { username, password } | 用户注册 |
| `create_room` | { roomName, maxPlayers } | 创建房间 |
| `join_room` | { roomId } | 加入房间 |
| `leave_room` | { roomId } | 离开房间 |
| `player_ready` | { roomId, isReady } | 玩家准备状态切换 |
| `start_game` | { roomId } | 房主开始游戏 |
| `roll_dice` | { roomId } | 掷骰子 |
| `buy_property` | { roomId, propertyId } | 购买地产 |
| `build_house` | { roomId, propertyId } | 建设房屋 |
| `end_turn` | { roomId } | 结束回合 |
| `send_chat` | { roomId, message } | 发送聊天消息 |
| `draw_card` | { roomId } | 抽取卡牌 |
| `bankrupt` | { roomId } | 玩家破产宣告 |

## 服务端 → 客户端事件

| 事件名 | 数据 | 说明 |
|--------|------|------|
| `login_success` | { userId, username } | 登录成功 |
| `login_failed` | { message } | 登录失败 |
| `register_success` | { userId, username } | 注册成功 |
| `register_failed` | { message } | 注册失败 |
| `room_created` | { room } | 房间创建成功 |
| `room_list_updated` | { rooms } | 房间列表更新 |
| `room_joined` | { room } | 成功加入房间 |
| `room_left` | { roomId } | 离开房间 |
| `player_joined` | { player } | 新玩家加入房间 |
| `player_left` | { playerId } | 玩家离开房间 |
| `player_ready_updated` | { playerId, isReady } | 玩家准备状态更新 |
| `game_started` | { gameState } | 游戏开始 |
| `dice_rolled` | { playerId, diceValue } | 骰子结果 |
| `player_moved` | { playerId, newPosition } | 玩家移动 |
| `property_purchased` | { propertyId, ownerId } | 地产被购买 |
| `house_built` | { propertyId, houseCount } | 房屋建成 |
| `rent_paid` | { fromPlayerId, toPlayerId, amount } | 支付过路费 |
| `turn_changed` | { currentPlayerId } | 回合切换 |
| `card_drawn` | { playerId, card } | 抽取卡牌 |
| `card_effect_applied` | { playerId, effect } | 卡牌效果执行 |
| `player_bankrupt` | { playerId } | 玩家破产 |
| `game_ended` | { winnerId } | 游戏结束 |
| `chat_message` | { playerId, username, message, timestamp } | 聊天消息 |
| `error` | { code, message } | 错误信息 |