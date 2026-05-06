"""
Agent核心能力工具模块
包含SPEC、Skill、Validation等核心能力的实现
"""

from typing import Dict, List, Any, Optional
from config.game_rules import RULES_SUMMARY, ECONOMY, GAME_SETTINGS


# ========================================
# SPEC 能力：规格说明书动态引用
# ========================================

def get_spec_context() -> str:
    """
    获取规格说明书上下文
    返回游戏规则摘要供Agent使用
    """
    return f"""
## 《在线大富翁软件需求规格说明书》核心规则

{RULES_SUMMARY}

### 经济参数
- 初始资金: {ECONOMY['INITIAL_MONEY']} 元
- 起点奖励: {ECONOMY['PASS_GO_REWARD']} 元（路过时获得，停在起点不发钱）
- 盖房费用: {ECONOMY['BUILD_COSTS']}
- 抵押/卖回比例: {ECONOMY['MORTGAGE_RATIO'] * 100}%

### 游戏设置
- 地图大小: {GAME_SETTINGS['BOARD_SIZE']} 格
- 玩家数量: {GAME_SETTINGS['MIN_PLAYERS']}~{GAME_SETTINGS['MAX_PLAYERS']} 人
- 回合超时: {GAME_SETTINGS['TURN_TIMEOUT']} 秒
"""


def get_spec_rule(rule_name: str) -> Any:
    """
    获取特定规则的值

    Args:
        rule_name: 规则名称，使用点号分隔的路径
                   例如: "ECONOMY.INITIAL_MONEY", "GAME_SETTINGS.MAX_PLAYERS"

    Returns:
        规则的值，如果不存在则返回None
    """
    parts = rule_name.split('.')
    obj = globals()

    for part in parts:
        # 如果obj已经是None，提前返回
        if obj is None:
            return None

        if isinstance(obj, dict):
            obj = obj.get(part)
        elif hasattr(obj, part):
            obj = getattr(obj, part)
        else:
            # 尝试作为字典键访问
            if isinstance(obj, dict):
                obj = obj.get(part)
            else:
                return None

    return obj


def validate_against_spec(check_type: str, data: Dict) -> Dict[str, Any]:
    """
    根据规格说明书验证数据

    Args:
        check_type: 检查类型 ('economy', 'game_settings', 'building_rules', etc.)
        data: 要验证的数据

    Returns:
        验证结果: {'valid': bool, 'errors': list, 'warnings': list}
    """
    result = {'valid': True, 'errors': [], 'warnings': []}

    if check_type == 'economy':
        # 验证经济参数
        if 'initial_money' in data:
            if data['initial_money'] != ECONOMY['INITIAL_MONEY']:
                result['errors'].append(
                    f"初始资金错误: 应为 {ECONOMY['INITIAL_MONEY']}，实际为 {data['initial_money']}"
                )
                result['valid'] = False

        if 'pass_go_reward' in data:
            if data['pass_go_reward'] != ECONOMY['PASS_GO_REWARD']:
                result['errors'].append(
                    f"起点奖励错误: 应为 {ECONOMY['PASS_GO_REWARD']}，实际为 {data['pass_go_reward']}"
                )

    elif check_type == 'game_settings':
        # 验证游戏设置
        if 'board_size' in data:
            if data['board_size'] != GAME_SETTINGS['BOARD_SIZE']:
                result['warnings'].append(
                    f"地图大小与规格不符: 规格为 {GAME_SETTINGS['BOARD_SIZE']}，实际为 {data['board_size']}"
                )

        if 'player_count' in data:
            min_p = GAME_SETTINGS['MIN_PLAYERS']
            max_p = GAME_SETTINGS['MAX_PLAYERS']
            if not (min_p <= data['player_count'] <= max_p):
                result['errors'].append(
                    f"玩家数量超出范围: 应为 {min_p}~{max_p}，实际为 {data['player_count']}"
                )
                result['valid'] = False

    elif check_type == 'building_rules':
        # 验证盖房规则
        if 'can_build_on_special' in data and data['can_build_on_special']:
            result['errors'].append(
                "特殊地块（电站/车站/水厂）不能盖房，违反规格"
            )
            result['valid'] = False

        if 'can_skip_level' in data and data['can_skip_level']:
            result['errors'].append(
                "盖房必须按顺序升级，不能跳级，违反规格"
            )
            result['valid'] = False

    return result


