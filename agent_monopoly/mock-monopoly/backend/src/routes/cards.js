const express = require('express');
const router = express.Router();
const { db } = require('../db/connection');
const Card = require('../models/Card');
const authMiddleware = require('../middleware/auth');

// 抽取卡牌
router.post('/draw', authMiddleware, async (req, res) => {
  try {
    const { roomId, cardType } = req.body;
    
    // 验证请求参数
    if (!roomId || !cardType || (cardType !== 'chance' && cardType !== 'chest')) {
      return res.status(400).json({
        code: 400,
        message: '无效的请求参数'
      });
    }
    
    // 获取当前用户ID（从JWT中解析）
    const userId = req.user.id;
    
    // 检查用户是否在指定房间中
    const playerCheck = db.prepare(`
      SELECT 1 FROM players 
      WHERE user_id = ? AND room_id = ?
    `).get(userId, roomId);
    
    if (!playerCheck) {
      return res.status(403).json({
        code: 403,
        message: '您不在该房间中'
      });
    }
    
    // 从卡牌堆中随机抽取一张卡牌
    const card = Card.drawCard(roomId, cardType);
    
    if (!card) {
      return res.status(404).json({
        code: 404,
        message: '没有可用的卡牌'
      });
    }
    
    // 更新卡牌状态，标记为已使用
    db.prepare(`
      UPDATE cards 
      SET status = 'used', player_id = ?, used_at = datetime('now')
      WHERE id = ?
    `).run(userId, card.id);
    
    // 返回抽取的卡牌信息
    res.json({
      code: 200,
      data: {
        cardId: card.id,
        cardType: card.card_type,
        description: card.description,
        effect: card.effect,
        playerId: userId
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
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { cardType } = req.query;
    
    let query = 'SELECT * FROM cards';
    let params = [];
    
    // 如果指定了卡牌类型，添加筛选条件
    if (cardType && (cardType === 'chance' || cardType === 'chest')) {
      query += ' WHERE card_type = ?';
      params.push(cardType);
    }
    
    // 按类型和ID排序
    query += ' ORDER BY card_type, id';
    
    const cards = db.prepare(query).all(...params);
    
    // 格式化卡牌数据
    const formattedCards = cards.map(card => ({
      id: card.id,
      cardType: card.card_type,
      description: card.description,
      effect: card.effect
    }));
    
    res.json({
      code: 200,
      data: {
        cards: formattedCards,
        total: formattedCards.length
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

module.exports = router;
```