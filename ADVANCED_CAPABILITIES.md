# LangGraph Agent 高级能力设计指南

## 📚 概述

本指南基于你的 `demo_zhipu.py`，展示如何实现 **Memory（记忆）**、**Spec（规范）**、**Skill（技能）** 三大核心能力。

---

## 1️⃣ Memory（记忆）- Agent 的记忆系统

### 1.1 短期记忆（Short-term Memory）

**定义**：当前会话的消息历史，自动累积。

**实现方式**：通过 `AgentState` 中的 `messages` 字段。

```python
class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], add]  # 自动累积消息
```

**关键特性**：
- `Annotated[Sequence[BaseMessage], add]` 会自动追加新消息
- 所有 Agent 共享同一个消息历史
- LangGraph 自动管理，无需手动追加

**实际使用**：
```python
def developer_agent(state: AgentState) -> AgentState:
    # 访问完整历史
    history = state["messages"]

    # 添加新消息（会被自动累积）
    response = llm.invoke(history)
    state["messages"].append(response)  # 追加到历史

    return state
```

---

### 1.2 长期记忆（Long-term Memory）

**定义**：跨会话持久化的记忆，存储在向量数据库中。

**应用场景**：
- 用户偏好记忆
- 历史对话记录
- 项目知识库

**实现示例**：

```python
from langchain_core.vectorstores import InMemoryVectorStore
from langchain_openai import OpenAIEmbeddings
from langchain_core.documents import Document

# 1. 创建向量存储
embeddings = OpenAIEmbeddings(
    api_key=os.getenv("ZHIPUAI_API_KEY"),
    base_url="https://open.bigmodel.cn/api/paas/v4/"
)
vectorstore = InMemoryVectorStore(embeddings)

# 2. 存储记忆
def save_to_memory(content: str, metadata: dict):
    doc = Document(page_content=content, metadata=metadata)
    vectorstore.add_documents([doc])

# 3. 检索记忆
def retrieve_memory(query: str, k: int = 3):
    results = vectorstore.similarity_search(query, k=k)
    return [doc.page_content for doc in results]

# 4. 在 Agent 中使用
def agent_with_memory(state: AgentState) -> AgentState:
    # 检索相关记忆
    relevant_memories = retrieve_memory(state["messages"][-1].content)

    # 将记忆注入到提示词中
    prompt = f"""历史记忆：
{chr(10).join(relevant_memories)}

当前任务：{state["messages"][-1].content}
"""

    response = llm.invoke([HumanMessage(content=prompt)])

    # 保存新的记忆
    save_to_memory(response.content, {"agent": "pm", "timestamp": "now"})

    return state
```

---

### 1.3 上下文记忆（Context Memory）

**定义**：在特定字段中累积关键信息。

**实现方式**：扩展 `AgentState`

```python
class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], add]
    current_agent: str
    requirements: str
    code: str

    # 上下文记忆字段
    user_preferences: str  # 用户偏好
    project_context: str   # 项目上下文
    decisions_made: str    # 已做出的决策
```

**使用示例**：

```python
def pm_agent(state: AgentState) -> AgentState:
    # 提取用户偏好
    user_prefs = extract_preferences(state["messages"][-1].content)

    # 保存到上下文记忆
    state["user_preferences"] = user_prefs

    # 后续 Agent 可以使用这些信息
    return state
```

---

## 2️⃣ Spec（规范）- Agent 的行为规范

### 2.1 Agent 规范定义

**定义**：明确 Agent 的角色、职责、输入输出规范。

**实现方式**：通过结构化的提示词和输出解析。

```python
from pydantic import BaseModel, Field

# 1. 定义输出规范
class PRDSpec(BaseModel):
    """产品需求文档规范"""
    product_name: str = Field(description="产品名称")
    core_features: list[str] = Field(description="核心功能列表")
    target_users: str = Field(description="目标用户")
    success_criteria: list[str] = Field(description="验收标准")

# 2. 使用结构化输出
def pm_agent_spec(state: AgentState) -> AgentState:
    pm_prompt = """你是资深产品经理。根据用户需求生成PRD。

    必须输出以下字段：
    - product_name: 产品名称
    - core_features: 核心功能列表
    - target_users: 目标用户
    - success_criteria: 验收标准
    """

    # 使用结构化输出
    structured_llm = llm.with_structured_output(PRDSpec)
    result: PRDSpec = structured_llm.invoke(state["messages"])

    # 现在可以精确访问每个字段
    print(f"产品：{result.product_name}")
    print(f"功能：{result.core_features}")

    state["requirements"] = result.model_dump_json()
    return state
```

