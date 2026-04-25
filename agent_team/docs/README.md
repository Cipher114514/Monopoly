# 需求组交付物总览

## 📦 需求组完整交付物清单

### 成员分配

| 成员 | 角色 | 交付物 |
|------|------|--------|
| 成员2 | Requirements Agent负责人 | requirements_agent.py、requirements_agent_prompts.md |
| 成员3 | UI Designer Agent负责人 | ui_designer_agent.py、ui_designer_agent_prompts.md、ui_reference_guide.md |

---

## 📋 交付物详细说明

### 1️⃣ Python实现文件

#### `agent_team/agents/requirements_agent.py`
**功能**：需求分析Agent实现
**职责**：
- 接收用户需求
- 生成结构化PRD文档
- 集成记忆系统

**输出格式**：
```python
{
    "prd_text": str,        # Markdown格式的PRD文档
    "prd_data": {
        "product_name": str,
        "features": List[str],
        "target_users": str,
        "success_criteria": List[str]
    }
}
```

**技术特点**：
- ✅ 集成LLM调用（智谱GLM-4）
- ✅ JSON解析与错误处理
- ✅ 记忆系统集成
- ✅ 结构化数据验证

---

#### `agent_team/agents/ui_designer_agent.py`
**功能**：UI设计Agent实现
**职责**：
- 基于PRD生成UI设计方案
- 生成颜色方案、页面布局、组件列表
- 定义交互设计

**输出格式**：
```python
{
    "ui_text": str,         # Markdown格式的UI设计文档
    "ui_data": {
        "color_scheme": {
            "primary": "#HEX",
            "secondary": "#HEX",
            "accent": "#HEX",
            "background": "#HEX",
            "text": "#HEX"
        },
        "pages": List[str],
        "components": List[{
            "name": str,
            "type": str,
            "description": str
        }],
        "interactions": List[str]
    }
}
```

**技术特点**：
- ✅ 设计系统理念
- ✅ 无障碍性设计考量
- ✅ 响应式设计支持
- ✅ 完整的组件设计

---

### 2️⃣ 提示词文档

#### `agent_team/docs/requirements_agent_prompts.md`
**内容**：Requirements Agent的提示词设计和演进

**主要章节**：
1. **核心提示词** - 主提示词模板
2. **提示词组件详解** - 每个部分的作用和优化
3. **高级提示词技巧** - Chain-of-Thought、Few-Shot等
4. **常见问题与解决方案** - 实际问题和对策
5. **提示词优化历史** - 版本演进记录
6. **测试结果** - 真实场景的输出质量
7. **最佳实践** - DO和DON'T列表
8. **参考资源** - 外部学习资料

**核心提示词**：
```
你是资深产品经理。
[上下文记忆]
[当前需求]
[任务定义：生成包含product_name、features、target_users、success_criteria的JSON]
[输出格式：纯JSON，无markdown包裹]
```

**关键优化点**：
- 强制结构化JSON输出
- 集成记忆系统上下文
- 明确字段定义和数据类型
- 包含最低质量标准

---

#### `agent_team/docs/ui_designer_agent_prompts.md`
**内容**：UI Designer Agent的提示词设计和最佳实践

**主要章节**：
1. **核心提示词** - 主提示词模板
2. **提示词组件详解** - 角色、产品信息、设计要素、输出格式
3. **高级提示词技巧** - 设计系统指导、用户研究驱动、无障碍优先
4. **常见问题与解决方案** - 页面简陋、颜色不协调、组件不完整等
5. **提示词优化历史** - v1到v4的演进
6. **测试结果** - 游戏UI、企业应用等场景
7. **最佳实践** - 清晰的设计目标、具体的约束等

**核心提示词**：
```
你是资深UI/UX设计师。
[产品信息：名称、功能、目标用户]
[设计要素：颜色方案、页面列表、组件设计、交互设计]
[格式要求：JSON结构，包含color_scheme、pages、components、interactions]
[输出格式：纯JSON，无markdown包裹]
```

**关键优化点**：
- 设计系统思维
- 无障碍性优先
- 颜色理论应用
- 组件完整性检查

---

### 3️⃣ UI参考指南

#### `agent_team/docs/ui_reference_guide.md`
**内容**：完整的UI设计参考资料和最佳实践

**主要章节**：

**第一部分：设计系统基础**
1. **颜色理论**
   - 色彩搭配方案（互补色、类似色、三角形）
   - 颜色在不同场景的应用
   - 色盲友好设计
   - 对比度标准（WCAG）

2. **排版系统**
   - 字体大小层级
   - 推荐字体（web字体、中文字体）
   - 行高和字重规范

3. **间距与布局**
   - 8px栅格系统
   - 响应式断点定义
   - 布局规范

4. **组件设计规范**
   - 按钮组件（尺寸、状态、类型）
   - 卡片组件
   - 输入框组件

