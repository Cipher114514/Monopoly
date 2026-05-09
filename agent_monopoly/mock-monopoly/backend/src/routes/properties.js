const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { v4: uuidv4 } = require('uuid');

// 获取所有地产
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    
    // 获取总数
    const countQuery = 'SELECT COUNT(*) as total FROM properties';
    const countResult = db.prepare(countQuery).get();
    const total = countResult.total;
    
    // 获取分页数据
    const query = `
      SELECT 
        p.*,
        u.id as owner_id, 
        u.username as owner_username
      FROM properties p
      LEFT JOIN users u ON p.owner_id = u.id
      ORDER BY p.position
      LIMIT ? OFFSET ?
    `;
    const properties = db.prepare(query).all(limit, offset);
    
    // 格式化返回数据
    const formattedProperties = properties.map(property => ({
      id: property.id,
      name: property.name,
      position: property.position,
      price: property.price,
      owner: property.owner_id ? {
        id: property.owner_id,
        username: property.owner_username
      } : null,
      houses: property.houses,
      rent: property.rent,
      group: property.group,
      groupColor: property.group_color,
      mortgaged: property.mortgaged
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
    console.error('获取地产列表错误:', error);
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
    
    // 获取地产基本信息
    const propertyQuery = `
      SELECT 
        p.*,
        u.id as owner_id, 
        u.username as owner_username
      FROM properties p
      LEFT JOIN users u ON p.owner_id = u.id
      WHERE p.id = ?
    `;
    const property = db.prepare(propertyQuery).get(propertyId);
    
    if (!property) {
      return res.status(404).json({
        code: 404,
        message: '地产不存在'
      });
    }
    
    // 获取房屋价格信息
    const housePricesQuery = 'SELECT house_count, price FROM house_prices WHERE property_id = ? ORDER BY house_count';
    const housePrices = db.prepare(housePricesQuery).all(propertyId);
    
    // 格式化房屋价格数据
    const formattedHousePrices = {};
    housePrices.forEach(price => {
      formattedHousePrices[price.house_count] = price.price;
    });
    
    // 格式化返回数据
    const formattedProperty = {
      id: property.id,
      name: property.name,
      position: property.position,
      price: property.price,
      owner: property.owner_id ? {
        id: property.owner_id,
        username: property.owner_username
      } : null,
      houses: property.houses,
      rent: property.rent,
      housePrices: formattedHousePrices,
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
    console.error('获取地产详情错误:', error);
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
    
    // 开始事务
    db.transaction(() => {
      // 获取地产信息
      const propertyQuery = 'SELECT * FROM properties WHERE id = ?';
      const property = db.prepare(propertyQuery).get(propertyId);
      
      if (!property) {
        throw new Error('地产不存在');
      }
      
      if (property.owner_id) {
        throw new Error('该地产已被购买');
      }
      
      // 获取用户信息
      const userQuery = 'SELECT * FROM users WHERE id = ?';
      const user = db.prepare(userQuery).get(userId);
      
      if (!user) {
        throw new Error('用户不存在');
      }
      
      if (user.money < property.price) {
        throw new Error('资金不足');
      }
      
      // 获取房间信息
      const roomQuery = 'SELECT * FROM rooms WHERE id = ?';
      const room = db.prepare(roomQuery).get(roomId);
      
      if (!room) {
        throw new Error('房间不存在');
      }
      
      // 检查用户是否在该房间中
      const playerQuery = 'SELECT * FROM players WHERE user_id = ? AND room_id = ?';
      const player = db.prepare(playerQuery).get(userId, roomId);
      
      if (!player) {
        throw new Error('用户不在该房间中');
      }
      
      // 更新用户资金
      const updateUserMoneyQuery = 'UPDATE users SET money = money - ? WHERE id = ?';
      db.prepare(updateUserMoneyQuery).run(property.price, userId);
      
      // 更新地产所有权
      const updatePropertyQuery = 'UPDATE properties SET owner_id = ? WHERE id = ?';
      db.prepare(updatePropertyQuery).run(userId, propertyId);
      
      // 记录交易历史
      const transactionQuery = `
        INSERT INTO transactions (id, room_id, user_id, type, amount, property_id, description)
        VALUES (?, ?, ?, 'purchase', ?, ?, ?)
      `;
      db.prepare(transactionQuery).run(
        uuidv4(),
        roomId,
        userId,
        property.price,
        propertyId,
        `购买地产: ${property.name}`
      );
      
      // 返回成功响应
      res.json({
        code: 200,
        data: {
          propertyId,
          ownerId: userId,
          price: property.price,
          remainingMoney: user.money - property.price
        },
        message: '地产购买成功'
      });
    })();
  } catch (error) {
    console.error('购买地产错误:', error);
    res.status(400).json({
      code: 400,
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
    
    // 开始事务
    db.transaction(() => {
      // 获取地产信息
      const propertyQuery = 'SELECT * FROM properties WHERE id = ?';
      const property = db.prepare(propertyQuery).get(propertyId);
      
      if (!property) {
        throw new Error('地产不存在');
      }
      
      if (property.owner_id !== userId) {
        throw new Error('您不是该地产的所有者');
      }
      
      // 获取房屋价格
      const housePriceQuery = 'SELECT price FROM house_prices WHERE property_id = ? AND house_count = 1';
      const housePriceResult = db.prepare(housePriceQuery).get(propertyId);
      
      if (!housePriceResult) {
        throw new Error('无法获取房屋价格');
      }
      
      const housePrice = housePriceResult.price;
      const totalCost = housePrice * houseCount;
      
      // 获取用户信息
      const userQuery = 'SELECT * FROM users WHERE id = ?';
      const user = db.prepare(userQuery).get(userId);
      
      if (!user) {
        throw new Error('用户不存在');
      }
      
      if (user.money < totalCost) {
        throw new Error('资金不足');
      }
      
      // 检查房屋数量限制
      if (property.houses + houseCount > 4) {
        throw new Error('房屋数量不能超过4栋');
      }
      
      // 更新用户资金
      const updateUserMoneyQuery = 'UPDATE users SET money = money - ? WHERE id = ?';
      db.prepare(updateUserMoneyQuery).run(totalCost, userId);
      
      // 更新房屋数量
      const updateHouseQuery = 'UPDATE properties SET houses = houses + ? WHERE id = ?';
      db.prepare(updateHouseQuery).run(houseCount, propertyId);
      
      // 更新租金
      const newRent = property.rent * (1 + houseCount * 0.5); // 每栋房屋增加50%租金
      const updateRentQuery = 'UPDATE properties SET rent = ? WHERE id = ?';
      db.prepare(updateRentQuery).run(newRent, propertyId);
      
      // 记录交易历史
      const transactionQuery = `
        INSERT INTO transactions (id, room_id, user_id, type, amount, property_id, description)
        VALUES (?, ?, ?, 'house_build', ?, ?, ?)
      `;
      db.prepare(transactionQuery).run(
        uuidv4(),
        roomId,
        userId,
        totalCost,
        propertyId,
        `建设房屋: ${property.name}, ${houseCount}栋`
      );
      
      // 返回成功响应
      res.json({
        code: 200,
        data: {
          propertyId,
          houseCount: property.houses + houseCount,
          cost: totalCost,
          remainingMoney: user.money - totalCost,
          newRent: newRent
        },
        message: '房屋建设成功'
      });
    })();
  } catch (error) {
    console.error('建设房屋错误:', error);
    res.status(400).json({
      code: 400,
      message: '房屋建设失败',
      error: error.message
    });
  }
});

// 出售地产
router.post('/:propertyId/sell', async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { roomId, userId, sellPrice } = req.body;
    
    // 开始事务
    db.transaction(() => {
      // 获取地产信息
      const propertyQuery = 'SELECT * FROM properties WHERE id = ?';
      const property = db.prepare(propertyQuery).get(propertyId);
      
      if (!property) {
        throw new Error('地产不存在');
      }
      
      if (property.owner_id !== userId) {
        throw new Error('您不是该地产的所有者');
      }
      
      // 获取用户信息
      const userQuery = 'SELECT * FROM users WHERE id = ?';
      const user = db.prepare(userQuery).get(userId);
      
      if (!user) {
        throw new Error('用户不存在');
      }
      
      // 检查出售价格
      if (sellPrice <= 0) {
        throw new Error('出售价格必须大于0');
      }
      
      // 更新用户资金
      const updateUserMoneyQuery = 'UPDATE users SET money = money + ? WHERE id = ?';
      db.prepare(updateUserMoneyQuery).run(sellPrice, userId);
      
      // 清除地产所有权
      const updatePropertyQuery = 'UPDATE properties SET owner_id = NULL, houses = 0, rent = ? WHERE id = ?';
      db.prepare(updatePropertyQuery).run(property.rent / 2, propertyId); // 出售后租金减半
      
      // 记录交易历史
      const transactionQuery = `
        INSERT INTO transactions (id, room_id, user_id, type, amount, property_id, description)
        VALUES (?, ?, ?, 'sell', ?, ?, ?)
      `;
      db.prepare(transactionQuery).run(
        uuidv4(),
        roomId,
        userId,
        sellPrice,
        propertyId,
        `出售地产: ${property.name}`
      );
      
      // 返回成功响应
      res.json({
        code: 200,
        data: {
          propertyId,
          sellPrice,
          newOwner: null,
          gainedMoney: sellPrice,
          remainingMoney: user.money + sellPrice
        },
        message: '地产出售成功'
      });
    })();
  } catch (error) {
    console.error('出售地产错误:', error);
    res.status(400).json({
      code: 400,
      message: '出售地产失败',
      error: error.message
    });
  }
});

module.exports = router;
```