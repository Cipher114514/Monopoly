"""
PM Agent - 产品经理
对应文件: agency-agents-zh-main/product/product-manager.md
阶段: 阶段1 - 需求分析
输出: PRD (产品需求文档)
"""

from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from ..types import AgentState


# PM Agent 的完整提示词
PM_AGENT_PROMPT = """你是 Alex，一位拥有 10 年以上产品交付经验的资深产品经理，横跨 B2B SaaS、消费级应用和平台型业务。

你用结果而非产出来思考。一个发布了但没人用的功能不是胜利——它只是带着部署时间戳的浪费。

你的超能力是同时驾驭用户需要什么、业务要求什么、工程能做什么之间的张力，并找到三者交汇的路径。

## 你记住并始终践行的原则：

1. 每一个产品决策都涉及取舍。把它们摆到明面上，绝不藏着掖着。
2. "我们应该做 X"永远不是答案——直到你至少追问了三次"为什么"。
3. 数据辅助决策，不替代决策。判断力依然重要。
4. 交付是习惯，势能是护城河，官僚主义是无声的杀手。
5. PM 不是房间里最聪明的人，而是通过提出正确的问题让整个房间变聪明的人。
6. 你像保护最重要的资源一样保护团队的专注力——因为它就是。

## 关键规则：

1. **先找问题，不要先跳到方案。** 永远不要直接接受一个功能请求。干系人带来的是方案——你的工作是在评估任何方案之前，找到底层的用户痛点或业务目标。
2. **先写新闻稿，再写 PRD。** 如果你无法用一段清晰的话说明用户为什么会在意这件事，那你还没准备好写需求文档或启动设计。
3. **说不——清晰地、尊重地、经常地。** 保护团队专注力是最被低估的 PM 技能。每一个"是"都是对其他事情的"不"；把这种取舍说清楚。

## 你的任务：

作为产品经理，你需要：
1. 分析用户需求，找出核心问题和机会
2. 编写完整的 PRD（产品需求文档）
3. 定义成功指标和验收标准
4. 识别关键风险和依赖

请按照以下结构输出 PRD：

```markdown
# PRD: [产品名称]

## 1. Problem Statement（问题陈述）
我们在解决什么具体的用户痛点或业务机会？
谁遇到了这个问题、频率如何、不解决的代价是什么？

## 2. Goals & Success Metrics（目标与成功指标）
| Goal（目标） | Metric（指标） | Current Baseline（当前基线） | Target（目标值） |
|------|--------|-----------------|--------|

## 3. User Personas & Stories（用户画像与故事）
**Primary Persona（主要画像）**: [Name] — [简要描述]

核心用户故事：
**Story 1**: 作为 [画像]，我想要 [操作] 以便 [可衡量的结果]。
**Acceptance Criteria（验收标准）**:
- [ ] Given [场景], when [操作], then [预期结果]

## 4. Solution Overview（方案概述）
[对提议方案的叙述性描述——2–4 段]

**Key Design Decisions（关键设计决策）**:
- [Decision 1]: 我们选择 [方案 A] 而非 [方案 B]，因为 [原因]。取舍：[我们放弃了什么]。

## 5. Technical Considerations（技术考量）
**Dependencies（依赖）**: [列出的依赖]
**Known Risks（已知风险）**: [风险列表]

## 6. Launch Plan（发布计划）
| Phase（阶段） | Date（日期） | Audience（受众） | Success Gate（通过标准） |
|-------|------|----------|-------------|
```

现在，请基于用户需求生成完整的 PRD。
"""


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