# ========================================
# Skill 能力：技能调用
# ========================================

class SkillRegistry:
    """技能注册表"""

    _skills = {}

    @classmethod
    def register(cls, name: str, func, description: str = ""):
        """注册技能"""
        cls._skills[name] = {
            'func': func,
            'description': description
        }

    @classmethod
    def execute(cls, name: str, *args, **kwargs) -> Any:
        """执行技能"""
        if name not in cls._skills:
            return {'error': f'Skill "{name}" not found'}

        try:
            result = cls._skills[name]['func'](*args, **kwargs)
            return {'success': True, 'result': result}
        except Exception as e:
            return {'error': str(e)}

    @classmethod
    def list_skills(cls) -> List[Dict[str, str]]:
        """列出所有可用技能"""
        return [
            {'name': name, 'description': skill['description']}
            for name, skill in cls._skills.items()
        ]


# 注册基础技能
def validate_json(json_str: str) -> Dict:
    """验证JSON格式"""
    import json
    try:
        json.loads(json_str)
        return {'valid': True}
    except json.JSONDecodeError as e:
        return {'valid': False, 'error': str(e)}


def validate_format(code: str, lang: str) -> Dict:
    """验证代码格式（简单检查）"""
    if lang in ['javascript', 'js']:
        # 简单的JS语法检查
        errors = []
        if code.count('{') != code.count('}'):
            errors.append('大括号不匹配')
        if code.count('(') != code.count(')'):
            errors.append('小括号不匹配')
        return {'valid': len(errors) == 0, 'errors': errors}
    return {'valid': True, 'message': f'{lang} format check not implemented'}


def check_game_rule_violation(code_snippet: str) -> Dict:
    """检查代码片段是否违反游戏规则"""
    from config.game_rules import RULES_SUMMARY

    violations = []

    # 检查常见违反规则的模式
    if '停在起点' in code_snippet and '发钱' in code_snippet:
        violations.append('停在起点不应该发钱，只有路过起点才发钱')

    if '路过' in code_snippet and '不发钱' in code_snippet:
        violations.append('路过起点应该发钱')

    # 检查特殊地块盖房
    if '电站' in code_snippet or '车站' in code_snippet:
        if '盖房' in code_snippet or 'build' in code_snippet.lower():
            violations.append('特殊地块（电站/车站/水厂）不能盖房')

    return {'violations': violations, 'valid': len(violations) == 0}


# 注册默认技能
SkillRegistry.register('validate_json', validate_json, '验证JSON格式')
SkillRegistry.register('validate_format', validate_format, '验证代码格式')
SkillRegistry.register('check_game_rules', check_game_rule_violation, '检查是否违反游戏规则')


def execute_skill(skill_name: str, *args, **kwargs) -> Dict[str, Any]:
    """
    执行技能并返回结果

    Args:
        skill_name: 技能名称
        *args, **kwargs: 技能参数

    Returns:
        执行结果: {'success': bool, 'result': any, 'error': str}
    """
    return SkillRegistry.execute(skill_name, *args, **kwargs)


# ========================================
# Validation 能力：验证状态管理
# ========================================

