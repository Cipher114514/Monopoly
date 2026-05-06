"""
Code Review Agent - 代码审查员 (增强版)
对应文件: agency-agents-zh-main/engineering/engineering-code-reviewer.md
阶段: 阶段6 - 代码审查
输出: 审查报告

增强功能:
1. 支持完整代码内容审查
2. 更智能的问题解析和分类
3. 详细的安全漏洞检测
4. 性能问题分析
5. 代码质量评分
6. 修复优先级排序
"""

from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from agent_state import AgentState
import re
from typing import Dict, List, Any, Optional
from core.context_builder import build_context_for_agent, validate_architecture_compliance


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
6. **降低误报** — 对正确使用安全库的代码不应过度报告为阻塞问题
7. **具体修复** — 为每个问题提供具体的代码修复示例
8. **合理评分** — 正确代码应能得到更高的评分

## 审查清单：

### 🔴 阻塞项（必须修复）
- **假数据/Mock数据** - Model/Service返回硬编码数据而非真实数据库操作
- **内存存储** - 使用Map/Set等内存结构而非真实数据库
- 安全漏洞（注入、XSS、鉴权绕过）
- 数据丢失或损坏风险
- 竞态条件或死锁
- 破坏 API 契约
- 关键路径缺少错误处理
- 资源泄漏（未关闭的连接、文件句柄）
- **缺失文件** - 路由引用的文件不存在

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

## 安全审查重点：

1. **SQL 注入** - 检查原始 SQL 查询、字符串拼接
2. **XSS 攻击** - 检查用户输入未转义直接输出
3. **认证/授权** - 检查令牌验证、权限检查
4. **敏感数据** - 检查硬编码密码、API Key、Token
5. **输入验证** - 检查参数校验、类型检查

## 性能审查重点：

1. **数据库查询** - N+1 查询、未使用索引
2. **内存使用** - 大对象未释放、内存泄漏
3. **网络请求** - 重复请求、未使用缓存
4. **渲染性能** - 前端大列表无虚拟滚动

## 大富翁游戏特定审查重点：

### 游戏逻辑问题：
1. **游戏规则实现** - 地产购买、租赁、抵押逻辑，建筑升级系统
2. **随机事件系统** - 骰子投掷、机会卡、公共基金、社区宝箱
3. **玩家状态管理** - 金钱、地产、监狱状态、破产处理
4. **游戏流程控制** - 回合管理、胜利条件判断、游戏结束处理
5. **游戏平衡性** - 地产价格设置、租金计算、机会卡效果平衡

### 性能问题：
1. **游戏循环** - 帧率控制、更新逻辑效率、渲染优化
2. **资源管理** - 图片、音频资源加载和释放、资源预加载
3. **对象管理** - 大量游戏对象的创建和销毁、对象池管理
4. **碰撞检测** - 玩家移动和位置计算、路径查找

### 安全问题：
1. **客户端验证** - 防止游戏状态篡改、客户端作弊
2. **作弊防护** - 随机数生成安全性、游戏状态验证
3. **数据同步** - 多人游戏状态一致性、网络延迟处理
4. **用户数据安全** - 玩家账户安全、敏感数据保护

### 代码质量问题：
1. **游戏状态管理** - 状态机设计、状态持久化、状态转换
2. **硬编码参数** - 游戏规则参数、价格表、配置数据
3. **模块化设计** - 游戏组件分离、职责单一、依赖管理
4. **代码重复** - 游戏逻辑重复实现、代码复用
5. **AI行为** - AI玩家决策逻辑、难度设置
6. **可扩展性** - 游戏规则扩展、新功能添加

### 多人游戏问题：
1. **网络同步** - 实时游戏状态同步、冲突解决
2. **玩家通信** - 聊天系统、玩家交互
3. **游戏房间管理** - 房间创建、加入、退出
4. **断线重连** - 玩家断线后的重连机制

## 安全库识别：

以下是常见的安全库，使用这些库的代码不应被标记为阻塞问题：

### 后端安全库：
- helmet (Node.js) - 安全头部设置
- express-rate-limit (Node.js) - 请求速率限制
- bcrypt / argon2 - 密码哈希
- JWT 相关库 - 认证令牌
- express-validator - 输入验证
- csurf - CSRF 保护

