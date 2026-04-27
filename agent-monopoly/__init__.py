"""
Agent Monopoly - 9阶段瀑布流智能体工作流

这是一个基于LangChain/LangGraph的多智能体协作系统，用于完整的软件项目开发。

工作流程包括9个阶段：
1. PM Agent (产品经理) - 需求分析和PRD生成
2. Requirements Agent (Sprint排序师) - 任务分解和优先级排序
3. Architecture Agent (后端架构师) - 后端架构设计
4. Design Agent (软件架构师) - 系统设计和软件架构
5. Coding Agent (高级开发者) - 代码实现
6. Code Review Agent (代码审查员) - 代码审查
7. Testing Agent (证据收集者) - 测试执行与证据收集
8. QA Agent (现实检验者) - 质量保证与集成测试
9. Documentation Agent (技术文档工程师) - 技术文档编写

使用示例:
    ```python
    from langchain_openai import ChatOpenAI
    from agent_monopoly import create_workflow

    # 初始化LLM
    llm = ChatOpenAI(
        model="gpt-4",
        temperature=0.7,
        api_key="your-api-key"
    )

    # 创建工作流
    workflow = create_workflow(llm)

    # 运行完整工作流
    result = workflow.run(
        project_name="在线大富翁游戏",
        user_requirement="开发一个基于Web的多人在线大富翁游戏，支持实时对战、房间管理和丰富的游戏功能。"
    )

    # 访问各阶段输出
    print(result["prd"])           # PRD文档
    print(result["tasks"])         # 任务列表
    print(result["architecture"])  # 架构设计
    print(result["design"])        # 系统设计
    print(result["code"])          # 生成的代码
    print(result["review"])        # 代码审查报告
    print(result["test_results"])  # 测试报告
    print(result["qa_report"])     # QA评估报告
    print(result["documentation"]) # 技术文档
    ```

运行单个阶段:
    ```python
    # 只运行特定阶段
    workflow = create_workflow(llm)

    # 准备初始状态
    state = {
        "project_name": "我的项目",
        "user_requirement": "项目需求...",
        # ... 其他必要字段
    }

    # 运行阶段3 (架构设计)
    state = workflow.run_stage(3, state)
    print(state["architecture"])
    ```
"""

from .types import AgentState
from .workflow import AgentWorkflow, create_workflow, WORKFLOW_DIAGRAM

__version__ = "1.0.0"
__author__ = "Agent Monopoly Team"

__all__ = [
    "AgentState",
    "AgentWorkflow",
    "create_workflow",
    "WORKFLOW_DIAGRAM",
]