class ValidationStatus:
    """验证状态管理"""

    def __init__(self):
        self.clear()

    def clear(self):
        """清空验证状态"""
        self.statuses: List[Dict[str, Any]] = []

    def add(self, agent: str, check_type: str, result: Dict[str, Any]):
        """
        添加验证状态

        Args:
            agent: Agent名称
            check_type: 检查类型
            result: 检查结果 {'valid': bool, 'errors': list, 'warnings': list}
        """
        self.statuses.append({
            'agent': agent,
            'check_type': check_type,
            'result': result,
            'timestamp': None  # 可以添加时间戳
        })

    def get_latest(self, agent: str = None, check_type: str = None) -> Optional[Dict]:
        """
        获取最新的验证状态

        Args:
            agent: 筛选Agent
            check_type: 筛选检查类型

        Returns:
            最新的验证状态，如果没有则返回None
        """
        filtered = self.statuses

        if agent:
            filtered = [s for s in filtered if s['agent'] == agent]

        if check_type:
            filtered = [s for s in filtered if s['check_type'] == check_type]

        if filtered:
            return filtered[-1]

        return None

    def has_blocking_issues(self) -> bool:
        """是否有阻塞问题"""
        for status in self.statuses:
            result = status.get('result', {})
            if not result.get('valid', True):
                return True
        return False

    def get_summary(self) -> Dict[str, Any]:
        """获取验证摘要"""
        total = len(self.statuses)
        passed = sum(1 for s in self.statuses if s['result'].get('valid', True))
        failed = total - passed

        errors = []
        warnings = []

        for status in self.statuses:
            result = status.get('result', {})
            errors.extend(result.get('errors', []))
            warnings.extend(result.get('warnings', []))

        return {
            'total': total,
            'passed': passed,
            'failed': failed,
            'has_blocking': self.has_blocking_issues(),
            'errors': errors,
            'warnings': warnings
        }

    def to_list(self) -> List[str]:
        """转换为字符串列表（兼容旧的validation_status字段）"""
        result = []
        for status in self.statuses:
            agent = status['agent']
            check_type = status['check_type']
            res = status['result']

            if res.get('valid', True):
                result.append(f"[{agent}] {check_type}: PASS")
            else:
                result.append(f"[{agent}] {check_type}: FAIL - {res.get('errors', [])}")

        return result


# 全局验证状态实例
_validation_status = ValidationStatus()


def get_validation_status() -> ValidationStatus:
    """获取验证状态实例"""
    return _validation_status


def add_validation(agent: str, check_type: str, result: Dict[str, Any]):
    """添加验证状态"""
    _validation_status.add(agent, check_type, result)


def validate_and_record(agent: str, check_type: str, data: Dict) -> bool:
    """
    验证数据并记录状态

    Args:
        agent: Agent名称
        check_type: 检查类型
        data: 要验证的数据

    Returns:
        是否通过验证
    """
    result = validate_against_spec(check_type, data)
    add_validation(agent, check_type, result)
    return result.get('valid', True)


# ========================================
# 综合使用：Agent核心能力上下文
# ========================================

def get_capability_context(agent_name: str) -> str:
    """
    获取核心能力上下文字符串，用于Agent prompt

    Args:
        agent_name: 当前Agent名称

    Returns:
        包含SPEC、Skill、Validation的上下文字符串
    """
    spec_context = get_spec_context()

    # 获取验证摘要
    validation = get_validation_status()
    summary = validation.get_summary()
    validation_context = f"""
## 验证状态摘要
- 总检查: {summary['total']} 次
- 通过: {summary['passed']} 次
- 失败: {summary['failed']} 次
- 阻塞问题: {'是' if summary['has_blocking'] else '否'}
"""

    if summary['errors']:
        validation_context += f"\n### 错误\n{chr(10).join(f'- {e}' for e in summary['errors'][:5])}"

    if summary['warnings']:
        validation_context += f"\n### 警告\n{chr(10).join(f'- {w}' for w in summary['warnings'][:5])}"

    # 可用技能列表
    skills = SkillRegistry.list_skills()
    skills_context = f"""
## 可用技能
{chr(10).join(f"- {s['name']}: {s['description']}" for s in skills)}
"""

    return f"""
{spec_context}

{validation_context}

{skills_context}

---
以上上下文由核心能力系统提供，Agent在执行任务时应参考以上信息。
"""
