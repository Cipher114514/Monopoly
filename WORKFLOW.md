# 在线大富翁项目 Agent 团队完整流程图

## 📋 目录
1. [团队架构总览](#团队架构总览)
2. [Agent详细说明](#agent详细说明)
3. [完整协作流程](#完整协作流程)
4. [数据流转关系](#数据流转关系)
5. [人工关卡设计](#人工关卡设计)
6. [State状态设计](#state状态设计)

---

## 团队架构总览

### Agent团队（9人）

```
┌─────────────────────────────────────────────────────────┐
│                    PM Agent（主控）                      │
│              协调流程、决策、验收                         │
└─────────────────────────────────────────────────────────┘
                          │
                          ↓
┌─────────────────────────────────────────────────────────┐
│              Requirements Agent（需求分析）              │
│                   分析需求、生成PRD                      │
└─────────────────────────────────────────────────────────┘
                          │
              ┌───────────┴───────────┐
              ↓                       ↓
┌──────────────────────┐    ┌──────────────────────┐
│  Architecture Agent  │    │  UI Designer Agent   │
│    （架构设计）      │    │    （UI设计）        │
│                      │    │                      │
│  - 系统架构          │    │  - 界面设计          │
│  - 技术选型          │    │  - 交互流程          │
│  - API设计           │    │  - 视觉风格          │
└──────────┬───────────┘    └──────────┬───────────┘
           │                             │
           └──────────┬──────────────────┘
                      │
          ┌───────────┴───────────┐
          ↓                       ↓
┌──────────────────────┐  ┌──────────────────────┐
│  Backend Dev Agent   │  │  Frontend Dev Agent  │
│    （后端开发）      │  │    （前端开发）      │
│                      │  │                      │
│  - 游戏服务器        │  │  - 游戏UI            │
│  - WebSocket        │  │  - 客户端逻辑         │
│  - 状态同步          │  │  - 动画效果          │
└──────────┬───────────┘  └──────────┬───────────┘
           │                         │
           └──────────┬──────────────┘
                      ↓
          ┌──────────────────────┐
          │   Test Agent         │
          │    （集成测试）       │
          │                      │
          │  - 测试用例          │
          │  - 自动化测试        │
          │  - 测试报告          │
          └──────────┬───────────┘
                     ↓
          ┌──────────────────────┐
          │    QA Agent          │
          │   （质量保证）        │
          │                      │
          │  - 需求评审          │
          │  - 设计评审          │
          │  - 代码评审          │
          │  - 最终验收          │
          └──────────┬───────────┘
                     ↓
          ┌──────────────────────┐
          │ Documentation Agent  │
          │     （文档）         │
          │                      │
          │  - 技术文档          │
          │  - 用户手册          │
          │  - API文档           │
          └──────────┬───────────┘
                     ↓
                【交付】
```

---

## Agent详细说明

### 1. PM Agent - 产品经理（主控）

| 属性 | 说明 |
|-----|------|
| **角色** | 主控协调者 |
| **职责** | 协调流程、做出决策、验收阶段 |
| **输入** | 用户需求、各Agent产出 |
| **输出** | 产品决策、验收结果 |
| **人工介入** | 全程参与 |
| **协作对象** | 所有Agent |

---

### 2. Requirements Agent - 需求分析

| 属性 | 说明 |
|-----|------|
| **角色** | 需求分析师 |
| **职责** | 分析用户需求、生成PRD、定义功能规格 |
| **输入** | 用户需求、竞品分析 |
| **输出** | 结构化PRD文档、功能清单 |
| **人工介入** | ✅ 需求确认关卡 |
| **协作对象** | PM Agent、Architecture Agent |

**输出格式**：
```python
{
    "prd_text": "完整的PRD文档（Markdown格式）",
    "prd_data": {
        "product_name": "在线大富翁",
        "features": ["多人对战", "实时同步", ...],
        "target_users": "18-22岁大学生",
        "success_criteria": [...]
    }
}
```

---

### 3. Architecture Agent - 架构设计

| 属性 | 说明 |
|-----|------|
| **角色** | 系统架构师 |
| **职责** | 设计系统架构、选择技术栈、设计API和数据模型 |
| **输入** | PRD文档 |
| **输出** | 架构设计文档、技术选型、API接口文档 |
| **人工介入** | ✅ 架构评审关卡 |
| **协作对象** | Requirements Agent、Backend Agent、Frontend Agent |

**输出格式**：
```python
{
    "architecture_text": "架构设计文档（Markdown）",
    "architecture_data": {
        "tech_stack": ["Node.js", "React", "Socket.io"],
        "components": ["游戏服务器", "匹配系统", ...],
        "api_design": [...],
        "database_design": {...}
    }
}
```

---

### 4. UI Designer Agent - UI设计（支撑型）

| 属性 | 说明 |
|-----|------|
| **角色** | UI/UX设计师 |
| **职责** | 设计界面、交互流程、视觉风格 |
| **输入** | PRD文档、用户画像 |
| **输出** | UI设计文档、页面原型、组件规范 |
| **人工介入** | ✅ UI评审关卡 |
| **协作对象** | Requirements Agent、Frontend Dev Agent |

**输出格式**：
```python
{
    "ui_text": "UI设计文档（Markdown）",
    "ui_data": {
        "color_scheme": {...},
        "pages": ["首页", "游戏大厅", "游戏界面"],
        "components": ["棋盘", "棋子", "按钮"],
        "interactions": [...]
    }
}
```

---

### 5. Backend Dev Agent - 后端开发

| 属性 | 说明 |
|-----|------|
| **角色** | 后端工程师 |
| **职责** | 实现游戏服务器、WebSocket、状态同步、房间管理 |
| **输入** | 架构设计文档、API接口规范 |
| **输出** | 后端代码（Node.js）、API实现、数据库脚本 |
| **人工介入** | ❌ 零人工编码 |
| **协作对象** | Architecture Agent、Test Agent |

**输出格式**：
```python
{
    "backend_code": "完整的Node.js代码",
    "api_implementation": {...},
    "database_scripts": "...",
    "tech_details": {
        "language": "Node.js",
        "framework": "Express",
        "websocket": "Socket.io"
    }
}
```

---

### 6. Frontend Dev Agent - 前端开发

| 属性 | 说明 |
|-----|------|
| **角色** | 前端工程师 |
| **职责** | 实现游戏UI、客户端逻辑、WebSocket客户端 |
| **输入** | 架构设计、UI设计规范、API接口 |
| **输出** | 前端代码、组件实现 |
| **人工介入** | ❌ 零人工编码 |
| **协作对象** | Architecture Agent、UI Designer Agent、Test Agent |

**输出格式**：
```python
{
    "frontend_code": "完整的React/Vue代码",
    "components": {...},
    "tech_details": {
        "framework": "React",
        "state_management": "Redux",
        "websocket_client": "Socket.io-client"
    }
}
```

---

### 7. Test Agent - 集成测试

| 属性 | 说明 |
|-----|------|
| **角色** | 测试工程师 |
| **职责** | 编写测试用例、执行自动化测试、生成测试报告 |
| **输入** | 前后端代码、PRD文档 |
| **输出** | 测试用例、测试代码、测试报告 |
| **人工介入** | ❌ 自动化测试 |
| **协作对象** | Backend Agent、Frontend Agent、QA Agent |

**输出格式**：
```python
{
    "test_cases": [...],
    "test_code": "测试代码",
    "test_report": {
        "coverage": "85%",
        "passed": 42,
        "failed": 3,
        "bugs": [...]
    }
}
```

---

### 8. QA Agent - 质量保证

| 属性 | 说明 |
|-----|------|
| **角色** | 质量保证工程师 |
| **职责** | 评审需求、设计、代码；执行最终验收 |
| **输入** | 所有Agent的产出 |
| **输出** | 评审意见、验收报告、最终交付物 |
| **人工介入** | ✅ 最终验收关卡 |
| **协作对象** | 所有Agent（最终把关） |

**输出格式**：
```python
{
    "reviews": {
        "requirements": "✅ 通过",
        "architecture": "✅ 通过",
        "code": "⚠️  需要改进",
        "test": "✅ 通过"
    },
    "final_report": "验收报告",
    "deliverables": [...]
}
```

---

### 9. Documentation Agent - 文档（支撑型）

| 属性 | 说明 |
|-----|------|
| **角色** | 技术文档工程师 |
| **职责** | 编写技术文档、用户手册、API文档 |
| **输入** | 所有Agent的产出 |
| **输出** | 技术文档、用户手册、API文档 |
| **人工介入** | ❌ 自动生成 |
| **协作对象** | 所有Agent |

**输出格式**：
```python
{
    "technical_docs": "技术文档",
    "user_manual": "用户手册",
    "api_docs": "API文档",
    "development_docs": "开发文档"
}
```

---

## 完整协作流程

### 阶段1：需求分析

```
┌─────────────┐
│  PM Agent   │ ← 接收用户需求
└──────┬──────┘
       │
       ↓
┌───────────────────┐
│ Requirements     │
│   Agent          │ ← 分析需求，生成PRD
└─────────┬─────────┘
          │
          ↓
    ┌─────────┐
    │ 人工确认│ ← 关卡1：需求是否正确？
    └────┬────┘
         │
    通过？│
         ↓
    阶段2
```

**数据传递**：
```python
# Requirements Agent → State
state["prd_text"] = "# 产品需求文档\n..."
state["prd_data"] = {"product_name": "...", "features": [...]}
```

---

### 阶段2：设计

```
         PRD
          ↓
┌───────────────────┐      ┌──────────────────┐
│  Architecture     │      │   UI Designer    │
│     Agent         │      │     Agent        │
└─────────┬─────────┘      └─────────┬────────┘
          │                          │
          │        ┌────────────────┘
          ↓        ↓
    ┌─────────┐
    │架构评审 │ ← 关卡2：架构是否合理？
    └────┬────┘
         │
    ┌────┴────┐
    ↓         ↓
┌──────┐  ┌──────┐
│  UI  │  │通过？│
│评审  │  └──┬───┘
└──┬───┘     │
   │      通过？
   ↓         ↓
阶段3    阶段3
```

**数据传递**：
```python
# Architecture Agent → State
state["architecture_text"] = "# 架构设计\n..."
state["architecture_data"] = {"tech_stack": [...], "api_design": [...]}

# UI Designer Agent → State
state["ui_text"] = "# UI设计\n..."
state["ui_data"] = {"color_scheme": {...}, "pages": [...]}
```

---

### 阶段3：编码（零人工）

```
架构设计    UI设计
   ↓          ↓
┌───────────────┐    ┌──────────────┐
│  Backend      │    │  Frontend     │
│   Dev Agent   │    │  Dev Agent    │
└───────┬───────┘    └──────┬───────┘
        │                   │
        │    并行开发        │
        │                   │
        └────────┬──────────┘
                 ↓
         后端代码 + 前端代码
```

**数据传递**：
```python
# Backend Agent → State
state["backend_code"] = "Node.js代码..."
state["backend_details"] = {"language": "Node.js", ...}

# Frontend Agent → State
state["frontend_code"] = "React代码..."
state["frontend_details"] = {"framework": "React", ...}
```

---

### 阶段4：测试

```
后端代码 + 前端代码
          ↓
┌───────────────────┐
│   Test Agent      │ ← 编写测试用例、执行测试
└─────────┬─────────┘
          │
          ↓
     测试报告
```

**数据传递**：
```python
# Test Agent → State
state["test_cases"] = [...]
state["test_code"] = "测试代码..."
state["test_report"] = {"coverage": "85%", "passed": 42, ...}
```

---

### 阶段5：质量保证

```
所有产出
   ↓
┌───────────────────┐
│    QA Agent       │ ← 评审所有产出、执行验收
└─────────┬─────────┘
          │
          ↓
    ┌─────────┐
    │最终验收 │ ← 关卡3：是否通过验收？
    └────┬────┘
         │
      通过？│
         ↓
    阶段6
```

**数据传递**：
```python
# QA Agent → State
state["qa_reviews"] = {...}
state["final_report"] = "验收报告"
```

---

### 阶段6：文档与交付

```
所有产出
   ↓
┌───────────────────┐
│  Documentation   │ ← 生成所有文档
│     Agent         │
└─────────┬─────────┘
          │
          ↓
    ┌─────────┐
    │ PM Agent│ ← 最终打包
    └────┬────┘
         ↓
    【交付】
```

**数据传递**：
```python
# Documentation Agent → State
state["technical_docs"] = "..."
state["user_manual"] = "..."
state["api_docs"] = "..."

# 最终交付物
deliverables = {
    "prd": state["prd_text"],
    "architecture": state["architecture_text"],
    "backend_code": state["backend_code"],
    "frontend_code": state["frontend_code"],
    "test_report": state["test_report"],
    "qa_report": state["final_report"],
    "docs": state["technical_docs"]
}
```

---

## 数据流转关系

### State状态结构

```python
class MonopolyAgentState(TypedDict):
    """在线大富翁项目Agent状态"""

    # 消息历史
    messages: Annotated[Sequence[BaseMessage], add]

    # 当前Agent
    current_agent: str

    # 需求阶段输出
    prd_text: str          # PRD文档（文本）
    prd_data: dict         # PRD数据（结构化）

    # 设计阶段输出
    architecture_text: str     # 架构文档（文本）
    architecture_data: dict    # 架构数据（结构化）
    ui_text: str              # UI文档（文本）
    ui_data: dict             # UI数据（结构化）

    # 编码阶段输出
    backend_code: str      # 后端代码
    backend_details: dict  # 后端技术细节
    frontend_code: str     # 前端代码
    frontend_details: dict # 前端技术细节

    # 测试阶段输出
    test_cases: list       # 测试用例
    test_code: str         # 测试代码
    test_report: dict      # 测试报告

    # QA阶段输出
    qa_reviews: dict       # 评审意见
    final_report: str      # 验收报告

    # 文档阶段输出
    technical_docs: str    # 技术文档
    user_manual: str       # 用户手册
    api_docs: str          # API文档

    # 流程控制
    human_feedback: list[str]  # 人工反馈历史
    iteration_count: int       # 迭代次数
```

---

### Agent间的数据依赖

```
Requirements Agent
    ├─→ prd_text ─────────────────────┐
    └─→ prd_data ───┐                 │
                    ↓                 │
         ┌────────── Architecture Agent
         │                  ┬──────────┴─────→ architecture_text
         │                  └───────────────→ architecture_data
         │
         ↓
    UI Designer Agent
    ├─────────────────→ ui_text
    └─────────────────→ ui_data
                           │
        ┌──────────────────┼──────────────────┐
        ↓                  ↓                  ↓
 Backend Agent    Frontend Agent      Test Agent (后期)
        │                  │                  │
        ├────→ backend_code                │
        └────→ backend_details             │
                           │               │
                           ├────→ frontend_code
                           └────→ frontend_details
                                            │
                                            ↓
                                     Test Agent
                                            │
                                     ┌──────┴──────┐
                                     ↓             ↓
                               test_cases    test_report
                               test_code
                                     │
                                     ↓
                               QA Agent
                                     │
                              ┌──────┴──────┐
                              ↓             ↓
                          qa_reviews   final_report
                              │             │
                              └──────┬──────┘
                                     ↓
                            Documentation Agent
                                     │
                              ┌──────┴──────┐
                              ↓             ↓
                        technical_docs  user_manual
                                       api_docs
```

---

## 人工关卡设计

### 关卡1：需求确认（Requirements之后）

```python
def checkpoint_requirements(state):
    print("\n" + "="*70)
    print("📋 需求分析完成")
    print("="*70)
    print(state["prd_text"])
    print("\n是否通过？")
    print("  1. 通过")
    print("  2. 不通过，需修改")
    print("  3. 终止项目")

    choice = input("请选择 (1/2/3): ")

    if choice == "1":
        return True, ""
    elif choice == "3":
        return False, "TERMINATE"
    else:
        print("请选择不通过的原因：")
        print("  1. 需求理解错误")
        print("  2. 功能缺失")
        print("  3. 用户画像错误")
        print("  4. 验收标准不明确")

        reason_choice = input("请选择编号: ")
        reasons = {
            "1": "需求理解错误",
            "2": "功能缺失",
            "3": "用户画像错误",
            "4": "验收标准不明确"
        }

        return False, reasons[reason_choice]
```

---

### 关卡2：架构评审（Architecture之后）

```python
def checkpoint_architecture(state):
    print("\n" + "="*70)
    print("🏗️ 架构设计完成")
    print("="*70)
    print(state["architecture_text"])
    print("\n是否通过？")

    choice = input("请选择 (1/2/3): ")

    if choice == "1":
        return True, ""
    elif choice == "3":
        return False, "TERMINATE"
    else:
        print("请选择不通过的原因：")
        print("  1. 技术选型不合理")
        print("  2. 组件划分不清晰")
        print("  3. 接口设计有问题")
        print("  4. 缺少关键组件")
        print("  5. 数据库设计不合理")

        reason_choice = input("请选择编号: ")
        return False, reason_choice
```

---

### 关卡3：最终验收（QA之后）

```python
def checkpoint_final(state):
    print("\n" + "="*70)
    print("✅ 项目开发完成，请验收")
    print("="*70)
    print(f"需求：{state['prd_text'][:100]}...")
    print(f"架构：{state['architecture_text'][:100]}...")
    print(f"后端：{state['backend_details']}")
    print(f"前端：{state['frontend_details']}")
    print(f"测试：{state['test_report']}")
    print(f"QA：{state['qa_reviews']}")

    print("\n是否通过验收？")
    choice = input("请选择 (1/2): ")

    if choice == "1":
        return True
    else:
        print("请说明原因：")
        reason = input("原因：")
        return False, reason
```

---

## 完整执行流程示例

### 成功场景（全部通过）

```python
# 1. 初始化
workflow = MonopolyWorkflow()
state = initialize_state(user_request)

# 2. 需求分析
state = requirements_agent(state)
approved, feedback = checkpoint_requirements(state)
# → 通过

# 3. 架构设计（并行UI设计）
state = architecture_agent(state)
state = ui_designer_agent(state)
approved, feedback = checkpoint_architecture(state)
# → 通过

# 4. 编码（并行）
state = backend_agent(state)
state = frontend_agent(state)

# 5. 测试
state = test_agent(state)

# 6. QA验收
state = qa_agent(state)
approved, feedback = checkpoint_final(state)
# → 通过

# 7. 文档生成
state = documentation_agent(state)

# 8. 交付
deliver(state)
```

---

### 迭代场景（不通过后改进）

```python
# 1. 需求分析
state = requirements_agent(state)
approved, feedback = checkpoint_requirements(state)
# → 不通过，原因：功能缺失

# 2. Agent根据反馈改进
state = requirements_agent_retry(state, feedback="功能缺失")
state["prd_data"]["features"].append("断线重连")

# 3. 再次确认
approved, feedback = checkpoint_requirements(state)
# → 通过

# 继续后续流程...
```

---

## 总结

### Agent团队规模
- **总计**：9个Agent
- **核心流程**：7个Agent
- **支撑型**：2个Agent

### 人工关卡
- **关卡1**：需求确认
- **关卡2**：架构评审
- **关卡3**：最终验收

### 零人工编码
- **编码阶段**：Backend、Frontend完全零人工
- **测试阶段**：Test Agent自动化
- **文档阶段**：Documentation Agent自动生成

### 符合要求
- ✅ 瀑布式开发模型
- ✅ 明确分工
- ✅ 质量保障机制
- ✅ 可追溯性
- ✅ 零人工编码
- ✅ 迭代优化能力
