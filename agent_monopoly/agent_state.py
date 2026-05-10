"""
Agent 类型定义
定义所有 Agent 使用的状态和数据结构

状态结构说明:
- 大块内容（PRD、架构、设计等）保存为独立文件在 workspace/ 目录
- State 中只保存文件路径引用和元数据
- 通过 file_manager 读写文件内容
"""

from typing import TypedDict, Annotated, Sequence
from operator import add
from langchain_core.messages import BaseMessage


class ArtifactRef(TypedDict):
    """文件引用类型"""
    file_path: str           # 文件相对路径 (如 "prd.md")
    artifact_type: str       # 文件类型 (如 "prd", "architecture")
    updated_at: str          # 更新时间
    size: int                # 内容大小（可选）
    items_count: int         # 项目数量（可选，如功能数量、任务数量）


class AgentState(TypedDict):
    """
    Agent 团队状态 - 9阶段瀑布流程

    状态存储策略:
    - 所有Agent的大块输出保存为 workspace/ 下的独立文件
    - State 中只保存文件引用 (ArtifactRef) 和必要的元数据
    - 后续Agent需要时通过 file_manager 读取文件内容
    """

    # ===== 基础字段 =====
    messages: Annotated[Sequence[BaseMessage], add]  # 所有消息历史
    current_agent: str  # 当前执行的 Agent 名称
    iteration_count: int  # 迭代次数

    # ===== 阶段1: PM Agent =====
    # PRD 保存为 workspace/prd.md
    prd: ArtifactRef  # PRD文件引用

    # ===== 阶段2: Requirements Agent =====
    # 任务列表保存为 workspace/tasks.md
    tasks: ArtifactRef  # 任务文件引用

    # ===== 阶段3: Architecture Agent =====
    # 架构文档保存为 workspace/architecture.md
    architecture: ArtifactRef  # 架构文件引用

    # ===== 阶段4: Design Agent =====
    # 设计文档保存为 workspace/design.md
    design: ArtifactRef  # 设计文件引用

    # ===== 阶段5: Coding Agent =====
    # 代码保存为 workspace/backend/ 和 workspace/frontend/
    code: dict  # 代码文件信息 {backend_files: [...], frontend_files: [...]}

    # ===== 阶段6: Code Review Agent =====
    # 审查报告保存为 workspace/review.md
    review: ArtifactRef  # 审查文件引用

    # ===== 阶段7: Testing Agent =====
    # 测试报告保存为 workspace/tests/report.md
    test_results: ArtifactRef  # 测试文件引用

    # ===== 阶段8: QA Agent =====
    # QA报告保存为 workspace/qa_report.md
    qa_report: ArtifactRef  # QA文件引用

    # ===== 阶段9: Documentation Agent =====
    # 文档保存为 workspace/docs/
    documentation: dict  # 文档信息 {documents: [...], word_count: int}

    # ===== 辅助字段 =====
    memory_context: str  # 记忆上下文
    skill_results: list[str]  # 技能执行结果
    validation_status: list[str]  # 验证状态

    # ===== 项目元数据 =====
    project_name: str  # 项目名称
    user_requirement: str  # 用户原始需求
