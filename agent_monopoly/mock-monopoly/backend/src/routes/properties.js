const express = require('express');
const router = express.Router();
const { db } = require('../db/connection');
const Property = require('../models/Property');
const Player = require('../models/Player');
const Room = require('../models/Room');

// 获取所有地产
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    
    const propertiesQuery = `
      SELECT p.*, u.username as owner_username 
      FROM properties p 
      LEFT JOIN users u ON p.owner_id = u.id
      ORDER BY p.position
      LIMIT ? OFFSET ?
    `;
    
    const countQuery = 'SELECT COUNT(*) as total FROM properties';
    
    const [properties] = await db.query(propertiesQuery, [limit, offset]);
    const [{ total }] = await db.query(countQuery);
    
    const formattedProperties = properties.map(prop => ({
      id: prop.id,
      name: prop.name,
      position: prop.position,
      price: prop.price,
      owner: prop.owner_username ? { id: prop.owner_id, username: prop.owner_username } : null,
      houses: prop.houses,
      rent: prop.rent,
      group: prop.group
    }));
    
    res.json({
      code: 200,
      data: {
        properties: formattedProperties,
        pagination: {
          page,
          limit,
          total
        }
      },
      message: '获取地产列表成功'
    });
  } catch (error) {
    console.error('获取地产列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取地产列表失败',
      error: error.message
    });
  }
});

// 获取地产详情
router.get('/:propertyId', async (req, res) => {
  try {
    const { propertyId } = req.params;
    
    const propertyQuery = `
      SELECT p.*, u.username as owner_username 
      FROM properties p 
      LEFT JOIN users u ON p.owner_id = u.id 
      WHERE p.id = ?
    `;
    
    const [properties] = await db.query(propertyQuery, [propertyId]);
    
    if (properties.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '地产不存在'
      });
    }
    
    const prop = properties[0];
    const housePrices = {
      1: prop.house_price_1 || 300000,
      2: prop.house_price_2 || 300000,
      3: prop.house_price_3 || 300000,
      4: prop.house_price_4 || 300000,
      hotel: prop.hotel_price || 300000
    };
    
    const groupColors = {
      brown: '#8B4513',
      light_blue: '#ADD8E6',
      pink: '#FFC0CB',
      orange: '#FFA500',
      red: '#FF0000',
      yellow: '#FFFF00',
      green: '#008000',
      dark_blue: '#000080',
      utilities: '#808080',
      railroad: '#000000',
      start: '#00FF00',
      jail: '#FF0000',
      free_parking: '#0000FF',
      tax: '#808080'
    };
    
    const formattedProperty = {
      id: prop.id,
      name: prop.name,
      position: prop.position,
      price: prop.price,
      owner: prop.owner_username ? { id: prop.owner_id, username: prop.owner_username } : null,
      houses: prop.houses,
      rent: prop.rent,
      housePrices,
      group: prop.group,
      groupColor: groupColors[prop.group] || '#000000',
      mortgaged: prop.mortgaged === 1
    };
    
    res.json({
      code: 200,
      data: formattedProperty,
      message: '获取地产详情成功'
    });
  } catch (error) {
    console.error('获取地产详情失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取地产详情失败',
      error: error.message
    });
  }
});

// 购买地产
router.post('/:propertyId/purchase', async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { roomId, userId } = req.body;
    
    // 验证房间和玩家
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        code: 404,
        message: '房间不存在'
      });
    }
    
    const player = await Player.findByUserIdAndRoom(userId, roomId);
    if (!player) {
      return res.status(404).json({
        code: 404,
        message: '玩家不存在或不在该房间'
      });
    }
    
    // 检查是否是当前玩家的回合
    if (room.current_player_id !== player.id) {
      return res.status(400).json({
        code: 400,
        message: '不是您的回合'
      });
    }
    
    // 获取地产信息
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({
        code: 404,
        message: '地产不存在'
      });
    }
    
    // 检查地产是否已有主人
    if (property.owner_id) {
      return res.status(400).json({
        code: 400,
        message: '该地产已被购买'
      });
    }
    
    // 检查玩家是否有足够资金
    if (player.money < property.price) {
      return res.status(400).json({
        code: 400,
        message: '资金不足'
      });
    }
    
    // 执行购买操作
    await db.beginTransaction();
    
    // 扣除玩家资金
    await db.query(
      'UPDATE players SET money = money - ? WHERE id = ?',
      [property.price, player.id]
    );
    
    // 更新地产所有者
    await db.query(
      'UPDATE properties SET owner_id = ? WHERE id = ?',
      [player.id, propertyId]
    );
    
    // 更新玩家资金
    const updatedPlayer = await Player.findById(player.id);
    
    await db.commit();
    
    res.json({
      code: 200,
      data: {
        propertyId,
        ownerId: player.id,
        price: property.price,
        remainingMoney: updatedPlayer.money
      },
      message: '地产购买成功'
    });
  } catch (error) {
    await db.rollback();
    console.error('购买地产失败:', error);
    res.status(500).json({
      code: 500,
      message: '购买地产失败',
      error: error.message
    });
  }
});

