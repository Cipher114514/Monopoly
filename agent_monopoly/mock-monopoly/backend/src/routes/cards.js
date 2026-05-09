const express = require('express');
const router = express.Router();
const { db } = require('../db/connection');
const Card = require('../models/Card');
const authMiddleware = require('../middleware/auth');

// 抽取卡牌
router.post('/draw', authMiddleware, async (req, res) => {
  try {
    const { roomId, cardType } = req.body;
    
    if (!roomId || !cardType || (cardType !== 'chance' && cardType !== 'chest')) {
      return res.status(400).json({
        code: 400,
        message: '请求参数无效'
      });
    }
    
    // 获取当前用户ID（从认证中间件获取）
    const userId = req.user.id;
    
    // 检查用户是否在房间中
    const playerCheck = db.prepare(`
      SELECT p.* FROM players p
      JOIN rooms r ON p.roomId = r.id
      WHERE p.userId = ? AND p.roomId = ? AND r.status = 'playing'
    `).get(userId, roomId);
    
    if (!playerCheck) {
      return res.status(403).json({
        code: 403,
        message: '您不在该房间中或游戏未开始'
      });
    }
    
    // 从指定类型的卡牌堆中随机抽取一张卡
    const card = Card.drawCard(roomId, cardType, playerCheck.id);
    
    if (!card) {
      return res.status(404).json({
        code: 404,
        message: '没有可用的卡牌'
      });
    }
    
    // 应用卡牌效果
    const result = Card.applyCardEffect(card, roomId, playerCheck.id);
    
    res.json({
      code: 200,
      data: {
        cardId: card.id,
        cardType: card.cardType,
        description: card.description,
        effect: card.effect,
        playerId: playerCheck.id,
        ...result
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
    
    if (cardType && (cardType === 'chance' || cardType === 'chest')) {
      query += ' WHERE cardType = ?';
      params.push(cardType);
    }
    
    query += ' ORDER BY cardType, id';
    
    const cards = db.prepare(query).all(...params);
    
    res.json({
      code: 200,
      data: {
        cards,
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

module.exports = router;
```