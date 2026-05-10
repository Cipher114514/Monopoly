/**
 * 大富翁游戏核心逻辑工具类
 * 处理游戏规则、骰子、移动、地产、租金等核心功能
 */

class GameLogic {
    /**
     * 掷骰子
     * @returns {number} 1-6的随机数
     */
    static rollDice() {
        return Math.floor(Math.random() * 6) + 1;
    }

    /**
     * 处理玩家移动
     * @param {number} currentPosition - 当前位置
     * @param {number} diceValue - 骰子点数
     * @param {number} boardSize - 棋盘大小（默认40格）
     * @returns {Object} 移动结果
     */
    static movePlayer(currentPosition, diceValue, boardSize = 40) {
        const newPosition = (currentPosition + diceValue) % boardSize;
        const passedGo = newPosition < currentPosition;
        const goReward = passedGo ? 200 : 0;

        return {
            newPosition,
            passedGo,
            goReward
        };
    }

    /**
     * 检查玩家是否可以购买地产
     * @param {Object} player - 玩家对象
     * @param {Object} property - 地产对象
     * @returns {boolean} 是否可以购买
     */
    static canBuyProperty(player, property) {
        // 检查玩家是否有足够资金
        if (player.money < property.price) {
            return false;
        }

        // 检查地产是否已有主人
        if (property.owner_id !== null) {
            return false;
        }

        // 检查是否是当前玩家的回合
        // 这里需要游戏状态管理，暂时返回true
        return true;
    }

    /**
     * 购买地产
     * @param {Object} player - 玩家对象
     * @param {Object} property - 地产对象
     * @returns {Object} 购买结果
     */
    static buyProperty(player, property) {
        if (!this.canBuyProperty(player, property)) {
            return {
                success: false,
                message: '无法购买此地产'
            };
        }

        // 扣除玩家资金
        player.money -= property.price;
        
        // 更新地产所有者
        property.owner_id = player.id;

        return {
            success: true,
            message: '购买成功',
            playerMoney: player.money,
            propertyOwner: property.owner_id
        };
    }

    /**
     * 计算租金
     * @param {Object} property - 地产对象
     * @param {number} diceValue - 骰子点数（用于计算铁路租金）
     * @returns {number} 租金金额
     */
    static calculateRent(property, diceValue = 1) {
        if (property.owner_id === null) {
            return 0;
        }

        // 根据地产类型计算租金
        switch (property.type) {
            case 'street':
                // 普通街道租金
                let rent = property.base_rent;
                
                // 检查是否拥有同色所有地产
                const hasAllColor = this.hasAllColorProperties(property);
                if (hasAllColor) {
                    rent *= 2; // 拥有同色所有地产，租金翻倍
                }
                
                // 根据房屋数量增加租金
                rent *= Math.pow(2, property.house_count);
                
                return rent;
                
            case 'railroad':
                // 铁路租金：基础租金 × 铁路数量
                const railroadCount = this.getRailroadCount(property.owner_id);
                return property.base_rent * railroadCount;
                
            case 'utility':
                // 电力公司/自来水公司租金：骰子点数 × 倍数
                const utilityCount = this.getUtilityCount(property.owner_id);
                return diceValue * (utilityCount === 2 ? 10 : 4);
                
            default:
                return property.base_rent;
        }
    }

    /**
     * 检查玩家是否拥有同色所有地产
     * @param {Object} property - 地产对象
     * @returns {boolean} 是否拥有同色所有地产
     */
    static hasAllColorProperties(property) {
        // 这里需要查询数据库获取同色所有地产
        // 暂时返回false，实际实现需要数据库查询
        return false;
    }

    /**
     * 获取玩家拥有的铁路数量
     * @param {number} ownerId - 玩家ID
     * @returns {number} 铁路数量
     */
    static getRailroadCount(ownerId) {
        // 这里需要查询数据库获取玩家拥有的铁路数量
        // 暂时返回0，实际实现需要数据库查询
        return 0;
    }

    /**
     * 获取玩家拥有的公用事业数量
     * @param {number} ownerId - 玩家ID
     * @returns {number} 公用事业数量
     */
    static getUtilityCount(ownerId) {
        // 这里需要查询数据库获取玩家拥有的公用事业数量
        // 暂时返回0，实际实现需要数据库查询
        return 0;
    }

    /**
     * 建造房屋
     * @param {Object} player - 玩家对象
     * @param {Object} property - 地产对象
     * @returns {Object} 建造结果
     */
    static buildHouse(player, property) {
        // 检查是否可以建造房屋
        if (property.type !== 'street') {
            return {
                success: false,
                message: '只能为街道建造房屋'
            };
        }

        if (property.owner_id !== player.id) {
            return {
                success: false,
                message: '您不是此地产的所有者'
            };
        }

        if (property.house_count >= 4) {
            return {
                success: false,
                message: '已达到最大房屋数量'
            };
        }

        // 检查资金
        const housePrice = property.house_price || 50;
        if (player.money < housePrice) {
            return {
                success: false,
                message: '资金不足'
            };
        }

        // 检查同色地产是否都有相同数量的房屋
        const canBuild = this.canBuildHouseOnProperty(property);
        if (!canBuild) {
            return {
                success: false,
                message: '必须均匀建造房屋'
            };
        }

        // 扣除资金并建造房屋
        player.money -= housePrice;
        property.house_count += 1;

        return {
            success: true,
            message: '房屋建造成功',
            playerMoney: player.money,
            houseCount: property.house_count
        };
    }

