"""
Requirements Agent - Sprint排序师
阶段: 阶段2 - 任务分解和优先级排序
输出: 任务列表保存为 workspace/tasks.md
"""

from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
import sys
from pathlib import Path

# 添加 core 目录到路径
sys.path.insert(0, str(Path(__file__).parent.parent))
from core.file_manager import WorkspaceManager, create_file_reference, load_content_from_reference
from core.context_builder import build_context_for_agent
from agent_state import AgentState


def _load_requirements_prompt():
    prompt_path = Path(__file__).resolve().parents[1] / "prompts" / "requirements_prompt.md"
    try:
        with open(prompt_path, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception:
        return """你是 Sprint 排序师，请基于 PRD 进行任务分解和优先级排序。

注意：这是课程作业项目，任务规划要实际可行，考虑Agent自动生成的特点。"""


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
        分解需求，规划 Sprint，保存为文件

        Args:
            state: 当前状态（包含PM Agent输出的prd引用）

        Returns:
            更新后的状态（tasks字段包含文件引用）
        """
        print("\n" + "="*70)
        print("📊 Requirements Agent - Sprint排序师")
        print("="*70)

        # 使用 context_builder 获取前序上下文
        context = build_context_for_agent(state, "requirements")
        project_name = state.get("project_name", "未命名项目")
        prd_ref = state.get("prd", {})

        # 从文件加载PRD内容（作为备份）
        workspace = WorkspaceManager()
        prd_content = workspace.read_markdown("prd")

        if not prd_content:
            print("❌ 未找到PRD文件，请先运行 PM Agent")
            state["current_agent"] = "Requirements Agent"
            state["tasks"] = {
                "file_path": "",
                "artifact_type": "tasks",
                "updated_at": "",
                "error": "PRD文件不存在"
            }
            return state

        print(f"📋 基于 PRD 进行 Sprint 规划")
        print(f"   - 项目: {project_name}")
        print(f"   - PRD大小: {len(prd_content)} 字符")
        print("\n⏳ 正在进行需求分析和优先级排序...")

        # 构建 prompt - 使用 context_builder 提供的上下文
        messages = [
            SystemMessage(content=REQUIREMENTS_AGENT_PROMPT),
            HumanMessage(content=f"""{context}

## 任务

基于以上PRD：
1. 进行功能分解，生成任务列表
2. 按优先级排序（P0=必须实现, P1=重要, P2=可选）
3. 规划合理的开发顺序（考虑依赖关系）
4. 定义每个任务的验收标准

要求：
- 任务要具体可执行
- 考虑课程作业的时间限制
- 优先实现核心玩法
- 输出为标准Markdown格式
""")
        ]

        # 调用 LLM
        try:
            response = llm.invoke(messages)
            tasks_content = response.content

            # 保存到文件
            file_path = workspace.write_markdown("tasks", tasks_content)

            # 提取任务元数据
            p0_count = tasks_content.count("P0") + tasks_content.count("必须")
            p1_count = tasks_content.count("P1") + tasks_content.count("重要")
            p2_count = tasks_content.count("P2") + tasks_content.count("可选")
            total_tasks = p0_count + p1_count + p2_count
            if total_tasks == 0:
                total_tasks = tasks_content.count("- [")  # 粗略估计

            # 创建文件引用
            tasks_ref = create_file_reference(
                artifact_type="tasks",
                filename=file_path,
                metadata={
                    "project_name": project_name,
                    "size": len(tasks_content),
                    "items_count": total_tasks,
                    "p0_count": p0_count,
                    "p1_count": p1_count,
                }
            )

            # 更新状态
            state["current_agent"] = "Requirements Agent"
            state["tasks"] = tasks_ref
            state["messages"].append(AIMessage(content=f"任务列表已保存到 {file_path}"))

            print("✅ Sprint 规划完成！")
            print(f"   - 文件路径: workspace/{file_path}")
            print(f"   - 内容大小: {len(tasks_content)} 字符")
            print(f"   - P0 任务: {p0_count} 个")
            print(f"   - P1 任务: {p1_count} 个")
            print(f"   - 总任务数: {total_tasks} 个")

        except Exception as e:
            print(f"❌ Sprint 规划失败: {e}")
            state["current_agent"] = "Requirements Agent"
            state["tasks"] = {
                "file_path": "",
                "artifact_type": "tasks",
                "updated_at": "",
                "error": str(e)
            }

        return state

    return requirements_agent


# 辅助函数：从文件引用加载任务内容（供后续Agent使用）
def load_tasks_content(state: AgentState) -> str:
    """
    从State中的文件引用加载任务列表内容

    Args:
        state: 当前状态

    Returns:
        任务内容字符串，如果读取失败返回空字符串
    """
    workspace = WorkspaceManager()
    content = workspace.read_markdown("tasks")
    return content if content else ""
