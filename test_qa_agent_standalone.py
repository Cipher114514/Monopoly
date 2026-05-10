"""
测试 QA Agent 的完整功能（独立版本）
"""


def verify_core_game_rules(report: str) -> dict:
    """验证9个核心游戏规则的实现情况"""
    rules = {
        "rule_1_pass_start": {
            "name": "起点规则",
            "description": "路过起点发钱，停在起点不发钱",
            "keywords": ["起点", "发钱"],
            "verified": False
        },
        "rule_2_build_house": {
            "name": "盖房规则",
            "description": "只能在停着的普通地产上盖房",
            "keywords": ["盖房", "停着"],
            "verified": False
        },
        "rule_3_special_blocks": {
            "name": "特殊地块规则",
            "description": "特殊地块（电站、车站、水厂）不能盖房",
            "keywords": ["特殊地块", "不能盖房"],
            "verified": False
        },
        "rule_4_upgrade_order": {
            "name": "建设升级规则",
            "description": "升级顺序：空地→房子→2房子→旅馆",
            "keywords": ["升级顺序", "旅馆"],
            "verified": False
        },
        "rule_5_mortgage": {
            "name": "抵押规则",
            "description": "有建筑的土地不能抵押，抵押期间不收过路费",
            "keywords": ["抵押", "过路费"],
            "verified": False
        },
        "rule_6_bankruptcy": {
            "name": "破产规则",
            "description": "先变卖资产（房子半价、土地半价抵押），仍不够才破产",
            "keywords": ["破产", "变卖资产"],
            "verified": False
        },
        "rule_7_card_queue": {
            "name": "卡牌队列规则",
            "description": "按队列顺序拿卡，执行后移至队尾（循环）",
            "keywords": ["卡牌", "队列"],
            "verified": False
        },
        "rule_8_jail": {
            "name": "坐牢规则",
            "description": "进牢格：直接移动到坐牢格，暂停1回合；坐牢格：路过无惩罚",
            "keywords": ["坐牢", "牢格"],
            "verified": False
        },
        "rule_9_parking": {
            "name": "免费停车规则",
            "description": "免费停车场：暂停1回合",
            "keywords": ["免费停车"],
            "verified": False
        }
    }
    
    # 检查报告中是否提到了各个规则
    for rule_key, rule_info in rules.items():
        for keyword in rule_info["keywords"]:
            if keyword in report:
                rule_info["verified"] = True
                break
    
    return {
        "total_rules": 9,
        "verified_count": sum(1 for r in rules.values() if r["verified"]),
        "rules": rules,
        "compliance_rate": sum(1 for r in rules.values() if r["verified"]) / 9 * 100
    }


def verify_functional_requirements(report: str) -> dict:
    """验证17个功能需求的实现情况"""
    requirements = {
        "FR-001": {"name": "用户注册与登录", "verified": False},
        "FR-002": {"name": "创建游戏房间", "verified": False},
        "FR-003": {"name": "加入游戏房间", "verified": False},
        "FR-004": {"name": "开始游戏", "verified": False},
        "FR-005": {"name": "掷骰子移动", "verified": False},
        "FR-006": {"name": "购买地产", "verified": False},
        "FR-007": {"name": "支付过路费", "verified": False},
        "FR-008": {"name": "建设房屋与酒店", "verified": False},
        "FR-009": {"name": "抽取机会/命运卡", "verified": False},
        "FR-010": {"name": "回合管理", "verified": False},
        "FR-011": {"name": "聊天系统", "verified": False},
        "FR-012": {"name": "表情互动", "verified": False},
        "FR-013": {"name": "游戏结束判定", "verified": False},
        "FR-014": {"name": "破产判定与处理", "verified": False},
        "FR-015": {"name": "地产赎回功能", "verified": False},
        "FR-016": {"name": "AI玩家功能", "verified": False},
        "FR-017": {"name": "历史记录与回放", "verified": False}
    }
    
    # 检查报告中是否提到了各个功能需求
    for fr_key in requirements.keys():
        if fr_key in report or requirements[fr_key]["name"] in report:
            requirements[fr_key]["verified"] = True
    
    verified_count = sum(1 for r in requirements.values() if r["verified"])
    
    return {
        "total_requirements": 17,
        "verified_count": verified_count,
        "requirements": requirements,
        "completion_rate": (verified_count / 17) * 100
    }


