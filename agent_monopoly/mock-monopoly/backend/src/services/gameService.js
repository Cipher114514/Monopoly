const { db } = require('../db/connection');
const Player = require('../models/Player');
const Property = require('../models/Property');
const Card = require('../models/Card');

class GameService {
  /**
   * 掷骰子
   * @param {number} playerId - 玩家ID
   * @returns {Promise<{ dice1: number, dice2: number, total: number }>} - 骰子点数结果
   */
  async rollDice(playerId) {
    const dice1 = Math.floor(Math.random() * 6) + 1;
    const dice2 = Math.floor(Math.random() * 6) + 1;
    const total = dice1 + dice2;
    
    // 更新玩家掷骰子状态
    await db.run(
      `UPDATE players 
       SET dice1 = ?, dice2 = ?, last_roll = ?
       WHERE id = ?`,
      [dice1, dice2, total, playerId]
    );
    
    return { dice1, dice2, total };
  }

  /**
   * 移动玩家
   * @param {number} playerId - 玩家ID
   * @param {number} steps - 移动步数
   * @returns {Promise<{ newPosition: number, passedGo: boolean }>} - 移动结果
   */
  async movePlayer(playerId, steps) {
    // 获取玩家当前位置
    const player = await db.get('SELECT position FROM players WHERE id = ?', [playerId]);
    if (!player) {
      throw new Error('Player not found');
    }
    
    const oldPosition = player.position;
    let newPosition = oldPosition + steps;
    let passedGo = false;
    
    // 检查是否经过起点
    if (newPosition >= 40) {
      passedGo = true;
      newPosition = newPosition % 40;
      
      // 经过起点奖励
      await db.run(
        'UPDATE players SET money = money + 200 WHERE id = ?',
        [playerId]
      );
    }
    
    // 更新玩家位置
    await db.run(
      'UPDATE players SET position = ? WHERE id = ?',
      [newPosition, playerId]
    );
    
    return { newPosition, passedGo };
  }

  /**
   * 购买地产
   * @param {number} playerId - 玩家ID
   * @param {number} propertyId - 地产ID
   * @returns {Promise<{ success: boolean, message: string }>} - 购买结果
   */
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
    