---

### 2.2 任务规范（Task Specification）

**定义**：定义任务的输入、处理步骤、输出格式。

**实现方式**：通过 Agent 之间的契约。

```python
# 1. 定义任务契约
class TaskSpec:
    """PM → Developer 的任务契约"""

    @staticmethod
    def validate_input(state: AgentState) -> bool:
        """验证输入"""
        required_fields = ["requirements", "user_preferences"]
        return all(field in state for field in required_fields)

    @staticmethod
    def transform_format(prd_json: str) -> dict:
        """转换格式"""
        import json
        return json.loads(prd_json)

# 2. 在 Agent 中使用规范
def developer_agent_with_spec(state: AgentState) -> AgentState:
    # 验证输入符合规范
    if not TaskSpec.validate_input(state):
        raise ValueError("输入不符合PM→Developer契约")

    # 转换格式
    prd = TaskSpec.transform_format(state["requirements"])

    # 使用规范化数据
    prompt = f"""根据以下PRD生成代码：

    产品：{prd['product_name']}
    功能：{prd['core_features']}

    要求：
    1. 使用Python
    2. 添加类型注解
    3. 包含错误处理
    """

    response = llm.invoke([HumanMessage(content=prompt)])
    state["code"] = response.content

    return state
```

---

### 2.3 输出规范（Output Specification）

**定义**：确保输出符合特定格式。

**实现方式**：使用 Pydantic 验证和格式化。

```python
from pydantic import validator

class CodeSpec(BaseModel):
    """代码输出规范"""
    language: str
    code: str
    dependencies: list[str]
    description: str

    @validator('language')
    def must_be_python(cls, v):
        if v not in ['python', 'javascript']:
            raise ValueError('只支持 Python 或 JavaScript')
        return v

    @validator('code')
    def must_include_main(cls, v):
        if 'def main(' not in v and 'if __name__' not in v:
            raise ValueError('代码必须包含 main 函数')
        return v

# 使用
def validate_output(code_str: str) -> CodeSpec:
    try:
        return CodeSpec(**json.loads(code_str))
    except Exception as e:
        print(f"输出不符合规范：{e}")
        return None
```

---

## 3️⃣ Skill（技能）- Agent 的能力扩展

### 3.1 Tool 使用（基础技能）

**定义**：给 Agent 提供外部工具调用能力。

**实现方式**：使用 LangChain 的 Tool。

```python
from langchain_core.tools import tool

# 1. 定义工具
@tool
def search_web(query: str) -> str:
    """搜索网络信息"""
    # 实际实现
    return f"搜索结果：{query}"

@tool
def read_file(filepath: str) -> str:
    """读取文件内容"""
    with open(filepath, 'r', encoding='utf-8') as f:
        return f.read()

@tool
def write_file(filepath: str, content: str) -> str:
    """写入文件"""
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    return f"已写入：{filepath}"

# 2. 将工具绑定到 LLM
tools = [search_web, read_file, write_file]
llm_with_tools = llm.bind_tools(tools)

# 3. 在 Agent 中使用
def agent_with_tools(state: AgentState) -> AgentState:
    response = llm_with_tools.invoke(state["messages"])

    # 处理工具调用
    if response.tool_calls:
        for tool_call in response.tool_calls:
            tool_name = tool_call["name"]
            tool_args = tool_call["args"]

            # 执行工具
            if tool_name == "search_web":
                result = search_web.run(tool_args["query"])
            elif tool_name == "read_file":
                result = read_file.run(tool_args["filepath"])
            # ... 其他工具

    return state
```

---

### 3.2 高级技能组合

**定义**：将多个工具组合成复杂的技能。

**实现方式**：创建技能代理。

