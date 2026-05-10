const express = require('express');
const router = express.Router();
const Player = require('../models/Player');
const Property = require('../models/Property');
const Card = require('../models/Card');
const GameEvent = require('../models/GameEvent');
const authenticateToken = require('../middleware/auth');

// 掷骰子
router.post('/roll-dice', authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.body;
    const userId = req.user.userId;
    
    // 获取当前玩家
    const player = await Player.getByUserIdAndRoom(userId, roomId);
    if (!player) {
      return res.status(404).json({ code: 404, message: '玩家不存在' });
    }
    
    // 生成1-6的随机骰子点数
    const dice1 = Math.floor(Math.random() * 6) + 1;
    const dice2 = Math.floor(Math.random() * 6) + 1;
    const total = dice1 + dice2;
    
    // 更新玩家位置
    let newPosition = player.position + total;
    if (newPosition >= 40) { // 假设棋盘有40格
      newPosition = newPosition - 40;
      // 过起点奖励
      await Player.update(player.id, { money: player.money + 200 });
    }
    
    // 更新玩家位置
    await Player.update(player.id, { position: newPosition });
    
    // 记录游戏事件
    await GameEvent.create({
      room_id: roomId,
      player_id: player.id,
      event_type: 'roll_dice',
      event_data: JSON.stringify({ dice1, dice2, total, newPosition }),
      created_at: Math.floor(Date.now() / 1000)
    });
    
    // 检查是否触发事件（地产、卡牌等）
    // 这里可以调用游戏逻辑处理
    
    res.json({
      code: 200,
      message: '掷骰子成功',
      data: {
        dice1,
        dice2,
        total,
        newPosition
      }
    });
  } catch (error) {
    console.error('掷骰子错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 购买地产
router.post('/buy-property', authenticateToken, async (req, res) => {
  try {
    const { roomId, propertyId } = req.body;
    const userId = req.user.userId;
    
    // 获取玩家和地产信息
    const player = await Player.getByUserIdAndRoom(userId, roomId);
    const property = await Property.findById(propertyId);
    
    if (!player || !property) {
      return res.status(404).json({ code: 404, message: '玩家或地产不存在' });
    }
    
    // 检查地产是否已有主人
    if (property.owner_id) {
      return res.status(400).json({ code: 400, message: '该地产已被购买' });
    }
    
    // 检查玩家是否有足够资金
    if (player.money < property.price) {
      return res.status(400).json({ code: 400, message: '资金不足' });
    }
    
    // 扣除玩家资金，更新地产所有权
    await Player.update(player.id, { money: player.money - property.price });
    await Property.update(propertyId, { owner_id: player.id });
    
    // 记录游戏事件
    await GameEvent.create({
      room_id: roomId,
      player_id: player.id,
      event_type: 'buy_property',
      event_data: JSON.stringify({ propertyId, price: property.price }),
      created_at: Math.floor(Date.now() / 1000)
    });
    
    res.json({
      code: 200,
      message: '购买地产成功',
      data: {
        playerId: player.id,
        propertyId,
        remainingMoney: player.money - property.price
      }
    });
  } catch (error) {
    console.error('购买地产错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 建造房屋
router.post('/build-house', authenticateToken, async (req, res) => {
  try {
    const { roomId, propertyId } = req.body;
    const userId = req.user.userId;
    
    // 获取玩家和地产信息
    const player = await Player.getByUserIdAndRoom(userId, roomId);
    const property = await Property.findById(propertyId);
    
    if (!player || !property) {
      return res.status(404).json({ code: 404, message: '玩家或地产不存在' });
    }
    
    // 检查地产是否属于该玩家
    if (property.owner_id !== player.id) {
      return res.status(400).json({ code: 400, message: '您不是该地产的所有者' });
    }
    
    // 检查房屋数量限制
    if (property.house_count >= 4) {
      return res.status(400).json({ code: 400, message: '已达到房屋数量上限' });
    }
    
    // 获取房屋建造费用
    const housePrice = property.house_price || 50; // 默认50
    
    // 检查玩家是否有足够资金
    if (player.money < housePrice) {
      return res.status(400).json({ code: 400, message: '资金不足' });
    }
    
    // 扣除玩家资金，增加房屋数量
    await Player.update(player.id, { money: player.money - housePrice });
    await Property.update(propertyId, { house_count: property.house_count + 1 });
    
    // 记录游戏事件
    await GameEvent.create({
      room_id: roomId,
      player_id: player.id,
      event_type: 'build_house',
      event_data: JSON.stringify({ propertyId, housePrice }),
      created_at: Math.floor(Date.now() / 1000)
    });
    
    res.json({
      code: 200,
      message: '建造房屋成功',
      data: {
        playerId: player.id,
        propertyId,
        houseCount: property.house_count + 1,
        remainingMoney: player.money - housePrice
      }
    });
  } catch (error) {
    console.error('建造房屋错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 抽取卡牌
router.post('/draw-card', authenticateToken, async (req, res) => {
  try {
    const { roomId, cardType } = req.body;
    const userId = req.user.userId;
    
    // 获取玩家
    const player = await Player.getByUserIdAndRoom(userId, roomId);
    if (!player) {
      return res.status(404).json({ code: 404, message: '玩家不存在' });
    }
    
    // 验证卡牌类型
    if (cardType !== 'chance' && cardType !== 'community') {
      return res.status(400).json({ code: 400, message: '无效的卡牌类型' });
    }
    
    // 获取随机卡牌
    const cards = await Card.getByType(cardType);
    if (cards.length === 0) {
      return res.status(404).json({ code: 404, message: '没有可用的卡牌' });
    }
    
    const randomIndex = Math.floor(Math.random() * cards.length);
    const card = cards[randomIndex];
    
    // 记录游戏事件
    await GameEvent.create({
      room_id: roomId,
      player_id: player.id,
      event_type: 'draw_card',
      event_data: JSON.stringify({ cardId: card.id, cardType, cardText: card.text }),
      created_at: Math.floor(Date.now() / 1000)
    });
    
    // 这里可以添加卡牌效果执行逻辑
    // 例如：移动、收钱、付钱等
    
    res.json({
      code: 200,
      message: '抽取卡牌成功',
      data: {
        cardId: card.id,
        cardType,
        cardText: card.text,
        cardEffect: card.effect
      }
    });
  } catch (error) {
    console.error('抽取卡牌错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 结束回合
router.post('/end-turn', authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.body;
    const userId = req.user.userId;
    
    // 获取当前玩家
    const currentPlayer = await Player.getByUserIdAndRoom(userId, roomId);
    if (!currentPlayer) {
      return res.status(404).json({ code: 404, message: '玩家不存在' });
    }
    
    // 获取房间所有玩家
    const players = await Player.getByRoomId(roomId);
    
    // 找到当前玩家的索引
    const currentIndex = players.findIndex(p => p.id === currentPlayer.id);
    let nextIndex = (currentIndex + 1) % players.length;
    
    // 如果下一个玩家破产，跳过
    let nextPlayer = players[nextIndex];
    while (nextPlayer.isBankrupt && nextIndex !== currentIndex) {
      nextIndex = (nextIndex + 1) % players.length;
      nextPlayer = players[nextIndex];
    }
    
    // 更新玩家准备状态
    await Player.update(currentPlayer.id, { isReady: false });
    
    // 更新下一个玩家的准备状态
    await Player.update(nextPlayer.id, { isReady: true });
    
    // 记录游戏事件
    await GameEvent.create({
      room_id: roomId,
      player_id: currentPlayer.id,
      event_type: 'end_turn',
      event_data: JSON.stringify({ 
        fromPlayerId: currentPlayer.id,
        toPlayerId: nextPlayer.id
      }),
      created_at: Math.floor(Date.now() / 1000)
    });
    
    res.json({
      code: 200,
      message: '回合结束',
      data: {
        currentPlayerId: currentPlayer.id,
        nextPlayerId: nextPlayer.id,
        nextPlayerName: nextPlayer.username || `Player${nextPlayer.id}`
      }
    });
  } catch (error) {
    console.error('结束回合错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 获取当前玩家位置信息
router.get('/player-position', authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.query;
    const userId = req.user.userId;
    
    const player = await Player.getByUserIdAndRoom(userId, roomId);
    if (!player) {
      return res.status(404).json({ code: 404, message: '玩家不存在' });
    }
    
    res.json({
      code: 200,
      message: '获取玩家位置成功',
      data: {
        position: player.position,
        money: player.money,
        inJail: player.inJail,
        isBankrupt: player.isBankrupt
      }
    });
  } catch (error) {
    console.error('获取玩家位置错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

module.exports = router;