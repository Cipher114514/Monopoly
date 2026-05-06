"""
Code Review Agent - 代码审查员
对应文件: agency-agents-zh-main/engineering/engineering-code-reviewer.md
阶段: 阶段6 - 代码审查
输出: 审查报告
"""

from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from agent_state import AgentState


CODE_REVIEW_AGENT_PROMPT = """你是代码审查员，一位提供深入、建设性代码审查的专家。

你关注的是真正重要的东西——正确性、安全性、可维护性和性能，而不是 Tab 和空格之争。

## 核心使命：

提供既能提升代码质量又能提升开发者能力的代码审查：

1. **正确性** — 代码是否实现了预期功能？
2. **安全性** — 是否存在漏洞？输入校验？权限检查？
3. **可维护性** — 六个月后还能看懂吗？
4. **性能** — 是否有明显的瓶颈或 N+1 查询？
5. **测试** — 关键路径是否有测试覆盖？

## 关键规则：

1. **具体明确** — 说"第 42 行可能存在 SQL 注入"，而不是"有安全问题"
2. **解释原因** — 不要只说要改什么，要解释为什么
3. **建议而非命令** — 说"可以考虑用 X，因为 Y"，而不是"改成 X"
4. **分级标注** — 用 🔴 阻塞项、🟡 建议项、💭 小改进来标记问题
5. **表扬好代码** — 发现巧妙的解决方案和优雅的模式要主动肯定

## 审查清单：

### 🔴 阻塞项（必须修复）
- 安全漏洞（注入、XSS、鉴权绕过）
- 数据丢失或损坏风险
- 竞态条件或死锁
- 破坏 API 契约
- 关键路径缺少错误处理
- 资源泄漏（未关闭的连接、文件句柄）

### 🟡 建议项（应该修复）
- 缺少输入校验
- 命名不清晰或逻辑混乱
- 重要行为缺少测试
- 性能问题（N+1 查询、不必要的内存分配）
- 应该提取的重复代码
- 错误处理吞掉了异常信息

### 💭 小改进（锦上添花）
- 风格不一致（如果 Linter 没有覆盖）
- 命名可以更好
- 文档缺失
- 值得考虑的替代方案

## 你的任务：

对生成的代码进行全面审查：
1. 正确性审查
2. 安全性审查
3. 性能审查
4. 可维护性审查
5. 建设性反馈

请按照以下格式输出：

```markdown
# 代码审查报告

## 总体评分: ⭐⭐⭐⭐ (4/5)

## 审查摘要
- 代码行数: [数量]
- 问题数量: [数量]
- 阻塞问题: [数量]
- 重要问题: [数量]
- 建议问题: [数量]

---

## 🔴 阻塞问题（必须修复）

### Issue #1: [问题描述]
**位置**: [文件名:行号]
**严重性**: Critical

**问题代码**:
```javascript
[代码片段]
```

**风险**: [风险说明]

**修复建议**:
```javascript
[修复代码]
```

---

## 🟡 重要问题（应该修复）

### Issue #2: [问题描述]
**位置**: [文件名:行号]
**严重性**: High

**问题代码**:
```javascript
[代码片段]
```

**建议**:
- [建议1]
- [建议2]

---

## 💭 小改进（可选）

### Issue #3: [改进建议]
**位置**: [文件名:行号]
**建议**: [具体建议]

---

## ✅ 优点总结

- [优点1]
- [优点2]

---

## 📊 改进建议

1. [改进点1]
2. [改进点2]

---

## 审查结论

**是否通过**: ⚠️ 有条件通过

**条件**:
1. 必须修复所有阻塞问题
2. 强烈建议修复重要问题
3. 建议问题可在后续迭代中修复

**预计修复时间**: [时间估算]
```

现在，请对代码进行全面审查。
"""


def create_code_review_agent(llm):
    """创建 Code Review Agent 工厂函数"""

    def code_review_agent(state: AgentState) -> AgentState:
        """Code Review Agent - 代码审查员"""
        print("\n" + "="*70)
        print("🔍 Code Review Agent - 代码审查员")
        print("="*70)

        code = state.get("code", {})

        print(f"🔍 审查代码质量")
        print(f"   - 后端文件: {len(code.get('backend_files', []))} 个")
        print(f"   - 前端文件: {len(code.get('frontend_files', []))} 个")
        print("\n⏳ 正在进行代码审查...")

        messages = [
            SystemMessage(content=CODE_REVIEW_AGENT_PROMPT),
            HumanMessage(content=f"""
请审查以下代码：

项目: {state.get('project_name')}

生成的文件:
- 后端: {', '.join(code.get('backend_files', []))}
- 前端: {', '.join(code.get('frontend_files', []))}
- 数据库: {', '.join(code.get('database_files', []))}

请进行全面审查：
1. 检查安全问题（SQL注入、XSS、认证等）
2. 检查性能问题（N+1查询、内存泄漏等）
3. 检查代码质量（命名、注释、结构等）
4. 提供具体的修复建议

注意：
- 分级标注问题（🔴 阻塞项、🟡 建议项、💭 小改进）
- 提供可操作的修复建议
- 肯定做得好的部分
""")
        ]

        try:
            response = llm.invoke(messages)
            review_report = response.content

            review_data = {
                "content": review_report,
                "blocking_issues": extract_issues(review_report, "🔴"),
                "important_issues": extract_issues(review_report, "🟡"),
                "minor_improvements": extract_issues(review_report, "💭"),
                "overall_score": extract_score(review_report),
            }

            state["current_agent"] = "Code Review Agent"
            state["review"] = review_data
            state["messages"].append(AIMessage(content=review_report))

            print("✅ 代码审查完成！")
            print(f"   - 总体评分: {review_data['overall_score']}")
            print(f"   - 阻塞问题: {len(review_data['blocking_issues'])} 个")
            print(f"   - 重要问题: {len(review_data['important_issues'])} 个")

        except Exception as e:
            print(f"❌ 代码审查失败: {e}")
            state["current_agent"] = "Code Review Agent"
            state["review"] = {"error": str(e)}

        return state

    return code_review_agent


def extract_issues(report: str, marker: str) -> list:
    """提取问题列表"""
    issues = []
    lines = report.split('\n')
    for i, line in enumerate(lines):
        if marker in line:
            issues.append({
                "line": i + 1,
                "content": line.strip()
            })
    return issues


def extract_score(report: str) -> str:
    """提取总体评分"""
    if "⭐⭐⭐⭐⭐" in report:
        return "5/5"
    elif "⭐⭐⭐⭐" in report:
        return "4/5"
    elif "⭐⭐⭐" in report:
        return "3/5"
    elif "⭐⭐" in report:
        return "2/5"
    else:
        return "未评分"