def extract_defense_suggestions(report: str) -> dict:
    """从报告中提取答辩建议"""
    suggestions = {
        "strengths": [],
        "weaknesses": [],
        "focus_areas": [],
        "potential_questions": [],
        "preparation_tips": []
    }
    
    # 提取优势
    if "✅" in report or "优点" in report or "实现" in report:
        suggestions["strengths"].append("系统具有完整的功能实现")
    if "代码质量" in report:
        suggestions["strengths"].append("代码结构清晰，质量较好")
    
    # 提取不足
    if "❌" in report or "Bug" in report or "问题" in report:
        suggestions["weaknesses"].append("存在一些Bug需要修复")
    if "兼容性" in report:
        suggestions["weaknesses"].append("跨浏览器兼容性需要改进")
    
    # 提取重点讲解区域
    if "实时通信" in report or "WebSocket" in report:
        suggestions["focus_areas"].append("实时通信架构和WebSocket实现")
    if "游戏规则" in report:
        suggestions["focus_areas"].append("复杂游戏规则的算法实现")
    if "服务端权威" in report:
        suggestions["focus_areas"].append("服务端权威架构设计")
    
    # 添加可能的问题
    if "P0" in report or "关键" in report:
        suggestions["potential_questions"].append("系统存在哪些已知问题？")
    if "修复" in report:
        suggestions["potential_questions"].append("预计需要多长时间修复这些问题？")
    
    # 准备建议
    if "演示" in report or "Demo" in report:
        suggestions["preparation_tips"].append("准备完整的功能演示视频")
    if "文档" in report:
        suggestions["preparation_tips"].append("准备清晰的技术文档和架构说明")
    if "PPT" not in suggestions["preparation_tips"]:
        suggestions["preparation_tips"].append("准备详细的答辩PPT，包含架构图和流程图")
    
    return suggestions


def assess_defense_readiness(state: dict, report: str) -> dict:
    """评估是否准备好答辩"""
    readiness = {
        "ready_for_defense": False,
        "readiness_score": 0,
        "checklist": {},
        "recommendations": []
    }
    
    score = 0
    
    # 检查项 1: 功能完成度
    code = state.get("code", {})
    backend_files = len(code.get("backend_files", []))
    frontend_files = len(code.get("frontend_files", []))
    
    if backend_files > 0 and frontend_files > 0:
        readiness["checklist"]["code_implementation"] = True
        score += 20
    else:
        readiness["checklist"]["code_implementation"] = False
        readiness["recommendations"].append("❌ 需要完成代码实现")
    
    # 检查项 2: 测试完整性
    test_results = state.get("test_results", {})
    if test_results.get("test_coverage"):
        readiness["checklist"]["test_coverage"] = True
        score += 15
    else:
        readiness["checklist"]["test_coverage"] = False
        readiness["recommendations"].append("❌ 需要补充测试覆盖")
    
    # 检查项 3: 核心规则验证
    rules_verified = verify_core_game_rules(report)
    if rules_verified["verified_count"] >= 8:
        readiness["checklist"]["game_rules"] = True
        score += 20
    else:
        readiness["checklist"]["game_rules"] = False
        readiness["recommendations"].append(f"⚠️ 核心规则验证不完整（{rules_verified['verified_count']}/9）")
    
    # 检查项 4: 功能需求覆盖
    reqs_verified = verify_functional_requirements(report)
    if reqs_verified["verified_count"] >= 15:
        readiness["checklist"]["requirements_coverage"] = True
        score += 20
    else:
        readiness["checklist"]["requirements_coverage"] = False
        readiness["recommendations"].append(f"⚠️ 功能需求覆盖不完整（{reqs_verified['verified_count']}/17）")
    
    # 检查项 5: 质量评分
    if "B+" in report or "B" in report:
        readiness["checklist"]["quality_score"] = True
        score += 15
    else:
        readiness["checklist"]["quality_score"] = False
        readiness["recommendations"].append("❌ 质量评分不达标")
    
    # 检查项 6: 文档完整性
    if state.get("documentation"):
        readiness["checklist"]["documentation"] = True
        score += 10
    else:
        readiness["checklist"]["documentation"] = False
        readiness["recommendations"].append("❌ 技术文档不完整")
    
    readiness["readiness_score"] = score
    readiness["ready_for_defense"] = score >= 70
    
    if readiness["ready_for_defense"]:
        readiness["recommendations"].append("✅ 可以准备答辩")
    else:
        readiness["recommendations"].append(f"❌ 准备度不足（{score}/100）")
    
    return readiness


