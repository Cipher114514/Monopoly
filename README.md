# 在线大富翁 Agent 团队开发项目

## 📋 项目简介

本项目使用 **LangGraph 框架** 构建一个多Agent协作系统，实现在线大富翁游戏的自动化开发。通过9个专业Agent的协作，模拟真实的软件开发生命周期（需求→设计→编码→测试→交付）。

### 核心特点

- ✅ **零人工编码**：所有代码由Agent生成
- ✅ **瀑布模型**：严格遵循软件开发流程
- ✅ **质量保障**：多层次质量检查和人工验收关卡
- ✅ **模块化架构**：清晰的职责分离，易于扩展
- ✅ **三大能力**：Memory（记忆）、Spec（规范）、Skill（技能）

---

## 📁 项目目录结构

```
agent-demo-langgraph/
│
├── 📄 README.md                    # 本文件（项目总览）
├── 📄 START.md                     # 快速开始指南
├── 📄 ARCHITECTURE.md              # 架构设计详解
├── 📄 ADVANCED_CAPABILITIES.md    # 高级能力说明
├── 📄 WORKFLOW.md                   # Agent流程图
├── 📄 TEAM_ALLOCATION.md           # 团队分工方案（10人）
│
├── 🔧 .env.example                  # 环境变量配置模板
├── 🔧 .env                         # 环境变量配置（本地使用，不提交）
├── 🔧 requirements.txt             # Python依赖包
│
├── 🐍 demo_zhipu.py                # 简单演示（PM + Developer）
├── 🐍 demo_advanced.py             # 高级演示（Memory + Spec + Skill）
├── 🐍 run_modular_demo.py          # 模块化演示
│
├── 📂 agent_team/                  # Agent团队模块化代码
│   ├── __init__.py
│   ├── README.md                   # agent_team模块说明
│   ├── WORKFLOW.md                 # 9个Agent完整流程图
│   ├── types.py                    # 共享类型定义
│   ├── config.py                   # LLM配置
│   ├── workflow.py                 # 流程统领文件
│   │
│   ├── 📂 agents/                  # Agent实现
│   │   ├── __init__.py
│   │   ├── pm_agent.py            # PM Agent（演示用）
│   │   └── developer_agent.py     # Developer Agent（演示用）
│   │
│   ├── 📂 memory/                  # Memory（记忆系统）
│   │   ├── __init__.py
│   │   └── memory_system.py       # SimpleMemory实现
│   │
│   ├── 📂 specs/                   # Spec（规范验证）
│   │   ├── __init__.py
│   │   └── validators.py          # PRDSpec, CodeSpec, SpecValidator
│   │
│   └── 📂 skills/                  # Skill（技能工具）
│       ├── __init__.py
│       └── tools.py                # 工具定义 + SkillSet
│
├── 📂 output/                      # Agent生成结果目录
│   ├── prd_output.md               # PRD文档
│   └── code_output.md              # 代码文档
│
└── 📂 venv/                        # Python虚拟环境（不提交）
```

---

## 🚀 快速开始

### 环境准备

#### 1. Python版本要求
- Python 3.9 或更高版本

#### 2. 创建虚拟环境

```bash
# 进入项目目录
cd agent-demo-langgraph

# 创建虚拟环境
python -m venv venv

# 激活虚拟环境
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate
```

#### 3. 安装依赖

```bash
# 安装依赖包
pip install -r requirements.txt
```

#### 4. 配置API密钥

```bash
# 复制配置模板
copy .env.example .env

# 编辑 .env 文件
# 填入你的智谱AI API密钥
# ZHIPUAI_API_KEY=your-api-key-here
```

### 运行演示

#### 简单演示（PM + Developer）
```bash
python demo_zhipu.py
```

#### 高级演示（Memory + Spec + Skill）
```bash
python demo_advanced.py
```

#### 模块化演示
```bash
python run_modular_demo.py
```

---

