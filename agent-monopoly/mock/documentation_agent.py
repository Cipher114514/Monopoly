"""
Documentation Agent Mock 数据

技术文档
"""

MOCK_DOCUMENTATION = {
    "content": """# 技术文档

## 文档结构

1. **README.md** - 项目说明
2. **ARCHITECTURE.md** - 架构设计
3. **API.md** - API文档
4. **DEVELOPMENT.md** - 开发指南
5. **REQUIREMENTS.md** - 需求贴合说明
6. **TEST_REPORT.md** - 测试报告
""",
    "documents": [
        "README.md",
        "ARCHITECTURE.md",
        "API.md",
        "DEVELOPMENT.md",
        "REQUIREMENTS.md",
        "TEST_REPORT.md"
    ],
    "total_sections": 6,
    "word_count": 5000,
    "files": {
        "README.md": {
            "sections": [
                "项目介绍",
                "功能特性（17个需求）",
                "技术栈",
                "安装指南",
                "运行说明",
                "注意事项"
            ],
            "word_count": 1000
        },
        "ARCHITECTURE.md": {
            "sections": [
                "架构概述",
                "技术选型",
                "数据库设计（7张表）",
                "核心模块（7个）",
                "架构决策记录"
            ],
            "word_count": 1500
        },
        "API.md": {
            "sections": [
                "认证接口（3个）",
                "房间接口（5个）",
                "游戏接口（6个）",
                "WebSocket事件（6个）"
            ],
            "word_count": 1200
        },
        "DEVELOPMENT.md": {
            "sections": [
                "开发环境",
                "代码规范",
                "测试指南",
                "常见问题"
            ],
            "word_count": 800
        },
        "REQUIREMENTS.md": {
            "sections": [
                "需求贴合说明",
                "17个功能需求映射",
                "核心规则验证",
                "实现清单"
            ],
            "word_count": 500
        }
    },
    "requirements_mapping": {
        "FR-001": "用户注册与登录 - 已实现",
        "FR-002": "创建游戏房间 - 已实现",
        "FR-003": "加入游戏房间 - 已实现",
        "FR-004": "开始游戏 - 已实现",
        "FR-005": "掷骰子移动 - 已实现（路过起点发钱✅）",
        "FR-006": "购买地产 - 已实现",
        "FR-007": "支付过路费 - 已实现（抵押期间不收✅）",
        "FR-008": "建设房屋与酒店 - 部分实现（盖房条件有Bug）",
        "FR-009": "抽取机会/命运卡 - 部分实现（队列循环有Bug）",
        "FR-010": "回合管理 - 已实现",
        "FR-011": "聊天系统 - 已实现",
        "FR-012": "表情互动 - 已实现",
        "FR-013": "游戏结束判定 - 基本实现",
        "FR-014": "破产判定与处理 - 部分实现（变卖资产有Bug）",
        "FR-015": "地产赎回功能 - 已实现",
        "FR-016": "AI玩家功能 - 已实现",
        "FR-017": "历史记录与回放 - 已实现"
    },
    "key_rules_documented": {
        "start_position": "路过起点发钱，停在起点不发钱",
        "build_house": "只能停在拥有的普通地产上盖房",
        "upgrade_order": "空地 → 房子 → 2房子 → 旅馆",
        "mortgage": "有建筑的土地不能抵押，抵押期间不收过路费",
        "bankruptcy": "先变卖资产（房子半价、土地半价抵押），仍不够才破产",
        "chance_fate": "按队列顺序拿卡，执行后移至队尾（循环）",
        "go_to_jail": "直接移动到坐牢格，暂停1回合",
        "in_jail": "路过无惩罚",
        "free_parking": "暂停1回合"
    }
}