    /**
     * 检查是否可以在地产上建造房屋
     * @param {Object} property - 地产对象
     * @returns {boolean} 是否可以建造
     */
    static canBuildHouseOnProperty(property) {
        // 检查同色所有地产的房屋数量是否均匀
        // 这里需要查询数据库获取同色所有地产
        // 暂时返回true，实际实现需要数据库查询
        return true;
    }

    /**
     * 抽取卡牌
     * @param {string} cardType - 卡牌类型（'chance' 或 'community'）
     * @returns {Object} 卡牌内容
     */
    static drawCard(cardType) {
        // 卡牌内容示例
        const chanceCards = [
            { type: 'move', value: 0, message: '回到起点' },
            { type: 'move', value: 5, message: '前进到棋盘广场' },
            { type: 'money', value: 50, message: '银行错误，获得50元' },
            { type: 'money', value: -15, message: '医疗费，支付15元' },
            { type: 'move', value: -3, message: '退回3格' },
            { type: 'jail', message: '进监狱' },
            { type: 'property', value: 40, message: '修缮费，支付40元每间房屋' },
            { type: 'go', message: '直接到起点' }
        ];

        const communityCards = [
            { type: 'money', value: 200, message: '获得200元' },
            { type: 'money', value: 100, message: '获得100元' },
            { type: 'money', value: 20, message: '获得20元' },
            { type: 'money', value: -50, message: '付医疗费50元' },
            { type: 'money', value: -100, message: '付医院费100元' },
            { type: 'money', value: -150, message: '付手术费150元' },
            { type: 'go', message: '直接到起点' },
            { type: 'jail', message: '出狱免费' }
        ];

        const cards = cardType === 'chance' ? chanceCards : communityCards;
        const randomIndex = Math.floor(Math.random() * cards.length);
        
        return {
            cardType,
            ...cards[randomIndex]
        };
    }

    /**
     * 检查玩家是否破产
     * @param {Object} player - 玩家对象
     * @returns {boolean} 是否破产
     */
    static isBankrupt(player) {
        return player.money < 0;
    }

    /**
     * 处理玩家破产
     * @param {Object} player - 破产玩家
     * @param {Object} creditor - 债主（玩家或银行）
     * @returns {Object} 处理结果
     */
    static handleBankruptcy(player, creditor) {
        if (!this.isBankrupt(player)) {
            return {
                success: false,
                message: '玩家未破产'
            };
        }

        // 将玩家所有资产转移给债主
        // 这里需要更新数据库中的地产所有权
        // 暂时返回成功
        return {
            success: true,
            message: `${player.username}已破产，所有资产转移给${creditor.username || '银行'}`
        };
    }

    /**
     * 进入监狱
     * @param {Object} player - 玩家对象
     * @param {string} reason - 进入监狱原因
     */
    static goToJail(player, reason = '普通原因') {
        player.in_jail = 1;
        player.jail_turns = 3; // 可以使用通行证或掷出双骰子离开
        return {
            success: true,
            message: `${player.username}进入监狱，原因：${reason}`,
            inJail: true,
            jailTurns: player.jail_turns
        };
    }

    /**
     * 离开监狱
     * @param {Object} player - 玩家对象
     * @param {boolean} useCard - 是否使用通行证
     * @param {boolean} rolledDoubles - 是否掷出双骰子
     * @returns {Object} 结果
     */
    static leaveJail(player, useCard = false, rolledDoubles = false) {
        if (player.in_jail !== 1) {
            return {
                success: false,
                message: '玩家不在监狱中'
            };
        }

        if (useCard) {
            // 使用通行证离开监狱
            player.in_jail = 0;
            player.jail_turns = 0;
            return {
                success: true,
                message: '使用通行证离开监狱',
                inJail: false
            };
        } else if (rolledDoubles) {
            // 掷出双骰子离开监狱
            player.in_jail = 0;
            player.jail_turns = 0;
            return {
                success: true,
                message: '掷出双骰子离开监狱',
                inJail: false
            };
        } else {
            // 支付50元离开监狱
            if (player.money >= 50) {
                player.money -= 50;
                player.in_jail = 0;
                player.jail_turns = 0;
                return {
                    success: true,
                    message: '支付50元离开监狱',
                    inJail: false,
                    playerMoney: player.money
                };
            } else {
                return {
                    success: false,
                    message: '资金不足，无法支付50元离开监狱'
                };
            }
        }
    }

    /**
     * 检查是否可以结束回合
     * @param {Object} player - 当前玩家
     * @param {Object} gameState - 游戏状态
     * @returns {boolean} 是否可以结束回合
     */
    static canEndTurn(player, gameState) {
        // 如果玩家在监狱且没有掷出双骰子，不能结束回合
        if (player.in_jail === 1 && !gameState.diceRolled) {
            return false;
        }

        // 如果玩家需要选择是否购买地产，不能结束回合
        if (gameState.propertyToBuy && !gameState.propertyDecisionMade) {
            return false;
        }

        return true;
    }
}

module.exports = GameLogic;