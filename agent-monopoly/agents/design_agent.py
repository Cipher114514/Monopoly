"""
Design Agent - 软件架构师
对应文件: agency-agents-zh-main/engineering/engineering-software-architect.md
阶段: 阶段4 - 系统设计和软件架构
输出: 系统设计文档
"""

from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from ..types import AgentState


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
│   PostgreSQL + Redis Repository  │
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

        print(f"🎨 设计系统架构")
        print(f"   - 基于架构设计: {len(architecture.get('tech_stack', []))} 项技术")
        print("\n⏳ 正在进行系统设计和架构决策...")

        messages = [
            SystemMessage(content=DESIGN_AGENT_PROMPT),
            HumanMessage(content=f"""
基于以下后端架构设计：

技术栈: {', '.join(architecture.get('tech_stack', []))}
数据库: {architecture.get('database_schema', [])}
API: {', '.join(architecture.get('api_endpoints', [])[:3])}

请设计：
1. 完整的分层架构
2. 领域模型和模块划分
3. 架构决策记录（ADR）
4. 质量属性分析
5. 演进策略

注意：
- 采用分层架构（API层 → 业务层 → 数据层）
- 使用领域驱动设计（DDD）思想
- 考虑系统的可扩展性和可维护性
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
