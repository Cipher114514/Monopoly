const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../database/db');

// 抽取卡牌
router.post('/draw', async (req, res) => {
  try {
    const { roomId, cardType } = req.body;
    
    if (!roomId || !cardType || (cardType !== 'chance' && cardType !== 'chest')) {
      return res.status(400).json({
        code: 400,
        message: '无效的请求参数'
      });
    }
    
    // 获取当前房间信息
    const roomQuery = 'SELECT * FROM rooms WHERE id = ?';
    const room = db.prepare(roomQuery).get(roomId);
    
    if (!room) {
      return res.status(404).json({
        code: 404,
        message: '房间不存在'
      });
    }
    
    // 获取当前轮到哪个玩家
    const currentPlayerQuery = 'SELECT * FROM players WHERE room_id = ? AND order_index = ?';
    const currentPlayer = db.prepare(currentPlayerQuery).get(roomId, room.current_turn);
    
    if (!currentPlayer) {
      return res.status(404).json({
        code: 404,
        message: '当前玩家不存在'
      });
    }
    
    // 从卡牌堆中随机抽取一张卡牌
    const cardQuery = `
      SELECT * FROM cards 
      WHERE card_type = ? 
      AND id NOT IN (
        SELECT card_id FROM drawn_cards 
        WHERE room_id = ? 
        AND card_type = ?
      )
      ORDER BY RANDOM() 
      LIMIT 1
    `;
    
    const card = db.prepare(cardQuery).get(cardType, roomId, cardType);
    
    if (!card) {
      // 如果卡牌堆已空，重置卡牌堆
      const resetQuery = 'DELETE FROM drawn_cards WHERE room_id = ? AND card_type = ?';
      db.prepare(resetQuery).run(roomId, cardType);
      
      // 重新抽取卡牌
      const newCard = db.prepare(cardQuery).get(cardType, roomId, cardType);
      
      if (!newCard) {
        return res.status(500).json({
          code: 500,
          message: '无法获取卡牌'
        });
      }
      
      // 记录已抽取的卡牌
      const insertDrawnCardQuery = 'INSERT INTO drawn_cards (room_id, card_id, card_type) VALUES (?, ?, ?)';
      db.prepare(insertDrawnCardQuery).run(roomId, newCard.id, cardType);
      
      // 执行卡牌效果
      await executeCardEffect(newCard, currentPlayer, roomId);
      
      return res.json({
        code: 200,
        data: {
          cardId: newCard.id,
          cardType: newCard.card_type,
          description: newCard.description,
          effect: JSON.parse(newCard.effect),
          playerId: currentPlayer.id
        }
      });
    }
    
    // 记录已抽取的卡牌
    const insertDrawnCardQuery = 'INSERT INTO drawn_cards (room_id, card_id, card_type) VALUES (?, ?, ?)';
    db.prepare(insertDrawnCardQuery).run(roomId, card.id, cardType);
    
    // 执行卡牌效果
    await executeCardEffect(card, currentPlayer, roomId);
    
    res.json({
      code: 200,
      data: {
        cardId: card.id,
        cardType: card.card_type,
        description: card.description,
        effect: JSON.parse(card.effect),
        playerId: currentPlayer.id
      }
    });
  } catch (error) {
    console.error('抽取卡牌错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
});

// 获取卡牌列表
router.get('/', (req, res) => {
  try {
    const { cardType } = req.query;
    
    let query = 'SELECT * FROM cards';
    let params = [];
    
    if (cardType && (cardType === 'chance' || cardType === 'chest')) {
      query += ' WHERE card_type = ?';
      params.push(cardType);
    }
    
    query += ' ORDER BY card_type, id';
    
    const cards = db.prepare(query).all(...params);
    
    res.json({
      code: 200,
      data: {
        cards: cards.map(card => ({
          id: card.id,
          cardType: card.card_type,
          description: card.description,
          effect: JSON.parse(card.effect)
        })),
        total: cards.length
      }
    });
  } catch (error) {
    console.error('获取卡牌列表错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
});

// 执行卡牌效果
async function executeCardEffect(card, player, roomId) {
  const effect = JSON.parse(card.effect);
  
  switch (effect.type) {
    case 'move':
      if (effect.target === 'start') {
        // 移动到起点
        const updatePositionQuery = 'UPDATE players SET position = 0 WHERE id = ?';
        db.prepare(updatePositionQuery).run(player.id);
        
        // 起点奖励
        const startRewardQuery = 'UPDATE players SET money = money + 200 WHERE id = ?';
        db.prepare(startRewardQuery).run(player.id);
      } else if (effect.target === 'back') {
        // 后退指定步数
        const newPosition = Math.max(0, player.position - effect.value);
        const updatePositionQuery = 'UPDATE players SET position = ? WHERE id = ?';
        db.prepare(updatePositionQuery).run(newPosition, player.id);
      } else if (effect.target === 'forward') {
        // 前进指定步数
        const newPosition = Math.min(39, player.position + effect.value);
        const updatePositionQuery = 'UPDATE players SET position = ? WHERE id = ?';
        db.prepare(updatePositionQuery).run(newPosition, player.id);
      }
      break;
      
    case 'money':
      // 更新玩家金钱
      const updateMoneyQuery = 'UPDATE players SET money = money + ? WHERE id = ?';
      db.prepare(updateMoneyQuery).run(effect.value, player.id);
      break;
      
    case 'jail':
      // 进监狱
      const goToJailQuery = 'UPDATE players SET position = 10, in_jail = 1 WHERE id = ?';
      db.prepare(goToJailQuery).run(player.id);
      break;
      
    case 'get_out_of_jail':
      // 出狱卡
      const getOutOfJailQuery = 'UPDATE players SET get_out_of_jail_free = get_out_of_jail_free + 1 WHERE id = ?';
      db.prepare(getOutOfJailQuery).run(player.id);
      break;
      
    case 'pay_all':
      // 向所有玩家支付金钱
      const allPlayersQuery = 'SELECT id FROM players WHERE room_id = ? AND id != ?';
      const allPlayers = db.prepare(allPlayersQuery).all(roomId, player.id);
      
      const payAmount = effect.value;
      const updatePlayerMoneyQuery = 'UPDATE players SET money = money + ? WHERE id = ?';
      const deductPlayerMoneyQuery = 'UPDATE players SET money = money - ? WHERE id = ?';
      
      // 向其他玩家支付
      allPlayers.forEach(p => {
        db.prepare(updatePlayerMoneyQuery).run(payAmount, p.id);
      });
      
      // 扣除当前玩家金钱
      db.prepare(deductPlayerMoneyQuery).run(payAmount * allPlayers.length, player.id);
      break;
      
    case 'receive_all':
      // 从所有玩家接收金钱
      const allPlayersReceiveQuery = 'SELECT id FROM players WHERE room_id = ? AND id != ?';
      const allPlayersReceive = db.prepare(allPlayersReceiveQuery).all(roomId, player.id);
      
      const receiveAmount = effect.value;
      const updatePlayerMoneyReceiveQuery = 'UPDATE players SET money = money - ? WHERE id = ?';
      const deductPlayerMoneyReceiveQuery = 'UPDATE players SET money = money + ? WHERE id = ?';
      
      // 从其他玩家接收
      allPlayersReceive.forEach(p => {
        db.prepare(updatePlayerMoneyReceiveQuery).run(receiveAmount, p.id);
      });
      
      // 增加当前玩家金钱
      db.prepare(deductPlayerMoneyReceiveQuery).run(receiveAmount * allPlayersReceive.length, player.id);
      break;
      
    case 'go_to':
      // 移动到指定位置
      const goToPositionQuery = 'UPDATE players SET position = ? WHERE id = ?';
      db.prepare(goToPositionQuery).run(effect.position, player.id);
      break;
      
    case 'houses':
      // 房屋相关效果
      if (effect.action === 'pay') {
        // 支付房屋费用
        const updateMoneyForHousesQuery = 'UPDATE players SET money = money - ? WHERE id = ?';
        db.prepare(updateMoneyForHousesQuery).run(effect.value, player.id);
      } else if (effect.action === 'receive') {
        // 收取房屋费用
        const updateMoneyForHousesQuery = 'UPDATE players SET money = money + ? WHERE id = ?';
        db.prepare(updateMoneyForHousesQuery).run(effect.value, player.id);
      }
      break;
      
    default:
      console.warn('未知的卡牌效果类型:', effect.type);
  }
}

module.exports = router;
```