const { db } = require('../db/connection');
const Player = require('../models/Player');
const Property = require('../models/Property');
const Card = require('../models/Card');

class GameService {
  // 掷骰子
  async rollDice(playerId) {
    try {
      // 生成1-6的随机数
      const diceValue = Math.floor(Math.random() * 6) + 1;
      
      // 更新玩家掷骰子状态
      await db.run(
        `UPDATE players 
         SET dice_value = ?, has_rolled = 1 
         WHERE id = ?`,
        [diceValue, playerId]
      );
      
      return { success: true, diceValue };
    } catch (error) {
      console.error('Error rolling dice:', error);
      return { success: false, error: 'Failed to roll dice' };
    }
  }

  // 移动玩家
  async movePlayer(playerId, steps) {
    try {
      // 获取当前玩家信息
      const player = await db.get(
        `SELECT position, money, passed_start 
         FROM players 
         WHERE id = ?`,
        [playerId]
      );
      
      if (!player) {
        throw new Error('Player not found');
      }
      
      // 计算新位置（大富翁棋盘是40格）
      const boardSize = 40;
      let newPosition = (player.position + steps) % boardSize;
      let passedStart = false;
      
      // 检查是否经过起点
      if (player.position + steps >= boardSize) {
        passedStart = true;
        // 经过起点奖励
        await db.run(
          `UPDATE players 
           SET money = money + 200, passed_start = 1 
           WHERE id = ?`,
          [playerId]
        );
      }
      
      // 更新玩家位置
      await db.run(
        `UPDATE players 
         SET position = ?, passed_start = 0 
         WHERE id = ?`,
        [newPosition, playerId]
      );
      
      // 检查新位置的事件
      const event = await this.handlePositionEvent(playerId, newPosition);
      
      return { 
        success: true, 
        newPosition, 
        passedStart, 
        event 
      };
    } catch (error) {
      console.error('Error moving player:', error);
      return { success: false, error: 'Failed to move player' };
    }
  }

  // 处理位置事件（地产、机会卡、命运卡等）
  async handlePositionEvent(playerId, position) {
    try {
      // 检查是否是地产
      const property = await db.get(
        `SELECT * FROM properties WHERE position = ?`,
        [position]
      );
      
      if (property) {
        // 如果地产无人拥有，可以购买
        if (!property.owner_id) {
          return { type: 'property', action: 'buy', property };
        }
        // 如果是自己的地产，无事发生
        else if (property.owner_id === playerId) {
          return { type: 'property', action: 'own', property };
        }
        // 如果是他人地产，需要支付租金
        else {
          const rent = this.calculateRent(property);
          await this.payRent(playerId, property.owner_id, rent);
          return { type: 'property', action: 'rent', property, rent };
        }
      }
      
      // 检查是否是机会卡位置
      const chancePosition = [7, 22, 36];
      if (chancePosition.includes(position)) {
        const card = await this.drawCard('chance');
        await this.executeCardEffect(playerId, card);
        return { type: 'chance', card };
      }
      
      // 检查是否是命运卡位置
      const communityChestPosition = [2, 17, 33];
      if (communityChestPosition.includes(position)) {
        const card = await this.drawCard('community_chest');
        await this.executeCardEffect(playerId, card);
        return { type: 'community_chest', card };
      }
      
      // 其他位置（如税收、监狱等）
      return { type: 'normal' };
    } catch (error) {
      console.error('Error handling position event:', error);
      return { type: 'error', error: 'Failed to handle position event' };
    }
  }

  // 购买地产
  async buyProperty(playerId, propertyId) {
    try {
      // 获取玩家和地产信息
      const player = await db.get(
        `SELECT money FROM players WHERE id = ?`,
        [playerId]
      );
      
      const property = await db.get(
        `SELECT * FROM properties WHERE id = ?`,
        [propertyId]
      );
      
      if (!player || !property) {
        throw new Error('Player or property not found');
      }
      
      // 检查地产是否可购买
      if (property.owner_id) {
        throw new Error('Property already owned');
      }
      
      // 检查玩家是否有足够资金
      if (player.money < property.price) {
        throw new Error('Insufficient funds');
      }
      
      // 执行购买
      await db.run(
        `UPDATE players 
         SET money = money - ? 
         WHERE id = ?`,
        [property.price, playerId]
      );
      
      await db.run(
        `UPDATE properties 
         SET owner_id = ? 
         WHERE id = ?`,
        [playerId, propertyId]
      );
      
      return { success: true, message: 'Property purchased successfully' };
    } catch (error) {
      console.error('Error buying property:', error);
      return { success: false, error: error.message };
    }
  }