5. **动画与微交互**
   - 动画参数（持续时间、缓动函数）
   - 常见微交互
   - 游戏特殊动画

**第二部分：设计案例**
1. **在线大富翁游戏UI案例**
   - 颜色方案
   - 页面结构
   - 核心组件

2. **设计对比分析**
   - 现代 vs 传统UI
   - 不同配色风格对比

**第三部分：设计检查清单**
- 颜色检查
- 排版检查
- 布局检查
- 组件检查
- 交互检查
- 无障碍检查

**第四部分：参考资源库**
- 设计参考网站
- 游戏UI参考
- 工具推荐

---

## 📊 交付物统计

| 类别 | 文件 | 行数 | 功能 |
|------|------|------|------|
| Python代码 | requirements_agent.py | ~150 | 需求分析实现 |
| Python代码 | ui_designer_agent.py | ~180 | UI设计实现 |
| 文档 | requirements_agent_prompts.md | ~500+ | 提示词设计文档 |
| 文档 | ui_designer_agent_prompts.md | ~600+ | UI提示词设计文档 |
| 文档 | ui_reference_guide.md | ~800+ | UI设计参考指南 |
| **合计** | **5个文件** | **2000+** | **完整需求组方案** |

---

## 🔄 工作流程集成

### 需求组在完整流程中的位置

```
整体流程：需求分析 → 架构设计 → 编码 → 测试 → QA → 文档与交付

需求组职责：
  ├─ Requirements Agent（Day 1-5）
  │  └─ 输出：prd_text + prd_data
  │
  └─ UI Designer Agent（Day 1-5，与Requirements并行）
     └─ 输出：ui_text + ui_data

需求组输出 → 为后续提供高质量输入
  ├─ Architecture Agent 需要：prd_text, prd_data
  ├─ Frontend Agent 需要：ui_text, ui_data
  └─ Test Agent 需要：功能清单、页面列表
```

---

## ✅ 质量保证

### 需求组输出标准

#### Requirements Agent输出标准
- ✅ PRD文档格式规范（Markdown）
- ✅ 产品名称明确
- ✅ 功能列表完整（8-10个）
- ✅ 目标用户清晰（年龄、职业、需求）
- ✅ 验收标准具体（可衡量的KPI）
- ✅ JSON结构规范
- ✅ 无JSON解析错误

#### UI Designer Agent输出标准
- ✅ UI设计文档格式规范（Markdown）
- ✅ 颜色方案和谐（5-6种主色）
- ✅ 颜色对比度达标（>= 4.5:1）
- ✅ 页面列表完整（7-10个）
- ✅ 组件设计详细（10-15个组件）
- ✅ 交互设计清晰（5-10个核心交互）
- ✅ JSON结构规范
- ✅ 无无障碍设计问题

---

## 🎓 使用指南

### 如何使用这些文档

#### 1. 对于后续开发者
- 查看`requirements_agent_prompts.md`理解提示词设计思路
- 查看`ui_designer_agent_prompts.md`了解UI Agent的工作方式
- 参考`ui_reference_guide.md`进行UI评审和优化

#### 2. 对于架构组
- 直接使用Requirements Agent的输出（prd_data）
- 参考UI Designer的颜色方案和页面列表
- 在`ARCHITECTURE.md`中调用这些Agent

#### 3. 对于测试组
- 使用PRD中的功能列表生成测试用例
- 使用UI数据验证页面和组件
- 检查交互设计的正确性

#### 4. 对于文档组
- 以PRD为基础编写用户手册
- 参考UI设计生成UI文档
- 整理功能和交互描述

---

## 🚀 快速开始

### 运行需求组演示

```bash
cd d:/STUDY/Monopoly-1
python demo_requirements_group.py
```

**输出**：
- PRD文档和数据
- UI设计文档和数据
- 完整的任务总结

### 集成到完整工作流程

```python
from agent_team.agents import create_requirements_agent, create_ui_designer_agent
from agent_team.memory import SimpleMemory

# 初始化
memory = SimpleMemory()
req_agent = create_requirements_agent(memory)
ui_agent = create_ui_designer_agent(memory)

# 执行工作流
state = req_agent(initial_state)  # 生成PRD
state = ui_agent(state)           # 生成UI设计
```

---

## 📚 相关文档

- [WORKFLOW.md](../WORKFLOW.md) - 完整工作流程
- [TEAM_ALLOCATION.md](../TEAM_ALLOCATION.md) - 团队分工
- [ARCHITECTURE.md](../ARCHITECTURE.md) - 架构文档

---

## 📝 版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| v1.0 | 2026-04-25 | 初始交付 |
| v2.0 | TBD | 基于反馈的优化 |

---

## 📞 问题反馈

如有问题或建议，请联系需求组负责人或提交Issue。

---

**文档完成时间**：2026年4月25日
**维护者**：需求组（成员2、成员3）
**状态**：✅ 完成并通过测试
