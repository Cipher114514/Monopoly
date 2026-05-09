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
      SELECT p.*, u.username as ownerName 
      FROM properties p 
      LEFT JOIN users u ON p.owner_id = u.id
      ORDER BY p.position
      LIMIT ? OFFSET ?
    `;
    
    const countQuery = 'SELECT COUNT(*) as total FROM properties';
    
    const [properties] = await db.prepare(propertiesQuery).all(limit, offset);
    const [{ total }] = await db.prepare(countQuery).get();
    
    const formattedProperties = properties.map(prop => ({
      id: prop.id,
      name: prop.name,
      position: prop.position,
      price: prop.price,
      owner: prop.owner_id ? {
        id: prop.owner_id,
        username: prop.ownerName
      } : null,
      houses: prop.houses,
      rent: prop.rent,
      group: prop.group,
      groupColor: prop.group_color,
      mortgaged: prop.mortgaged
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
      SELECT p.*, u.username as ownerName 
      FROM properties p 
      LEFT JOIN users u ON p.owner_id = u.id 
      WHERE p.id = ?
    `;
    
    const property = await db.prepare(propertyQuery).get(propertyId);
    
    if (!property) {
      return res.status(404).json({
        code: 404,
        message: '地产不存在'
      });
    }
    
    const housePricesQuery = `
      SELECT house_1_price, house_2_price, house_3_price, house_4_price, hotel_price 
      FROM property_prices 
      WHERE property_id = ?
    `;
    
    const housePrices = await db.prepare(housePricesQuery).get(propertyId);
    
    const formattedProperty = {
      id: property.id,
      name: property.name,
      position: property.position,
      price: property.price,
      owner: property.owner_id ? {
        id: property.owner_id,
        username: property.ownerName
      } : null,
      houses: property.houses,
      rent: property.rent,
      housePrices: {
        1: housePrices.house_1_price,
        2: housePrices.house_2_price,
        3: housePrices.house_3_price,
        4: housePrices.house_4_price,
        hotel: housePrices.hotel_price
      },
      group: property.group,
      groupColor: property.group_color,
      mortgaged: property.mortgaged
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
    const room = await Room.getById(roomId);
    if (!room) {
      return res.status(404).json({
        code: 404,
        message: '房间不存在'
      });
    }
    
    const player = await Player.getByUserId(userId, roomId);
    if (!player) {
      return res.status(404).json({
        code: 404,
        message: '玩家不存在'
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
    const property = await Property.getById(propertyId);
    if (!property) {
      return res.status(404).json({
        code: 404,
        message: '地产不存在'
      });
    }
    
    // 检查地产是否已被购买
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
    
    // 开始事务
    const transaction = db.transaction();
    
    try {
      // 扣除玩家资金
      await Player.updateMoney(player.id, player.money - property.price, transaction);
      
      // 更新地产所有权
      await Property.updateOwner(propertyId, player.id, transaction);
      
      // 提交事务
      await transaction.commit();
      
      // 获取更新后的玩家信息
      const updatedPlayer = await Player.getById(player.id);
      
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
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
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
    const room = await Room.getById(roomId);
    if (!room) {
      return res.status(404).json({
        code: 404,
        message: '房间不存在'
      });
    }
    
    const player = await Player.getByUserId(userId, roomId);
    if (!player) {
      return res.status(404).json({
        code: 404,
        message: '玩家不存在'
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
    const property = await Property.getById(propertyId);
    if (!property) {
      return res.status(404).json({
        code: 404,
        message: '地产不存在'
      });
    }
    
    // 检查地产是否属于当前玩家
    if (property.owner_id !== player.id) {
      return res.status(400).json({
        code: 400,
        message: '您不是该地产的所有者'
      });
    }
    
    // 检查房屋数量是否已达上限
    if (property.houses >= 4) {
      return res.status(400).json({
        code: 400,
        message: '房屋数量已达上限'
      });
    }
    
    // 检查建设数量是否合理
    if (houseCount <= 0 || property.houses + houseCount > 4) {
      return res.status(400).json({
        code: 400,
        message: '无效的建设数量'
      });
    }
    
    // 获取房屋价格
    const housePricesQuery = `
      SELECT house_${property.houses + 1}_price as price 
      FROM property_prices 
      WHERE property_id = ?
    `;
    
    const [{ price }] = await db.prepare(housePricesQuery).all(propertyId);
    
    // 检查玩家是否有足够资金
    const totalCost = price * houseCount;
    if (player.money < totalCost) {
      return res.status(400).json({
        code: 400,
        message: '资金不足'
      });
    }
    
    // 开始事务
    const transaction = db.transaction();
    
    try {
      // 扣除玩家资金
      await Player.updateMoney(player.id, player.money - totalCost, transaction);
      
      // 更新房屋数量
      await Property.updateHouseCount(propertyId, property.houses + houseCount, transaction);
      
      // 更新租金
      const newRent = property.rent * (1 + 0.5 * houseCount);
      await Property.updateRent(propertyId, newRent, transaction);
      
      // 提交事务
      await transaction.commit();
      
      // 获取更新后的玩家信息
      const updatedPlayer = await Player.getById(player.id);
      
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
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
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
    const room = await Room.getById(roomId);
    if (!room) {
      return res.status(404).json({
        code: 404,
        message: '房间不存在'
      });
    }
    
    const player = await Player.getByUserId(userId, roomId);
    if (!player) {
      return res.status(404).json({
        code: 404,
        message: '玩家不存在'
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
    const property = await Property.getById(propertyId);
    if (!property) {
      return res.status(404).json({
        code: 404,
        message: '地产不存在'
      });
    }
    
    // 检查地产是否属于当前玩家
    if (property.owner_id !== player.id) {
      return res.status(400).json({
        code: 400,
        message: '您不是该地产的所有者'
      });
    }
    
    // 检查是否有房屋
    if (property.houses > 0) {
      return res.status(400).json({
        code: 400,
        message: '请先出售所有房屋'
      });
    }
    
    // 开始事务
    const transaction = db.transaction();
    
    try {
      // 增加玩家资金
      await Player.updateMoney(player.id, player.money + sellPrice, transaction);
      
      // 更新地产所有权
      await Property.updateOwner(propertyId, null, transaction);
      
      // 提交事务
      await transaction.commit();
      
      // 获取更新后的玩家信息
      const updatedPlayer = await Player.getById(player.id);
      
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
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
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