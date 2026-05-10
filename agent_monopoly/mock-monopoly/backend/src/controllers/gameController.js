const { db } = require('../db/connection');
const Player = require('../models/Player');
const Property = require('../models/Property');
const Card = require('../models/Card');

// 掷骰子
exports.rollDice = async (req, res) => {
    try {
        const { roomId, userId } = req.body;
        
        // 验证玩家是否在房间中
        const player = await Player.findByUserIdAndRoom(userId, roomId);
        if (!player) {
            return res.status(404).json({
                code: 404,
                message: 'Player not found in room'
            });
        }

        // 生成随机骰子点数 (1-6)
        const dice1 = Math.floor(Math.random() * 6) + 1;
        const dice2 = Math.floor(Math.random() * 6) + 1;
        const totalSteps = dice1 + dice2;

        // 更新玩家位置
        let newPosition = player.position + totalSteps;
        
        // 检查是否经过起点
        let passedGo = false;
        if (newPosition > 39) {
            passedGo = true;
            newPosition = newPosition % 40;
        }

        // 更新玩家资金（如果经过起点）
        let updatedMoney = player.money;
        if (passedGo) {
            updatedMoney += 200;
        }

        // 更新玩家位置和资金
        const updatedPlayer = await Player.update(player.id, {
            position: newPosition,
            money: updatedMoney
        });

        // 检查玩家是否到达地产
        const property = await Property.findByPosition(newPosition);
        let propertyMessage = null;
        
        if (property) {
            if (property.ownerId === null) {
                // 地产无人购买，通知玩家
                propertyMessage = {
                    id: property.id,
                    name: property.name,
                    price: property.price,
                    canBuy: true
                };
            } else if (property.ownerId !== userId) {
                // 地产有主人，计算租金
                const rent = calculateRent(property, updatedPlayer);
                updatedMoney -= rent;
                
                // 更新玩家资金
                const finalPlayer = await Player.update(player.id, {
                    money: updatedMoney
                });
                
                // 给地主增加资金
                const owner = await Player.findById(property.ownerId);
                if (owner) {
                    await Player.update(owner.id, {
                        money: owner.money + rent
                    });
                }
                
                propertyMessage = {
                    id: property.id,
                    name: property.name,
                    rent: rent,
                    owner: property.ownerId
                };
            }
        }

        // 返回结果
        res.json({
            code: 200,
            message: 'Dice rolled successfully',
            data: {
                dice: [dice1, dice2],
                totalSteps: totalSteps,
                newPosition: newPosition,
                updatedPlayer: finalPlayer || updatedPlayer,
                passedGo: passedGo,
                property: propertyMessage
            }
        });

    } catch (error) {
        console.error('Error rolling dice:', error);
        res.status(500).json({
            code: 500,
            message: 'Internal server error'
        });
    }
};

// 购买地产
exports.buyProperty = async (req, res) => {
    try {
        const { roomId, userId, propertyId } = req.body;
        
        // 获取玩家信息
        const player = await Player.findByUserIdAndRoom(userId, roomId);
        if (!player) {
            return res.status(404).json({
                code: 404,
                message: 'Player not found in room'
            });
        }

        // 获取地产信息
        const property = await Property.findById(propertyId);
        if (!property) {
            return res.status(404).json({
                code: 404,
                message: 'Property not found'
            });
        }

        // 检查玩家是否拥有足够资金
        if (player.money < property.price) {
            return res.status(400).json({
                code: 400,
                message: 'Insufficient funds'
            });
        }

        // 检查地产是否已被购买
        if (property.ownerId !== null) {
            return res.status(400).json({
                code: 400,
                message: 'Property already owned'
            });
        }

        // 扣除玩家资金，更新地产所有者
        const updatedPlayer = await Player.update(player.id, {
            money: player.money - property.price
        });

        await Property.update(propertyId, {
            ownerId: userId,
            houseCount: 0
        });

        res.json({
            code: 200,
            message: 'Property purchased successfully',
            data: {
                player: updatedPlayer,
                property: {
                    ...property,
                    ownerId: userId
                }
            }
        });

    } catch (error) {
        console.error('Error buying property:', error);
        res.status(500).json({
            code: 500,
            message: 'Internal server error'
        });
    }
};