## 📚 重要文档说明

### 核心文档（必读）

| 文档 | 说明 | 适合人群 |
|-----|------|---------|
| **README.md**（本文件） | 项目总览和目录结构 | 所有人 |
| **START.md** | 快速开始指南 | 新成员 |
| **TEAM_ALLOCATION.md** | 团队分工方案（10人） | 所有人 |
| **WORKFLOW.md** | 9个Agent完整流程图 | 所有人 |

### 进阶文档

| 文档 | 说明 | 适合人群 |
|-----|------|---------|
| **ARCHITECTURE.md** | 架构详解 | 想深入了解架构的人 |
| **ADVANCED_CAPABILITIES.md** | Memory/Spec/Skill详解 | 开发者 |

### Agent团队模块文档

| 文档 | 位置 | 说明 |
|-----|------|------|
| **agent_team/README.md** | `agent_team/` | 模块化架构说明 |
| **agent_team/WORKFLOW.md** | `agent_team/` | 完整流程图和数据流 |

---

## 👥 团队协作指南

### 团队结构（10人）

```
接口定义组（1人）
├── 定义State结构和接口契约
│
需求组（2人）
├── Requirements Agent
└── UI Designer Agent
│
架构组（2人）
├── Architecture Agent
└── Frontend Agent
│
实现组（3人）
└── Backend Agent
│
测试组（2人）
├── Test Agent
└── QA + Documentation Agent
```

**详细分工**：见 [TEAM_ALLOCATION.md](TEAM_ALLOCATION.md)

---

## 🛠️ 开发指南

### Agent开发流程

#### 1. 理解接口契约
```python
# 查看定义好的接口
from agent_team.types import MonopolyAgentState

# 每个Agent必须遵守的输入输出格式
state: MonopolyAgentState = {
    "messages": [...],
    "prd_text": "...",
    "prd_data": {...},
    # ...
}
```

#### 2. 实现Agent函数
```python
# agent_team/agents/my_agent.py

def create_my_agent(memory, skills):
    """Agent工厂函数"""

    def my_agent(state: MonopolyAgentState) -> MonopolyAgentState:
        # 1. 使用Memory获取上下文
        context = memory.summarize_context()

        # 2. 构建提示词
        prompt = f"""你是XX角色...
上下文：{context}
任务：...
"""

        # 3. 调用LLM
        response = llm.invoke(prompt)

        # 4. 使用Skill调用工具
        result = skills.execute("tool_name", param=value)

        # 5. 更新State
        state["output_field"] = response.content
        state["current_agent"] = "MyAgent"

        # 6. 保存到Memory
        memory.add_long_term("key", value)

        return state

    return my_agent
```

#### 3. 添加到工作流
```python
# agent_team/workflow.py

from agent_team.agents import create_my_agent

def __init__(self):
    # 创建Agent
    self.my_agent = create_my_agent(self.memory, self.skills)

    # 添加到流程图
    workflow.add_node("my_agent", self.my_agent)
```

---

### 代码规范

#### 命名规范
```python
# Agent文件：小写下划线
requirements_agent.py
architecture_agent.py

# Agent函数：小写下划线
def requirements_agent(state):
    pass

# Agent工厂：驼峰命名
def create_requirements_agent(memory, skills):
    pass
```

#### 注释规范
```python
def my_agent(state: MonopolyAgentState) -> MonopolyAgentState:
    """
    My Agent - 角色描述

    Args:
        state: Agent状态

    Returns:
        更新后的状态

    Raises:
        ValueError: 输入不符合要求时
    """

    # 实现逻辑
    pass
```

---

## 🔄 工作流程

### 开发阶段划分

```
Day 1-2: 接口定义
  ↓
Day 1-5: 需求组开发（Requirements + UI）
  ↓
Day 3-7: 架构组开发（Architecture + Frontend）
  ↓
Day 5-9: 实现组开发（Backend）
  ↓
Day 8-10: 测试组开发（Test）
  ↓
Day 10-12: 质量组开发（QA + Documentation）
```

