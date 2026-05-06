# 在线大富翁游戏 - Agent协作开发项目

基于 LangChain/LangGraph 的多智能体协作系统，用于完整的软件项目开发。本项目为2周课程作业，严格贴合《在线大富翁软件需求规格说明书》。

## 📋 项目概述

### 项目背景
- **项目类型**: 2周课程作业（非商业项目）
- **开发团队**: 3-4人大学生团队
- **目标用户**: 18-22岁大学生
- **核心目标**: 实现完整的17个功能需求和9个核心游戏规则

### 核心特性
- ✅ **完整的瀑布流**: 覆盖软件开发的完整生命周期（9个Agent）
- ✅ **专业智能体**: 每个阶段都有专门的智能体负责
- ✅ **严格需求贴合**: 100%覆盖17个功能需求和9个核心游戏规则
- ✅ **完整产出**: Mock数据、Prompt模板、测试模板、QA评审模板
- ✅ **2周时间规划**: 总工时116小时，16个任务，适合3-4人团队

### 质量评估
- **功能完成度**: 85%
- **需求贴合度**: 85%
- **整体评级**: B+（良好）
- **答辩状态**: 可以参加答辩

---

## 🎯 17个功能需求（FR）

本项目严格实现《在线大富翁软件需求规格说明书》的所有功能需求：

1. **FR-001**: 用户注册与登录
2. **FR-002**: 创建游戏房间
3. **FR-003**: 加入游戏房间
4. **FR-004**: 开始游戏
5. **FR-005**: 掷骰子移动
6. **FR-006**: 购买地产
7. **FR-007**: 支付过路费
8. **FR-008**: 建设房屋与酒店
9. **FR-009**: 抽取机会/命运卡
10. **FR-010**: 回合管理
11. **FR-011**: 聊天系统
12. **FR-012**: 表情互动
13. **FR-013**: 游戏结束判定
14. **FR-014**: 破产判定与处理
15. **FR-015**: 地产赎回功能
16. **FR-016**: AI玩家功能
17. **FR-017**: 历史记录与回放

---

## 🎮 9个核心游戏规则

所有Mock数据和Prompt都严格遵循以下核心游戏规则：

1. **起点规则**: 路过起点发钱，停在起点不发钱
2. **盖房规则**: 只能在停着的普通地产上盖房
3. **特殊地块**: 特殊地块（电站、车站、水厂）不能盖房
4. **升级顺序**: 空地 → 房子 → 2房子 → 旅馆
5. **抵押限制**: 有建筑的土地不能抵押
6. **过路费**: 抵押期间不收过路费
7. **破产处理**: 先变卖资产（房子半价、土地半价抵押），仍不够才破产
8. **卡牌循环**: 按队列顺序拿卡，执行后移至队尾（循环）
9. **坐牢规则**: 进牢格：直接移动到坐牢格，暂停1回合；坐牢格：路过无惩罚

---

## 🏗️ 9个Agent工作流

```
┌──────────────┐
│ 阶段1: PM    │ → PRD（17个FR + 9个核心规则）
│    产品经理   │
└──────┬───────┘
       │
       ↓
┌──────────────┐
│ 阶段2:       │ → 任务列表（16任务，116小时）
│ Requirements │
└──────┬───────┘
       │
       ↓
┌──────────────┐
│ 阶段3:       │ → 架构设计（7张表 + API）
│ Architecture │
└──────┬───────┘
       │
       ↓
┌──────────────┐
│ 阶段4:       │ → 系统设计（ADR + 核心算法）
│    Design    │
└──────┬───────┘
       │
       ↓
┌──────────────┐
│ 阶段5:       │ → 代码实现（15后端 + 10前端）
│    Coding    │
└──────┬───────┘
       │
       ↓
┌──────────────┐
│ 阶段6:       │ → 代码审查（4个问题 + 改进建议）
│Code Review   │
└──────┬───────┘
       │
       ↓
┌──────────────┐
│ 阶段7:       │ → 测试报告（85.7%通过率 + 3个Bug）
│   Testing    │
└──────┬───────┘
       │
       ↓
┌──────────────┐
│ 阶段8:       │ → QA评估（B+评级 + 答辩建议）
│     QA       │
└──────┬───────┘
       │
       ↓
┌──────────────┐
│ 阶段9:       │ → 技术文档（6个文档 + 5000字）
│Documentation │
└──────────────┘
```

---

## 📁 项目文件结构