### 前端安全库：
- DOMPurify - XSS 防护
- helmet.js - 前端安全头部
- sanitize-html - HTML 净化

## 环境配置与代码问题区分：

**注意：** 以下内容属于环境配置问题，不应标记为代码阻塞问题：
- HTTPS 配置（应在服务器或反向代理层面设置）
- 生产环境部署配置
- 服务器硬件/软件选择
- 网络基础设施配置

## 评分算法：

### 评分因素及权重：
1. **安全问题** (30%) - 无阻塞安全问题，无重要安全问题
2. **游戏逻辑** (25%) - 游戏规则实现正确，无明显漏洞
3. **代码质量** (20%) - 代码结构清晰，模块化设计，无重复代码
4. **性能优化** (15%) - 游戏循环效率，资源管理，对象管理
5. **可维护性** (10%) - 注释完整，文档完善，命名规范

### 评分标准：

### 5/5 - 优秀
- **安全问题**：无阻塞安全问题，无重要安全问题
- **游戏逻辑**：游戏规则实现正确，无明显漏洞，游戏平衡性良好
- **代码质量**：代码结构清晰，模块化设计，无重复代码
- **性能优化**：游戏循环效率高，资源管理合理，对象管理高效
- **可维护性**：注释完整，文档完善，命名规范
- **额外加分**：使用了安全库和最佳实践，AI行为合理，多人游戏同步良好

### 4/5 - 良好
- **安全问题**：无阻塞安全问题，少量重要安全问题（≤1个）
- **游戏逻辑**：游戏规则基本正确，无严重漏洞，游戏平衡性一般
- **代码质量**：代码结构合理，模块化设计基本合理，少量重复代码
- **性能优化**：游戏循环效率一般，资源管理基本合理，对象管理一般
- **可维护性**：注释基本完整，文档基本完善，命名基本规范

### 3/5 - 一般
- **安全问题**：无阻塞安全问题，多个重要安全问题（2-3个）
- **游戏逻辑**：游戏规则部分正确，存在部分漏洞，游戏平衡性较差
- **代码质量**：代码结构需要改进，模块化设计不够合理，较多重复代码
- **性能优化**：游戏循环效率较低，资源管理存在问题，对象管理不够高效
- **可维护性**：注释不够完整，文档不够完善，命名不够规范

### 2/5 - 较差
- **安全问题**：存在阻塞安全问题，多个重要安全问题
- **游戏逻辑**：游戏规则存在明显错误，存在严重漏洞，游戏平衡性差
- **代码质量**：代码结构混乱，模块化设计不合理，大量重复代码
- **性能优化**：游戏循环效率低，资源管理混乱，对象管理低效
- **可维护性**：注释缺失，文档缺失，命名混乱

### 1/5 - 差
- **安全问题**：多个阻塞安全问题，严重安全漏洞
- **游戏逻辑**：游戏规则严重错误，无法正常运行，游戏平衡性极差
- **代码质量**：代码结构严重混乱，无模块化设计，大量重复代码
- **性能优化**：游戏循环效率极低，资源管理严重混乱，对象管理严重低效
- **可维护性**：无注释，无文档，命名严重混乱

## 你的任务：

对生成的代码进行全面审查：
1. 正确性审查
2. 安全性审查
3. 性能审查
4. 可维护性审查
5. 建设性反馈

**必须严格按照以下格式输出：**

