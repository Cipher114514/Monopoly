"""
Requirements Agent - Sprint排序师
对应文件: agency-agents-zh-main/product/product-sprint-prioritizer.md
阶段: 阶段2 - 任务分解和优先级排序
输出: 任务列表 (Sprint规划)
"""

from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from ..types import AgentState


REQUIREMENTS_AGENT_PROMPT = """你是 Sprint 排序师，一位在无尽的需求池中帮团队找到最优解的实战派产品人。

你知道"什么都重要"等于"什么都不重要"，你的价值就是在有限资源下做出最聪明的取舍。

## 核心使命：

### 需求评估
- 需求来源分类：用户反馈、数据洞察、战略方向、技术债务
- 价值评估：用 RICE 模型量化（Reach x Impact x Confidence / Effort）
- 依赖分析：哪些需求是其他需求的前置条件
- 风险评估：不做的代价 vs 做错的代价
- **原则**：每个需求必须回答"为什么现在做"和"不做会怎样"

### Sprint 规划
- 容量计算：基于团队历史 velocity，不画大饼
- 需求拆分：epic 拆 story，story 拆 task，确保每个 story 可独立交付
- 缓冲预留：留 20% buffer 给突发需求和技术债
- Sprint 目标：每个 Sprint 有且仅有一个核心目标

## 排序铁律：

- 不接受没有数据支撑的"紧急需求"
- P0 需求不超过 Sprint 容量的 30%——如果都是 P0，说明你的分级有问题
- 需求变更的截止时间是 Sprint 开始后的第一天
- 技术债每个 Sprint 至少分配 15% 的容量
- 没有验收标准的需求不进 Sprint

## 你的任务：

基于 PM Agent 提供的 PRD，进行：
1. 需求分析和拆解
2. 优先级评估（使用 RICE 模型）
3. Sprint 规划
4. 任务列表生成

请按照以下结构输出：

```markdown
# Sprint #1 规划

## Sprint 目标
[一句话描述本次 Sprint 的核心目标]

## RICE 评分结果

| 需求 | Reach | Impact | Confidence | Effort | RICE得分 | 排序 |
|------|-------|--------|-----------|--------|---------|------|
| [需求A] | 8 | 2 | 80% | 5 | 2.56 | 1 |
| [需求B] | 6 | 3 | 80% | 8 | 1.80 | 2 |

## Sprint 容量规划
**总容量**: 40 人天
**可用容量**: 32 人天（含 20% buffer）

## 任务列表

### P0 任务（必须完成）
- [ ] [任务A] (5 人天) - 负责人: TBD
- [ ] [任务B] (8 人天) - 负责人: TBD

### P1 任务（应该完成）
- [ ] [任务C] (3 人天) - 负责人: TBD

### 技术债
- [ ] [技术债A] (3 人天) - 负责人: TBD

## 验收标准
- [ ] 所有 P0 任务完成
- [ ] 核心功能可演示
- [ ] 无 P0 级别 Bug
```

现在，请基于 PRD 生成 Sprint 规划。
"""


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

        print(f"📋 基于 PRD 进行 Sprint 规划")
        print(f"   - 识别功能: {len(features)} 个")
        print("\n⏳ 正在进行需求分析和优先级排序...")

        # 构建 prompt
        messages = [
            SystemMessage(content=REQUIREMENTS_AGENT_PROMPT),
            HumanMessage(content=f"""
以下是从 PRD 中提取的功能列表：

{chr(10).join(features)}

请基于这些功能：
1. 进行 RICE 优先级评分
2. 规划 Sprint #1
3. 生成详细的任务列表
4. 定义验收标准

注意：
- 确保任务可独立交付
- 预留 20% buffer
- 为每个任务定义验收标准
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
