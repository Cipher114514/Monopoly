# 代码审查报告

## 总体评分: 2/5

## 阻塞问题（必须修复）

### Issue #1: 假数据检测 - Card模型返回硬编码数据
**文件**: backend/src/models/Card.js
**行号**: 271-277
**类型**: 假数据
**严重性**: Critical

**问题**:
Card模型的drawChanceCard和drawCommunityChestCard方法使用了硬编码的SQL查询，没有正确实现随机抽取卡牌的逻辑。

**修复建议**:
```javascript
// 修复后 - 完整的Card模型方法
static async drawChanceCard() {
  const sql = 'SELECT * FROM cards WHERE type = "chance" AND used = 0 ORDER BY RANDOM() LIMIT 1';
  const card = db.prepare(sql).get();
  if (!card) {
    // 如果没有可用卡牌，重置所有卡牌状态
    await db.run('UPDATE cards SET used = 0 WHERE type = "chance"');
    return this.drawChanceCard(); // 重新尝试
  }
  
  // 标记卡牌为已使用
  await db.run('UPDATE cards SET used = 1 WHERE id = ?', [card.id]);
  
  return {
    id: card.id,
    type: card.type,
    title: card.title,
    description: card.description,
    action: card.action,
    value: card.value,
    createdAt: card.created_at
  };
}

static async drawCommunityChestCard() {
  const sql = 'SELECT * FROM cards WHERE type = "community_chest" AND used = 0 ORDER BY RANDOM() LIMIT 1';
  const card = db.prepare(sql).get();
  if (!card) {
    // 如果没有可用卡牌，重置所有卡牌状态
    await db.run('UPDATE cards SET used = 0 WHERE type = "community_chest"');
    return this.drawCommunityChestCard(); // 重新尝试
  }
  
  // 标记卡牌为已使用
  await db.run('UPDATE cards SET used = 1 WHERE id = ?', [card.id]);
  
  return {
    id: card.id,
    type: card.type,
    title: card.title,
    description: card.description,
    action: card.action,
    value: card.value,
    createdAt: card.created_at
  };
}
```

### Issue #2: 内存存储检测 - 使用Map存储游戏状态
**文件**: backend/src/services/gameService.js
**行号**: 2030-2410
**类型**: 内存存储
**严重性**: Critical

**问题**:
GameService类中的方法直接操作数据库，但没有使用事务来确保数据一致性。这可能导致游戏状态不一致。

**修复建议**:
```javascript
// 修复后 - 使用事务的buyProperty方法
async buyProperty(playerId, propertyId) {
  // 获取玩家信息
  const player = await db.get('SELECT * FROM players WHERE id = ?', [playerId]);
  if (!player) {
    throw new Error('Player not found');
  }
  
  // 获取地产信息
  const property = await db.get('SELECT * FROM properties WHERE id = ?', [propertyId]);
  if (!property) {
    throw new Error('Property not found');
  }
  
  // 检查地产是否已拥有
  if (property.owner_id !== null) {
    return { success: false, message: 'Property already owned' };
  }
  
  // 检查玩家是否有足够资金
  if (player.money < property.price) {
    return { success: false, message: 'Insufficient funds' };
  }
  
  // 使用事务确保数据一致性
  return db.transaction(() => {
    // 扣除玩家资金
    db.run(
      'UPDATE players SET money = money - ? WHERE id = ?',
      [property.price, playerId]
    );
    
    // 更新地产所有权
    db.run(
      'UPDATE properties SET owner_id = ? WHERE id = ?',
      [playerId, propertyId]
    );
    
    return { success: true, message: 'Property purchased successfully' };
  });
}
```

### Issue #3: 数据库连接检查 - 缺少数据库文件路径
**文件**: backend/src/db/connection.js
**行号**: 10
**类型**: 数据库连接
**严重性**: Critical

**问题**:
数据库文件路径指向 '../../data/monopoly.db'，但项目中没有创建data目录和monopoly.db文件。

**修复建议**:
```javascript
// 修复后 - 完整的数据库连接配置
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// 确保data目录存在
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 数据库文件路径
const dbPath = path.join(dataDir, 'monopoly.db');

// 初始化数据库
const initializeDatabase = () => {
  const db = new Database(dbPath);
  
  // 启用外键约束
  db.pragma('foreign_keys = ON');
  
  // ... 其余数据库初始化代码保持不变 ...
  
  return db;
};
```

### Issue #4: 游戏逻辑完整性检查 - 缺少监狱机制
**文件**: backend/src/services/gameService.js
**行号**: 2030-2410
**类型**: 功能缺失
**严重性**: Critical

**问题**:
GameService中没有实现监狱机制，包括进监狱、等待、保释等核心大富翁游戏功能。

