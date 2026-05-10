const { 
    rollDice, 
    movePlayer, 
    handlePropertyLanding, 
    drawCard, 
    buildHouse, 
    endTurn,
    checkBankruptcy,
    startGame
} = require('../../utils/gameLogic');

const Player = require('../../models/Player');
const Property = require('../../models/Property');
const Room = require('../../models/Room');

module.exports = (io) => {
    return (socket) => {
        // 掷骰子
        socket.on('roll_dice', async (data) => {
            try {
                const { roomId, userId } = data;
                
                // 验证是否轮到该玩家
                const room = await Room.findById(roomId);
                if (!room || room.current_player !== userId) {
                    socket.emit('error', { message: '不是您的回合' });
                    return;
                }

                // 检查玩家是否在监狱中
                const player = await Player.findByUserIdAndRoom(userId, roomId);
                if (player.inJail) {
                    socket.emit('error', { message: '您在监狱中，无法掷骰子' });
                    return;
                }

                // 掷骰子
                const dice1 = Math.floor(Math.random() * 6) + 1;
                const dice2 = Math.floor(Math.random() * 6) + 1;
                const total = dice1 + dice2;

                // 广播骰子结果
                io.to(roomId).emit('dice_rolled', {
                    userId,
                    dice1,
                    dice2,
                    total
                });

                // 移动玩家
                await movePlayer(roomId, userId, total);

                // 检查玩家是否破产
                const updatedPlayer = await Player.findByUserIdAndRoom(userId, roomId);
                if (updatedPlayer.money < 0) {
                    await checkBankruptcy(roomId, userId);
                    return;
                }

                // 检查是否结束回合
                if (dice1 !== dice2) {
                    await endTurn(roomId);
                }
            } catch (error) {
                console.error('掷骰子错误:', error);
                socket.emit('error', { message: '掷骰子失败' });
            }
        });

        // 购买地产
        socket.on('buy_property', async (data) => {
            try {
                const { roomId, userId, propertyId } = data;
                
                // 验证是否轮到该玩家
                const room = await Room.findById(roomId);
                if (!room || room.current_player !== userId) {
                    socket.emit('error', { message: '不是您的回合' });
                    return;
                }

                // 检查玩家是否落在该地产上
                const player = await Player.findByUserIdAndRoom(userId, roomId);
                const property = await Property.findById(propertyId);
                
                if (!property || property.owner_id !== null) {
                    socket.emit('error', { message: '地产已被购买或不存在' });
                    return;
                }

                if (player.position !== property.position) {
                    socket.emit('error', { message: '您没有落在这个地产上' });
                    return;
                }

                // 检查玩家资金是否足够
                if (player.money < property.price) {
                    socket.emit('error', { message: '资金不足' });
                    return;
                }

                // 执行购买
                const updatedPlayer = await Player.update(player.id, { 
                    money: player.money - property.price 
                });
                
                await Property.update(propertyId, { owner_id: userId });

                // 广播购买结果
                io.to(roomId).emit('property_bought', {
                    userId,
                    propertyId,
                    propertyName: property.name,
                    price: property.price
                });

                // 检查是否结束回合
                await endTurn(roomId);
            } catch (error) {
                console.error('购买地产错误:', error);
                socket.emit('error', { message: '购买地产失败' });
            }
        });

        // 建造房屋
        socket.on('build_house', async (data) => {
            try {
                const { roomId, userId, propertyId } = data;
                
                // 验证是否轮到该玩家
                const room = await Room.findById(roomId);
                if (!room || room.current_player !== userId) {
                    socket.emit('error', { message: '不是您的回合' });
                    return;
                }

                // 检查玩家是否拥有该地产
                const property = await Property.findById(propertyId);
                if (!property || property.owner_id !== userId) {
                    socket.emit('error', { message: '您不拥有这个地产' });
                    return;
                }

                // 检查是否可以建造房屋
                if (property.house_count >= 4) {
                    socket.emit('error', { message: '房屋数量已达上限' });
                    return;
                }

                // 检查玩家资金是否足够
                const housePrice = property.price * 0.5; // 房屋价格是地产价格的一半
                const player = await Player.findByUserIdAndRoom(userId, roomId);
                if (player.money < housePrice) {
                    socket.emit('error', { message: '资金不足' });
                    return;
                }

                // 执行建造
                const updatedPlayer = await Player.update(player.id, { 
                    money: player.money - housePrice 
                });
                
                await Property.update(propertyId, { 
                    house_count: property.house_count + 1 
                });

                // 广播建造结果
                io.to(roomId).emit('house_built', {
                    userId,
                    propertyId,
                    houseCount: property.house_count + 1,
                    cost: housePrice
                });

                // 检查是否结束回合
                await endTurn(roomId);
            } catch (error) {
                console.error('建造房屋错误:', error);
                socket.emit('error', { message: '建造房屋失败' });
            }
        });

        // 抽取卡牌
        socket.on('draw_card', async (data) => {
            try {
                const { roomId, userId } = data;
                
                // 验证是否轮到该玩家
                const room = await Room.findById(roomId);
                if (!room || room.current_player !== userId) {
                    socket.emit('error', { message: '不是您的回合' });
                    return;
                }

                // 检查玩家是否落在卡牌格子上
                const player = await Player.findByUserIdAndRoom(userId, roomId);
                const isChancePosition = [7, 22, 36].includes(player.position);
                const isCommunityChestPosition = [2, 17, 33].includes(player.position);
                
                if (!isChancePosition && !isCommunityChestPosition) {
                    socket.emit('error', { message: '您没有落在卡牌格子上' });
                    return;
                }

                // 抽取卡牌
                const card = await drawCard(roomId, userId, isChancePosition ? 'chance' : 'community_chest');
                
                // 广播卡牌结果
                io.to(roomId).emit('card_drawn', {
                    userId,
                    card
                });

                // 检查是否结束回合
                await endTurn(roomId);
            } catch (error) {
                console.error('抽取卡牌错误:', error);
                socket.emit('error', { message: '抽取卡牌失败' });
            }
        });

        // 结束回合
        socket.on('end_turn', async (data) => {
            try {
                const { roomId, userId } = data;
                
                // 验证是否轮到该玩家
                const room = await Room.findById(roomId);
                if (!room || room.current_player !== userId) {
                    socket.emit('error', { message: '不是您的回合' });
                    return;
                }

                // 结束回合
                await endTurn(roomId);
            } catch (error) {
                console.error('结束回合错误:', error);
                socket.emit('error', { message: '结束回合失败' });
            }
        });

        // 开始游戏
        socket.on('start_game', async (data) => {
            try {
                const { roomId } = data;
                
                // 验证房间状态
                const room = await Room.findById(roomId);
                if (!room || room.status !== 'waiting') {
                    socket.emit('error', { message: '房间状态不正确' });
                    return;
                }

                // 检查是否所有玩家都准备好了
                const players = await Player.findByRoomId(roomId);
                const allReady = players.every(player => player.isReady);
                if (!allReady) {
                    socket.emit('error', { message: '所有玩家必须都准备好才能开始' });
                    return;
                }

                // 开始游戏
                await startGame(roomId);

                // 广播游戏开始
                io.to(roomId).emit('game_started', {
                    message: '游戏开始！'
                });
            } catch (error) {
                console.error('开始游戏错误:', error);
                socket.emit('error', { message: '开始游戏失败' });
            }
        });
    };
};