  // 计算租金
  calculateRent(property) {
    // 基础租金
    let rent = property.rent;
    
    // 如果有房子，增加租金
    if (property.houses > 0) {
      rent = property.rent * Math.pow(2, property.houses);
    }
    
    // 如果是同色地产全部拥有，租金翻倍
    const colorGroupProperties = db.all(
      `SELECT COUNT(*) as count FROM properties 
       WHERE color_group = ? AND owner_id = ?`,
      [property.color_group, property.owner_id]
    );
    
    if (colorGroupProperties[0].count === this.getPropertiesInGroup(property.color_group).length) {
      rent *= 2;
    }
    
    return rent;
  }

  // 支付租金
  async payRent(payerId, receiverId, amount) {
    try {
      // 检查付款人是否有足够资金
      const payer = await db.get(
        `SELECT money FROM players WHERE id = ?`,
        [payerId]
      );
      
      if (payer.money < amount) {
        // 破产处理
        await this.handleBankruptcy(payerId, receiverId);
        return { success: false, message: 'Player is bankrupt' };
      }
      
      // 执行转账
      await db.run(
        `UPDATE players 
         SET money = money - ? 
         WHERE id = ?`,
        [amount, payerId]
      );
      
      await db.run(
        `UPDATE players 
         SET money = money + ? 
         WHERE id = ?`,
        [amount, receiverId]
      );
      
      return { success: true, message: 'Rent paid successfully' };
    } catch (error) {
      console.error('Error paying rent:', error);
      return { success: false, error: 'Failed to pay rent' };
    }
  }

  // 建造房屋
  async buildHouse(playerId, propertyId) {
    try {
      // 获取玩家和地产信息
      const player = await db.get(
        `SELECT money FROM players WHERE id = ?`,
        [playerId]
      );
      
      const property = await db.get(
        `SELECT * FROM properties WHERE id = ?`,
        [propertyId]
      );
      
      if (!player || !property) {
        throw new Error('Player or property not found');
      }
      
      // 检查是否是自己的地产
      if (property.owner_id !== playerId) {
        throw new Error('Not the owner of this property');
      }
      
      // 检查是否已达到最大房屋数
      if (property.houses >= 4) {
        throw new Error('Maximum houses reached');
      }
      
      // 检查是否有足够资金
      const housePrice = property.house_price || 50;
      if (player.money < housePrice) {
        throw new Error('Insufficient funds');
      }
      
      // 检查同色地产是否全部拥有
      const colorGroupProperties = db.all(
        `SELECT id FROM properties 
         WHERE color_group = ? AND owner_id = ?`,
        [property.color_group, playerId]
      );
      
      if (colorGroupProperties.length !== this.getPropertiesInGroup(property.color_group).length) {
        throw new Error('Must own all properties in the color group to build houses');
      }
      
      // 检查同色地产的房屋数量是否均衡
      for (const prop of colorGroupProperties) {
        const propInfo = await db.get(
          `SELECT houses FROM properties WHERE id = ?`,
          [prop.id]
        );
        if (propInfo.houses < property.houses) {
          throw new Error('Must build houses evenly across all properties in the color group');
        }
      }
      
      // 执行建造
      await db.run(
        `UPDATE players 
         SET money = money - ? 
         WHERE id = ?`,
        [housePrice, playerId]
      );
      
      await db.run(
        `UPDATE properties 
         SET houses = houses + 1 
         WHERE id = ?`,
        [propertyId]
      );
      
      return { success: true, message: 'House built successfully' };
    } catch (error) {
      console.error('Error building house:', error);
      return { success: false, error: error.message };
    }
  }

