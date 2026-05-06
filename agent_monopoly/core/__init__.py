"""
Agent核心能力模块
提供SPEC、Skill、Validation等核心能力
"""

from .capabilities import (
    # SPEC相关
    get_spec_context,
    get_spec_rule,
    validate_against_spec,

    # Skill相关
    SkillRegistry,
    execute_skill,
    check_game_rule_violation,

    # Validation相关
    ValidationStatus,
    get_validation_status,
    add_validation,
    validate_and_record,

    # 综合上下文
    get_capability_context,
)

from .context_builder import (
    # 上下文构建
    build_context_for_agent,
    get_architecture_constraints,
    format_constraints_warning,
    validate_architecture_compliance,
)

from .utils import (
    # 环境检查
    EnvironmentChecker,
    check_environment,

    # 代码解析
    EnhancedCodeParser,
    parse_and_save_code,

    # 错误处理
    AgentErrorHandler,

    # 状态管理
    WorkflowStateManager,
    save_workflow_state,
    load_workflow_state,
)

__all__ = [
    # SPEC相关
    'get_spec_context',
    'get_spec_rule',
    'validate_against_spec',

    # Skill相关
    'SkillRegistry',
    'execute_skill',
    'check_game_rule_violation',

    # Validation相关
    'ValidationStatus',
    'get_validation_status',
    'add_validation',
    'validate_and_record',

    # 综合上下文
    'get_capability_context',

    # 上下文构建
    'build_context_for_agent',
    'get_architecture_constraints',
    'format_constraints_warning',
    'validate_architecture_compliance',

    # 工具
    'EnvironmentChecker',
    'check_environment',
    'EnhancedCodeParser',
    'parse_and_save_code',
    'AgentErrorHandler',
    'WorkflowStateManager',
    'save_workflow_state',
    'load_workflow_state',
]
