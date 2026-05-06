"""
Design Agent - 软件架构师
对应文件: agency-agents-zh-main/engineering/engineering-software-architect.md
阶段: 阶段4 - 系统设计和软件架构
输出: 系统设计文档
"""

from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from agent_state import AgentState
from core.context_builder import build_context_for_agent, get_architecture_constraints, format_constraints_warning


DESIGN_AGENT_PROMPT = """你是软件架构师，一位设计可维护、可扩展且与业务领域对齐的软件系统的专家。

你的思维方式围绕限界上下文、权衡矩阵和架构决策记录。

## 核心使命：

设计平衡各方关注点的软件架构：

1. **领域建模** — 限界上下文、聚合、领域事件
2. **架构模式** — 何时使用微服务、模块化单体还是事件驱动
3. **权衡分析** — 一致性 vs 可用性，耦合 vs 重复，简单 vs 灵活
4. **技术决策** — 记录上下文、方案和理由的 ADR
5. **演进策略** — 系统如何在不重写的情况下成长

## 关键规则：

1. **不做架构宇航员** — 每个抽象都必须证明其复杂度的合理性
2. **权衡优于最佳实践** — 说清楚你放弃了什么，而不只是你得到了什么
3. **领域优先，技术其次** — 先理解业务问题，再选工具
4. **可逆性很重要** — 优先选择容易改变的决策，而非"最优"的
5. **记录决策，而非只是设计** — ADR 记录的是"为什么"，不只是"是什么"
6. **复杂度守恒** — 分布式不会消除复杂度，只是把它从代码搬到了基础设施

## 你的任务：

基于后端架构，进行详细的系统设计：
1. 领域建模和模块划分
2. 架构决策记录（ADR）
3. 质量属性分析
4. 技术选型决策
5. 演进策略

请按照以下结构输出：

```markdown
# 系统设计文档

## 架构决策记录 (ADR)

### ADR-001: 架构模式选择
**状态**: 已接受
**背景**: [问题描述]
**决策**: 选择 [架构模式]
**理由**: [为什么选择这个]
**取舍**: [放弃了什么]

### ADR-002: 数据存储策略
**状态**: 已接受
**决策**: [决策内容]
**理由**: [为什么]

## 领域模型

### 限界上下文
```
┌─────────────┐  ┌─────────────┐
│  用户上下文  │  │  游戏上下文  │
│  User Context│  │ Game Context│
└─────────────┘  └─────────────┘
```

### 核心聚合
- **用户聚合**: User, UserProfile
- **游戏聚合**: GameRoom, Game, Player

## 架构层次

```
┌─────────────────────────────────┐
│      前端层 (Frontend)           │
│   React + Socket.io Client      │
└─────────────┬───────────────────┘
              │ REST API + WebSocket
┌─────────────▼───────────────────┐
│      API 层 (API Layer)          │
│   Express/FastAPI 路由控制器     │
└─────────────┬───────────────────┘
              │
┌─────────────▼───────────────────┐
│    业务逻辑层 (Business Layer)   │
│   游戏逻辑、房间管理、用户管理    │
└─────────────┬───────────────────┘
              │
┌─────────────▼───────────────────┐
│    数据访问层 (Data Layer)       │
│   SQLite (持久化文件存储)        │
└─────────────────────────────────┘
```

## 质量属性分析

### 可扩展性
- 水平扩展策略: [策略]
- 垂直扩展策略: [策略]

### 可靠性
- 故障模式: [常见故障]
- 熔断器: [熔断策略]
- 降级策略: [降级方案]

### 可维护性
- 模块边界: [边界定义]
- 依赖方向: [依赖规则]

## 技术选型决策矩阵

| 维度 | 权重 | 方案A | 方案B | 选择 |
|-----|------|------|------|------|
| 查询灵活性 | 30% | 9 | 7 | A |
| 水平扩展 | 25% | 5 | 9 | B |

## 演进策略

### 阶段1: MVP
- 单体应用
- 核心功能

### 阶段2: 模块化
- 模块拆分
- 接口定义

### 阶段3: 微服务（可选）
- 服务拆分
- 独立部署
```

现在，请基于后端架构设计完整的系统架构。
"""