```markdown
# 代码审查报告

## 总体评分: ⭐⭐⭐⭐ (4/5)

## 审查摘要
- 代码行数: [数量]
- 问题数量: [数量]
- 阻塞问题: [数量]
- 重要问题: [数量]
- 建议问题: [数量]
- 审查时间: [当前时间]

## 安全性分析
- SQL注入风险: [有/无]
- XSS风险: [有/无]
- 认证问题: [有/无]
- 敏感数据泄露: [有/无]
- 游戏作弊风险: [有/无]

## 性能分析
- N+1查询: [有/无]
- 内存泄漏: [有/无]
- 游戏循环效率: [优秀/良好/一般/较差/差]
- 资源管理: [优秀/良好/一般/较差/差]
- 优化建议: [列出]

## 代码质量分析
- 命名规范: [优秀/良好/一般/较差/差]
- 注释完整性: [优秀/良好/一般/较差/差]
- 错误处理: [优秀/良好/一般/较差/差]
- 代码结构: [优秀/良好/一般/较差/差]
- 代码重复: [优秀/良好/一般/较差/差]

## 大富翁游戏特定分析
- 游戏逻辑正确性: [优秀/良好/一般/较差/差]
- 游戏平衡性: [优秀/良好/一般/较差/差]
- 随机事件系统: [优秀/良好/一般/较差/差]
- 玩家状态管理: [优秀/良好/一般/较差/差]
- 游戏流程控制: [优秀/良好/一般/较差/差]
- 安全防护: [优秀/良好/一般/较差/差]
- 多人游戏支持: [优秀/良好/一般/较差/差]

---

## 🔴 阻塞问题（必须修复）

### Issue #1: [问题描述]
**位置**: [文件名:行号]
**严重性**: Critical
**类型**: [安全/性能/功能/游戏逻辑]
**问题行号**: [行号]
**影响范围**: [影响的功能或模块]

**问题代码**:
```[语言]
[问题代码片段]
```

**风险**: [详细的风险描述]
**可能的后果**: [如果不修复可能导致的问题]

**修复建议**:
```[语言]
[修复代码]
```

**修复步骤**:
1. [步骤1]
2. [步骤2]
3. [步骤3]

**修复行号**: [行号]
**预计修复时间**: [时间估算]

---

## 🟡 重要问题（应该修复）

### Issue #2: [问题描述]
**位置**: [文件名:行号]
**严重性**: High
**类型**: [安全/性能/可维护性/游戏逻辑]
**问题行号**: [行号]
**影响范围**: [影响的功能或模块]

**问题代码**:
```[语言]
[代码片段]
```

**建议**:
- [建议1]
- [建议2]

**修复建议**:
```[语言]
[修复代码]
```

**修复步骤**:
1. [步骤1]
2. [步骤2]
3. [步骤3]

**建议行号**: [行号]
**预计修复时间**: [时间估算]

---

## 💭 小改进（可选）

### Issue #3: [改进建议]
**位置**: [文件名:行号]
**问题行号**: [行号]
**影响范围**: [影响的功能或模块]
**建议**: [具体建议]

**修复建议**:
```[语言]
[修复代码]
```

**预计修复时间**: [时间估算]

---

## ✅ 优点总结

- [优点1]
- [优点2]
- [优点3]
- [优点4]
- [优点5]

---

## 技术债务分析

### 短期债务（1-2周内解决）
- [债务1]
- [债务2]

### 中期债务（1-2个月内解决）
- [债务1]
- [债务2]

### 长期债务（后续迭代解决）
- [债务1]
- [债务2]

---

## 审查结论

**是否通过**: ⚠️ 有条件通过 / ✅ 通过 / ❌ 不通过

**条件**:
1. 必须修复所有阻塞问题
2. 强烈建议修复重要问题
3. 建议问题可在后续迭代中修复

**预计修复时间**: [总时间估算]
**代码质量趋势**: 📈 提升 / 📉 下降 / ➡️ 持平
**下一步建议**:
- [建议1]
- [建议2]
- [建议3]
```

**重要要求：**
1. 对于每个问题，必须提供精确的行号
2. 行号必须与代码内容中的实际位置对应
3. 必须使用 `文件名:行号` 格式
4. 必须在每个问题的 "**位置**" 和 "**问题行号**" 字段中填写行号
5. 对于每个问题，必须提供具体的代码修复示例
6. 正确使用安全库的代码不应被标记为阻塞问题
7. 评分应基于代码质量和安全实践，正确代码应获得更高评分
8. 特别关注大富翁游戏特定的问题，包括游戏逻辑、性能优化、安全防护等
9. 不得使用其他格式，必须严格按照上述模板

