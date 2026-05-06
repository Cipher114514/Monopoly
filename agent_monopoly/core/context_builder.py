"""
Agent上下文构建工具
确保各Agent之间真正传递完整的决策上下文，而不是简化字段
"""

from typing import Dict, Any


def build_context_for_agent(state: Dict[str, Any], agent_stage: str) -> str:
    """
    为指定Agent构建完整的上下文字符串

    Args:
        state: 当前AgentState
        agent_stage: Agent阶段 (pm, requirements, architecture, design, coding, etc.)

    Returns:
        包含所有前序Agent决策的完整上下文字符串
    """
    context_parts = []

    # 1. 项目基础信息（所有Agent都需要）
    project_name = state.get("project_name", "未命名项目")
    user_requirement = state.get("user_requirement", "")
    context_parts.append(f"""## 项目基础信息
- 项目名称: {project_name}
- 用户需求: {user_requirement[:200]}...
""")

    # 2. PRD (Requirements Agent及之后需要)
    if agent_stage in ["requirements", "architecture", "design", "coding", "code_review", "testing", "qa", "documentation"]:
        prd = state.get("prd", {})
        if prd and "error" not in prd:
            context_parts.append(f"""## PM Agent - 产品需求文档 (PRD)

### 项目名称
{prd.get('project_name', project_name)}

### 核心功能
{chr(10).join(f"- {f}" for f in prd.get('features', [])[:10])}

### 成功指标
{chr(10).join(f"- {m}" for m in prd.get('success_metrics', [])[:5])}

### PRD完整内容
{prd.get('content', '')[:1500]}
""")

    # 3. 任务规划 (Architecture Agent及之后需要)
    if agent_stage in ["architecture", "design", "coding", "code_review", "testing", "qa", "documentation"]:
        tasks = state.get("tasks", [])
        if tasks and not isinstance(tasks[0], dict) or (isinstance(tasks[0], dict) and "error" not in tasks[0]):
            context_parts.append(f"""## Requirements Agent - 任务规划

### 规划任务总数
{len(tasks)} 个任务

### P0优先级任务
{chr(10).join(f"- {t.get('name', t) if isinstance(t, dict) else t}" for t in tasks if isinstance(t, dict) and t.get('priority') == 'P0')[:10]}
""")

    # 4. 架构决策 (Design Agent及之后需要)
    if agent_stage in ["design", "coding", "code_review", "testing", "qa", "documentation"]:
        architecture = state.get("architecture", {})
        if architecture and "error" not in architecture:
            tech_stack = architecture.get('tech_stack', [])

            # 提取数据库决策
            db_decision = "未明确指定"
            for tech in tech_stack:
                if "SQLite" in tech or "sql" in tech.lower():
                    db_decision = "SQLite (better-sqlite3或sql.js)"
                    break
                elif "PostgreSQL" in tech or "postgres" in tech.lower():
                    db_decision = "PostgreSQL"
                    break
                elif "MySQL" in tech:
                    db_decision = "MySQL"
                    break

            context_parts.append(f"""## Architecture Agent - 后端架构设计

### ⚠️ 技术栈约束 (必须严格遵守)
**后端框架**: Node.js + Express
**数据库**: {db_decision}
**实时通信**: Socket.io
**认证**: JWT + bcryptjs
**前端**: React + Vite

### 数据库Schema
{chr(10).join(f"- {table}" for table in architecture.get('database_schema', [])[:10])}

### API端点设计
{chr(10).join(f"- {ep}" for ep in architecture.get('api_endpoints', [])[:15])}

### 安全措施
{chr(10).join(f"- {s}" for s in architecture.get('security_measures', []))}

### 架构文档完整内容
{architecture.get('content', '')[:2000]}
""")

    # 5. 系统设计 (Coding Agent及之后需要)
    if agent_stage in ["coding", "code_review", "testing", "qa", "documentation"]:
        design = state.get("design", {})
        if design and "error" not in design:
            context_parts.append(f"""## Design Agent - 系统设计

### ADR决策记录
{chr(10).join(f"- {adr}" for adr in design.get('adr_records', [])[:10])}

### 模块划分
{chr(10).join(f"- {m}" for m in design.get('modules', [])[:10])}

### 设计文档完整内容
{design.get('content', '')[:1500]}
""")

    # 6. 已生成的代码 (Code Review及之后需要)
    if agent_stage in ["code_review", "testing", "qa", "documentation"]:
        code = state.get("code", {})
        if code and "error" not in code:
            context_parts.append(f"""## Coding Agent - 代码实现

### 生成文件统计
- 后端文件: {len(code.get('backend_files', []))} 个
- 前端文件: {len(code.get('frontend_files', []))} 个
- 数据库文件: {len(code.get('database_files', []))} 个

### 后端文件列表
{chr(10).join(f"- {f}" for f in code.get('backend_files', [])[:20])}

### 前端文件列表
{chr(10).join(f"- {f}" for f in code.get('frontend_files', [])[:20])}
""")

    # 7. 代码审查报告 (Testing及之后需要)
    if agent_stage in ["testing", "qa", "documentation"]:
        review = state.get("review", {})
        if review and "error" not in review:
            context_parts.append(f"""## Code Review Agent - 审查报告

### 总体评分
{review.get('overall_score', 'N/A')}

### 阻塞问题
{chr(10).join(f"- {issue}" for issue in review.get('blocking_issues', [])[:10])}

### 重要问题
{chr(10).join(f"- {issue}" for issue in review.get('important_issues', [])[:10])}
""")

    # 8. 添加memory_context (如果有)
    memory_context = state.get("memory_context", "")
    if memory_context:
        context_parts.append(f"""## 前序Agent的额外决策记录

{memory_context}
""")

    return "\n".join(context_parts)