```
agent-monopoly/
├── mock/                          # Mock数据模块（前期准备组产出）
│   ├── __init__.py               # 模块初始化
│   ├── initial_state.py          # 初始状态（17个FR）
│   ├── pm_agent.py               # PM Agent - PRD
│   ├── requirements_agent.py     # Requirements Agent - 任务列表
│   ├── architecture_agent.py     # Architecture Agent - 架构设计
│   ├── design_agent.py           # Design Agent - 系统设计
│   ├── coding_agent.py           # Coding Agent - 代码实现
│   ├── code_review_agent.py      # Code Review Agent - 审查报告
│   ├── testing_agent.py          # Testing Agent - 测试报告
│   ├── qa_agent.py               # QA Agent - 质量评估
│   └── documentation_agent.py    # Documentation Agent - 技术文档
│
├── prompts/                       # Prompt模板（前期准备组产出）
│   ├── agent_prompts.md          # 9个Agent的Prompt模板
│   ├── test_cases_template.md    # 测试用例模板
│   ├── test_report_template.md    # 测试报告模板
│   └── qa_review_template.md     # 质量评审模板
│
├── types.py                       # State结构定义
├── contract.md                   # 接口契约文档
├── SKILL.md                      # Agent技能说明
├── DELIVERABLES.md               # 前期准备组产出总结
└── README.md                     # 本文件
```

---

## 🚀 快速开始

### 1. 安装依赖

```bash
pip install langchain langchain-openai langgraph
```

### 2. 使用Mock数据

```python
from agent_monopoly.mock import (
    INITIAL_STATE,
    MOCK_PRD,
    MOCK_TASKS,
    MOCK_ARCHITECTURE,
    MOCK_DESIGN,
    MOCK_CODE,
    MOCK_REVIEW,
    MOCK_TEST_RESULTS,
    MOCK_QA_REPORT,
    MOCK_DOCUMENTATION
)

# 使用初始状态
state = INITIAL_STATE.copy()

# PM Agent处理
state['prd'] = MOCK_PRD

# Requirements Agent处理
state['tasks'] = MOCK_TASKS

# Architecture Agent处理
state['architecture'] = MOCK_ARCHITECTURE

# Design Agent处理
state['design'] = MOCK_DESIGN

# Coding Agent处理
state['code'] = MOCK_CODE

# Code Review Agent处理
state['review'] = MOCK_REVIEW

# Testing Agent处理
state['test_results'] = MOCK_TEST_RESULTS

# QA Agent处理
state['qa_report'] = MOCK_QA_REPORT

# Documentation Agent处理
state['documentation'] = MOCK_DOCUMENTATION
```

### 3. 使用Prompt模板

```python
# 读取Prompt模板
with open('prompts/agent_prompts.md', 'r', encoding='utf-8') as f:
    prompts = f.read()

# 使用特定Agent的Prompt
def extract_section(content, section_title):
    """提取指定章节的内容"""
    lines = content.split('\n')
    start_idx = None
    for i, line in enumerate(lines):
        if f"## {section_title}" in line:
            start_idx = i
            break

    if start_idx is None:
        return ""

    end_idx = start_idx + 1
    for i in range(start_idx + 1, len(lines)):
        if lines[i].startswith("## "):
            end_idx = i
            break

    return '\n'.join(lines[start_idx:end_idx])

# 获取PM Agent的Prompt
pm_prompt = extract_section(prompts, 'PM Agent Prompt')
print(pm_prompt)
```

### 4. 使用测试模板

```python
# 读取测试用例模板
with open('prompts/test_cases_template.md', 'r', encoding='utf-8') as f:
    template = f.read()

# 填写测试用例
def fill_test_case(template, tc_id, actual_result, status):
    """填写测试用例"""
    test_case = template.replace(f'#### TC-{tc_id}:', f'#### TC-{tc_id}:')
    test_case = test_case.replace('**实际结果**: _____', f'**实际结果**: {actual_result}')
    test_case = test_case.replace('**状态**: PASS / FAIL', f'**状态**: {status}')
    return test_case

# 填写测试结果
filled_tc = fill_test_case(template, '005', '玩家资金增加200元', 'PASS')
print(filled_tc)
```

---

## 📊 前期准备组产出总结

### Mock数据模块（mock/）

| 文件 | 内容 | 核心特点 |
|------|------|---------|
| initial_state.py | 项目初始状态 | 包含17个FR的完整描述 |
| pm_agent.py | PRD | 17个FR + 9个核心规则 + 2周规划 |
| requirements_agent.py | 任务列表 | 16任务，116小时，P0/P1优先级 |
| architecture_agent.py | 架构设计 | 7张表 + 完整API + 服务端权威 |
| design_agent.py | 系统设计 | 5个ADR + 4个核心算法 |
| coding_agent.py | 代码实现 | 15后端文件 + 10前端文件 |
| code_review_agent.py | 审查报告 | 4个问题 + 需求贴合度验证 |
| testing_agent.py | 测试报告 | 85.7%通过率 + 3个Bug |
| qa_agent.py | QA评估 | B+评级 + 答辩建议 |
| documentation_agent.py | 技术文档 | 6个文档 + 5000字 |

