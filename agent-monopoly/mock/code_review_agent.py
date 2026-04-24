"""
Code Review Agent Mock 数据

代码审查报告
"""

MOCK_REVIEW = {
    "content": """# 代码审查报告

## 总体评分: ⭐⭐⭐⭐ (4/5)

## 审查摘要
- 代码行数: ~2500行
- 问题数量: 8个
- 阻塞问题: 0个
- 重要问题: 4个
- 建议问题: 4个

## 🟡 重要问题

### Issue #1: 破产逻辑不完整
**位置**: economyService.js:120
**问题**: 未实现递归变卖资产
**建议**: 按需求文档实现：先变卖房子（半价），再抵押土地（半价）

### Issue #2: 路过起点判断错误
**位置**: gameService.js:45
**问题**: 未区分路过和停在起点
**建议**: 停在起点不发钱，只有路过才发钱

### Issue #3: 卡牌队列未循环
**位置**: CardDeck.js:30
**问题**: 卡牌用完后未移至队尾
**建议**: 执行后将卡牌移至队尾，实现循环使用

### Issue #4: 盖房条件检查缺失
**位置**: propertyService.js:60
**问题**: 未检查是否停在地产上
**建议**: 只能在停着的地产上盖房，路过不行

## 💭 小改进

### Issue #5: 缺少输入验证
### Issue #6: 错误处理不完整
### Issue #7: 缺少代码注释
### Issue #8: 变量命名不规范

## ✅ 优点

- 代码结构清晰
- 模块划分合理
- WebSocket集成良好
- 基本功能完整

## 审查结论

**是否通过**: ✅ 通过（课程作业标准）

**评价**: 代码质量良好，核心功能基本完整，需要修复4个重要逻辑问题以严格贴合需求文档。
""",
    "overall_score": "4/5",
    "blocking_issues": [],
    "important_issues": [
        {
            "id": "ISSUE-001",
            "severity": "High",
            "location": "economyService.js:120",
            "title": "破产逻辑不完整",
            "suggestions": ["实现递归变卖资产", "先变卖房子（半价）", "再抵押土地（半价）"]
        },
        {
            "id": "ISSUE-002",
            "severity": "High",
            "location": "gameService.js:45",
            "title": "路过起点判断错误",
            "suggestions": ["停在起点不发钱", "只有路过才发钱"]
        },
        {
            "id": "ISSUE-003",
            "severity": "High",
            "location": "CardDeck.js:30",
            "title": "卡牌队列未循环",
            "suggestions": ["执行后移至队尾", "实现循环使用"]
        },
        {
            "id": "ISSUE-004",
            "severity": "High",
            "location": "propertyService.js:60",
            "title": "盖房条件检查缺失",
            "suggestions": ["只能停在的地产盖房", "路过不能盖房"]
        }
    ],
    "minor_improvements": [
        {"id": "ISSUE-005", "suggestion": "添加输入验证"},
        {"id": "ISSUE-006", "suggestion": "完善错误处理"},
        {"id": "ISSUE-007", "suggestion": "添加代码注释"},
        {"id": "ISSUE-008", "suggestion": "改善变量命名"}
    ],
    "pass_rate": 0.80,
    "recommendation": "有条件通过 - 需要修复4个重要逻辑问题",
    "strengths": ["结构清晰", "模块划分合理", "WebSocket集成良好"]
}