  // 抽卡
  async drawCard(type) {
    try {
      // 获取一张随机卡
      const card = await db.get(
        `SELECT * FROM cards 
         WHERE type = ? 
         ORDER BY RANDOM() 
         LIMIT 1`,
        [type]
      );
      
      return card;
    } catch (error) {
      console.error('Error drawing card:', error);
      return null;
    }
  }

  // 执行卡牌效果
  async executeCardEffect(playerId, card) {
    try {
      if (!card) return;
      
      switch (card.action) {
        case 'money':
          // 获得金钱
          await db.run(
            `UPDATE players 
             SET money = money + ? 
             WHERE id = ?`,
            [card.amount, playerId]
          );
          break;
          
        case 'pay':
          // 支付金钱
          await db.run(
            `UPDATE players 
             SET money = money - ? 
             WHERE id = ?`,
            [card.amount, playerId]
          );
          break;
          
        case 'move':
          // 移动到指定位置
          await db.run(
            `UPDATE players 
             SET position = ? 
             WHERE id = ?`,
            [card.position, playerId]
          );
          break;
          
        case 'jail':
          // 进监狱
          await db.run(
            `UPDATE players 
             SET position = 10, in_jail = 1 
             WHERE id = ?`,
            [playerId]
          );
          break;
          
        case 'get_out_of_jail':
          // 获得出狱卡
          await db.run(
            `UPDATE players 
             SET get_out_of_jail_free = get_out_of_jail_free + 1 
             WHERE id = ?`,
            [playerId]
          );
          break;
          
        default:
          break;
      }
      
      return { success: true, message: 'Card effect executed' };
    } catch (error) {
      console.error('Error executing card effect:', error);
      return { success: false, error: 'Failed to execute card effect' };
    }
  }

  // 处理破产
  async handleBankruptcy(playerId, receiverId) {
    try {
      // 将玩家所有地产转移给债权人
      await db.run(
        `UPDATE properties 
         SET owner_id = ? 
         WHERE owner_id = ?`,
        [receiverId, playerId]
      );
      
      // 重置玩家金钱
      await db.run(
        `UPDATE players 
         SET money = 0, is_bankrupt = 1 
         WHERE id = ?`,
        [playerId]
      );
      
      return { success: true, message: 'Player declared bankrupt' };
    } catch (error) {
      console.error('Error handling bankruptcy:', error);
      return { success: false, error: 'Failed to handle bankruptcy' };
    }
  }

  // 获取指定颜色的所有地产
  getPropertiesInGroup(colorGroup) {
    // 这里应该从数据库获取，但为了简化，返回硬编码值
    // 实际实现中应该查询数据库
    return [
      { color_group: colorGroup },
      // 其他同色地产...
    ];
  }

  // 结束回合
  async endTurn(playerId) {
    try {
      // 重置玩家掷骰子状态
      await db.run(
        `UPDATE players 
         SET has_rolled = 0, dice_value = 0 
         WHERE id = ?`,
        [playerId]
      );
      
      // 获取房间信息
      const player = await db.get(
        `SELECT room_id FROM players WHERE id = ?`,
        [playerId]
      );
      
      if (!player) {
        throw new Error('Player not found');
      }
      
      // 获取房间内所有玩家
      const players = await db.all(
        `SELECT id, position FROM players 
         WHERE room_id = ? 
         ORDER BY position`,
        [player.room_id]
      );
      
      // 找到下一个玩家
      const currentIndex = players.findIndex(p => p.id === playerId);
      const nextIndex = (currentIndex + 1) % players.length;
      const nextPlayerId = players[nextIndex].id;
      
      // 更新当前玩家
      await db.run(
        `UPDATE players 
         SET is_current = 0 
         WHERE room_id = ?`,
        [player.room_id]
      );
      
      // 设置下一个玩家
      await db.run(
        `UPDATE players 
         SET is_current = 1 
         WHERE id = ?`,
        [nextPlayerId]
      );
      
      return { success: true, nextPlayerId };
    } catch (error) {
      console.error('Error ending turn:', error);
      return { success: false, error: 'Failed to end turn' };
    }
  }
}

module.exports = new GameService();
```