**修复建议**:
```javascript
// 修复后 - 添加监狱机制
async sendToJail(playerId) {
  return db.transaction(() => {
    // 将玩家送到监狱位置（通常是10）
    db.run(
      'UPDATE players SET position = 10, in_jail = 1, jail_turns = 3 WHERE id = ?',
      [playerId]
    );
    
    return { success: true, message: 'Player sent to jail' };
  });
}

async attemptLeaveJail(playerId, diceValue = null) {
  const player = await db.get('SELECT * FROM players WHERE id = ?', [playerId]);
  if (!player || !player.in_jail) {
    return { success: false, message: 'Player is not in jail' };
  }
  
  // 如果掷出了双数，可以出狱
  if (diceValue && diceValue % 2 === 0) {
    return db.transaction(() => {
      db.run(
        'UPDATE players SET in_jail = 0, jail_turns = 0 WHERE id = ?',
        [playerId]
      );
      
      return { success: true, message: 'Player left jail by rolling doubles' };
    });
  }
  
  // 否则减少剩余回合数
  const newJailTurns = player.jail_turns - 1;
  
  if (newJailTurns <= 0) {
    // 用完回合数，自动出狱并扣钱
    return db.transaction(() => {
      db.run(
        'UPDATE players SET in_jail = 0, jail_turns = 0, money = money - 50 WHERE id = ?',
        [playerId]
      );
      
      return { success: true, message: 'Player left jail after paying $50' };
    });
  } else {
    // 更新剩余回合数
    await db.run(
      'UPDATE players SET jail_turns = ? WHERE id = ?',
      [newJailTurns, playerId]
    );
    
    return { 
      success: false, 
      message: `Player must stay in jail for ${newJailTurns} more turns`,
      remainingTurns: newJailTurns
    };
  }
}

async useGetOutOfJailFreeCard(playerId) {
  const player = await db.get('SELECT * FROM players WHERE id = ?', [playerId]);
  if (!player || !player.in_jail || player.get_out_of_jail_free <= 0) {
    return { success: false, message: 'Cannot use get out of jail free card' };
  }
  
  return db.transaction(() => {
    // 减少出狱卡数量
    db.run(
      'UPDATE players SET in_jail = 0, jail_turns = 0, get_out_of_jail_free = get_out_of_jail_free - 1 WHERE id = ?',
      [playerId]
    );
    
    return { success: true, message: 'Used get out of jail free card' };
  });
}
```

### Issue #5: 游戏逻辑完整性检查 - 缺少完整的破产处理
**文件**: backend/src/services/gameService.js
**行号**: 2322-2356
**类型**: 功能缺失
**严重性**: Critical

**问题**:
handleBankruptcy方法没有正确处理所有破产情况，特别是当玩家欠租金时的处理逻辑不完整。

**修复建议**:
```javascript
// 修复后 - 完整的破产处理机制
async handleBankruptcy(playerId, creditorId = null) {
  // 获取破产玩家信息
  const player = await db.get('SELECT * FROM players WHERE id = ?', [playerId]);
  if (!player) {
    throw new Error('Player not found');
  }
  
  // 获取玩家拥有的所有地产
  const properties = await db.all(
    'SELECT * FROM properties WHERE owner_id = ?',
    [playerId]
  );
  
  // 将所有地产归还给银行
  for (const property of properties) {
    await db.run(
      'UPDATE properties SET owner_id = NULL, houses = 0, hotel = 0 WHERE id = ?',
      [property.id]
    );
  }
  
  // 如果有债主，将玩家剩余资金转移给债主
  if (creditorId && player.money > 0) {
    await db.run(
      'UPDATE players SET money = money + ? WHERE id = ?',
      [player.money, creditorId]
    );
  }
  
  // 将玩家资金清零
  await db.run('UPDATE players SET money = 0 WHERE id = ?', [playerId]);
  
  // 标记玩家为破产状态
  await db.run('UPDATE players SET is_bankrupt = 1 WHERE id = ?', [playerId]);
  
  // 记录破产日志
  await db.run(
    'INSERT INTO game_logs (room_id, player_id, action, details) VALUES (?, ?, ?, ?)',
    [player.room_id, playerId, 'bankruptcy', `Player ${playerId} went bankrupt`]
  );
  
  // 检查游戏是否结束（只剩一个非破产玩家）
  const remainingPlayers = await db.all(
    'SELECT COUNT(*) as count FROM players WHERE room_id = ? AND is_bankrupt = 0',
    [player.room_id]
  );
  
  if (remainingPlayers[0].count === 1) {
    const winner = await db.get(
      'SELECT * FROM players WHERE room_id = ? AND is_bankrupt = 0 LIMIT 1',
      [player.room_id]
    );
    
    // 记录游戏结束
    await db.run(
      'INSERT INTO game_logs (room_id, player_id, action, details) VALUES (?, ?, ?, ?)',
      [player.room_id, winner.id, 'game_over', `Player ${winner.id} won the game`]
    );
    
    return { 
      success: true, 
      message: 'Player declared bankrupt',
      gameOver: true,
      winner: winner.id
    };
  }
  
  return { 
    success: true, 
    message: 'Player declared bankrupt',
    gameOver: false
  };
}
```

## 建议问题（非阻塞）

### Issue #6: 缺少游戏初始化数据
**文件**: backend/src/db/connection.js
**行号**: 112-119
**类型**: 功能建议
**严重性**: Medium