**详细时间表**：见 [TEAM_ALLOCATION.md](TEAM_ALLOCATION.md)

---

## 🧪 测试与调试

### 单元测试

```bash
# 测试单个Agent
cd agent_team
python -c "from agents import create_pm_agent; print('PM Agent导入成功')"
```

### 集成测试

```bash
# 运行完整流程
python run_modular_demo.py
```

### 调试技巧

1. **查看日志**：每个Agent会打印执行过程
2. **检查输出**：查看 `output/` 目录
3. **验证State**：打印 `state` 查看数据流
4. **使用Mock**：开发时用Mock数据测试

---

## 📊 项目进度跟踪

### 里程碑

- [ ] **Day 2**：接口冻结
- [ ] **Day 5**：需求阶段完成
- [ ] **Day 7**：架构设计完成
- [ ] **Day 9**：编码阶段完成
- [ ] **Day 10**：测试阶段完成
- [ ] **Day 12**：项目交付

### 每日更新

建议使用在线表格或项目管理工具跟踪进度。

---

## 🔗 关键依赖

### Python包
```
langgraph>=0.0.20
langchain>=0.1.0
langchain-core>=0.1.0
langchain-openai>=0.1.0
zhipuai>=1.0.0
python-dotenv>=1.0.0
```

### API服务
- **智谱AI**：https://open.bigmodel.cn/（国内推荐）

---

## 🎯 核心能力说明

### Memory（记忆）
- **作用**：Agent之间共享信息
- **实现**：`agent_team/memory/memory_system.py`
- **使用**：保存和读取关键信息

### Spec（规范）
- **作用**：约束输出格式，验证数据质量
- **实现**：`agent_team/specs/validators.py`
- **使用**：定义PRDSpec、CodeSpec等

### Skill（技能）
- **作用**：扩展Agent能力（文件操作、代码分析等）
- **实现**：`agent_team/skills/tools.py`
- **使用**：调用工具执行任务

**详细说明**：见 [ADVANCED_CAPABILITIES.md](ADVANCED_CAPABILITIES.md)

---

## 🐛 常见问题

### Q1: 虚拟环境激活失败
**A**: 确保使用Python 3.9+，并且用正确的激活脚本：
```bash
# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

### Q2: 依赖安装失败
**A**: 使用清华镜像源加速：
```bash
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
```

### Q3: API密钥错误
**A**: 检查 `.env` 文件是否配置，确保格式正确：
```
ZHIPUAI_API_KEY=your-actual-api-key
```

### Q4: Agent输出质量差
**A**:
1. 检查提示词设计
2. 查看人工反馈机制
3. 参考 [ADVANCED_CAPABILITIES.md](ADVANCED_CAPABILITIES.md) 优化

---

## 📞 联系方式

### 项目管理
- **组长**：[待填写]
- **技术负责人**：[待填写]

### 技术支持
- **GitHub Issues**：[待填写]
- **讨论群**：[待填写]

---

## 📝 更新日志

### v1.0 (2026-04-22)
- ✅ 初始化项目结构
- ✅ 实现基础演示（PM + Developer）
- ✅ 实现高级演示（Memory + Spec + Skill）
- ✅ 完成模块化重构
- ✅ 确定团队分工方案
- ✅ 完成接口设计文档

---

## 📄 许可证

本项目用于学习和研究目的。

---

## 🙏 致谢

- **LangGraph**：强大的Agent编排框架
- **智谱AI**：提供大语言模型API
- **LangChain**：提供LLM开发工具

---

**快速链接**：
- [快速开始](START.md) - 立即上手
- [团队分工](TEAM_ALLOCATION.md) - 了解你的角色
- [流程图](WORKFLOW.md) - 理解Agent协作
- [高级能力](ADVANCED_CAPABILITIES.md) - 深入三大能力