现在，请对以下代码进行全面审查，严格按照指定格式输出。
"""


# 模块划分：
# 1. 配置模块 - 包含提示模板和常量
# 2. 缓存模块 - 处理代码审查结果的缓存
# 3. 分析模块 - 提取和分析审查结果
# 4. 报告模块 - 生成和保存审查报告
# 5. 主模块 - 整合所有功能

# 缓存模块
import hashlib

class ReviewCache:
    """代码审查结果缓存"""
    def __init__(self):
        self.cache = {}
    
    def get_key(self, code_content: str) -> str:
        """计算代码内容的哈希值作为缓存键"""
        return hashlib.md5(code_content.encode()).hexdigest()
    
    def get(self, code_content: str) -> dict:
        """获取缓存的审查结果"""
        key = self.get_key(code_content)
        return self.cache.get(key)
    
    def set(self, code_content: str, review_data: dict):
        """缓存审查结果"""
        key = self.get_key(code_content)
        self.cache[key] = review_data
    
    def clear(self):
        """清空缓存"""
        self.cache.clear()

# 创建全局缓存实例
review_cache = ReviewCache()

def create_code_review_agent(llm):
    """创建 Code Review Agent 工厂函数"""

    def code_review_agent(state: AgentState) -> AgentState:
        """Code Review Agent - 代码审查员"""
        print("\n" + "="*70)
        print("🔍 Code Review Agent - 代码审查员 (增强版)")
        print("="*70)

        code = state.get("code", {})
        code_content = code.get("content", "")
        architecture = state.get("architecture", {})

        backend_files = code.get('backend_files', [])
        frontend_files = code.get('frontend_files', [])
        database_files = code.get('database_files', [])

        # 使用上下文构建工具获取完整上下文
        full_context = build_context_for_agent(state, "code_review")

        # 验证架构合规性
        compliance = validate_architecture_compliance(state)

        print(f"🔍 审查代码质量")
        print(f"   - 后端文件: {len(backend_files)} 个")
        print(f"   - 前端文件: {len(frontend_files)} 个")
        print(f"   - 数据库文件: {len(database_files)} 个")
        print(f"   - 架构合规: {'✅' if compliance['compliant'] else '⚠️ ' + str(len(compliance['issues'])) + '个问题'}")
        print(f"   - 代码内容长度: {len(code_content)} 字符")
        print("\n⏳ 正在进行代码审查...")

        # 检查缓存
        cached_review = review_cache.get(code_content)
        if cached_review:
            print("✅ 使用缓存的审查结果")
            state["current_agent"] = "Code Review Agent"
            state["review"] = cached_review
            state["messages"].append(AIMessage(content=cached_review["content"]))
            
            print(f"   - 总体评分: {cached_review['overall_score']}")
            print(f"   - 阻塞问题: {len(cached_review['blocking_issues'])} 个")
            print(f"   - 重要问题: {len(cached_review['important_issues'])} 个")
            print(f"   - 小改进: {len(cached_review['minor_improvements'])} 个")
            return state

        # 为代码添加行号标记，便于 LLM 引用
        if code_content:
            lines = code_content.split('\n')
            numbered_code = []
            for i, line in enumerate(lines, 1):
                numbered_code.append(f"{i:4d} | {line}")
            code_content_with_lines = '\n'.join(numbered_code)
        else:
            code_content_with_lines = code_content

        # 优化提示模板，减少长度
        # 获取架构文档用于验证
        architecture_content = architecture.get('content', '')

        # 构建合规性警告
        compliance_warning = ""
        if not compliance['compliant']:
            compliance_warning = "\n⚠️ **架构合规性问题**：\n"
            for issue in compliance['issues']:
                compliance_warning += f"- {issue}\n"

        messages = [
            SystemMessage(content=CODE_REVIEW_AGENT_PROMPT),
            HumanMessage(content=f"""{full_context}

## 架构合规性检查
{'✅ 代码符合架构约束' if compliance['compliant'] else compliance_warning}

## 来自 Architecture Agent 的架构文档

{architecture_content[:1500]}

## 审查的代码

项目: {state.get('project_name')}

### 生成的文件:
- 后端: {', '.join(backend_files) if backend_files else '无'}
- 前端: {', '.join(frontend_files) if frontend_files else '无'}
- 数据库: {', '.join(database_files) if database_files else '无'}

### 完整代码内容:
{code_content_with_lines if code_content_with_lines else '代码内容为空，请基于文件列表进行推断性审查'}

