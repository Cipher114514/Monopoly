"""
Coding Agent Mock 数据

代码实现和项目结构
"""

MOCK_CODE = {
    "content": """# 代码实现文档

## 项目结构

```
monopoly-game/
├── backend/
│   ├── src/
│   │   ├── routes/        # 路由
│   │   │   ├── auth.js
│   │   │   ├── rooms.js
│   │   │   └── games.js
│   │   ├── services/      # 业务逻辑
│   │   │   ├── authService.js
│   │   │   ├── roomService.js
│   │   │   └── gameService.js    # 核心游戏逻辑
│   │   │   ├── economyService.js # 经济系统
│   │   │   ├── propertyService.js # 地块管理
│   │   │   └── recordService.js  # 回放系统
│   │   ├── models/        # 数据模型
│   │   │   ├── db.js
│   │   │   └── schemas.js
│   │   ├── socket/        # WebSocket
│   │   │   └── gameHandler.js
│   │   ├── game/          # 游戏引擎
│   │   │   ├── GameEngine.js
│   │   │   ├── Player.js
│   │   │   ├── Property.js
│   │   │   └── CardDeck.js
│   │   └── app.js
│   └── tests/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.jsx
│   │   │   ├── RoomList.jsx
│   │   │   ├── GameBoard.jsx
│   │   │   ├── PlayerInfo.jsx
│   │   │   └── Chat.jsx
│   │   ├── game/          # 游戏逻辑组件
│   │   │   ├── Dice.jsx
│   │   │   ├── Board.jsx
│   │   │   └── PropertyCard.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── index.html
└── README.md
```

## 核心代码示例

### gameService.js - 游戏核心逻辑
```javascript
class GameService {
    // 掷骰子移动
    async rollDice(gameId, playerId) {
        const game = await Game.findById(gameId);
        const dice = Math.floor(Math.random() * 6) + 1;
        const player = game.players[playerId];

        // 计算移动
        const oldPos = player.position;
        const newPos = (oldPos + dice) % 40;

        // 判断是否路过起点
        const passedStart = (oldPos < 40 && newPos < oldPos) ||
                           (oldPos >= 40 && newPos < oldPos - 40);

        if (passedStart && newPos !== 0) {
            player.money += 200; // 路过起点发钱
        }

        player.position = newPos;

        // 触发地块事件
        await this.handleTileEvent(game, player, newPos);

        await game.save();
        return { dice, newPos, passedStart };
    }

    // 购买地产
    async buyProperty(gameId, playerId, tileIndex) {
        const game = await Game.findById(gameId);
        const player = game.players[playerId];
        const tile = game.map[tileIndex];

        if (player.money < tile.price) {
            throw new Error('资金不足');
        }

        player.money -= tile.price;
        tile.ownerId = playerId;

        await game.save();
    }

    // 支付过路费
    async payRent(gameId, playerId, tileIndex) {
        const game = await Game.findById(gameId);
        const player = game.players[playerId];
        const tile = game.map[tileIndex];
        const owner = game.players[tile.ownerId];

        if (tile.isMortgaged) {
            return; // 抵押期间不收过路费
        }

        const rent = this.calculateRent(tile);

        if (player.money < rent) {
            // 触发破产流程
            await this.handleBankruptcy(game, player, rent);
        } else {
            player.money -= rent;
            owner.money += rent;
        }

        await game.save();
    }
}
```
""",
    "backend_files": [
        "backend/src/app.js",
        "backend/src/routes/auth.js",
        "backend/src/routes/rooms.js",
        "backend/src/routes/games.js",
        "backend/src/services/authService.js",
        "backend/src/services/roomService.js",
        "backend/src/services/gameService.js",
        "backend/src/services/economyService.js",
        "backend/src/services/propertyService.js",
        "backend/src/services/recordService.js",
        "backend/src/models/db.js",
        "backend/src/game/GameEngine.js",
        "backend/src/game/Player.js",
        "backend/src/game/Property.js",
        "backend/src/game/CardDeck.js",
        "backend/src/socket/gameHandler.js"
    ],
    "frontend_files": [
        "frontend/src/App.jsx",
        "frontend/src/components/Login.jsx",
        "frontend/src/components/RoomList.jsx",
        "frontend/src/components/GameBoard.jsx",
        "frontend/src/components/PlayerInfo.jsx",
        "frontend/src/components/Chat.jsx",
        "frontend/src/components/EmojiPicker.jsx",
        "frontend/src/game/Dice.jsx",
        "frontend/src/game/Board.jsx",
        "frontend/src/game/PropertyCard.jsx"
    ],
    "key_implementations": {
        "game_engine": "GameEngine.js - 核心游戏逻辑，处理回合流转",
        "economy_system": "economyService.js - 经济系统，处理买卖抵押赎回",
        "property_system": "propertyService.js - 地块系统，处理购买和建设",
        "record_system": "recordService.js - 回放系统，记录所有操作",
        "websocket": "gameHandler.js - WebSocket处理，实时同步"
    }
}
