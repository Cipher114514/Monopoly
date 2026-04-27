"""
共享类型定义
定义所有Agent使用的状态、数据结构
"""

from typing import TypedDict, Annotated, Sequence
from operator import add
from langchain_core.messages import BaseMessage


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
