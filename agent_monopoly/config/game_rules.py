"""
在线大富翁游戏规则配置
严格按照《在线大富翁软件需求规格说明书》定义
"""

# ========================================
# 经济参数
# ========================================

ECONOMY = {
    # 初始资金
    "INITIAL_MONEY": 15000,

    # 起点奖励（路过起点时获得，停在起点不发钱）
    "PASS_GO_REWARD": 2000,

    # 个人所得税金额
    "INCOME_TAX": 2000,

    # 建设费用（普通地产）
    "BUILD_COSTS": {
        "house": 1000,      # 盖房子费用
        "second_house": 1500,  # 盖第二栋房子费用
        "hotel": 2000       # 盖旅馆费用
    },

    # 卖回价格（半价建设费用）
    "SELL_BACK_RATIO": 0.5,

    # 抵押价格（半价地价）
    "MORTGAGE_RATIO": 0.5,

    # 赎回价格（抵押金额，即半价地价）
    "REDEEM_RATIO": 0.5,
}

# ========================================
# 普通地产过路费计算
# ========================================

# 地产等级对应的过路费倍率
NORMAL_PROPERTY_RENTS = {
    "empty": 0.1,       # 空地：地价的10%
    "house": 0.3,       # 1房子：地价的30%
    "second_house": 0.5,  # 2房子：地价的50%
    "hotel": 0.8,       # 旅馆：地价的80%
}

# ========================================
# 特殊地块过路费计算
# ========================================

# 特殊地块（电站/车站/水厂）拥有数量对应的过路费倍率
UTILITY_RENT_MULTIPLIER = {
    1: 4,    # 拥有1个：骰子点数 × 4
    2: 10,   # 拥有2个：骰子点数 × 10
    3: 20,   # 拥有3个：骰子点数 × 20
}

# ========================================
# 游戏设置
# ========================================

GAME_SETTINGS = {
    # 回合超时时间（秒）
    "TURN_TIMEOUT": 60,

    # 地图地块数量
    "BOARD_SIZE": 40,

    # 最少玩家人数
    "MIN_PLAYERS": 2,

    # 最多玩家人数
    "MAX_PLAYERS": 6,

    # AI思考延迟（秒）
    "AI_THINK_DELAY": 2,
}

# ========================================
# 地块类型定义
# ========================================

TILE_TYPES = {
    "START": "start",           # 起点
    "NORMAL_PROPERTY": "normal_property",  # 普通地产
    "SPECIAL_PROPERTY": "special_property",  # 特殊地产（电站/车站/水厂）
    "CHANCE": "chance",         # 机会格
    "FATE": "fate",             # 命运格
    "INCOME_TAX": "income_tax", # 个人所得税格
    "GO_TO_JAIL": "go_to_jail", # 进牢格
    "JAIL": "jail",             # 坐牢格
    "FREE_PARKING": "free_parking",  # 免费停车场
    "EMPTY": "empty",           # 空格
}

# ========================================
# 建筑等级定义
# ========================================

BUILDING_LEVELS = {
    "EMPTY": 0,       # 空地
    "HOUSE": 1,       # 1房子
    "SECOND_HOUSE": 2,  # 2房子
    "HOTEL": 3,       # 旅馆
}

# ========================================
# 特殊地块类型（不能盖房）
# ========================================

SPECIAL_PROPERTY_TYPES = [
    "POWER_STATION",  # 发电站
    "TRAIN_STATION",  # 车站
    "WATER_WORKS",    # 水厂
]

# ========================================
# 核心游戏规则验证函数
# ========================================

def can_build_house(property_data):
    """
    判断是否可以在该地产盖房

    规则：只有停在自己拥有的普通地产上才能盖房
    """
    return (
        property_data.get("type") == "normal_property" and
        property_data.get("owner") is not None and
        property_data.get("building_level", 0) < 3 and
        not property_data.get("is_mortgaged", False)
    )


def can_upgrade_building(current_level):
    """
    判断是否可以升级建筑

    规则：必须按顺序升级，不能跳级
    """
    return current_level < 3


def is_special_property(property_type):
    """
    判断是否为特殊地块

    规则：特殊地块（电站、车站、水厂）永远不能盖房
    """
    return property_type in SPECIAL_PROPERTY_TYPES