// 建造房屋
exports.buildHouse = async (req, res) => {
    try {
        const { roomId, userId, propertyId } = req.body;
        
        // 获取玩家信息
        const player = await Player.findByUserIdAndRoom(userId, roomId);
        if (!player) {
            return res.status(404).json({
                code: 404,
                message: 'Player not found in room'
            });
        }

        // 获取地产信息
        const property = await Property.findById(propertyId);
        if (!property) {
            return res.status(404).json({
                code: 404,
                message: 'Property not found'
            });
        }

        // 检查玩家是否拥有该地产
        if (property.ownerId !== userId) {
            return res.status(403).json({
                code: 403,
                message: 'You do not own this property'
            });
        }

        // 检查房屋数量限制
        if (property.houseCount >= 4) {
            return res.status(400).json({
                code: 400,
                message: 'Maximum houses reached'
            });
        }

        // 检查玩家资金
        const housePrice = property.price / 2; // 房屋价格是地产价格的一半
        if (player.money < housePrice) {
            return res.status(400).json({
                code: 400,
                message: 'Insufficient funds for house'
            });
        }

        // 扣除玩家资金，增加房屋数量
        const updatedPlayer = await Player.update(player.id, {
            money: player.money - housePrice
        });

        await Property.update(propertyId, {
            houseCount: property.houseCount + 1
        });

        res.json({
            code: 200,
            message: 'House built successfully',
            data: {
                player: updatedPlayer,
                property: {
                    ...property,
                    houseCount: property.houseCount + 1
                }
            }
        });

    } catch (error) {
        console.error('Error building house:', error);
        res.status(500).json({
            code: 500,
            message: 'Internal server error'
        });
    }
};

// 抽取卡牌
exports.drawCard = async (req, res) => {
    try {
        const { roomId, userId } = req.body;
        
        // 获取玩家信息
        const player = await Player.findByUserIdAndRoom(userId, roomId);
        if (!player) {
            return res.status(404).json({
                code: 404,
                message: 'Player not found in room'
            });
        }

        // 随机抽取一张卡牌
        const cards = await Card.findAll();
        if (cards.length === 0) {
            return res.status(404).json({
                code: 404,
                message: 'No cards available'
            });
        }

        const randomIndex = Math.floor(Math.random() * cards.length);
        const card = cards[randomIndex];

        // 执行卡牌效果
        let effectMessage = null;
        let updatedPlayer = player;

        switch (card.type) {
            case 'money':
                // 收钱效果
                updatedPlayer = await Player.update(player.id, {
                    money: player.money + card.amount
                });
                effectMessage = `You received $${card.amount}`;
                break;
            
            case 'move':
                // 移动效果
                const newPosition = card.position;
                updatedPlayer = await Player.update(player.id, {
                    position: newPosition
                });
                effectMessage = `You moved to position ${card.position}`;
                break;
            
            case 'jail':
                // 进监狱效果
                updatedPlayer = await Player.update(player.id, {
                    inJail: 1
                });
                effectMessage = 'You went to jail';
                break;
            
            case 'fine':
                // 罚款效果
                updatedPlayer = await Player.update(player.id, {
                    money: Math.max(0, player.money - card.amount)
                });
                effectMessage = `You paid a fine of $${card.amount}`;
                break;
        }

        res.json({
            code: 200,
            message: 'Card drawn successfully',
            data: {
                card: card,
                updatedPlayer: updatedPlayer,
                effectMessage: effectMessage
            }
        });

    } catch (error) {
        console.error('Error drawing card:', error);
        res.status(500).json({
            code: 500,
            message: 'Internal server error'
        });
    }
};

// 辅助函数：计算租金
function calculateRent(property, player) {
    let rent = property.baseRent;
    
    // 如果有房屋，增加租金
    if (property.houseCount > 0) {
        rent = property.baseRent * Math.pow(2, property.houseCount);
    }
    
    // TODO: 可以添加更多租金计算逻辑，如整组地产加成等
    
    return rent;
}