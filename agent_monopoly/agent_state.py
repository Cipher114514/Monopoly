"""
Agent 类型定义
定义所有 Agent 使用的状态和数据结构
"""

from typing import TypedDict, Annotated, Sequence
from operator import add
from langchain_core.messages import BaseMessage


class AgentState(TypedDict):
    """
    Agent 团队状态 - 9阶段瀑布流程

    严格对应 9 个阶段的智能体，每个阶段产出对应的结果
    """

    # ===== 基础字段 =====
    messages: Annotated[Sequence[BaseMessage], add]  # 所有消息历史
    current_agent: str  # 当前执行的 Agent 名称
    iteration_count: int  # 迭代次数

    # ===== 阶段1: PM Agent =====
    prd: dict  # 产品需求文档 (PRD)

    # ===== 阶段2: Requirements Agent =====
    tasks: list  # 任务列表 (Sprint规划)

    # ===== 阶段3: Architecture Agent =====
    architecture: dict  # 后端架构设计

    # ===== 阶段4: Design Agent =====
    design: dict  # 系统设计/软件架构

    # ===== 阶段5: Coding Agent =====
    code: dict  # 前后端代码

    # ===== 阶段6: Code Review Agent =====
    review: dict  # 代码审查报告

    # ===== 阶段7: Testing Agent =====
    test_results: dict  # 测试结果和证据

    # ===== 阶段8: QA Agent =====
    qa_report: dict  # 质量评估报告

    # ===== 阶段9: Documentation Agent =====
    documentation: dict  # 技术文档

    # ===== 辅助字段 =====
    memory_context: str  # 记忆上下文
    skill_results: list[str]  # 技能执行结果
    validation_status: list[str]  # 验证状态

    # ===== 项目元数据 =====
    project_name: str  # 项目名称
    user_requirement: str  # 用户原始需求
