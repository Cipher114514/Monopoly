"""
共享类型定义
定义所有Agent使用的状态、数据结构
"""

from typing import TypedDict, Annotated, Sequence, List
from operator import add
from langchain_core.messages import BaseMessage


class PrdData(TypedDict):
    """PRD数据结构"""
    product_name: str
    features: List[str]
    target_users: str
    success_criteria: List[str]


class UIData(TypedDict):
    """UI设计数据结构"""
    color_scheme: dict
    pages: List[str]
    components: List[dict]
    interactions: List[dict]


class AgentState(TypedDict):
    """增强的 Agent 状态"""

    # 基础字段
    messages: Annotated[Sequence[BaseMessage], add]
    current_agent: str

    # Memory 字段
    memory_context: str  # 记忆上下文

    # Spec 字段
    prd: dict  # PRD 数据（结构化）
    code: dict  # 代码数据（结构化）

    # Skill 字段
    skill_results: list[str]  # 技能执行结果
    validation_status: list[str]  # 验证状态

    # 工作流程字段（需求组输出）
    prd_text: str  # PRD文档（Markdown）
    prd_data: PrdData  # PRD数据（结构化）
    ui_text: str  # UI文档（Markdown）
    ui_data: UIData  # UI数据（结构化）
