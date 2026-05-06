"""
Requirements Agent - Sprint排序师
对应文件: agency-agents-zh-main/product/product-sprint-prioritizer.md
阶段: 阶段2 - 任务分解和优先级排序
输出: 任务列表 (Sprint规划)
"""

from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from agent_state import AgentState
from pathlib import Path
from core.context_builder import build_context_for_agent


def _load_requirements_prompt():
    prompt_path = Path(__file__).resolve().parents[1] / "prompts" / "requirements_prompt.md"
    try:
        with open(prompt_path, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception:
        return "你是 Sprint 排序师，请基于 PRD 输出 Sprint 规划（含 RICE 表、任务列表、验收标准）。"


REQUIREMENTS_AGENT_PROMPT = _load_requirements_prompt()


def create_requirements_agent(llm):
    """
    创建 Requirements Agent 工厂函数

    Args:
        llm: 语言模型实例

    Returns:
        requirements_agent: Requirements Agent 函数
    """

    def requirements_agent(state: AgentState) -> AgentState:
        """
        Requirements Agent - Sprint排序师
        分解需求，规划 Sprint

        Args:
            state: 当前状态

        Returns:
            更新后的状态
        """
        print("\n" + "="*70)
        print("📊 Requirements Agent - Sprint排序师")
        print("="*70)

        # 获取 PRD
        prd = state.get("prd", {})
        prd_content = prd.get("content", "")
        features = prd.get("features", [])

        # 使用上下文构建工具获取完整上下文
        full_context = build_context_for_agent(state, "requirements")

        print(f"📋 基于 PRD 进行 Sprint 规划")
        print(f"   - 识别功能: {len(features)} 个")
        print("\n⏳ 正在进行需求分析和优先级排序...")

        # 构建 prompt - 包含完整PRD内容
        messages = [
            SystemMessage(content=REQUIREMENTS_AGENT_PROMPT),
            HumanMessage(content=f"""{full_context}

## PRD完整内容

{prd_content}

## 任务

基于以上PRD完整内容：
1. 进行 RICE 优先级评分
2. 规划 Sprint #1
3. 生成详细的任务列表
4. 定义验收标准

注意：
- 确保任务可独立交付
- 预留 20% buffer
- 为每个任务定义验收标准
- 输出JSON格式的任务列表
""")
        ]

        # 调用 LLM
        try:
            response = llm.invoke(messages)
            sprint_plan = response.content

            # 提取任务列表
            tasks = extract_tasks(sprint_plan)

            # 更新状态
            state["current_agent"] = "Requirements Agent"
            state["tasks"] = tasks
            state["messages"].append(AIMessage(content=sprint_plan))

            print("✅ Sprint 规划完成！")
            print(f"   - 规划任务: {len(tasks)} 个")
            print(f"   - P0 任务: {sum(1 for t in tasks if t.get('priority') == 'P0')} 个")
            print(f"   - P1 任务: {sum(1 for t in tasks if t.get('priority') == 'P1')} 个")

        except Exception as e:
            print(f"❌ Sprint 规划失败: {e}")
            state["current_agent"] = "Requirements Agent"
            state["tasks"] = [{"error": str(e)}]

        return state

    return requirements_agent


def extract_tasks(sprint_plan: str) -> list:
    """从 Sprint 规划中提取任务列表"""
    tasks = []
    lines = sprint_plan.split('\n')

    current_priority = "P1"
    for line in lines:
        line = line.strip()
        if line.startswith("- [ ]"):
            # 提取任务信息
            task_name = line[4:].strip()
            # 判断优先级
            if "P0" in line or "必须" in line:
                current_priority = "P0"
            elif "P1" in line or "应该" in line:
                current_priority = "P1"
            elif "技术债" in line:
                current_priority = "Tech"

            tasks.append({
                "name": task_name,
                "priority": current_priority,
                "status": "pending",
                "assignee": "TBD"
            })

    return tasks[:10] if tasks else [
        {"name": "用户注册与登录", "priority": "P0", "status": "pending"},
        {"name": "创建游戏房间", "priority": "P0", "status": "pending"},
        {"name": "游戏核心逻辑", "priority": "P1", "status": "pending"},
    ]