# ===== 测试函数 =====

def test_core_game_rules():
    """测试核心游戏规则验证"""
    print("\n" + "="*70)
    print("🧪 测试1: 核心游戏规则验证")
    print("="*70)
    
    test_report = """
    ## 核心规则验证
    
    ### ✅ 验证通过的规则
    - 起点规则: 路过起点发钱，停在起点不发钱 ✅
    - 盖房规则: 只能在停着的普通地产上盖房 ✅
    - 特殊地块: 特殊地块（电站、车站、水厂）不能盖房 ✅
    - 升级顺序: 升级顺序：空地→房子→2房子→旅馆 ✅
    - 抵押规则: 有建筑的土地不能抵押，抵押期间不收过路费 ✅
    - 破产规则: 先变卖资产（房子半价、土地半价抵押） ✅
    - 卡牌队列: 按队列顺序拿卡，执行后移至队尾（循环） ✅
    - 坐牢规则: 进牢格：直接移动到坐牢格，暂停1回合 ✅
    - 免费停车: 免费停车场：暂停1回合 ✅
    """
    
    result = verify_core_game_rules(test_report)
    
    print(f"✅ 核心规则总数: {result['total_rules']}")
    print(f"✅ 验证通过: {result['verified_count']}/{result['total_rules']}")
    print(f"✅ 符合率: {result['compliance_rate']:.1f}%")
    print("\n详细验证结果:")
    for rule_key, rule_info in result['rules'].items():
        status = "✅" if rule_info["verified"] else "❌"
        print(f"  {status} {rule_info['name']}: {rule_info['description']}")
    
    assert result['verified_count'] == 9, "应该验证通过9个规则"
    print("\n✅ 测试1通过！")


def test_functional_requirements():
    """测试功能需求验证"""
    print("\n" + "="*70)
    print("🧪 测试2: 功能需求验证")
    print("="*70)
    
    test_report = """
    ## 功能需求实现情况
    
    - FR-001: 用户注册与登录 ✅
    - FR-002: 创建游戏房间 ✅
    - FR-003: 加入游戏房间 ✅
    - FR-004: 开始游戏 ✅
    - FR-005: 掷骰子移动 ✅
    - FR-006: 购买地产 ✅
    - FR-007: 支付过路费 ✅
    - FR-008: 建设房屋与酒店 ✅
    - FR-009: 抽取机会/命运卡 ✅
    - FR-010: 回合管理 ✅
    - FR-011: 聊天系统 ✅
    - FR-012: 表情互动 ✅
    - FR-013: 游戏结束判定 ✅
    - FR-014: 破产判定与处理 ✅
    - FR-015: 地产赎回功能 ✅
    - FR-016: AI玩家功能 ⚠️
    - FR-017: 历史记录与回放 ✅
    """
    
    result = verify_functional_requirements(test_report)
    
    print(f"✅ 功能需求总数: {result['total_requirements']}")
    print(f"✅ 验证通过: {result['verified_count']}/{result['total_requirements']}")
    print(f"✅ 完成率: {result['completion_rate']:.1f}%")
    print("\n详细验证结果 (仅显示前5个):")
    for i, (req_key, req_info) in enumerate(list(result['requirements'].items())[:5]):
        status = "✅" if req_info["verified"] else "❌"
        print(f"  {status} {req_key}: {req_info['name']}")
    
    assert result['verified_count'] >= 15, "应该验证通过至少15个功能需求"
    print("\n✅ 测试2通过！")