    // 执行购买
    await db.run('BEGIN TRANSACTION');
    try {
      // 扣除玩家资金
      await db.run(
        'UPDATE players SET money = money - ? WHERE id = ?',
        [property.price, playerId]
      );
      
      // 更新地产所有权
      await db.run(
        'UPDATE properties SET owner_id = ? WHERE id = ?',
        [playerId, propertyId]
      );
      
      await db.run('COMMIT');
      return { success: true, message: 'Property purchased successfully' };
    } catch (error) {
      await db.run('ROLLBACK');
      throw error;
    }
  }

  /**
   * 收取租金
   * @param {number} playerId - 落地玩家ID
   * @returns {Promise<{ rentPaid: number, ownerId: number } | null}> - 租金信息，如果无人拥有则返回null
   */
  async collectRent(playerId) {
    // 获取玩家位置
    const player = await db.get('SELECT position FROM players WHERE id = ?', [playerId]);
    if (!player) {
      throw new Error('Player not found');
    }
    
    // 获取位置上的地产
    const property = await db.get(
      'SELECT * FROM properties WHERE position = ? AND owner_id IS NOT NULL',
      [player.position]
    );
    
    if (!property) {
      return null; // 无人拥有
    }
    
    // 计算租金
    let rent = property.base_rent;
    
    // 根据房屋数量增加租金
    if (property.house_count > 0) {
      rent = property.base_rent * Math.pow(2, property.house_count);
    }
    
    // 获取地主信息
    const owner = await db.get('SELECT * FROM players WHERE id = ?', [property.owner_id]);
    
    // 检查玩家是否有足够资金支付租金
    if (player.money < rent) {
      // 破产处理
      await this.handleBankruptcy(playerId, property.owner_id);
      return { rentPaid: player.money, ownerId: property.owner_id };
    }
    
    // 执行租金交易
    await db.run('BEGIN TRANSACTION');
    try {
      // 从玩家扣除租金
      await db.run(
        'UPDATE players SET money = money - ? WHERE id = ?',
        [rent, playerId]
      );
      
      // 给地主增加租金
      await db.run(
        'UPDATE players SET money = money + ? WHERE id = ?',
        [rent, property.owner_id]
      );
      
      await db.run('COMMIT');
      return { rentPaid: rent, ownerId: property.owner_id };
    } catch (error) {
      await db.run('ROLLBACK');
      throw error;
    }
  }

  /**
   * 建设房屋
   * @param {number} playerId - 玩家ID
   * @param {number} propertyId - 地产ID
   * @returns {Promise<{ success: boolean, message: string }>} - 建设结果
   */
  async buildHouse(playerId, propertyId) {
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
    
    // 检查玩家是否是地主
    if (property.owner_id !== playerId) {
      return { success: false, message: 'You do not own this property' };
    }
    
    // 检查房屋数量上限
    if (property.house_count >= 4) {
      return { success: false, message: 'Maximum houses reached' };
    }
    
    // 检查玩家是否有足够资金
    const housePrice = property.price * 0.5; // 房屋价格是地产价格的一半
    if (player.money < housePrice) {
      return { success: false, message: 'Insufficient funds for house' };
    }
    
    // 执行建设
    await db.run('BEGIN TRANSACTION');
    try {
      // 扣除玩家资金
      await db.run(
        'UPDATE players SET money = money - ? WHERE id = ?',
        [housePrice, playerId]
      );
      
      // 更新房屋数量
      await db.run(
        'UPDATE properties SET house_count = house_count + 1 WHERE id = ?',
        [propertyId]
      );
      
      await db.run('COMMIT');
      return { success: true, message: 'House built successfully' };
    } catch (error) {
      await db.run('ROLLBACK');
      throw error;
    }
  }

  /**
   * 抽取机会/命运卡
   * @param {number} playerId - 玩家ID
   * @param {string} cardType - 卡牌类型 ('chance' 或 'community')
   * @returns {Promise<{ card: object, effectApplied: boolean }>} - 卡牌信息
   */
  async drawCard(playerId, cardType) {
    // 获取随机卡牌
    const card = await db.get(
      'SELECT * FROM cards WHERE type = ? AND used = 0 ORDER BY RANDOM() LIMIT 1',
      [cardType]
    );
    
    if (!card) {
      // 如果没有可用卡牌，重置所有卡牌状态
      await db.run('UPDATE cards SET used = 0 WHERE type = ?', [cardType]);
      // 重新抽取
      return this.drawCard(playerId, cardType);
    }
    
    // 标记卡牌为已使用
    await db.run('UPDATE cards SET used = 1 WHERE id = ?', [card.id]);
    
    let effectApplied = false;
    
    // 应用卡牌效果
    if (card.effect_type === 'money') {
      // 金钱效果
      await db.run(
        'UPDATE players SET money = money + ? WHERE id = ?',
        [card.effect_value, playerId]
      );
      effectApplied = true;
    } else if (card.effect_type === 'move') {
      // 移动效果
      await this.movePlayer(playerId, card.effect_value);
      effectApplied = true;
    } else if (card.effect_type === 'jail') {
      // 进监狱效果
      await db.run('UPDATE players SET position = 10, in_jail = 1 WHERE id = ?', [playerId]);
      effectApplied = true;
    } else if (card.effect_type === 'get_out_of_jail') {
      // 出狱卡
      // 这里只是标记玩家拥有出狱卡，实际使用时再处理
      await db.run(
        'UPDATE players SET get_out_of_jail_free = get_out_of_jail_free + 1 WHERE id = ?',
        [playerId]
      );
      effectApplied = true;
    }
    
    return { card, effectApplied };
  }

  /**
   * 处理破产
   * @param {number} playerId - 破产玩家ID
   * @param {number} creditorId - 债主ID（如果是欠租金）
   */
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
        'UPDATE properties SET owner_id = NULL, house_count = 0 WHERE id = ?',
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
  }

  /**
   * 结束当前回合
   * @param {number} currentPlayerId - 当前玩家ID
   * @param {number} nextPlayerId - 下一个玩家ID
   */
  async endTurn(currentPlayerId, nextPlayerId) {
    // 重置当前玩家的掷骰子状态
    await db.run(
      'UPDATE players SET dice1 = NULL, dice2 = NULL, last_roll = NULL WHERE id = ?',
      [currentPlayerId]
    );
    
    // 设置下一个玩家为当前玩家
    await db.run(
      'UPDATE rooms SET current_player_id = ? WHERE id = (SELECT room_id FROM players WHERE id = ?)',
      [nextPlayerId, nextPlayerId]
    );
  }

  /**
   * 获取游戏状态
   * @param {number} roomId - 房间ID
   * @returns {Promise<object>} - 游戏状态
   */
  async getGameState(roomId) {
    // 获取房间信息
    const room = await db.get('SELECT * FROM rooms WHERE id = ?', [roomId]);
    if (!room) {
      throw new Error('Room not found');
    }
    
    // 获取所有玩家信息
    const players = await db.all(
      'SELECT * FROM players WHERE room_id = ? ORDER BY turn_order',
      [roomId]
    );
    
    // 获取所有地产信息
    const properties = await db.all(
      'SELECT * FROM properties WHERE room_id = ?',
      [roomId]
    );
    
    return {
      room,
      players,
      properties,
      currentPlayerId: room.current_player_id
    };
  }
}

module.exports = new GameService();
```