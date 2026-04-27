# Agent Team - 模块化多Agent协作系统

## 📁 目录结构

```
agent_team/
├── __init__.py              # 包初始化
├── types.py                 # 共享类型定义
├── config.py                # LLM 配置
├── workflow.py              # 流程统领（主文件）
│
├── memory/                  # 记忆系统
│   ├── __init__.py
│   └── memory_system.py     # SimpleMemory 实现
│
├── specs/                   # 规范验证
│   ├── __init__.py
│   └── validators.py        # PRDSpec, CodeSpec, SpecValidator
│
├── skills/                  # 技能工具
│   ├── __init__.py
│   └── tools.py             # 工具定义 + SkillSet
│
└── agents/                  # Agent 实现
    ├── __init__.py
    ├── pm_agent.py          # PM Agent
    └── developer_agent.py   # Developer Agent
```

## 🚀 快速开始

### 运行演示

```bash
# 在项目根目录
cd agent-demo-langgraph
python run_modular_demo.py
```

### 在代码中使用

```python
from agent_team.workflow import create_workflow

# 创建工作流
workflow = create_workflow()

# 运行
result = workflow.run("我想开发一个待办事项应用")
```

## 🏗️ 架构设计

### 1. 模块分离

```
用户请求
    ↓
workflow.py (统领)
    ↓
├── agents/ (执行逻辑)
│   ├── pm_agent.py
│   └── developer_agent.py
│
├── memory/ (状态管理)
│   └── memory_system.py
│
├── specs/ (质量保障)
│   └── validators.py
│
└── skills/ (工具调用)
    └── tools.py
```

### 2. 数据流

```
AgentState (状态)
    ↓
Agent 处理
    ↓
Memory ← 记住关键信息
Spec ← 验证输出
Skill ← 调用工具
    ↓
更新 AgentState
    ↓
传给下一个 Agent
```

## 📝 组件说明

### types.py - 类型定义

定义 `AgentState`，包含：
- `messages`: 消息历史
- `prd`: PRD数据
- `code`: 代码数据
- `memory_context`: 记忆上下文
- `skill_results`: 技能执行结果

### config.py - 配置

- 加载环境变量
- 初始化 LLM
- 提供 `get_llm_singleton()`

### memory/ - 记忆系统

**SimpleMemory** 提供：
- `add_short_term()`: 添加短期记忆
- `add_long_term()`: 添加长期记忆
- `summarize_context()`: 总结上下文

### specs/ - 规范验证

**PRDSpec**: PRD 输出规范
**CodeSpec**: 代码输出规范
**SpecValidator**: 验证器

### skills/ - 技能工具

**工具**：
- `write_file`: 写文件
- `read_file`: 读文件
- `count_lines`: 统计行数

**SkillSet**: 工具集合管理

### agents/ - Agent 实现

每个Agent文件：
- 定义Agent函数
- 使用 Memory 记住信息
- 使用 Spec 验证输出
- 使用 Skill 调用工具

### workflow.py - 流程统领

- 初始化所有组件
- 定义 Agent 流程图
- 提供运行接口

## 🔧 如何扩展

### 添加新 Agent

1. 在 `agents/` 目录创建文件：
```python
# agents/qa_agent.py
def create_qa_agent(memory, skills):
    def qa_agent(state):
        # 实现逻辑
        return state
    return qa_agent
```

2. 在 `workflow.py` 中注册：
```python
from .agents import create_qa_agent

self.qa_agent = create_qa_agent(self.memory, self.skills)
workflow.add_node("qa", self.qa_agent)
```

### 添加新技能

在 `skills/tools.py` 中添加：
```python
@tool
def my_new_tool(param: str) -> str:
    """工具描述"""
    return f"结果: {param}"
```

### 添加新规范

在 `specs/validators.py` 中添加：
```python
class MySpec(BaseModel):
    field: str = Field(description="字段描述")

    def validate(self) -> bool:
        # 验证逻辑
        return True
```

## ✨ 优势对比

| 特性 | 单文件版本 | 模块化版本 |
|-----|-----------|-----------|
| **可读性** | 所有代码混在一起 | 职责清晰分离 |
| **可维护性** | 修改困难 | 模块独立维护 |
| **可复用性** | 无法复用 | 组件可复用 |
| **可测试性** | 难以单独测试 | 每个模块可测试 |
| **可扩展性** | 添加功能困难 | 轻松扩展 |

## 🎯 设计原则

1. **单一职责** - 每个模块只做一件事
2. **依赖注入** - Agent 通过参数接收 memory 和 skills
3. **共享类型** - 所有 Agent 使用同一个 AgentState
4. **工厂模式** - 使用 `create_*` 函数创建 Agent
5. **统一接口** - 所有 Agent 接收相同的 state 参数

## 📚 学习路径

1. **先看 workflow.py** - 了解整体流程
2. **再看 types.py** - 理解数据结构
3. **然后看 agents/** - 学习 Agent 实现
4. **最后看 memory/specs/skills** - 理解支撑能力

## 🔍 调试技巧

### 查看日志

每个Agent会打印执行过程：
```
🤖 PM Agent 正在工作...
📚 记忆上下文：...
✅ PRD 生成成功
```

### 查看状态

在 workflow.run() 后查看 result：
```python
result = workflow.run(user_request)
print(result["prd"])      # PRD 内容
print(result["code"])     # 代码内容
print(result["memory_context"])  # 记忆上下文
```

### 单独测试模块

```python
# 测试 Memory
from agent_team.memory import SimpleMemory
memory = SimpleMemory()
memory.add_long_term("key", "value")
print(memory.get_long_term("key"))

# 测试 Spec
from agent_team.specs import PRDSpec
prd = PRDSpec(product_name="测试", features=[...])
print(prd.to_markdown())

# 测试 Skill
from agent_team.skills import SkillSet
skills = SkillSet()
result = skills.execute("write_file", filename="test.txt", content="hello")
print(result)
```

## 🎉 总结

这个模块化架构：
- ✅ 清晰的职责分离
- ✅ 易于维护和扩展
- ✅ 可复用的组件
- ✅ 便于测试和调试

适合构建复杂的 Agent 协作系统！
