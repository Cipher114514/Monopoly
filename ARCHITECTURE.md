# LangGraph协作机制详解

## 📐 核心架构

### 1. 整体架构图

```
用户需求
    ↓
StateGraph (流程控制器)
    ↓
┌──────────┐    ┌──────────┐    ┌──────────┐
│ PM Agent │ → │ Dev Agent│ → │ QA Agent │
└──────────┘    └──────────┘    └──────────┘
    ↓              ↓              ↓
        共享状态 (State)
          - messages
          - requirements
          - code
```

---

## 🔑 核心概念

### 1. State（状态）
```python
class AgentState(TypedDict):
    messages: list      # 消息历史
    requirements: str   # PM产出的需求
    code: str          # Developer产出的代码
```

### 2. Agent（节点）
```python
def agent_name(state: AgentState) -> AgentState:
    # 处理逻辑
    response = llm.invoke(...)
    state["output"] = response.content
    return state
```

### 3. Edge（边）
```python
# 普通边
workflow.add_edge("pm", "developer")

# 条件边
workflow.add_conditional_edges(
    "qa",
    lambda state: "end" if passed else "developer"
)
```

---

## 🔄 完整流程

```
初始状态
  ↓
PM Agent → 产出PRD
  ↓
Developer Agent → 基于PRD生成代码
  ↓
QA Agent → 质量检查
  ↓
通过 → 结束
不通过 → 返回Developer
```

---

## 🎨 进阶模式

### 1. 反馈循环
```python
def route_after_qa(state):
    if state["quality_score"] < 80:
        return "developer"  # 返回重做
    else:
        return "end"
```

### 2. 并行执行
```python
# 从design分叉
workflow.add_edge("design", "frontend")
workflow.add_edge("design", "backend")

# 汇聚
workflow.add_edge("frontend", "integration")
workflow.add_edge("backend", "integration")
```

### 3. 条件分支
```python
def route_based_on_complexity(state):
    if state["complexity"] == "high":
        return "full_design"
    else:
        return "simple_design"
```

---

## 📝 总结

- **State** = Agent之间共享的数据
- **Agent** = 处理State的函数
- **Edge** = Agent之间的连接
- **Router** = 决定流程方向

**核心优势：**
✅ 清晰的状态管理
✅ 灵活的流程控制
✅ 易于扩展
