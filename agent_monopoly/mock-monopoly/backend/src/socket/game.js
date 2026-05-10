const { db } = require('../db/connection');
const Player = require('../models/Player');
const Property = require('../models/Property');
const Card = require('../models/Card');
const GameEvent = require('../models/GameEvent');
const jwt = require('jsonwebtoken');
const { validateDiceRoll, validatePropertyPurchase, validateHouseBuilding } = require('../utils/validation');
const { handleDiceRoll, handlePropertyPurchase, handleHouseBuilding, handleCardDraw } = require('../utils/gameLogic');

/**
 * 游戏Socket事件处理器
 * 处理游戏核心逻辑相关的Socket.io事件
 */
module.exports = (io) => {
  return (socket) => {
    // 验证用户身份
    const token = socket.handshake.auth.token;
    if (!token) {
      socket.emit('error', { code: 401, message: '未提供访问令牌' });
      return;
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      socket.emit('error', { code: 401, message: '无效的访问令牌' });
      return;
    }

    const userId = decoded.userId;

    /**
     * 掷骰子事件
     * 客户端 → 服务器: roll_dice
     */
    socket.on('roll_dice', async (data) => {
      try {
        const { roomId } = data;
        
        // 验证房间和玩家
        const room = await db.get('SELECT * FROM rooms WHERE id = ?', [roomId]);
        if (!room) {
          socket.emit('error', { code: 404, message: '房间不存在' });
          return;
        }

        // 获取当前玩家
        const currentPlayer = await Player.findByUserIdAndRoom(userId, roomId);
        if (!currentPlayer) {
          socket.emit('error', { code: 403, message: '您不是该房间的玩家' });
          return;
        }

        // 验证是否是当前玩家的回合
        // 这里简化处理，实际应该记录当前轮到哪个玩家
        const players = await Player.findByRoomId(roomId);
        const currentPlayerIndex = players.findIndex(p => p.id === currentPlayer.id);
        const isCurrentTurn = currentPlayerIndex === 0; // 简化逻辑
        
        if (!isCurrentTurn) {
          socket.emit('error', { code: 403, message: '现在不是您的回合' });
          return;
        }

        // 验证骰子点数
        const diceResult = validateDiceRoll(data.dice);
        
        // 处理骰子结果
        const gameResult = await handleDiceRoll(roomId, currentPlayer.id, diceResult);
        
        // 广播骰子结果给房间所有玩家
        io.to(roomId).emit('dice_rolled', {
          playerId: currentPlayer.id,
          dice: diceResult,
          newPosition: gameResult.newPosition,
          message: gameResult.message,
          passedGo: gameResult.passedGo
        });

        // 如果到达地产，通知当前玩家
        if (gameResult.propertyAtNewPosition) {
          socket.emit('property_reached', {
            property: gameResult.propertyAtNewPosition,
            canBuy: !gameResult.propertyAtNewPosition.owner_id && currentPlayer.money >= gameResult.propertyAtNewPosition.price
          });
        }

        // 如果触发卡牌，通知当前玩家
        if (gameResult.triggeredCard) {
          socket.emit('card_triggered', {
            cardType: gameResult.triggeredCard.type,
            message: gameResult.triggeredCard.message
          });
        }

        // 记录游戏事件
        await GameEvent.create({
          room_id: roomId,
          player_id: currentPlayer.id,
          event_type: 'dice_roll',
          event_data: JSON.stringify({
            dice: diceResult,
            oldPosition: currentPlayer.position,
            newPosition: gameResult.newPosition,
            passedGo: gameResult.passedGo
          })
        });

      } catch (error) {
        console.error('处理掷骰子事件时出错:', error);
        socket.emit('error', { code: 500, message: '服务器内部错误' });
      }
    });

    /**
     * 购买地产事件
     * 客户端 → 服务器: buy_property
     */
    socket.on('buy_property', async (data) => {
      try {
        const { roomId, propertyId } = data;
        
        // 验证房间和玩家
        const room = await db.get('SELECT * FROM rooms WHERE id = ?', [roomId]);
        if (!room) {
          socket.emit('error', { code: 404, message: '房间不存在' });
          return;
        }

        const currentPlayer = await Player.findByUserIdAndRoom(userId, roomId);
        if (!currentPlayer) {
          socket.emit('error', { code: 403, message: '您不是该房间的玩家' });
          return;
        }

        // 验证是否是当前玩家的回合
        const players = await Player.findByRoomId(roomId);
        const currentPlayerIndex = players.findIndex(p => p.id === currentPlayer.id);
        const isCurrentTurn = currentPlayerIndex === 0; // 简化逻辑
        
        if (!isCurrentTurn) {
          socket.emit('error', { code: 403, message: '现在不是您的回合' });
          return;
        }

        // 获取地产信息
        const property = await Property.findById(propertyId);
        if (!property) {
          socket.emit('error', { code: 404, message: '地产不存在' });
          return;
        }

        // 验证购买条件
        const validation = validatePropertyPurchase(currentPlayer, property);
        if (!validation.valid) {
          socket.emit('error', { code: 400, message: validation.message });
          return;
        }

        // 执行购买操作
        const purchaseResult = await handlePropertyPurchase(roomId, currentPlayer.id, propertyId);
        
        // 广播购买结果
        io.to(roomId).emit('property_purchased', {
          playerId: currentPlayer.id,
          propertyId: propertyId,
          playerName: currentPlayer.username || '玩家',
          propertyName: property.name,
          price: property.price
        });

        // 记录游戏事件
        await GameEvent.create({
          room_id: roomId,
          player_id: currentPlayer.id,
          event_type: 'property_purchase',
          event_data: JSON.stringify({
            propertyId: propertyId,
            propertyName: property.name,
            price: property.price,
            playerMoney: purchaseResult.playerMoney
          })
        });

      } catch (error) {
        console.error('处理购买地产事件时出错:', error);
        socket.emit('error', { code: 500, message: '服务器内部错误' });
      }
    });

    /**
     * 建造房屋事件
     * 客户端 → 服务器: build_house
     */
    socket.on('build_house', async (data) => {
      try {
        const { roomId, propertyId } = data;
        
        // 验证房间和玩家
        const room = await db.get('SELECT * FROM rooms WHERE id = ?', [roomId]);
        if (!room) {
          socket.emit('error', { code: 404, message: '房间不存在' });
          return;
        }

        const currentPlayer = await Player.findByUserIdAndRoom(userId, roomId);
        if (!currentPlayer) {
          socket.emit('error', { code: 403, message: '您不是该房间的玩家' });
          return;
        }

        // 验证是否是当前玩家的回合
        const players = await Player.findByRoomId(roomId);
        const currentPlayerIndex = players.findIndex(p => p.id === currentPlayer.id);
        const isCurrentTurn = currentPlayerIndex === 0; // 简化逻辑
        
        if (!isCurrentTurn) {
          socket.emit('error', { code: 403, message: '现在不是您的回合' });
          return;
        }

        // 获取地产信息
        const property = await Property.findById(propertyId);
        if (!property) {
          socket.emit('error', { code: 404, message: '地产不存在' });
          return;
        }

        // 验证建造条件
        const validation = validateHouseBuilding(currentPlayer, property);
        if (!validation.valid) {
          socket.emit('error', { code: 400, message: validation.message });
          return;
        }

        // 执行建造操作
        const buildResult = await handleHouseBuilding(roomId, currentPlayer.id, propertyId);
        
        // 广播建造结果
        io.to(roomId).emit('house_built', {
          playerId: currentPlayer.id,
          propertyId: propertyId,
          houseCount: buildResult.houseCount,
          totalCost: buildResult.totalCost
        });

        // 记录游戏事件
        await GameEvent.create({
          room_id: roomId,
          player_id: currentPlayer.id,
          event_type: 'house_build',
          event_data: JSON.stringify({
            propertyId: propertyId,
            houseCount: buildResult.houseCount,
            totalCost: buildResult.totalCost,
            playerMoney: buildResult.playerMoney
          })
        });

      } catch (error) {
        console.error('处理建造房屋事件时出错:', error);
        socket.emit('error', { code: 500, message: '服务器内部错误' });
      }
    });

    /**
     * 抽取卡牌事件
     * 客户端 → 服务器: draw_card
     */
    socket.on('draw_card', async (data) => {
      try {
        const { roomId, cardType } = data;
        
        // 验证房间和玩家
        const room = await db.get('SELECT * FROM rooms WHERE id = ?', [roomId]);
        if (!room) {
          socket.emit('error', { code: 404, message: '房间不存在' });
          return;
        }

        const currentPlayer = await Player.findByUserIdAndRoom(userId, roomId);
        if (!currentPlayer) {
          socket.emit('error', { code: 403, message: '您不是该房间的玩家' });
          return;
        }

        // 验证卡牌类型
        if (cardType !== 'chance' && cardType !== 'community') {
          socket.emit('error', { code: 400, message: '无效的卡牌类型' });
          return;
        }

        // 执行抽卡操作
        const cardResult = await handleCardDraw(roomId, currentPlayer.id, cardType);
        
        // 广播抽卡结果
        io.to(roomId).emit('card_drawn', {
          playerId: currentPlayer.id,
          card: cardResult.card,
          effect: cardResult.effect
        });

        // 记录游戏事件
        await GameEvent.create({
          room_id: roomId,
          player_id: currentPlayer.id,
          event_type: 'card_draw',
          event_data: JSON.stringify({
            cardType: cardType,
            cardId: cardResult.card.id,
            cardText: cardResult.card.text,
            effect: cardResult.effect
          })
        });

      } catch (error) {
        console.error('处理抽取卡牌事件时出错:', error);
        socket.emit('error', { code: 500, message: '服务器内部错误' });
      }
    });

    /**
     * 结束回合事件
     * 客户端 → 服务器: end_turn
     */
    socket.on('end_turn', async (data) => {
      try {
        const { roomId } = data;
        
        // 验证房间和玩家
        const room = await db.get('SELECT * FROM rooms WHERE id = ?', [roomId]);
        if (!room) {
          socket.emit('error', { code: 404, message: '房间不存在' });
          return;
        }

        const currentPlayer = await Player.findByUserIdAndRoom(userId, roomId);
        if (!currentPlayer) {
          socket.emit('error', { code: 403, message: '您不是该房间的玩家' });
          return;
        }

        // 验证是否是当前玩家的回合
        const players = await Player.findByRoomId(roomId);
        const currentPlayerIndex = players.findIndex(p => p.id === currentPlayer.id);
        const isCurrentTurn = currentPlayerIndex === 0; // 简化逻辑
        
        if (!isCurrentTurn) {
          socket.emit('error', { code: 403, message: '现在不是您的回合' });
          return;
        }

        // 获取下一个玩家
        const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
        const nextPlayer = players[nextPlayerIndex];

        // 更新当前玩家状态
        await Player.update(currentPlayer.id, { is_ready: 0 });

        // 更新下一个玩家状态
        await Player.update(nextPlayer.id, { is_ready: 1 });

        // 广播回合切换
        io.to(roomId).emit('turn_changed', {
          previousPlayerId: currentPlayer.id,
          currentPlayerId: nextPlayer.id,
          currentPlayerName: nextPlayer.username || '玩家'
        });

        // 记录游戏事件
        await GameEvent.create({
          room_id: roomId,
          player_id: currentPlayer.id,
          event_type: 'turn_end',
          event_data: JSON.stringify({
            nextPlayerId: nextPlayer.id,
            nextPlayerName: nextPlayer.username || '玩家'
          })
        });

      } catch (error) {
        console.error('处理结束回合事件时出错:', error);
        socket.emit('error', { code: 500, message: '服务器内部错误' });
      }
    });

    /**
     * 玩家破产事件
     * 客户端 → 服务器: player_bankrupt
     */
    socket.on('player_bankrupt', async (data) => {
      try {
        const { roomId } = data;
        
        // 验证房间和玩家
        const room = await db.get('SELECT * FROM rooms WHERE id = ?', [roomId]);
        if (!room) {
          socket.emit('error', { code: 404, message: '房间不存在' });
          return;
        }

        const currentPlayer = await Player.findByUserIdAndRoom(userId, roomId);
        if (!currentPlayer) {
          socket.emit('error', { code: 403, message: '您不是该房间的玩家' });
          return;
        }

        // 检查玩家是否真的破产
        if (currentPlayer.money > 0) {
          socket.emit('error', { code: 400, message: '您还没有破产' });
          return;
        }

        // 更新玩家破产状态
        await Player.update(currentPlayer.id, { is_bankrupt: 1 });

        // 获取房间内其他玩家
        const players = await Player.findByRoomId(roomId);
        const activePlayers = players.filter(p => p.id !== currentPlayer.id && !p.is_bankrupt);

        // 如果只剩一个玩家，游戏结束
        if (activePlayers.length === 1) {
          const winner = activePlayers[0];
          await db.run('UPDATE rooms SET status = ? WHERE id = ?', ['finished', roomId]);
          
          io.to(roomId).emit('game_finished', {
            winnerId: winner.id,
            winnerName: winner.username || '玩家'
          });

          // 记录游戏结束事件
          await GameEvent.create({
            room_id: roomId,
            player_id: winner.id,
            event_type: 'game_finished',
            event_data: JSON.stringify({
              winnerId: winner.id,
              winnerName: winner.username || '玩家'
            })
          });
        } else {
          // 广播玩家破产
          io.to(roomId).emit('player_bankrupted', {
            playerId: currentPlayer.id,
            playerName: currentPlayer.username || '玩家'
          });

          // 记录破产事件
          await GameEvent.create({
            room_id: roomId,
            player_id: currentPlayer.id,
            event_type: 'player_bankrupt',
            event_data: JSON.stringify({
              reason: 'player_out_of_money'
            })
          });
        }

      } catch (error) {
        console.error('处理玩家破产事件时出错:', error);
        socket.emit('error', { code: 500, message: '服务器内部错误' });
      }
    });

    /**
     * 玩家离开房间事件
     */
    socket.on('disconnect', async () => {
      try {
        // 获取玩家在的所有房间
        const players = await Player.findByUserId(userId);
        
        for (const player of players) {
          const room = await db.get('SELECT * FROM rooms WHERE id = ?', [player.room_id]);
          if (room) {
            // 广播玩家离开
            io.to(player.room_id).emit('player_left', {
              playerId: player.id,
              playerName: player.username || '玩家'
            });

            // 记录离开事件
            await GameEvent.create({
              room_id: player.room_id,
              player_id: player.id,
              event_type: 'player_left',
              event_data: JSON.stringify({
                reason: 'disconnected'
              })
            });
          }
        }
      } catch (error) {
        console.error('处理玩家断开连接时出错:', error);
      }
    });
  };
};