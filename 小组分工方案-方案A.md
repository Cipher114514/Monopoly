# 在线大富翁 Agent 团队分工方案（10人版 - 方案A）

## 📋 文档信息
- **版本**: v3.0
- **创建日期**: 2026-04-23
- **设计原则**: 最小化依赖 + 严格对应9阶段Workflow
- **智能体来源**: agency-agents-zh 精选9个

---

## 目录
1. [设计原则](#设计原则)
2. [团队结构](#团队结构)
3. [Workflow与智能体映射](#workflow与智能体映射)
4. [详细分工](#详细分工)
5. [并行开发策略](#并行开发策略)
6. [时间节点](#时间节点)

---

## 设计原则

### 核心思想：接口先行 + 并行开发

```
传统瀑布（串行依赖）：
PM → Requirements → Architecture → Design → Coding → Review → Test → QA → Doc
 ↓        ↓             ↓             ↓         ↓        ↓       ↓     ↓     ↓
15天   阻塞2天       阻塞2天        阻塞2天    阻塞3天   阻塞1天  阻塞2天 阻塞1天 阻塞2天
└────────────────────────────────────────────────────────────────────────→ 30天

新方案（最小依赖）：
┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐
│前期准备│  │需求设计│  │架构设计│  │开发测试│
│  (1人) │  │  (2人) │  │  (2人) │  │  (4人) │
│ Day1-2 │  │ Day1-5 │  │ Day3-7 │  │ Day5-10│
└────────┘  └────────┘  └────────┘  └────────┘
     │            │            │            │
     └────────────┴────────────┴────────────┴────────→ 10天完成
```

### 三大策略

#### 策略1：接口冻结（Day 1-2）
- 定义 State 结构
- 定义数据契约
- 定义 Mock 数据
- 一旦定义，不再修改

#### 策略2：Mock 先行（Day 3-4）
- 所有 Agent 基于 Mock 开发
- 不等待上游 Agent 完成
- 最后 1 天对接真实数据

#### 策略3：增量集成（每2天）
- Day 2: 集成 PM + Requirements
- Day 4: 集成 Architecture + Design
- Day 6: 集成 Coding + Review
- Day 8: 集成 Test + QA
- Day 10: 完整集成 + Documentation

---

## 团队结构

### 五个独立小组（按并行层级）

```
┌─────────────────────────────────────────────────────────┐
│              前期准备组（1人）                          │
│  职责：定义State结构、接口契约、Mock数据                 │
│  产出：types.py, contract.md, mock_data.py             │
│  时间：Day 1-2（完成后退出）                            │
└─────────────────────────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ↓               ↓               ↓
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ 需求组（2人）│  │ 架构组（2人）│  │ 实现组（4人）│
├──────────────┤  ├──────────────┤  ├──────────────┤
│- PM          │  │- Architecture│  │- Coding (3人)│
│- Requirements│  │- Design      │  │- Review      │
└──────────────┘  └──────────────┘  │- Test        │
      ↓                 ↓           │- QA+Doc      │
┌────────────────────────────────────┴──────────────┐
│              质量组（1人 - 从实现组抽调）          │
├──────────────────────────────────────────────────┤
│- QA + Documentation（最后2天独立负责）            │
└──────────────────────────────────────────────────┘
```

---

## Workflow与智能体映射

### 9 阶段 Workflow 对应表

| 阶段 | Workflow名称 | 对应智能体 | 智能体文件 | 负责人 | 工作时间 |
|-----|-------------|-----------|-----------|--------|---------|
| 阶段1 | PM Agent | **产品经理** | `product/product-manager.md` | 成员2 | Day 1-5 |
| 阶段2 | Requirements Agent | **Sprint排序师** | `product/product-sprint-prioritizer.md` | 成员3 | Day 1-5 |
| 阶段3 | Architecture Agent | **后端架构师** | `engineering/engineering-backend-architect.md` | 成员4 | Day 3-7 |
| 阶段4 | Design Agent | **软件架构师** | `engineering/engineering-software-architect.md` | 成员5 | Day 3-7 |
| 阶段5 | Coding Agent | **高级开发者** | `engineering/engineering-senior-developer.md` | 成员5,6,7 | Day 5-9 |
| 阶段6 | Code Review Agent | **代码审查员** | `engineering/engineering-code-reviewer.md` | 成员8 | Day 7-9 |
| 阶段7 | Testing Agent | **证据收集者** | `testing/testing-evidence-collector.md` | 成员9 | Day 8-10 |
| 阶段8 | QA Agent | **现实检验者** | `testing/testing-reality-checker.md` | 成员10 | Day 9-10 |
| 阶段9 | Documentation Agent | **技术文档工程师** | `engineering/engineering-technical-writer.md` | 成员10 | Day 9-10 |

### 智能体功能说明

#### 阶段1-2：需求分析
- **产品经理**：需求分析、PRD编写、产品规划
- **Sprint排序师**：任务分解、优先级排序、迭代规划

#### 阶段3-4：架构设计
- **后端架构师**：数据库设计、API架构、可扩展性
- **软件架构师**：系统设计、架构模式、技术选型

#### 阶段5-6：开发与审查
- **高级开发者**：全栈开发（前端+后端）、核心逻辑
- **代码审查员**：代码质量、性能、安全审查

#### 阶段7-9：测试与交付
- **证据收集者**：测试执行、证据收集、测试报告
- **现实检验者**：质量把关、防止虚假、验收标准
- **技术文档工程师**：文档编写、交付物整理

---

## 详细分工

### 🔵 前期准备组（1人）- 独立

#### 成员1：接口设计师
**技能要求**：中等，细心，有设计思维
**工作时间**：Day 1-2
**主要职责**：
- 定义完整的 State 结构（包含9个阶段的字段）
- 定义各 Agent 之间的数据契约
- 编写接口文档
- 提供 Mock 数据生成器

**交付物**：
- [ ] `types.py` - 完整的State定义
- [ ] `contract.md` - 接口契约文档
- [ ] `mock_data.py` - Mock数据生成
- [ ] `interface_example.md` - 接口使用示例

**依赖关系**：
- **输入**：无（独立设计）
- **输出**：给所有人提供接口定义和Mock数据

**为什么独立**：
- 只在前期工作2天
- 定义完接口后就基本不需要了
- 不依赖任何人，别人也不依赖他

---

### 🟢 需求组（2人）- 并行

#### 成员2：PM Agent 负责人
**对应阶段**：阶段1
**对应智能体**：产品经理
**技能要求**：中等，产品思维
**工作时间**：Day 1-5
**主要职责**：
- 实现 PM Agent
- 设计产品经理提示词
- 实现 PRD 生成逻辑
- 基于《在线大富翁软件需求规格说明书.md》生成PRD

**交付物**：
- [ ] `pm_agent.py`
- [ ] `prompts/pm_prompt.md`
- [ ] PRD 文档示例

**依赖**：
- **需要**：接口定义（State中的prd字段）
- **被需要**：架构组

**并行策略**：
- 与 Sprint 排序师并行开发
- 不互相依赖

---

#### 成员3：Requirements Agent 负责人
**对应阶段**：阶段2
**对应智能体**：Sprint排序师
**技能要求**：中等，需求分析能力
**工作时间**：Day 1-5
**主要职责**：
- 实现 Requirements Agent
- 设计 Sprint 排序提示词
- 实现任务分解逻辑
- 将 PRD 转化为可执行任务列表

**交付物**：
- [ ] `requirements_agent.py`
- [ ] `prompts/requirements_prompt.md`
- [ ] 任务列表示例

**依赖**：
- **需要**：接口定义（State中的tasks字段）+ PM Agent的输出（PRD）
- **被需要**：架构组

**并行策略**：
- 与 PM 并行开发
- 使用 Mock PRD 开发
- Day 3-5 对接真实 PRD

---

### 🟡 架构组（2人）- 相对独立

#### 成员4：Architecture Agent 负责人
**对应阶段**：阶段3
**对应智能体**：后端架构师
**技能要求**：高，系统设计能力
**工作时间**：Day 3-7
**主要职责**：
- 实现 Architecture Agent
- 设计后端架构提示词
- 实现数据库架构生成
- 实现API接口设计

**交付物**：
- [ ] `architecture_agent.py`
- [ ] `prompts/architecture_prompt.md`
- [ ] 数据库设计示例
- [ ] API 文档示例

**依赖**：
- **需要**：PM Agent的输出（PRD）
- **被需要**：Design Agent、Coding Agent

**时间安排**：
- Day 3-4：使用 Mock PRD 开发框架
- Day 5-7：对接真实 PRD

---

#### 成员5：Design Agent 负责人（兼顾 Coding）
**对应阶段**：阶段4
**对应智能体**：软件架构师
**技能要求**：高，架构设计能力
**工作时间**：Day 3-9
**主要职责**：
- Day 3-7: 实现 Design Agent（阶段4）
- Day 5-9: 参与 Coding Agent（阶段5）

**阶段4职责**：
- 实现 Design Agent
- 设计软件架构提示词
- 实现系统架构设计
- 实现技术选型分析

**阶段5职责**：
- 参与 Coding Agent 开发（高级开发者-全栈）

**交付物**：
- [ ] `design_agent.py`
- [ ] `prompts/design_prompt.md`
- [ ] 系统架构文档示例
- [ ] 参与 `coding_agent.py` 开发

**依赖**：
- **需要**：Architecture Agent的输出
- **被需要**：Coding Agent

---

### 🔴 实现组（4人）- 协作

#### 成员5、6、7：Coding Agent（3人协作）
**对应阶段**：阶段5
**对应智能体**：高级开发者
**技能要求**：高，全栈开发能力
**工作时间**：Day 5-9
**主要职责**：
- 共同实现 Coding Agent
- 设计全栈开发提示词
- 实现代码生成逻辑
- 实现前端和后端代码生成

**分工**：
- 成员5：核心逻辑、WebSocket通信（兼顾Design Agent）
- 成员6：前端代码生成、UI实现
- 成员7：后端代码生成、数据库操作

**交付物**：
- [ ] `coding_agent.py`
- [ ] `prompts/coding_prompt.md`（3份）
- [ ] 前端代码示例
- [ ] 后端代码示例

**依赖**：
- **需要**：Design Agent的输出 + Architecture Agent的输出
- **被需要**：Code Review Agent、Test Agent

**时间安排**：
- Day 5-6：使用 Mock 架构开发框架
- Day 7-9：对接真实架构

**为什么3人**：
- Coding 最复杂（前端+后端）
- 需要互相协作和支持
- 降低单点风险

---

#### 成员8：Code Review Agent 负责人
**对应阶段**：阶段6
**对应智能体**：代码审查员
**技能要求**：高，代码审查能力
**工作时间**：Day 7-9
**主要职责**：
- 实现 Code Review Agent
- 设计代码审查提示词
- 实现代码质量检查
- 实现性能、安全审查

**交付物**：
- [ ] `code_review_agent.py`
- [ ] `prompts/code_review_prompt.md`
- [ ] 审查报告示例

**依赖**：
- **需要**：Coding Agent的代码输出
- **被需要**：Test Agent

**时间安排**：
- Day 7-8：等待代码完成
- Day 8-9：开发 Code Review Agent

---

### 🟣 质量组（2人）- 收尾

#### 成员9：Test Agent 负责人
**对应阶段**：阶段7
**对应智能体**：证据收集者
**技能要求**：中等，细心
**工作时间**：Day 8-10
**主要职责**：
- 实现 Test Agent
- 设计测试用例生成提示词
- 实现测试执行逻辑
- 实现测试报告生成

**交付物**：
- [ ] `testing_agent.py`
- [ ] `prompts/testing_prompt.md`
- [ ] 测试用例示例
- [ ] 测试报告示例

**依赖**：
- **需要**：Coding Agent、Code Review Agent的代码输出
- **被需要**：QA Agent

**时间安排**：
- Day 8-9：等待代码和审查完成
- Day 9-10：开发 Test Agent

---

#### 成员10：QA + Documentation Agent（兼顾）
**对应阶段**：阶段8 + 阶段9
**对应智能体**：现实检验者 + 技术文档工程师
**技能要求**：中等
**工作时间**：Day 9-10
**主要职责**：
- 实现 QA Agent（阶段8）
- 实现 Documentation Agent（阶段9）
- 整合所有产出

**交付物**：
- [ ] `qa_agent.py`
- [ ] `documentation_agent.py`
- [ ] `prompts/qa_prompt.md`
- [ ] `prompts/documentation_prompt.md`
- [ ] 最终交付物

**依赖**：
- **需要**：所有 Agent 的产出
- **被需要**：无（最后完成）

**时间安排**：
- Day 9-10：等待所有人完成

---

## 并行开发策略

### 时间轴甘特图

```
Day:  1   2   3   4   5   6   7   8   9   10
      │   │   │   │   │   │   │   │   │   │
──────┴───┴───┴───┴───┴───┴───┴───┴───┴───┴─────
准备组 ██                                    [完成]
      │
需求组     ████████
      ├─PM           (成员2)
      └─Requirements  (成员3)
      │
架构组          ██████████
      ├─Architecture (成员4)
      └─Design       (成员5→兼顾Coding)
      │
实现组              ████████████
      ├─Coding (成员5,6,7)
      └─Review (成员8)
      │
质量组                      ██████
      ├─Test         (成员9)
      └─QA+Doc       (成员10)
```

---

### 关键策略

#### 策略1：接口冻结（Day 1-2）

**原则**：
- Day 1: 成员1设计 State 结构，全员讨论确认
- Day 2: 接口冻结，不再修改

**State 结构示例**：
```python
# types.py（一旦定义，不再修改）
class AgentState(TypedDict):
    # 基础字段
    messages: Annotated[Sequence[BaseMessage], add]
    current_agent: str

    # 阶段1-2: PM + Requirements
    prd: dict           # 产品经理输出
    tasks: list         # Sprint排序师输出

    # 阶段3-4: Architecture + Design
    architecture: dict  # 后端架构师输出
    design: dict        # 软件架构师输出

    # 阶段5-6: Coding + Review
    code: dict          # 高级开发者输出
    review: dict        # 代码审查员输出

    # 阶段7-9: Test + QA + Doc
    test_results: dict  # 证据收集者输出
    qa_report: dict     # 现实检验者输出
    documentation: dict # 技术文档工程师输出

    # 辅助字段
    memory_context: str
    skill_results: list[str]
    validation_status: list[str]
```

**好处**：
- 后续开发基于接口，不依赖具体实现
- 可以并行开发
- 降低依赖风险

---

#### 策略2：Mock 先行（Day 3-6）

**原则**：
- 所有 Agent 使用 Mock 数据开发
- 不等待上游 Agent 完成
- 最后 1-2 天对接真实数据

**Mock 数据示例**：
```python
# mock_data.py
MOCK_PRD = {
    "product_name": "在线大富翁",
    "features": ["用户注册", "游戏房间", "实时对战", ...],
    ...
}

MOCK_ARCHITECTURE = {
    "tech_stack": ["Node.js", "Socket.io", "React"],
    "database": "PostgreSQL",
    ...
}

# 使用示例
def pm_agent(state):
    # 先用Mock开发
    # state["prd"] = generate_prd(MOCK_REQUIREMENTS)

    # 等真实输入可用时，替换Mock
    state["prd"] = generate_prd(state.get("user_requirement"))
    return state
```

**好处**：
- 不阻塞开发
- 最大并行度
- 降低依赖延期风险

---

#### 策略3：增量集成（每2天）

**集成节奏**：
- Day 2: 集成 PM + Requirements
- Day 4: 集成 Architecture + Design
- Day 6: 集成 Coding（框架）
- Day 8: 集成 Review + Test
- Day 10: 完整集成 + QA + Documentation

**每次集成只涉及新增的Agent**：
```bash
# Day 2 集成
python workflow.py --stages pm,requirements

# Day 4 集成
python workflow.py --stages pm,requirements,architecture,design

# Day 6 集成
python workflow.py --stages pm,requirements,architecture,design,coding

# Day 8 集成
python workflow.py --stages all --exclude qa,documentation

# Day 10 完整集成
python workflow.py --stages all
```

**好处**：
- 降低集成复杂度
- 早期发现问题
- 降低最后集成风险

---

## 时间节点

### Week 1：接口与需求

| Day | 任务 | 负责人 | 产出 | 里程碑 |
|-----|------|--------|------|--------|
| 1-2 | 定义接口 | 成员1 | types.py, contract.md, mock_data.py | ✅ 接口冻结 |
| 1-5 | PM Agent | 成员2 | pm_agent.py | 需求阶段 |
| 1-5 | Requirements Agent | 成员3 | requirements_agent.py | 需求阶段 |

**里程碑**（Day 5）：需求阶段完成，集成 PM + Requirements

---

### Week 2：架构与实现

| Day | 任务 | 负责人 | 产出 | 里程碑 |
|-----|------|--------|------|--------|
| 3-7 | Architecture Agent | 成员4 | architecture_agent.py | 架构阶段 |
| 3-7 | Design Agent | 成员5 | design_agent.py | 设计阶段 |
| 5-9 | Coding Agent | 成员5,6,7 | coding_agent.py | 开发阶段 |
| 7-9 | Code Review Agent | 成员8 | code_review_agent.py | 审查阶段 |

**里程碑**（Day 7）：架构设计完成，集成 Architecture + Design
**里程碑**（Day 9）：开发完成，集成 Coding + Review

---

### Week 3：测试与交付

| Day | 任务 | 负责人 | 产出 | 里程碑 |
|-----|------|--------|------|--------|
| 8-10 | Test Agent | 成员9 | testing_agent.py | 测试阶段 |
| 9-10 | QA Agent | 成员10 | qa_agent.py | 质量保障 |
| 9-10 | Documentation Agent | 成员10 | documentation_agent.py | 文档交付 |
| 10 | 完整集成 | 全员 | 完整workflow | ✅ 项目完成 |

**里程碑**（Day 10）：项目完成，演示答辩

---

## 依赖关系矩阵

| Agent | 依赖 | 被依赖 | 等待时间 | 并行策略 |
|-------|------|--------|---------|---------|
| 接口定义 | 无 | 所有 | 0天 | 独立 |
| PM | 接口 | Requirements, Architecture | 0天 | 并行 |
| Requirements | 接口+PM | Architecture | 0天 | Mock先行 |
| Architecture | 接口+PM | Design, Coding | 0天 | Mock先行 |
| Design | 接口+Architecture | Coding | 0天 | Mock先行 |
| Coding | 接口+Architecture+Design | Review, Test | 0天 | Mock先行 |
| Review | 接口+Coding | Test | 1天 | 并行框架 |
| Test | 接口+Coding+Review | QA | 0天 | 并行框架 |
| QA | 接口+所有 | Documentation | 0天 | 并行 |
| Documentation | 接口+所有 | 无 | 0天 | 并行 |

**最大等待时间**：1天（通过Mock可以减少到0天）

---

## 风险与应对

### 风险1：接口定义不合理

**风险**：前期定义的接口后期无法使用

**应对**：
- Day 1 全员参与接口设计（1小时会议）
- 成员1（接口设计师）主导，成员2（PM）、成员4（Architecture）重点参与
- 预留接口调整空间
- 使用灵活的数据结构（dict、list）

---

### 风险2：Coding 难度太高

**风险**：3人仍无法完成全栈开发

**应对**：
- 成员5（Design）兼顾 Coding，增加人力
- 简化功能（先基础版）
- 使用模板生成（AI辅助）
- 延长1-2天时间

---

### 风险3：依赖的 Agent 延期

**风险**：Design 延期，导致 Coding 无法开始

**应对**：
- 使用 Mock 数据（策略2）
- Coding 组提前开发框架
- 只在最后 1 天对接真实数据

---

### 风险4：成员10 工作过重

**风险**：QA + Documentation 两个 Agent，时间不够

**应对**：
- 从 Coding 组抽调 1 人协助（Day 9-10）
- 使用 AI 生成文档框架
- 优先 QA，文档可以后期补

---

## 优势总结

✅ **最小化等待时间**
- 接口定义后，各组可并行开发
- 最大等待时间：1天
- 使用 Mock 可降为 0天

✅ **降低依赖风险**
- 依赖的 Agent 延期，不影响当前 Agent 开发
- 只需最后对接时调整

✅ **提高并行度**
- 5 个小组可同时工作
- 充分利用 10 人团队

✅ **职责清晰**
- 每个 Agent 有明确的负责人
- 依赖关系一目了然

✅ **严格对应 Workflow**
- 9 个阶段 = 9 个智能体
- 完美匹配瀑布模型
- 符合课程要求

---

## 附录：快速启动

### Day 1：接口定义会议（1小时）

**参会**：全员
**议程**：
1. 成员1介绍 State 设计方案（15分钟）
2. 讨论（30分钟）
3. 确认最终方案（15分钟）

**产出**：
- types.py（定稿）
- contract.md（定稿）
- mock_data.py（初稿）

---

### Day 2：接口冻结

**原则**：
- Day 2 结束后，接口不再修改
- 如必须修改，全员投票表决（2/3同意）
- 后续所有开发基于冻结的接口

**行动**：
- 成员1 完成接口文档
- 成员2-10 熟悉接口定义
- 准备 Mock 数据

---

### Day 3 开始：并行开发

各小组按照分工，并行开发各自的 Agent：
- 需求组（成员2、3）：PM + Requirements
- 架构组（成员4、5）：Architecture + Design
- 实现组（成员5-8）：Coding + Review
- 质量组（成员9、10）：Test + QA + Documentation

---

## 与 Workflow 的完美对应

```
┌────────────────────────────────────────────────────────┐
│                  9 阶段瀑布流程                         │
├────────────────────────────────────────────────────────┤
│                                                        │
│  ┌────────┐  ┌──────────┐  ┌──────────┐              │
│  │  PM    │→ │Requirements│→ │Architecture│            │
│  │(成员2) │  │  (成员3)   │  │  (成员4)   │            │
│  └────────┘  └──────────┘  └──────────┘              │
│                                                │       │
│                                        ┌───────▼───────┐│
│  ┌──────────┐  ┌──────────┐  │   Design    ││
│  │  QA      │← │  Test    │← │  (成员5)    ││
│  │(成员10) │  │ (成员9)   │  └─────────────┘│
│  └──────────┘  └──────────┘          │       │
│       ▲             ▲         ┌───────▼───────┐│
│       │             │         │   Coding      ││
│  ┌────┴─────┐  ┌──┴──────┐  │ (成员5,6,7)  ││
│  │Documentation│ Review  │  └──────────────┘│
│  │ (成员10) │  │(成员8)  │          │        │
│  └──────────┘  └─────────┘          │        │
│       ▲             ▲         ┌──────▼────────┘
│       │             │         │
│       └─────────────┴─────────┴── 完美对应！
│
└────────────────────────────────────────────────────────┘
```

---

**文档版本**：v3.0
**创建日期**：2026-04-23
**核心改进**：方案A + 最小化依赖 + 严格对应9阶段