**强制要求：**
- 必须为每个问题提供精确的行号
- 必须使用 `文件名:行号` 格式
- 必须在每个问题的 "**位置**" 和 "**问题行号**" 字段中填写行号
- 必须严格按照提供的模板格式输出
- 必须为每个问题提供具体的代码修复示例
- 特别关注大富翁游戏特定的问题
- **重点检查**：代码是否违反了架构约束（如使用错误的数据库）
""")
        ]

        try:
            # 检查代码内容是否为空
            if not code_content:
                print("⚠️ 代码内容为空，无法进行审查")
                state["current_agent"] = "Code Review Agent"
                state["review"] = {"error": "代码内容为空，无法进行审查"}
                return state
            
            # 调用LLM进行代码审查
            print("📡 正在调用LLM进行代码审查...")
            response = llm.invoke(messages)
            
            # 检查响应是否有效
            if not response or not hasattr(response, 'content'):
                print("❌ LLM响应无效")
                state["current_agent"] = "Code Review Agent"
                state["review"] = {"error": "LLM响应无效，无法获取审查结果"}
                return state
            
            review_report = response.content
            
            # 检查审查报告是否为空
            if not review_report:
                print("❌ 审查报告为空")
                state["current_agent"] = "Code Review Agent"
                state["review"] = {"error": "审查报告为空，无法进行分析"}
                return state

            # 提取和分析审查结果
            print("📊 正在分析审查结果...")
            review_data = {
                "content": review_report,
                "blocking_issues": extract_issues_by_type(review_report, "🔴"),
                "important_issues": extract_issues_by_type(review_report, "🟡"),
                "minor_improvements": extract_issues_by_type(review_report, "💭"),
                "overall_score": extract_score(review_report),
                "security_analysis": extract_security_analysis(review_report),
                "performance_analysis": extract_performance_analysis(review_report),
                "statistics": generate_statistics(review_report, code),
            }

            # 验证行号
            print("🔍 正在验证行号...")
            review_data["blocking_issues"] = validate_issue_line_numbers(
                review_data["blocking_issues"], code_content
            )
            review_data["important_issues"] = validate_issue_line_numbers(
                review_data["important_issues"], code_content
            )
            review_data["minor_improvements"] = validate_issue_line_numbers(
                review_data["minor_improvements"], code_content
            )

            # 缓存审查结果
            print("💾 正在缓存审查结果...")
            review_cache.set(code_content, review_data)

            state["current_agent"] = "Code Review Agent"
            state["review"] = review_data
            state["messages"].append(AIMessage(content=review_report))

            print("✅ 代码审查完成！")
            print(f"   - 总体评分: {review_data['overall_score']}")
            print(f"   - 阻塞问题: {len(review_data['blocking_issues'])} 个")
            print(f"   - 重要问题: {len(review_data['important_issues'])} 个")
            print(f"   - 小改进: {len(review_data['minor_improvements'])} 个")

            has_line_info = any(
                issue.get("issue_line_numbers") for issue in review_data["blocking_issues"]
            )
            print(f"   - 行号标注: {'✅' if has_line_info else '⚠️ 部分缺失'}")

            if review_data.get("security_analysis"):
                sec = review_data["security_analysis"]
                print(f"   - 安全: SQL注入{'⚠️' if sec.get('sql_injection') else '✅'} "
                      f"XSS{'⚠️' if sec.get('xss') else '✅'} "
                      f"认证{'⚠️' if sec.get('auth') else '✅'}")

        except Exception as e:
            import traceback
            error_trace = traceback.format_exc()
            print(f"❌ 代码审查失败: {e}")
            print(f"详细错误信息: {error_trace}")
            state["current_agent"] = "Code Review Agent"
            state["review"] = {
                "error": f"代码审查失败: {str(e)}",
                "error_details": error_trace
            }

        return state

    return code_review_agent


def extract_issues_by_type(report: str, marker: str) -> List[Dict[str, Any]]:
    """提取问题列表并尝试解析详细信息"""
    issues = []
    lines = report.split('\n')

    current_issue = None
    in_code_block = False
    in_suggestion_block = False

    for i, line in enumerate(lines):
        if marker in line and "Issue #" in line:
            if current_issue:
                issues.append(current_issue)

            issue_match = re.search(r'Issue #\d+:\s*(.+)', line)
            current_issue = {
                "line": i + 1,
                "title": issue_match.group(1) if issue_match else line.strip(),
                "severity": "Critical" if marker == "🔴" else ("High" if marker == "🟡" else "Low"),
                "description": "",
                "code_snippet": "",
                "suggestion": "",
                "location": "",
                "risk": "",
                "issue_line_numbers": "",
                "fix_line_numbers": "",
                "issue_type": ""
            }
            in_code_block = False
            in_suggestion_block = False

        elif current_issue:
            if "**位置**:" in line:
                location_match = re.search(r'\*\*位置\*\*:\s*(.+)', line)
                if location_match:
                    current_issue["location"] = location_match.group(1).strip()

            elif "**严重性**:" in line:
                severity_match = re.search(r'\*\*严重性\*\*:\s*(.+)', line)
                if severity_match:
                    current_issue["severity"] = severity_match.group(1).strip()

            elif "**类型**:" in line:
                type_match = re.search(r'\*\*类型\*\*:\s*(.+)', line)
                if type_match:
                    current_issue["issue_type"] = type_match.group(1).strip()

            elif "**风险**:" in line:
                risk_match = re.search(r'\*\*风险\*\*:\s*(.+)', line)
                if risk_match:
                    current_issue["risk"] = risk_match.group(1).strip()

            elif "**问题行号**:" in line:
                line_num_match = re.search(r'\*\*问题行号\*\*:\s*(.+)', line)
                if line_num_match:
                    current_issue["issue_line_numbers"] = line_num_match.group(1).strip()

            elif "**修复行号**:" in line:
                fix_line_match = re.search(r'\*\*修复行号\*\*:\s*(.+)', line)
                if fix_line_match:
                    current_issue["fix_line_numbers"] = fix_line_match.group(1).strip()

            elif "**建议行号**:" in line:
                fix_line_match = re.search(r'\*\*建议行号\*\*:\s*(.+)', line)
                if fix_line_match:
                    current_issue["fix_line_numbers"] = fix_line_match.group(1).strip()

            elif "```" in line:
                if in_code_block:
                    in_code_block = False
                    in_suggestion_block = True
                else:
                    in_code_block = True
                    in_suggestion_block = False

            elif in_code_block:
                current_issue["code_snippet"] += line + "\n"

            elif in_suggestion_block and line.strip() and not line.strip().startswith("-"):
                current_issue["suggestion"] += line.strip() + "\n"

            elif "**建议**:" in line:
                in_suggestion_block = True

            elif "**" in line:
                continue

            elif line.strip() and not line.strip().startswith("-"):
                current_issue["description"] += line.strip() + " "

    if current_issue:
        issues.append(current_issue)

    return issues


def parse_line_numbers(line_info: str) -> Dict[str, Any]:
    """解析行号信息，支持多种格式"""
    result = {
        "start_line": None,
        "end_line": None,
        "ranges": [],
        "raw": line_info
    }

    if not line_info:
        return result

    line_info = line_info.strip()

    range_pattern = r'(\d+)\s*[-~]\s*(\d+)'
    range_match = re.search(range_pattern, line_info)
    if range_match:
        result["start_line"] = int(range_match.group(1))
        result["end_line"] = int(range_match.group(2))
        result["ranges"] = [(result["start_line"], result["end_line"])]

    single_pattern = r'(?:第\s*)?(\d+)(?:\s*行)?'
    single_matches = re.findall(single_pattern, line_info)
    if single_matches:
        nums = [int(m) for m in single_matches]
        if result["start_line"] is None:
            result["start_line"] = nums[0]
            result["end_line"] = nums[-1]
        for num in nums:
            if (num, num) not in result["ranges"]:
                result["ranges"].append((num, num))

    return result


def validate_issue_line_numbers(issues: List[Dict[str, Any]], code_content: str) -> List[Dict[str, Any]]:
    """验证问题的行号是否在代码范围内，并尝试根据代码片段推断实际行号"""
    if not code_content:
        return issues

    code_lines = code_content.split('\n')
    total_lines = len(code_lines)

    for issue in issues:
        issue_line_info = issue.get("issue_line_numbers", "")

        if issue_line_info:
            parsed = parse_line_numbers(issue_line_info)

            if parsed["start_line"] and parsed["end_line"]:
                if parsed["start_line"] > total_lines or parsed["end_line"] > total_lines:
                    issue["line_warning"] = f"行号超出范围 (1-{total_lines})"
                    issue["issue_line_numbers"] = f"~{parsed['start_line']}-{min(parsed['end_line'], total_lines)}"
                else:
                    issue["line_validation"] = "valid"
        else:
            code_snippet = issue.get("code_snippet", "").strip()
            if code_snippet and code_snippet in code_content:
                start_pos = code_content.index(code_snippet)
                start_line = code_content[:start_pos].count('\n') + 1
                end_line = start_line + code_snippet.count('\n')
                issue["issue_line_numbers"] = f"{start_line}"
                if end_line > start_line:
                    issue["issue_line_numbers"] += f"-{end_line}"
                issue["line_validation"] = "inferred"
            else:
                issue["line_validation"] = "unknown"

    return issues


def extract_security_analysis(report: str) -> Dict[str, Any]:
    """提取安全分析结果"""
    analysis = {
        "sql_injection": False,
        "xss": False,
        "auth": False,
        "sensitive_data": False,
        "input_validation": False,
        "password_security": False,
        "details": []
    }

    report_lower = report.lower()

    if "sql" in report_lower and ("注入" in report or "injection" in report_lower):
        analysis["sql_injection"] = True
        analysis["details"].append("检测到SQL注入风险")

    if "xss" in report_lower or ("跨站" in report and "脚本" in report) or "dangerouslysetinnerhtml" in report_lower:
        analysis["xss"] = True
        analysis["details"].append("检测到XSS风险")

    if ("认证" in report or "授权" in report or "权限" in report or "认证绕过" in report):
        if any(keyword in report for keyword in ["问题", "风险", "漏洞", "绕过", "缺失", "未验证"]):
            analysis["auth"] = True
            analysis["details"].append("检测到认证/授权问题")

    if any(keyword in report_lower for keyword in ["密码", "api", "key", "token", "secret", "密钥"]):
        if any(keyword in report for keyword in ["硬编码", "暴露", "泄露", "明文", "敏感信息"]):
            analysis["sensitive_data"] = True
            analysis["details"].append("检测到敏感数据泄露风险")

    if ("密码" in report or "password" in report_lower):
        if any(keyword in report for keyword in ["明文", "未加密", "未哈希", "硬编码"]):
            analysis["password_security"] = True
            analysis["details"].append("检测到密码安全问题")

    if ("输入" in report and "验证" in report) or "输入验证" in report or "参数验证" in report:
        if any(keyword in report for keyword in ["缺失", "缺少", "未", "无"]):
            analysis["input_validation"] = True
            analysis["details"].append("检测到输入验证缺失")

    return analysis


def extract_performance_analysis(report: str) -> Dict[str, Any]:
    """提取性能分析结果"""
    analysis = {
        "n_plus_1": False,
        "memory_leak": False,
        "no_index": False,
        "unoptimized_query": False,
        "no_pagination": False,
        "suggestions": []
    }

    report_lower = report.lower()

    if "n+1" in report_lower or "n+1" in report or "循环查询" in report or "嵌套查询" in report:
        analysis["n_plus_1"] = True
        analysis["suggestions"].append("检测到N+1查询问题，建议使用批量查询或预加载")

    if any(keyword in report for keyword in ["内存", "泄漏", "泄露", "无限增长", "无限"]):
        if any(keyword in report for keyword in ["缓存", "增长", "没有过期", "无过期", "从不清理"]):
            analysis["memory_leak"] = True
            analysis["suggestions"].append("检测到内存泄漏或缓存无限增长风险")

    if any(keyword in report for keyword in ["索引", "index", "缺少索引", "缺失索引", "未建索引"]):
        analysis["no_index"] = True
        analysis["suggestions"].append("检测到可能的索引缺失问题")

    if any(keyword in report for keyword in ["查询", "数据库"]):
        if any(keyword in report for keyword in ["未优化", "低效", "慢", "全表扫描"]):
            analysis["unoptimized_query"] = True
            analysis["suggestions"].append("检测到未优化的数据库查询")

    if "分页" in report and ("无" in report or "缺少" in report or "没有" in report):
        analysis["no_pagination"] = True
        analysis["suggestions"].append("检测到缺少分页机制")

    if "limit" in report_lower and ("无" in report or "缺少" in report or "没有" in report):
        analysis["no_pagination"] = True
        analysis["suggestions"].append("检测到查询缺少LIMIT限制")

    return analysis


def extract_score(report: str) -> str:
    """提取总体评分"""
    score_match = re.search(r'总体评分:\s*[⭐🭐]*\s*\(?(\d)/5\)?', report)
    if score_match:
        return f"{score_match.group(1)}/5"

    if "⭐⭐⭐⭐⭐" in report or "5/5" in report:
        return "5/5"
    elif "⭐⭐⭐⭐" in report or "4/5" in report:
        return "4/5"
    elif "⭐⭐⭐" in report or "3/5" in report:
        return "3/5"
    elif "⭐⭐" in report or "2/5" in report:
        return "2/5"
    elif "⭐" in report or "1/5" in report:
        return "1/5"
    else:
        return "未评分"


def generate_statistics(report: str, code: Dict[str, Any]) -> Dict[str, Any]:
    """生成审查统计信息"""
    blocking = len(re.findall(r'🔴.*?阻塞', report))
    important = len(re.findall(r'🟡.*?建议', report))
    minor = len(re.findall(r'💭.*?改进', report))

    code_content = code.get("content", "")
    lines = code_content.count('\n') + 1 if code_content else 0

    word_count = len(report)

    sql_injection_count = len(re.findall(r'sql|注入|injection', report, re.IGNORECASE))
    xss_count = len(re.findall(r'xss|跨站|脚本.*攻击', report, re.IGNORECASE))
    auth_issues_count = len(re.findall(r'认证|授权|权限|绕过', report))
    sensitive_data_count = len(re.findall(r'密码|密钥|api.*key|token|secret|敏感信息', report, re.IGNORECASE))
    n_plus_1_count = len(re.findall(r'n\+?1|循环查询|嵌套查询', report, re.IGNORECASE))
    memory_issues_count = len(re.findall(r'内存.*泄漏|缓存.*过期|无限增长', report))
    index_issues_count = len(re.findall(r'索引|index', report, re.IGNORECASE))
    transaction_count = len(re.findall(r'事务|transaction', report, re.IGNORECASE))
    foreign_key_count = len(re.findall(r'外键|foreign.*key', report, re.IGNORECASE))

    return {
        "total_issues": blocking + important + minor,
        "blocking_issues": blocking,
        "important_issues": important,
        "minor_improvements": minor,
        "code_lines": lines,
        "report_words": word_count,
        "file_count": {
            "backend": len(code.get("backend_files", [])),
            "frontend": len(code.get("frontend_files", [])),
            "database": len(code.get("database_files", []))
        },
        "issue_category_counts": {
            "sql_injection": sql_injection_count,
            "xss": xss_count,
            "auth_issues": auth_issues_count,
            "sensitive_data": sensitive_data_count,
            "n_plus_1": n_plus_1_count,
            "memory_issues": memory_issues_count,
            "index_issues": index_issues_count,
            "transaction_issues": transaction_count,
            "foreign_key_issues": foreign_key_count,
        }
    }


def determine_review_status(review_data: Dict[str, Any]) -> str:
    """根据审查结果确定通过状态"""
    if review_data.get("error"):
        return "❌ 审查失败"

    blocking = len(review_data.get("blocking_issues", []))

    if blocking > 0:
        return "❌ 不通过 - 存在阻塞问题"

    important = len(review_data.get("important_issues", []))
    if important > 3:
        return "⚠️ 有条件通过 - 存在较多重要问题"

    return "✅ 通过"


def extract_code_snippets(report: str, language: str = None) -> List[Dict[str, str]]:
    """提取代码片段"""
    snippets = []
    pattern = r'```(\w+)?\n(.*?)```'

    for match in re.finditer(pattern, report, re.DOTALL):
        lang = match.group(1) or "text"
        code = match.group(2).strip()

        if language is None or lang == language:
            snippets.append({
                "language": lang,
                "code": code,
                "length": len(code)
            })

    return snippets


def get_actionable_suggestions(review_data: Dict[str, Any]) -> List[Dict[str, str]]:
    """获取可操作的建议列表"""
    suggestions = []

    for issue in review_data.get("blocking_issues", []):
        suggestions.append({
            "priority": "P0",
            "title": issue.get("title", "未命名问题"),
            "suggestion": issue.get("suggestion", issue.get("description", "")),
            "location": issue.get("location", "未知位置")
        })

    for issue in review_data.get("important_issues", []):
        suggestions.append({
            "priority": "P1",
            "title": issue.get("title", "未命名问题"),
            "suggestion": issue.get("suggestion", issue.get("description", "")),
            "location": issue.get("location", "未知位置")
        })

    return suggestions
