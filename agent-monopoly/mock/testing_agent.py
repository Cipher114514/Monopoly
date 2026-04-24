"""
Testing Agent Mock 数据

测试报告
"""

MOCK_TEST_RESULTS = {
    "content": """# 测试报告

## 测试概述
- 测试时间: 3小时
- 测试版本: v1.0.0
- 测试环境: 本地开发环境

## 功能测试结果（17个功能需求）

### 核心功能
- [x] FR-001: 用户注册与登录 - PASS
- [x] FR-002: 创建游戏房间 - PASS
- [x] FR-003: 加入游戏房间 - PASS
- [x] FR-004: 开始游戏 - PASS
- [x] FR-005: 掷骰子移动 - PASS
- [x] FR-006: 购买地产 - PASS
- [x] FR-007: 支付过路费 - PASS
- [ ] FR-008: 建设房屋与酒店 - FAIL
- [ ] FR-009: 抽取机会/命运卡 - FAIL
- [x] FR-010: 回合管理 - PASS
- [x] FR-011: 聊天系统 - PASS
- [x] FR-012: 表情互动 - PASS
- [ ] FR-013: 游戏结束判定 - PARTIAL
- [ ] FR-014: 破产判定与处理 - FAIL
- [x] FR-015: 地产赎回功能 - PASS
- [x] FR-016: AI玩家功能 - PASS
- [x] FR-017: 历史记录与回放 - PASS

## Bug列表

### Bug #001: 盖房条件错误
**严重程度**: P1
**需求**: FR-008
**问题**: 路过自己的地产也能盖房
**期望**: 只能在停着的地产上盖房

### Bug #002: 卡牌未循环
**严重程度**: P1
**需求**: FR-009
**问题**: 卡牌用完不再出现
**期望**: 按队列循环使用

### Bug #003: 破产处理不完整
**严重程度**: P0
**需求**: FR-014
**问题**: 未实现变卖资产流程
**期望**: 先变卖房子（半价），再抵押土地（半价）

## 测试统计

- 总测试用例: 35
- 通过: 30 (85.7%)
- 失败: 3 (8.6%)
- 部分: 2 (5.7%)

## 核心规则验证

### ✅ 已验证
- 路过起点发钱，停在起点不发钱
- 抵押期间不收过路费
- 特殊地块不能盖房
- 回合超时处理

### ❌ 未通过
- 只能在停着的地产盖房 - 失败
- 卡牌队列循环 - 失败
- 破产前先变卖资产 - 失败

## 测试结论

**通过率**: 85.7%
**核心功能**: 基本完整
**建议**: 修复3个Bug后可以提交
""",
    "bugs": [
        {
            "id": "BUG-001",
            "severity": "P1",
            "title": "盖房条件错误",
            "fr": "FR-008",
            "actual": "路过自己的地产也能盖房",
            "expected": "只能停在的地产盖房"
        },
        {
            "id": "BUG-002",
            "severity": "P1",
            "title": "卡牌未循环",
            "fr": "FR-009",
            "actual": "卡牌用完不再出现",
            "expected": "按队列循环使用"
        },
        {
            "id": "BUG-003",
            "severity": "P0",
            "title": "破产处理不完整",
            "fr": "FR-014",
            "actual": "未实现变卖资产流程",
            "expected": "先变卖房子（半价），再抵押土地（半价）"
        }
    ],
    "test_coverage": "85.7%",
    "quality_score": "7.5/10",
    "release_recommendation": "修复3个Bug后可以提交",
    "functional_requirements_tested": 17,
    "test_cases": [
        {"id": "TC-001", "fr": "FR-001", "name": "用户注册", "status": "PASS"},
        {"id": "TC-002", "fr": "FR-002", "name": "创建房间", "status": "PASS"},
        {"id": "TC-003", "fr": "FR-005", "name": "掷骰子移动", "status": "PASS"},
        {"id": "TC-004", "fr": "FR-005", "name": "路过起点发钱", "status": "PASS"},
        {"id": "TC-005", "fr": "FR-008", "name": "建设房屋", "status": "FAIL"},
        {"id": "TC-006", "fr": "FR-009", "name": "抽取机会卡", "status": "FAIL"},
        {"id": "TC-007", "fr": "FR-014", "name": "破产处理", "status": "FAIL"}
    ],
    "summary": {
        "total_cases": 35,
        "passed": 30,
        "failed": 3,
        "partial": 2,
        "pass_rate": 0.857
    },
    "key_rules_verified": {
        "pass_start_bonus": "✅ 路过起点发钱，停在起点不发钱",
        "mortgage_no_rent": "✅ 抵押期间不收过路费",
        "special_no_build": "✅ 特殊地块不能盖房",
        "stop_to_build": "❌ 只能在停着的地产盖房",
        "card_cycle": "❌ 卡牌队列循环",
        "bankruptcy_sell": "❌ 破产前先变卖资产"
    }
}