```python
class CodeWritingSkill:
    """代码编写技能组合"""

    def __init__(self):
        self.tools = {
            "read": read_file,
            "write": write_file,
            "search": search_web
        }

    def execute_task(self, task: str, state: AgentState) -> str:
        """执行复杂任务"""

        # 1. 分析任务
        analysis_prompt = f"""分析以下任务，确定需要哪些步骤：

        任务：{task}

        可用操作：
        - read: 读取文件
        - write: 写入文件
        - search: 搜索信息

        请输出执行步骤。
        """

        steps = llm.invoke([HumanMessage(content=analysis_prompt)])

        # 2. 执行步骤
        results = []
        for step in steps.content.split('\n'):
            if 'read' in step:
                # 提取文件路径
                filepath = extract_filepath(step)
                result = self.tools['read'].run(filepath)
                results.append(result)

            elif 'write' in step:
                filepath, content = extract_write_info(step)
                result = self.tools['write'].run(filepath, content)
                results.append(result)

        return '\n'.join(results)

# 使用
code_skill = CodeWritingSkill()

def developer_agent_with_skill(state: AgentState) -> AgentState:
    task = f"根据PRD生成代码：{state['requirements']}"

    # 使用技能组合执行任务
    result = code_skill.execute_task(task, state)

    state["code"] = result
    return state
```

---

### 3.3 动态技能加载

**定义**：根据任务动态加载技能。

**实现方式**：技能注册表。

```python
class SkillRegistry:
    """技能注册表"""

    def __init__(self):
        self.skills = {}

    def register(self, name: str, skill):
        """注册技能"""
        self.skills[name] = skill

    def get_skill(self, task_type: str):
        """根据任务类型获取技能"""
        return self.skills.get(task_type)

# 全局注册表
registry = SkillRegistry()
registry.register("coding", CodeWritingSkill())
registry.register("research", ResearchSkill())
registry.register("testing", TestingSkill())

# 使用
def router_agent(state: AgentState) -> AgentState:
    # 分析任务类型
    task_type = classify_task(state["messages"][-1].content)

    # 动态获取技能
    skill = registry.get_skill(task_type)

    if skill:
        result = skill.execute(state["messages"][-1].content, state)
        state["results"] = result

    return state
```

---

## 4️⃣ 完整示例：增强版 Agent

将所有能力组合到一起：

```python
# 1. 增强的状态定义
class EnhancedAgentState(TypedDict):
    # 基础字段
    messages: Annotated[Sequence[BaseMessage], add]
    current_agent: str

    # 记忆字段
    short_term: list[BaseMessage]
    long_term_query: str
    context_memory: dict

    # 规范字段
    current_spec: dict
    validation_errors: list[str]

    # 技能字段
    available_tools: list
    skill_results: dict
```

---

## 5️⃣ 实战技巧

### 5.1 Memory 优化

```python
# 1. 消息压缩（当历史过长时）
def compress_messages(messages: list, max_tokens: int = 4000) -> list:
    """压缩消息历史"""
    if count_tokens(messages) <= max_tokens:
        return messages

    # 保留最近的 N 条消息
    return messages[-10:]

# 2. 关键信息提取
def extract_key_info(messages: list) -> dict:
    """提取关键信息到状态"""
    return {
        "user_goal": extract_from_messages(messages, "user_goal"),
        "constraints": extract_from_messages(messages, "constraints"),
        "preferences": extract_from_messages(messages, "preferences")
    }
```

### 5.2 Spec 验证

```python
# 在 Agent 之间添加验证层
def validate_transition(from_agent: str, to_agent: str, state: dict) -> bool:
    """验证 Agent 之间的转换是否符合规范"""

    # 定义转换规则
    rules = {
        "pm->developer": lambda s: "requirements" in s and len(s["requirements"]) > 0,
        "developer->qa": lambda s: "code" in s and len(s["code"]) > 0,
    }

    key = f"{from_agent}->{to_agent}"
    if key in rules:
        return rules[key](state)

    return False
```

### 5.3 Skill 组合

```python
# 技能链式调用
def skill_chain(state: AgentState, skills: list) -> AgentState:
    """链式调用多个技能"""

    result = state
    for skill in skills:
        result = skill.execute(result)

    return result

# 使用
skills = [CodeWritingSkill(), TestingSkill(), DocumentationSkill()]
final_state = skill_chain(initial_state, skills)
```

---

## 6️⃣ 总结

| 能力 | 核心概念 | 实现方式 |
|-----|---------|---------|
| **Memory** | 记住信息 | State字段、向量存储、上下文累积 |
| **Spec** | 规范行为 | Pydantic模型、契约验证、结构化输出 |
| **Skill** | 扩展能力 | Tools、技能组合、动态加载 |

**设计原则**：
1. Memory：短期用 State，长期用向量库
2. Spec：明确输入输出，严格验证
3. Skill：模块化设计，可组合复用

---

**下一步**：查看 `demo_advanced.py` 了解完整实现！