// 建设房屋
router.post('/:propertyId/houses', async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { roomId, userId, houseCount } = req.body;
    
    // 验证房间和玩家
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        code: 404,
        message: '房间不存在'
      });
    }
    
    const player = await Player.findByUserIdAndRoom(userId, roomId);
    if (!player) {
      return res.status(404).json({
        code: 404,
        message: '玩家不存在或不在该房间'
      });
    }
    
    // 检查是否是当前玩家的回合
    if (room.current_player_id !== player.id) {
      return res.status(400).json({
        code: 400,
        message: '不是您的回合'
      });
    }
    
    // 获取地产信息
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({
        code: 404,
        message: '地产不存在'
      });
    }
    
    // 检查玩家是否是该地产的所有者
    if (property.owner_id !== player.id) {
      return res.status(400).json({
        code: 400,
        message: '您不是该地产的所有者'
      });
    }
    
    // 检查房屋数量限制
    if (property.houses + houseCount > 4) {
      return res.status(400).json({
        code: 400,
        message: '房屋数量不能超过4栋'
      });
    }
    
    // 获取房屋价格
    const housePrice = property.house_price_1 || 300000;
    const totalCost = housePrice * houseCount;
    
    // 检查玩家是否有足够资金
    if (player.money < totalCost) {
      return res.status(400).json({
        code: 400,
        message: '资金不足'
      });
    }
    
    // 执行建设操作
    await db.beginTransaction();
    
    // 扣除玩家资金
    await db.query(
      'UPDATE players SET money = money - ? WHERE id = ?',
      [totalCost, player.id]
    );
    
    // 更新房屋数量
    await db.query(
      'UPDATE properties SET houses = houses + ? WHERE id = ?',
      [houseCount, propertyId]
    );
    
    // 更新租金
    const newRent = property.rent * (1 + property.houses * 0.5);
    await db.query(
      'UPDATE properties SET rent = ? WHERE id = ?',
      [newRent, propertyId]
    );
    
    // 更新玩家资金
    const updatedPlayer = await Player.findById(player.id);
    
    await db.commit();
    
    res.json({
      code: 200,
      data: {
        propertyId,
        houseCount: property.houses + houseCount,
        cost: totalCost,
        remainingMoney: updatedPlayer.money,
        newRent
      },
      message: '房屋建设成功'
    });
  } catch (error) {
    await db.rollback();
    console.error('建设房屋失败:', error);
    res.status(500).json({
      code: 500,
      message: '建设房屋失败',
      error: error.message
    });
  }
});

// 出售地产
router.post('/:propertyId/sell', async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { roomId, userId, sellPrice } = req.body;
    
    // 验证房间和玩家
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        code: 404,
        message: '房间不存在'
      });
    }
    
    const player = await Player.findByUserIdAndRoom(userId, roomId);
    if (!player) {
      return res.status(404).json({
        code: 404,
        message: '玩家不存在或不在该房间'
      });
    }
    
    // 检查是否是当前玩家的回合
    if (room.current_player_id !== player.id) {
      return res.status(400).json({
        code: 400,
        message: '不是您的回合'
      });
    }
    
    // 获取地产信息
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({
        code: 404,
        message: '地产不存在'
      });
    }
    
    // 检查玩家是否是该地产的所有者
    if (property.owner_id !== player.id) {
      return res.status(400).json({
        code: 400,
        message: '您不是该地产的所有者'
      });
    }
    
    // 执行出售操作
    await db.beginTransaction();
    
    // 增加玩家资金
    await db.query(
      'UPDATE players SET money = money + ? WHERE id = ?',
      [sellPrice, player.id]
    );
    
    // 清除地产所有者
    await db.query(
      'UPDATE properties SET owner_id = NULL, houses = 0, rent = ? WHERE id = ?',
      [property.rent / (1 + property.houses * 0.5), propertyId]
    );
    
    // 更新玩家资金
    const updatedPlayer = await Player.findById(player.id);
    
    await db.commit();
    
    res.json({
      code: 200,
      data: {
        propertyId,
        sellPrice,
        newOwner: null,
        gainedMoney: sellPrice,
        remainingMoney: updatedPlayer.money
      },
      message: '地产出售成功'
    });
  } catch (error) {
    await db.rollback();
    console.error('出售地产失败:', error);
    res.status(500).json({
      code: 500,
      message: '出售地产失败',
      error: error.message
    });
  }
});

module.exports = router;
```