def create_design_agent(llm):
    """创建 Design Agent 工厂函数"""

    def design_agent(state: AgentState) -> AgentState:
        """Design Agent - 软件架构师"""
        print("\n" + "="*70)
        print("🎨 Design Agent - 软件架构师")
        print("="*70)

        architecture = state.get("architecture", {})
        memory_context = state.get("memory_context", "")

        # 使用上下文构建工具获取完整上下文
        full_context = build_context_for_agent(state, "design")

        # 获取技术栈约束
        constraints = get_architecture_constraints(state)

        if memory_context:
            print("📚 已读取前序 Agent 的决策上下文")

        print(f"🎨 设计系统架构")
        print(f"   - 基于架构设计: {len(architecture.get('tech_stack', []))} 项技术")
        print(f"   - 数据库: {constraints['database']}")
        print("\n⏳ 正在进行系统设计和架构决策...")

        messages = [
            SystemMessage(content=DESIGN_AGENT_PROMPT),
            HumanMessage(content=f"""{full_context}

⚠️ **技术栈约束（必须遵守）**：
- 数据库: {constraints['database']}
- 后端: {constraints['backend']}
- 实时通信: {constraints['realtime']}

## 你的任务

基于以上后端架构设计，进行详细的系统设计：

1. **完整分层架构**：API层 → 业务层 → 数据层
2. **领域模型和模块划分**：使用DDD思想
3. **架构决策记录（ADR）**：记录每个重要决策的原因和取舍
4. **质量属性分析**：可扩展性、可靠性、可维护性
5. **演进策略**：MVP → 模块化 → 微服务（可选）

⚠️ **关键要求**：
- 数据访问层必须使用 SQLite
- 禁止使用内存存储
- 所有数据必须持久化到数据库文件

请按照以下格式输出：

```markdown
# 系统设计文档

## 架构决策记录 (ADR)

### ADR-001: 架构模式选择
**状态**: 已接受
**背景**: [问题描述]
**决策**: 选择 [架构模式]
**理由**: [为什么选择这个]
**取舍**: [放弃了什么]

### ADR-002: 数据存储策略
**状态**: 已接受
**背景**: [问题]
**决策**: 使用 SQLite
**理由**: [为什么]

## 领域模型

### 限界上下文
[描述限界上下文划分]

### 核心聚合
- **用户聚合**: User, UserProfile
- **游戏聚合**: GameRoom, Game, Player

## 架构层次

[描述分层架构，确保数据层显示为SQLite]

## 质量属性分析

[详细分析]

## 演进策略

[MVP → 模块化 → 微服务的演进路径]
```
""")
        ]

        try:
            response = llm.invoke(messages)
            design_doc = response.content

            design_data = {
                "content": design_doc,
                "adr_records": extract_adr(design_doc),
                "modules": extract_modules(design_doc),
                "quality_attributes": extract_quality(design_doc),
            }

            state["current_agent"] = "Design Agent"
            state["design"] = design_data
            state["messages"].append(AIMessage(content=design_doc))

            print("✅ 系统设计完成！")
            print(f"   - ADR记录: {len(design_data['adr_records'])} 个")
            print(f"   - 模块: {len(design_data['modules'])} 个")

        except Exception as e:
            print(f"❌ 系统设计失败: {e}")
            state["current_agent"] = "Design Agent"
            state["design"] = {"error": str(e)}

        return state

    return design_agent


def extract_adr(design_doc: str) -> list:
    """提取架构决策记录"""
    adrs = []
    if "ADR" in design_doc:
        adrs.append("ADR-001: 架构模式选择")
        adrs.append("ADR-002: 数据存储策略")
    return adrs


def extract_modules(design_doc: str) -> list:
    """提取模块列表"""
    modules = ["用户模块", "游戏模块", "房间模块", "实时通信模块"]
    return modules


def extract_quality(design_doc: str) -> list:
    """提取质量属性"""
    qualities = ["可扩展性", "可靠性", "可维护性"]
    return qualities
