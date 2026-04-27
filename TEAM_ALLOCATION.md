# 在线大富翁Agent团队分工方案（10人版 - 最小依赖）

## 📋 目录
1. [设计原则](#设计原则)
2. [团队结构](#团队结构)
3. [详细分工](#详细分工)
4. [并行开发策略](#并行开发策略)
5. [接口契约](#接口契约)
6. [时间节点](#时间节点)

---

## 设计原则

### 核心思想：接口先行 + 并行开发

```
传统依赖链（串行）：
Requirements → Architecture → Backend → Test → QA
  3天           3天            5天        2天      2天
  ↓             ↓              ↓          ↓        ↓
  ├─────────────┴──────────────┴──────────┴─────→ 15天

新方案（并行）：
┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐
│Requirements│  │Architecture│  │  Backend  │  │   Test   │
│  (2人)   │  │  (2人)   │  │  (3人)   │  │  (2人)   │
└─────────┘  └─────────┘  └─────────┘  └─────────┘
     ↓             ↓             ↓             ↓
  Day 1-5       Day 1-5       Day 3-7       Day 6-8

关键：接口先行（Day 1-2统一定义State和接口）
```

---

## 团队结构

### 五个独立小组（按依赖层级）

```
┌─────────────────────────────────────────────────────────┐
│              接口定义组（1人）                          │
│  职责：定义State结构、接口契约、数据格式                │
│  产出：types.py, 接口文档                              │
│  特点：所有人都不依赖他，他定义好接口后就不需要了       │
└─────────────────────────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ↓               ↓               ↓
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ 需求组（2人）│  │ 架构组（2人）│  │ 实现组（3人）│
├──────────────┤  ├──────────────┤  ├──────────────┤
│- Requirements│  │- Architecture│  │- Backend    │
│- UI Designer │  │- Frontend    │  │- Test       │
└──────────────┘  └──────────────┘  └──────────────┘
      ↓                 ↓                 ↓
┌──────────────────────────────────────────────────┐
│              质量组（2人）                        │
├──────────────────────────────────────────────────┤
│- QA                                              │
│- Documentation                                   │
└──────────────────────────────────────────────────┘
```

---

## 详细分工

### 🔵 接口定义组（1人）- 独立

#### 成员1：接口设计师
**姓名位置**：_____________
**技能要求**：中等，细心，有设计思维
**工作时间**：Day 1-2（前期完成）
**主要职责**：
- 定义完整的 State 结构
- 定义各 Agent 之间的数据契约
- 编写接口文档
- 提供接口Mock数据

**交付物**：
- [ ] types.py（完整的State定义）
- [ ] interface_contract.md（接口契约文档）
- [ ] mock_data.py（Mock数据生成）
- [ ] 接口使用示例

**依赖关系**：
- **输入**：无（独立设计）
- **输出**：给所有人提供接口定义

**为什么独立**：
- 只在前期工作2天
- 定义完接口后就基本不需要了
- 不依赖任何人，别人也不依赖他

---

### 🟢 需求组（2人）- 相对独立

#### 成员2：Requirements Agent负责人
**姓名位置**：_____________
**技能要求**：中等，需求分析能力
**工作时间**：Day 1-5
**主要职责**：
- 实现 Requirements Agent
- 设计提示词
- 实现 PRD 生成逻辑

**交付物**：
- [ ] requirements_agent.py
- [ ] 提示词文档

**依赖**：
- **需要**：接口定义（State中的prd字段）
- **被需要**：架构组

---

#### 成员3：UI Designer Agent负责人
**姓名位置**：_____________
**技能要求**：中等，设计思维
**工作时间**：Day 1-5
**主要职责**：
- 实现 UI Designer Agent
- 设计UI生成提示词
- 收集UI参考素材

**交付物**：
- [ ] ui_designer_agent.py
- [ ] UI参考文档

**依赖**：
- **需要**：接口定义（State中的ui字段）
- **被需要**：架构组（Frontend）

**并行策略**：
- 与 Requirements 并行开发
- 不互相依赖

---

### 🟡 架构组（2人）- 依赖需求组

#### 成员4：Architecture Agent负责人
**姓名位置**：_____________
**技能要求**：高，系统设计能力
**工作时间**：Day 3-7（需求组完成后开始）
**主要职责**：
- 实现 Architecture Agent
- 设计架构分析提示词
- 实现 API 文档生成

**交付物**：
- [ ] architecture_agent.py
- [ ] 架构设计模板

**依赖**：
- **需要**：Requirements Agent 的输出（PRD）
- **被需要**：实现组（Backend、Frontend）

**时间安排**：
- Day 3-5：等待需求组完成
- Day 5-7：开发 Architecture Agent

---

#### 成员5：Frontend Agent负责人
**姓名位置**：_____________
**技能要求**：高，前端开发能力
**工作时间**：Day 3-7
**主要职责**：
- 实现 Frontend Agent
- 设计前端生成提示词
- 实现代码格式化

**交付物**：
- [ ] frontend_agent.py
- [ ] 提示词文档

**依赖**：
- **需要**：Architecture 的输出 + UI Designer 的输出
- **被需要**：测试组

**时间安排**：
- Day 3-5：等待架构组完成（可并行开发框架）
- Day 5-7：基于架构输出开发

**并行策略**：
- 与 Architecture Agent 负责人结对
- 互相支持，共享上下文

---

### 🔴 实现组（3人）- 依赖架构组

#### 成员6、7、8：Backend Agent（3人协作）
**姓名位置**：_____________、_____________、_____________
**技能要求**：高，后端开发能力
**工作时间**：Day 5-9（架构组完成后开始）
**主要职责**：
- 共同实现 Backend Agent
- 设计提示词（协作）
- 实现代码生成逻辑
- 处理 WebSocket、同步机制

**分工**：
- 成员6：游戏服务器逻辑
- 成员7：WebSocket通信
- 成员8：房间管理、状态同步

**交付物**：
- [ ] backend_agent.py
- [ ] 提示词文档（3份）
- [ ] 技术方案说明

**依赖**：
- **需要**：Architecture 的输出
- **被需要**：测试组

**时间安排**：
- Day 5-7：等待架构组完成
- Day 7-9：开发 Backend Agent

**为什么3人**：
- Backend 最复杂
- 需要互相协作和支持
- 降低单点风险

---

### 🟣 测试组（2人）- 依赖实现组

#### 成员9：Test Agent负责人
**姓名位置**：_____________
**技能要求**：中等，细心
**工作时间**：Day 8-10（实现组完成后开始）
**主要职责**：
- 实现 Test Agent
- 设计测试用例生成
- 实现测试报告

**交付物**：
- [ ] test_agent.py
- [ ] 测试用例模板

**依赖**：
- **需要**：Backend、Frontend 的代码输出
- **被需要**：QA Agent

**时间安排**：
- Day 8-9：等待代码完成
- Day 9-10：开发 Test Agent

---

#### 成员10：QA Agent + Documentation Agent
**姓名位置**：_____________
**技能要求**：中等
**工作时间**：Day 10-12（测试组完成后开始）
**主要职责**：
- 实现 QA Agent
- 实现 Documentation Agent
- 整合所有产出

**交付物**：
- [ ] qa_agent.py
- [ ] documentation_agent.py
- [ ] 最终交付物

**依赖**：
- **需要**：所有 Agent 的产出
- **被需要**：无（最后完成）

**时间安排**：
- Day 10-12：等待所有人完成

---

## 并行开发策略

### 时间轴甘特图

```
Day:  1   2   3   4   5   6   7   8   9   10  11  12
      │   │   │   │   │   │   │   │   │   │   │   │
──────┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴─────
接口组 ██                                    [完成]
      │
需求组     ████████
      ├─Requirements (成员2)
      └─UI Designer   (成员3)
      │
架构组          ██████████
      ├─Architecture (成员4)
      └─Frontend     (成员5)
      │
实现组              ████████████
      ├─Backend (成员6,7,8)
      │
测试组                      ██████
      ├─Test         (成员9)
      └─QA+Doc       (成员10)
```

### 关键策略

#### 策略1：接口冻结（Day 1-2）
```python
# Day 1-2：所有人参与（或接口设计师独立）
# 定义好 State 结构和接口契约

# types.py（一旦定义，不再修改）
class MonopolyState(TypedDict):
    # 需求阶段
    prd_text: str
    prd_data: dict

    # 架构阶段
    architecture_text: str
    architecture_data: dict

    # UI阶段
    ui_text: str
    ui_data: dict

    # ... 等等

# 接口契约（一旦定义，不再修改）
CONTRACT = {
    "requirements": {
        "output": "prd_text, prd_data",
        "format": "Markdown + JSON"
    },
    "architecture": {
        "input": "prd_text, prd_data",
        "output": "architecture_text, architecture_data"
    }
    # ...
}
```

**好处**：
- 后续开发基于接口，不依赖具体实现
- 可以并行开发

---

#### 策略2：Mock先行（Day 3-4）
```python
# 在依赖的Agent未完成时，使用Mock数据

# backend_agent.py 可以先这样开发
def backend_agent(state):
    # 先用Mock数据开发
    mock_architecture = load_mock("architecture_mock.json")

    # 基于Mock开发逻辑
    prompt = f"基于以下架构生成代码：{mock_architecture}"

    # 等真实的Architecture完成后，替换Mock
    return state

# advantage：
# Backend组不等Architecture完成就可以开始
# 只需要最后一天对接真实数据
```

---

#### 策略3：增量集成（每2天一次）
```python
# Day 2：集成 Requirements + UI
# Day 4：集成 Architecture
# Day 6：集成 Backend
# Day 8：集成 Test
# Day 10：集成 QA
# Day 12：完整集成

# 每次集成只涉及新增的Agent
# 降低集成复杂度
```

---

## 接口契约

### State结构（Day 1-2定义，不可变更）

```python
class MonopolyAgentState(TypedDict):
    """在线大富翁项目Agent状态（所有人遵守）"""

    # 基础字段
    messages: Annotated[Sequence[BaseMessage], add]
    current_agent: str

    # === 需求阶段 ===
    prd_text: str          # PRD文档（Markdown）
    prd_data: PrdData      # PRD数据（结构化）

    # === 架构阶段 ===
    architecture_text: str        # 架构文档（Markdown）
    architecture_data: ArchData   # 架构数据（结构化）

    # === UI阶段 ===
    ui_text: str            # UI文档（Markdown）
    ui_data: UIData         # UI数据（结构化）

    # === 编码阶段 ===
    backend_code: str       # 后端代码
    backend_details: dict   # 后端技术细节
    frontend_code: str      # 前端代码
    frontend_details: dict  # 前端技术细节

    # === 测试阶段 ===
    test_cases: list        # 测试用例
    test_report: dict       # 测试报告

    # === QA阶段 ===
    qa_reviews: dict        # 评审意见
    final_report: str       # 验收报告

    # === 流程控制 ===
    human_feedback: list[str]  # 人工反馈历史
    iteration_count: int       # 迭代次数
```

---

### 数据契约（接口规范）

#### Requirements → Architecture

```python
# Requirements 输出格式
{
    "prd_text": str,    # 完整PRD文档（Markdown）
    "prd_data": {
        "product_name": str,
        "features": List[str],      # 17个功能
        "target_users": str,
        "success_criteria": List[str]
    }
}

# Architecture 输入格式（必须适配）
def architecture_agent(state):
    # 读取Requirements的输出
    prd_text = state["prd_text"]
    prd_data = state["prd_data"]

    # 必须验证输入
    assert "features" in prd_data
    assert len(prd_data["features"]) > 0

    # 生成架构
    ...
```

---

#### Architecture → Backend

```python
# Architecture 输出格式
{
    "architecture_text": str,
    "architecture_data": {
        "tech_stack": List[str],      # ["Node.js", "Socket.io"]
        "components": List[dict],     # 组件列表
        "api_design": List[dict],     # API接口
        "database_design": dict       # 数据库设计
    }
}

# Backend 输入格式（必须适配）
def backend_agent(state):
    # 读取Architecture的输出
    arch_text = state["architecture_text"]
    arch_data = state["architecture_data"]

    # 必须验证输入
    assert "tech_stack" in arch_data
    assert "api_design" in arch_data

    # 生成代码
    ...
```

---

### 接口文档模板

每个Agent需要提供：

```markdown
# XX Agent 接口文档

## 输入要求
- 必需字段：xxx
- 可选字段：yyy
- 格式要求：zzz

## 输出格式
```json
{
    "field1": "type1",
    "field2": "type2"
}
```

## 错误处理
- 如果输入不符合要求：raise ValueError("...")
```

---

## 时间节点

### Week 1：接口与需求

| Day | 任务 | 负责人 | 产出 |
|-----|------|--------|------|
| 1-2 | 定义接口 | 成员1 | types.py, 接口文档 |
| 1-5 | Requirements | 成员2 | requirements_agent.py |
| 1-5 | UI Designer | 成员3 | ui_designer_agent.py |

**里程碑**（Day 5）：需求阶段完成

---

### Week 2：架构与实现

| Day | 任务 | 负责人 | 产出 |
|-----|------|--------|------|
| 3-7 | Architecture | 成员4 | architecture_agent.py |
| 3-7 | Frontend | 成员5 | frontend_agent.py |
| 5-9 | Backend | 成员6,7,8 | backend_agent.py |

**里程碑**（Day 9）：编码阶段完成

---

### Week 3：测试与质量

| Day | 任务 | 负责人 | 产出 |
|-----|------|--------|------|
| 8-10 | Test | 成员9 | test_agent.py |
| 10-12 | QA + Documentation | 成员10 | qa_agent.py, documentation_agent.py |
| 12 | 整合测试 | 全员 | 完整流程 |

**里程碑**（Day 12）：项目完成

---

## 依赖关系矩阵

| Agent | 依赖 | 被依赖 | 等待时间 |
|-------|------|--------|---------|
| 接口定义 | 无 | 所有 | 0天 |
| Requirements | 接口 | 架构组 | 0天 |
| UI Designer | 接口 | Frontend | 0天 |
| Architecture | Requirements | 实现 | 2天 |
| Frontend | Architecture+UI | 测试 | 2天 |
| Backend | Architecture | 测试 | 2天 |
| Test | Backend+Frontend | QA | 1天 |
| QA+Doc | 所有 | 无 | 2天 |

**最大等待时间**：2天（通过Mock可以减少到0天）

---

## 风险与应对

### 风险1：接口定义不合理

**风险**：前期定义的接口后期无法使用

**应对**：
- Day 1所有人参与接口设计（1小时会议）
- 成员2（Requirements）和成员4（Architecture）重点参与
- 预留接口调整空间

---

### 风险2：Backend难度太高

**风险**：Backend 3人仍无法完成

**应对**：
- 技术负责人（如果另有安排）或 成员4（Architecture）支持
- 简化功能（先基础版）
- 延长2天时间

---

### 风险3：依赖的Agent延期

**风险**：Architecture延期，导致Backend无法开始

**应对**：
- 使用Mock数据（策略2）
- Backend组提前开发框架
- 只在最后一天对接真实数据

---

## 优势总结

✅ **最小化等待时间**
- 接口定义后，各组可并行开发
- 最大等待时间：2天
- 使用Mock可降为0天

✅ **降低依赖风险**
- 依赖的Agent延期，不影响当前Agent开发
- 只需最后对接时调整

✅ **提高并行度**
- 5个小组可同时工作
- 充分利用10人团队

✅ **职责清晰**
- 每个Agent有明确的负责人
- 依赖关系一目了然

---

## 附录：快速启动

### Day 1：接口定义会议（1小时）

**参会**：全员
**议程**：
1. 成员1介绍State设计方案（15分钟）
2. 讨论（30分钟）
3. 确认最终方案（15分钟）

**产出**：
- types.py（定稿）
- 接口契约文档（定稿）

---

### Day 2：接口冻结

**原则**：
- Day 2结束后，接口不再修改
- 如必须修改，所有人投票表决
- 后续所有开发基于冻结的接口

---

### Day 3开始：并行开发

各小组按照分工，并行开发各自的Agent。

---

**文档版本**：v2.0
**创建日期**：2026-04-22
**核心改进**：最小化依赖、并行开发