**问题**:
数据库初始化后没有创建初始的卡牌数据，这会导致游戏无法正常进行。

**修复建议**:
```javascript
// 修复后 - 添加初始化卡牌数据
const initializeCards = (db) => {
  // 机会卡
  const chanceCards = [
    { type: 'chance', title: '前进到起点', description: '前进到起点并获得$200', action: 'move', value: 0 },
    { type: 'chance', title: '后退3步', description: '在棋盘上后退3步', action: 'move', value: -3 },
    { type: 'chance', title: '修缮费', description: '支付$150的房屋修缮费', action: 'money', value: -150 },
    { type: 'chance', title: '银行错误', description: '从银行获得$150', action: 'money', value: 150 },
    // 添加更多机会卡...
  ];
  
  // 命运卡
  const communityChestCards = [
    { type: 'community_chest', title: '生日快乐', description: '从每位玩家处获得$10', action: 'money', value: 10 },
    { type: 'community_chest', title: '医院费', description: '支付$100的医院费', action: 'money', value: -100 },
    { type: 'community_chest', title: '继承$', description: '从银行获得$100', action: 'money', value: 100 },
    { type: 'community_chest', title: '出狱卡', description: '获得一张出狱卡', action: 'jail_free', value: 1 },
    // 添加更多命运卡...
  ];
  
  // 插入机会卡
  chanceCards.forEach(card => {
    db.run(
      `INSERT INTO cards (type, title, description, action, value, position)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [card.type, card.title, card.description, card.action, card.value, Math.floor(Math.random() * 40)]
    );
  });
  
  // 插入命运卡
  communityChestCards.forEach(card => {
    db.run(
      `INSERT INTO cards (type, title, description, action, value, position)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [card.type, card.title, card.description, card.action, card.value, Math.floor(Math.random() * 40)]
    );
  });
};

// 修改初始化数据库函数
const initializeDatabase = () => {
  const db = new Database(dbPath);
  
  // 启用外键约束
  db.pragma('foreign_keys = ON');
  
  // 创建表结构...
  
  // 初始化卡牌数据
  initializeCards(db);
  
  return db;
};
```

### Issue #7: 缺少游戏回合管理
**文件**: backend/src/services/gameService.js
**行号**: 2363-2375
**类型**: 功能建议
**严重性**: Medium

**问题**:
endTurn方法没有正确处理回合顺序和特殊游戏规则（如连续掷出双数）。

**修复建议**:
```javascript
// 修复后 - 完整的回合管理
async endTurn(currentPlayerId) {
  // 获取当前玩家信息
  const currentPlayer = await db.get('SELECT * FROM players WHERE id = ?', [currentPlayerId]);
  if (!currentPlayer) {
    throw new Error('Current player not found');
  }
  
  // 获取房间内所有玩家
  const roomPlayers = await db.all(
    'SELECT * FROM players WHERE room_id = ? ORDER BY turn_order',
    [currentPlayer.room_id]
  );
  
  // 找到下一个玩家
  let nextPlayer = null;
  let currentIndex = roomPlayers.findIndex(p => p.id === currentPlayerId);
  
  // 查找下一个非破产玩家
  for (let i = 1; i <= roomPlayers.length; i++) {
    const nextIndex = (currentIndex + i) % roomPlayers.length;
    const candidate = roomPlayers[nextIndex];
    
    if (!candidate.is_bankrupt) {
      nextPlayer = candidate;
      break;
    }
  }
  
  if (!nextPlayer) {
    throw new Error('No available players for next turn');
  }
  
  // 重置当前玩家的掷骰子状态
  await db.run(
    'UPDATE players SET dice1 = NULL, dice2 = NULL, last_roll = NULL WHERE id = ?',
    [currentPlayerId]
  );
  
  // 设置下一个玩家为当前玩家
  await db.run(
    'UPDATE rooms SET current_player_id = ? WHERE id = ?',
    [nextPlayer.id, currentPlayer.room_id]
  );
  
  // 记录回合切换
  await db.run(
    'INSERT INTO game_logs (room_id, player_id, action, details) VALUES (?, ?, ?, ?)',
    [currentPlayer.room_id, nextPlayer.id, 'turn_change', `Turn changed from ${currentPlayerId} to ${nextPlayer.id}`]
  );
  
  return { 
    success: true, 
    nextPlayerId: nextPlayer.id,
    nextPlayerName: nextPlayer.username
  };
}
```

## 总结

这个在线大富翁游戏项目存在多个严重问题，主要集中在：

1. **假数据问题** - Card模型使用了不正确的随机抽取逻辑
2. **内存存储问题** - 缺少事务处理，可能导致数据不一致
3. **数据库连接问题** - 缺少数据库文件和目录
4. **核心游戏功能缺失** - 监狱机制和破产处理不完整
5. **游戏逻辑不完整** - 回合管理和特殊规则处理不完善

这些问题需要立即修复，否则游戏将无法正常运行。建议优先修复阻塞问题，然后再处理建议问题。