### Prompt模板（prompts/）

| 文件 | 内容 | 用途 |
|------|------|------|
| agent_prompts.md | 9个Agent的Prompt | 指导LLM生成各阶段输出 |
| test_cases_template.md | 测试用例模板 | 填写实际测试结果 |
| test_report_template.md | 测试报告模板 | 生成标准测试报告 |
| qa_review_template.md | 质量评审模板 | 进行QA评审和答辩准备 |

### 文档

| 文件 | 内容 |
|------|------|
| SKILL.md | 9个Agent的技能说明 + 验证清单 |
| DELIVERABLES.md | 前期准备组产出总结 + 使用指南 |
| contract.md | 接口契约文档 |

---

## 🎯 技术栈

### 后端
- **框架**: Node.js + Express
- **数据库**: SQLite
- **实时通信**: Socket.io
- **架构模式**: 服务端权威（防作弊）

### 前端
- **框架**: React
- **构建工具**: Vite
- **样式**: TailwindCSS
- **状态管理**: React Context

### 开发工具
- **AI框架**: LangChain + LangGraph
- **LLM**: GPT-4 / Claude
- **版本控制**: Git
- **项目管理**: 2周Sprint

---

## 📋 开发时间规划

### 总览
- **总时长**: 2周
- **总工时**: 116小时
- **任务数**: 16个
- **团队规模**: 3-4人

### Sprint规划

#### 第1周（Week 1）
- **Day 1-2**: 基础设施（项目初始化 + 数据库）
- **Day 3-5**: 后端开发（用户 + 房间 + 游戏核心）

#### 第2周（Week 2）
- **Day 1-3**: 前端开发（登录 + 房间 + 游戏界面）
- **Day 4**: 高级功能（AI玩家 + 历史回放）
- **Day 5**: 集成测试 + Bug修复

### 任务优先级
- **P0（必须完成）**: 12个任务
- **P1（应该完成）**: 4个任务

---

## ✅ 验收标准

### 前期准备组
- [x] State结构定义（types.py）
- [x] 接口契约文档（contract.md）
- [x] Mock数据（mock/文件夹，10个文件）
- [x] Prompt模板（prompts/文件夹，4个文件）
- [x] 技能说明（SKILL.md）
- [x] 产出总结（DELIVERABLES.md）

### 开发团队
- [ ] 17个功能需求全部实现
- [ ] 9个核心游戏规则验证通过
- [ ] 通过端到端测试
- [ ] 准备答辩材料

---

## 🎓 答辩准备

### 必须准备材料
1. **演示视频/现场演示**
   - 完整游戏流程演示（15分钟）
   - 核心功能展示
   - 实时通信展示

2. **技术文档**
   - README.md
   - 架构说明
   - API文档
   - 需求贴合说明

3. **答辩PPT**
   - 项目概述（2分钟）
   - 技术架构（3分钟）
   - 核心功能展示（5分钟）
   - 需求贴合度说明（2分钟）
   - 演示Demo（3分钟）

### 强调亮点
1. **功能完整**: 实现了17个功能需求
2. **需求贴合**: 严格贴合需求规格说明书
3. **技术亮点**: 服务端权威、WebSocket实时通信
4. **开发效率**: 2周时间完成
5. **团队协作**: 多Agent协作开发

### 应对提问准备

**Q1: 如何确保贴合需求规格说明书？**
A: 我们按17个功能需求逐项实现，并通过测试验证9个核心规则。

**Q2: 最大的技术挑战是什么？**
A: 游戏状态同步和复杂规则实现，特别是破产处理和卡牌队列。

**Q3: 如何保证游戏公平性？**
A: 采用服务端权威架构，所有游戏逻辑在服务端执行。

**Q4: 如果给你更多时间会怎么改进？**
A: 修复3个逻辑Bug，优化UI，添加更多地图主题。

**Q5: 团队如何协作？**
A: 采用多Agent协作，每个Agent负责不同阶段，定期同步和review。

---

## 📞 联系方式

- **GitHub**: https://github.com/Cipher114514/Monopoly
- **项目仓库**: https://github.com/Cipher114514/Monopoly.git

---

## 📄 许可证

MIT License

---

## 🙏 致谢

本项目基于 [agency-agents-zh-main](https://github.com/miurla/agency-agents-zh-main) 项目，并针对《在线大富翁软件需求规格说明书》进行了完整适配。

---

**前期准备组** ✅ 已完成所有产出！

**开发团队** 🚀 准备开始开发！

**祝答辩成功！** 🎉