def can_mortgage(property_data):
    """
    判断是否可以抵押地产

    规则：有建筑的土地不能抵押
    """
    return (
        property_data.get("building_level", 0) == 0 and
        not property_data.get("is_mortgaged", False)
    )


def calculate_bankruptcy(player_money, player_assets, debt):
    """
    计算破产处理

    规则：
    1. 先变卖资产（半价卖回房子、半价抵押土地）
    2. 变卖所有资产后仍不够支付费用，才判定为破产
    """
    # 建筑等级到成本键的映射
    level_to_cost_key = {
        1: "house",
        2: "second_house",
        3: "hotel"
    }

    # 计算可变卖资产价值
    liquidatable_value = 0

    # 房子/旅馆半价卖回
    for prop in player_assets:
        building_level = prop.get("building_level", 0)
        if building_level > 0:
            cost_key = level_to_cost_key.get(building_level)
            if cost_key:
                cost = ECONOMY["BUILD_COSTS"].get(cost_key, 0)
                liquidatable_value += cost * ECONOMY["SELL_BACK_RATIO"]

    # 空地半价抵押
    for prop in player_assets:
        if prop.get("building_level", 0) == 0 and not prop.get("is_mortgaged", False):
            liquidatable_value += prop.get("price", 0) * ECONOMY["MORTGAGE_RATIO"]

    # 总可用资金
    total_available = player_money + liquidatable_value

    return total_available < debt


def calculate_normal_property_rent(property_price, building_level, dice_roll=None):
    """
    计算普通地产过路费

    规则：
    - 空地：地价的10%
    - 1房子：地价的30%
    - 2房子：地价的50%
    - 旅馆：地价的80%
    """
    level_multipliers = {
        0: NORMAL_PROPERTY_RENTS["empty"],
        1: NORMAL_PROPERTY_RENTS["house"],
        2: NORMAL_PROPERTY_RENTS["second_house"],
        3: NORMAL_PROPERTY_RENTS["hotel"],
    }
    multiplier = level_multipliers.get(building_level, NORMAL_PROPERTY_RENTS["empty"])
    return int(property_price * multiplier)


def calculate_utility_rent(dice_roll, owned_count):
    """
    计算特殊地块过路费

    规则：
    - 拥有1个：骰子点数 × 4
    - 拥有2个：骰子点数 × 10
    - 拥有3个：骰子点数 × 20
    """
    multiplier = UTILITY_RENT_MULTIPLIER.get(owned_count, UTILITY_RENT_MULTIPLIER[1])
    return dice_roll * multiplier


# ========================================
# 机会/命运卡牌队列规则
# ========================================

CARD_QUEUE_RULES = {
    "draw_from": "front",      # 从队首拿取
    "return_to": "back",       # 执行后移至队尾
    "keep_count": True,        # 保持卡牌数量不变
}

# ========================================
# 回合流程定义
# ========================================

TURN_FLOW = [
    "roll_dice",      # 1. 掷骰子移动
    "handle_tile",    # 2. 处理停留地块效果
    "build_option",   # 3. 如果停在自己的地产上，可选择盖房
    "end_turn",       # 4. 回合结束
]

# ========================================
# 导出规则摘要（供其他模块使用）
# ========================================

RULES_SUMMARY = """
## 大富翁游戏核心规则

### 移动与起点
- 路过起点：获得奖励资金
- 停在起点：不发钱

### 盖房规则
- 只能在停着的地产盖房
- 升级顺序：空地 → 房子 → 2房子 → 旅馆（不能跳级）
- 特殊地块（电站/车站/水厂）永远不能盖房
- 有建筑的土地不能抵押

### 抵押规则
- 抵押期间不能收取过路费
- 抵押价格：半价地价
- 赎回价格：抵押金额

### 破产规则
- 资金不足时：先变卖资产（半价）
- 变卖所有资产后仍不够：才破产
- 破产后：所有地产回归空白

### 卡牌规则
- 按队列顺序拿取（队首）
- 执行后移至队尾（循环）
- 卡牌数量保持不变

### 特殊地块
- 进牢格：直接移动到坐牢格，暂停1回合
- 坐牢格：路过无惩罚
- 免费停车场：暂停1回合
- 个人所得税：支付固定税金
"""
