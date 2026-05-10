"""
PM Agent - 产品经理
阶段: 阶段1 - 需求分析
输出: PRD (产品需求文档) 保存为 workspace/prd.md
"""

from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
import sys
from pathlib import Path

# 添加 core 目录到路径
sys.path.insert(0, str(Path(__file__).parent.parent))
from core.file_manager import WorkspaceManager, create_file_reference
from core.context_builder import build_context_for_agent
from agent_state import AgentState


# 尝试从 prompts/pm_prompt.md 加载提示词，若失败则回退到内嵌字符串
def _load_pm_prompt():
    prompt_path = Path(__file__).resolve().parents[1] / "prompts" / "pm_prompt.md"
    try:
        with open(prompt_path, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception:
        # 回退到内嵌简短提示
        return """你是产品经理，请基于需求生成完整的 PRD。注意：这是课程作业项目，只需规划核心功能，避免过度设计。"""


PM_AGENT_PROMPT = _load_pm_prompt()


def create_pm_agent(llm):
    """
    创建 PM Agent 工厂函数

    Args:
        llm: 语言模型实例

    Returns:
        pm_agent: PM Agent 函数
    """

    def pm_agent(state: AgentState) -> AgentState:
        """
        PM Agent - 产品经理
        分析需求，生成 PRD 并保存为文件

        Args:
            state: 当前状态

        Returns:
            更新后的状态（prd字段包含文件引用）
        """
        print("\n" + "="*70)
        print("🎯 PM Agent - 产品经理")
        print("="*70)

        # 获取用户需求
        user_requirement = state.get("user_requirement", "")
        project_name = state.get("project_name", "未命名项目")

        print(f"📋 项目: {project_name}")
        print(f"📝 需求: {user_requirement[:100]}...")
        print("\n⏳ 正在分析需求并生成 PRD...")

        # 构建 prompt
        messages = [
            SystemMessage(content=PM_AGENT_PROMPT),
            HumanMessage(content=f"""
项目名称: {project_name}

用户需求:
{user_requirement}

请基于以上需求，按照课程作业项目的实际情况，生成完整的产品需求文档（PRD）。

要求：
1. 只规划能在短期作业时间内完成的核心功能
2. 明确区分P0（必须实现）和P1（可选）功能
3. 说明哪些功能本作业不实现
4. 考虑代码由Agent自动生成的实际能力
5. 输出为标准Markdown格式
""")
        ]

        # 调用 LLM
        try:
            response = llm.invoke(messages)
            prd_content = response.content

            # 使用 WorkspaceManager 保存 PRD 到文件
            workspace = WorkspaceManager()
            file_path = workspace.write_markdown("prd", prd_content)

            # 提取元数据
            features_count = prd_content.count("| F0") + prd_content.count("| F1") + prd_content.count("| F2")
            if features_count == 0:
                # 尝试其他计数方式
                features_count = prd_content.count("功能") // 5  # 粗略估计

            # 创建文件引用（存入State）
            prd_ref = create_file_reference(
                artifact_type="prd",
                filename=file_path,
                metadata={
                    "project_name": project_name,
                    "size": len(prd_content),
                    "items_count": features_count,
                }
            )

            # 更新状态 - 只存文件引用，不存完整内容
            state["current_agent"] = "PM Agent"
            state["prd"] = prd_ref
            state["messages"].append(AIMessage(content=f"PRD已生成并保存到 {file_path}"))

            print("✅ PRD 生成完成！")
            print(f"   - 文件路径: workspace/{file_path}")
            print(f"   - 内容大小: {len(prd_content)} 字符")
            print(f"   - 功能数量: {features_count}")

        except Exception as e:
            print(f"❌ PRD 生成失败: {e}")
            state["current_agent"] = "PM Agent"
            state["prd"] = {
                "file_path": "",
                "artifact_type": "prd",
                "updated_at": "",
                "error": str(e)
            }

        return state

    return pm_agent


# 辅助函数：从文件引用加载PRD内容（供后续Agent使用）
def load_prd_content(state: AgentState) -> str:
    """
    从State中的文件引用加载PRD内容

    Args:
        state: 当前状态

    Returns:
        PRD内容字符串，如果读取失败返回空字符串
    """
    prd_ref = state.get("prd", {})
    if not prd_ref or "file_path" not in prd_ref:
        return ""

    workspace = WorkspaceManager()
    content = workspace.read_markdown("prd")
    return content if content else ""