def get_architecture_constraints(state: Dict[str, Any]) -> Dict[str, str]:
    """
    从架构决策中提取技术约束

    Returns:
        包含技术栈约束的字典
    """
    architecture = state.get("architecture", {})

    # 默认约束
    constraints = {
        "database": "SQLite (better-sqlite3)",
        "backend": "Node.js + Express",
        "frontend": "React + Vite",
        "realtime": "Socket.io",
        "auth": "JWT + bcryptjs"
    }

    if architecture and "error" not in architecture:
        tech_stack = architecture.get('tech_stack', [])

        # 提取数据库
        for tech in tech_stack:
            if "SQLite" in tech or "sql.js" in tech or "better-sqlite" in tech:
                constraints["database"] = "SQLite (better-sqlite3)"
                break
            elif "PostgreSQL" in tech:
                constraints["database"] = "PostgreSQL"
                break

        # 提取后端框架
        for tech in tech_stack:
            if "Express" in tech:
                constraints["backend"] = "Node.js + Express"
                break
            elif "FastAPI" in tech or "Flask" in tech:
                constraints["backend"] = "Python + " + tech
                break

    return constraints


def format_constraints_warning(constraints: Dict[str, str]) -> str:
    """
    格式化技术约束警告信息
    """
    return f"""⚠️ **技术栈约束（必须严格遵守，不可更改）**：
- 数据库: {constraints['database']}
- 后端: {constraints['backend']}
- 实时通信: {constraints['realtime']}
- 认证: {constraints['auth']}
- 前端: {constraints['frontend']}

⚠️ **禁止使用**：
- 禁止使用 PostgreSQL、MySQL、MongoDB 等需要额外服务器的数据库
- 禁止使用内存 Map/Set 存储数据
- 所有数据必须持久化到 SQLite 数据库文件"""


def validate_architecture_compliance(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    验证生成的代码是否符合架构约束

    Returns:
        验证结果
    """
    constraints = get_architecture_constraints(state)
    code = state.get("code", {})

    issues = []
    warnings = []

    if code and "error" not in code:
        content = code.get('content', '')

        # 检查是否使用了错误的数据库
        if constraints['database'] == "SQLite":
            if 'require("pg")' in content or 'require("postgres")' in content:
                issues.append("代码使用了PostgreSQL，但架构要求使用SQLite")
            if 'require("mysql")' in content:
                issues.append("代码使用了MySQL，但架构要求使用SQLite")
            if 'new Map()' in content and 'memory' in content.lower():
                warnings.append("代码可能使用了内存存储，建议使用SQLite持久化")

    return {
        "compliant": len(issues) == 0,
        "issues": issues,
        "warnings": warnings
    }
