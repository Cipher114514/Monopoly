"""
PM Agent - 产品经理
对应文件: agency-agents-zh-main/product/product-manager.md
阶段: 阶段1 - 需求分析
输出: PRD (产品需求文档)
"""

from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from agent_state import AgentState
from pathlib import Path


# 尝试从 prompts/pm_prompt.md 加载提示词，若失败则回退到内嵌字符串
def _load_pm_prompt():
    prompt_path = Path(__file__).resolve().parents[1] / "prompts" / "pm_prompt.md"
    try:
        with open(prompt_path, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception:
        # 回退到内嵌简短提示
        return """你是产品经理，请基于需求生成完整的 PRD。保证包含问题陈述、目标与指标、用户故事、方案与技术考量。"""


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
        分析需求，生成 PRD

        Args:
            state: 当前状态

        Returns:
            更新后的状态
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

请基于以上需求，生成完整的 PRD 文档。注意：
1. 深入分析用户痛点
2. 定义清晰的成功指标
3. 提供详细的用户故事和验收标准
4. 识别技术依赖和风险
""")
        ]

        # 调用 LLM
        try:
            response = llm.invoke(messages)
            prd_content = response.content

            # 提取 PRD 的关键信息
            prd_data = {
                "project_name": project_name,
                "content": prd_content,
                "features": extract_features(prd_content),
                "success_metrics": extract_metrics(prd_content),
                "user_stories": extract_user_stories(prd_content),
                "risks": extract_risks(prd_content),
            }

            # 更新状态
            state["current_agent"] = "PM Agent"
            state["prd"] = prd_data
            state["messages"].append(AIMessage(content=prd_content))

            print("✅ PRD 生成完成！")
            print(f"   - 识别功能: {len(prd_data['features'])} 个")
            print(f"   - 成功指标: {len(prd_data['success_metrics'])} 个")
            print(f"   - 用户故事: {len(prd_data['user_stories'])} 个")

        except Exception as e:
            print(f"❌ PRD 生成失败: {e}")
            state["current_agent"] = "PM Agent"
            state["prd"] = {"error": str(e)}

        return state

    return pm_agent


# 辅助函数：提取 PRD 中的关键信息
def extract_features(prd_content: str) -> list:
    """从 PRD 中提取功能列表"""
    # 简化实现：查找包含 "功能" 或 "Feature" 的行
    features = []
    lines = prd_content.split('\n')
    for line in lines:
        if '功能' in line or 'feature' in line.lower():
            features.append(line.strip())
    return features[:10] if features else ["核心功能未明确定义"]


def extract_metrics(prd_content: str) -> list:
    """从 PRD 中提取成功指标"""
    metrics = []
    lines = prd_content.split('\n')
    for line in lines:
        if 'metric' in line.lower() or '指标' in line or '%' in line:
            metrics.append(line.strip())
    return metrics[:5] if metrics else ["未定义具体指标"]


def extract_user_stories(prd_content: str) -> list:
    """从 PRD 中提取用户故事"""
    stories = []
    lines = prd_content.split('\n')
    for line in lines:
        if 'story' in line.lower() or '用户故事' in line or '作为' in line:
            stories.append(line.strip())
    return stories[:5] if stories else ["未定义用户故事"]


def extract_risks(prd_content: str) -> list:
    """从 PRD 中提取风险"""
    risks = []
    lines = prd_content.split('\n')
    for line in lines:
        if 'risk' in line.lower() or '风险' in line:
            risks.append(line.strip())
    return risks[:5] if risks else ["未识别风险"]
