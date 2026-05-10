"""
Agent上下文构建工具
确保各Agent之间真正传递完整的决策上下文，而不是简化字段
"""

from typing import Dict, Any
from pathlib import Path


def _load_workspace_content(artifact_type: str) -> str:
    """
    从 workspace 加载文件内容

    Args:
        artifact_type: artifact 类型 (如 "prd", "tasks", "architecture")

    Returns:
        文件内容字符串，如果读取失败返回空字符串
    """
    try:
        from core.file_manager import WorkspaceManager
        workspace = WorkspaceManager()
        content = workspace.read_markdown(artifact_type)
        return content if content else ""
    except Exception:
        return ""


def build_context_for_agent(state: Dict[str, Any], agent_stage: str) -> str:
    """
    为指定Agent构建完整的上下文字符串
    完整传递所有前序Agent的输出，不做任何截断

    Args:
        state: 当前AgentState
        agent_stage: Agent阶段 (pm, requirements, architecture, design, coding, etc.)

    Returns:
        包含所有前序Agent决策的完整上下文字符串
    """
    context_parts = []

    # 1. 项目基础信息（所有Agent都需要）- 完整传递
    project_name = state.get("project_name", "未命名项目")
    user_requirement = state.get("user_requirement", "")
    context_parts.append(f"""## 项目基础信息
- 项目名称: {project_name}
- 用户需求: {user_requirement}
""")

    # 2. PRD (Requirements Agent及之后需要) - 完整传递
    if agent_stage in ["requirements", "architecture", "design", "coding", "code_review", "testing", "qa", "documentation"]:
        prd = state.get("prd", {})
        if prd and not isinstance(prd, list) and "error" not in prd:
            # prd 是 ArtifactRef，从 workspace 读取完整内容
            prd_content = _load_workspace_content("prd") or prd.get('content', '')
            features_list = prd.get('features', [])
            metrics_list = prd.get('success_metrics', [])
            context_parts.append(f"""## PM Agent - 产品需求文档 (PRD)

### 项目名称
{prd.get('project_name', project_name)}

### 核心功能
{chr(10).join(f"- {f}" for f in features_list)}

### 成功指标
{chr(10).join(f"- {m}" for m in metrics_list)}

### PRD完整内容
{prd_content}
""")

    # 3. 任务规划 (Architecture Agent及之后需要) - 完整传递
    if agent_stage in ["architecture", "design", "coding", "code_review", "testing", "qa", "documentation"]:
        tasks = state.get("tasks", {})
        # tasks 可能是 ArtifactRef 或空 dict
        if tasks and not isinstance(tasks, list) and "error" not in tasks:
            # tasks 是 ArtifactRef，从 workspace 读取完整内容
            tasks_content = _load_workspace_content("tasks") or tasks.get('content', '')
            p0_count = tasks.get('p0_count', 0)
            context_parts.append(f"""## Requirements Agent - 任务规划

### 规划任务总数
{tasks.get('items_count', 'N/A')} 个任务

### P0优先级任务
{p0_count} 个

### 任务列表完整内容
{tasks_content}
""")
        elif tasks and len(tasks) > 0:
            # tasks 是列表（兼容旧格式）
            if not isinstance(tasks[0], dict) or (isinstance(tasks[0], dict) and "error" not in tasks[0]):
                p0_tasks = [t for t in tasks if isinstance(t, dict) and t.get('priority') == 'P0']
                context_parts.append(f"""## Requirements Agent - 任务规划

### 规划任务总数
{len(tasks)} 个任务

### P0优先级任务
{chr(10).join(f"- {t.get('name', t) if isinstance(t, dict) else t}" for t in p0_tasks)}
""")

    # 4. 架构决策 (Design Agent及之后需要) - 完整传递
    if agent_stage in ["design", "coding", "code_review", "testing", "qa", "documentation"]:
        architecture = state.get("architecture", {})
        if architecture and not isinstance(architecture, list) and "error" not in architecture:
            # architecture 是 ArtifactRef，从 workspace 读取完整内容
            arch_content = _load_workspace_content("architecture") or architecture.get('content', '')
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

            schema_list = architecture.get('database_schema', [])
            endpoints_list = architecture.get('api_endpoints', [])
            security_list = architecture.get('security_measures', [])

            context_parts.append(f"""## Architecture Agent - 后端架构设计

### ⚠️ 技术栈约束 (必须严格遵守)
**后端框架**: Node.js + Express
**数据库**: {db_decision}
**实时通信**: Socket.io
**认证**: JWT + bcryptjs
**前端**: React + Vite

### 数据库Schema (完整列表)
{chr(10).join(f"- {table}" for table in schema_list)}

### API端点设计 (完整列表)
{chr(10).join(f"- {ep}" for ep in endpoints_list)}

### 安全措施
{chr(10).join(f"- {s}" for s in security_list)}

### 架构文档完整内容 (不截断)
{arch_content}
""")

    # 5. 系统设计 (Coding Agent及之后需要) - 完整传递
    if agent_stage in ["coding", "code_review", "testing", "qa", "documentation"]:
        design = state.get("design", {})
        if design and not isinstance(design, list) and "error" not in design:
            # design 是 ArtifactRef，从 workspace 读取完整内容
            design_content = _load_workspace_content("design") or design.get('content', '')
            adr_list = design.get('adr_records', [])
            modules_list = design.get('modules', [])

            context_parts.append(f"""## Design Agent - 系统设计

### ADR决策记录 (完整列表)
{chr(10).join(f"- {adr}" for adr in adr_list)}

### 模块划分 (完整列表)
{chr(10).join(f"- {m}" for m in modules_list)}

### 设计文档完整内容 (不截断)
{design_content}
""")

    # 6. 已生成的代码 (Code Review及之后需要) - 完整传递
    if agent_stage in ["code_review", "testing", "qa", "documentation"]:
        code = state.get("code", {})
        if code and "error" not in code:
            backend_files = code.get('backend_files', [])
            frontend_files = code.get('frontend_files', [])
            database_files = code.get('database_files', [])

            # 处理文件数量 - 可能是 int 或 list
            if isinstance(backend_files, int):
                backend_count = backend_files
                backend_list = []
            else:
                backend_count = len(backend_files) if backend_files else 0
                backend_list = backend_files if backend_files else []

            if isinstance(frontend_files, int):
                frontend_count = frontend_files
                frontend_list = []
            else:
                frontend_count = len(frontend_files) if frontend_files else 0
                frontend_list = frontend_files if frontend_files else []

            if isinstance(database_files, int):
                database_count = database_files
            else:
                database_count = len(database_files) if database_files else 0

            context_parts.append(f"""## Coding Agent - 代码实现

### 生成文件统计
- 后端文件: {backend_count} 个
- 前端文件: {frontend_count} 个
- 数据库文件: {database_count} 个

### 后端文件列表 (完整)
{chr(10).join(f"- {{f}}" for f in backend_list) if backend_list else "(无详细列表)"}

### 前端文件列表 (完整)
{chr(10).join(f"- {{f}}" for f in frontend_list) if frontend_list else "(无详细列表)"}
""")

    # 7. 代码审查报告 (Testing及之后需要) - 完整传递
    if agent_stage in ["testing", "qa", "documentation"]:
        review = state.get("review", {})
        if review and not isinstance(review, list) and "error" not in review:
            # review 是 ArtifactRef，从 workspace 读取完整内容
            review_content = _load_workspace_content("review") or review.get('content', '')

            # 处理 issues - 可能是 int 或 list
            blocking_issues = review.get('blocking_issues', [])
            if isinstance(blocking_issues, int):
                blocking_list = []
            else:
                blocking_list = blocking_issues if blocking_issues else []

            important_issues = review.get('important_issues', [])
            if isinstance(important_issues, int):
                important_list = []
            else:
                important_list = important_issues if important_issues else []

            context_parts.append(f"""## Code Review Agent - 审查报告

### 总体评分
{review.get('overall_score', 'N/A')}

### 阻塞问题 (完整列表)
{chr(10).join(f"- {{issue}}" for issue in blocking_list) if blocking_list else "(无)"}

### 重要问题 (完整列表)
{chr(10).join(f"- {{issue}}" for issue in important_list) if important_list else "(无)"}

### 审查报告完整内容
{review_content}
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
        "database": "SQLite",
        "backend": "Node.js + Express",
        "frontend": "React + Vite",
        "realtime": "Socket.io",
        "auth": "JWT + bcryptjs"
    }

    if architecture and not isinstance(architecture, list) and "error" not in architecture:
        tech_stack = architecture.get('tech_stack', [])

        # 提取数据库
        for tech in tech_stack:
            if "SQLite" in tech or "sql" in tech.lower():
                constraints["database"] = "SQLite"
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