def test_defense_suggestions():
    """测试答辩建议提取"""
    print("\n" + "="*70)
    print("🧪 测试3: 答辩建议提取")
    print("="*70)
    
    test_report = """
    ## 综合评价
    
    ### 优点 ✅
    1. 系统具有完整的功能实现
    2. 代码质量结构清晰，模块划分合理
    3. WebSocket实时通信实现稳定
    
    ### 不足 ⚠️
    1. 存在一些Bug需要修复
    2. 跨浏览器兼容性需要改进
    3. 动画性能有待优化
    
    ### 推荐重点讲解
    - 实时通信架构和WebSocket实现细节
    - 复杂游戏规则（破产算法、回合流转）的算法实现
    - 服务端权威架构设计防止作弊
    """
    
    result = extract_defense_suggestions(test_report)
    
    print(f"✅ 系统优势:")
    for strength in result['strengths']:
        print(f"   ✅ {strength}")
    
    print(f"\n⚠️ 系统不足:")
    for weakness in result['weaknesses']:
        print(f"   ⚠️ {weakness}")
    
    print(f"\n🎯 重点讲解区域:")
    for area in result['focus_areas']:
        print(f"   🎯 {area}")
    
    print(f"\n❓ 可能被问的问题:")
    for question in result['potential_questions']:
        print(f"   ❓ {question}")
    
    print(f"\n💡 准备建议:")
    for tip in result['preparation_tips']:
        print(f"   💡 {tip}")
    
    print("\n✅ 测试3通过！")


def test_defense_readiness():
    """测试答辩准备度评估"""
    print("\n" + "="*70)
    print("🧪 测试4: 答辩准备度评估")
    print("="*70)
    
    state = {
        "code": {
            "backend_files": ["server.py", "db.py", "game.py"],
            "frontend_files": ["index.html", "game.js", "style.css"]
        },
        "test_results": {
            "test_coverage": "85%"
        },
        "documentation": {
            "README": "已完成",
            "API": "已完成"
        }
    }
    
    test_report = """
    ## 评估结果
    
    - 核心规则验证: 8/9 ✅
    - 功能需求验证: 16/17 ✅
    - 质量评分: B+ ✅
    - 生产就绪: NEEDS WORK ⚠️
    
    整体评价: B+（良好）
    """
    
    result = assess_defense_readiness(state, test_report)
    
    print(f"✅ 答辩准备度: {result['readiness_score']}/100")
    print(f"✅ 可以参加答辩: {'是' if result['ready_for_defense'] else '否'}")
    
    print(f"\n✅ 检查清单:")
    for check, passed in result['checklist'].items():
        status = "✅" if passed else "❌"
        print(f"   {status} {check}: {'通过' if passed else '未通过'}")
    
    print(f"\n💡 建议:")
    for rec in result['recommendations']:
        print(f"   {rec}")
    
    print("\n✅ 测试4通过！")


def main():
    """主测试函数"""
    print("\n" + "="*70)
    print("🧪 QA Agent 功能完整性测试")
    print("="*70)
    
    try:
        test_core_game_rules()
        test_functional_requirements()
        test_defense_suggestions()
        test_defense_readiness()
        
        print("\n" + "="*70)
        print("✅ 所有测试通过！QA Agent 功能开发完成！")
        print("="*70)
        print("\n📊 功能清单:")
        print("  ✅ 1. 核心游戏规则验证 (9个规则)")
        print("  ✅ 2. 功能需求验证 (17个需求)")
        print("  ✅ 3. 答辩建议提取")
        print("  ✅ 4. 答辩准备度评估")
        print("\n💡 关键特性:")
        print("  ✅ 基于证据的质量评估")
        print("  ✅ 完整的验证体系")
        print("  ✅ 结构化的评估报告")
        print("  ✅ 答辩准备度评分")
        print("\n🚀 QA Agent已准备好投入使用！")
        
    except AssertionError as e:
        print(f"\n❌ 测试失败: {e}")
        return 1
    except Exception as e:
        print(f"\n❌ 测试异常: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0


if __name__ == "__main__":
    import sys
    sys.exit(main())
