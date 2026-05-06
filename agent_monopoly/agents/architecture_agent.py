"""
Architecture Agent - 后端架构师
对应文件: agency-agents-zh-main/engineering/engineering-backend-architect.md
阶段: 阶段3 - 后端架构设计
输出: 架构设计文档
"""

from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from agent_state import AgentState
from core.context_builder import build_context_for_agent, format_constraints_warning, get_architecture_constraints


ARCHITECTURE_AGENT_PROMPT = """你是后端架构师，一位资深后端架构师，专精可扩展系统设计、数据库架构和云基础设施。

⚠️ **技术栈约束（必须遵守，不可更改）**：
- 数据库: SQLite (better-sqlite3 或 sql.js)
- 禁止使用 PostgreSQL、MySQL、MongoDB 等需要额外服务器的数据库
- 禁止使用内存 Map/Set 存储数据
- 后端: Node.js + Express
- 实时通信: Socket.io
- 认证: JWT + bcryptjs

你构建健壮、安全、高性能的服务端应用，能够在保持可靠性和安全性的同时处理大规模负载。

## 核心使命：

### 数据/Schema 工程卓越
- 定义和维护数据 schema 和索引规范
- 为大规模数据集设计高效的数据结构
- 创建高性能持久层，查询时间低于 20ms
- 验证 schema 合规性并维护向后兼容性

### 设计可扩展的系统架构
- 创建可水平独立扩展的架构
- 设计针对性能、一致性和增长优化的数据库 schema
- 实现具有适当版本控制和文档的健壮 API 架构
- **默认要求**：在所有系统中包含全面的安全措施和监控

### 确保系统可靠性
- 实现适当的错误处理、熔断器和优雅降级
- 设计备份和灾难恢复策略以保护数据
- 创建监控和告警系统以主动检测问题

### 优化性能和安全
- 设计缓存策略以减少数据库负载并提高响应时间
- 实现具有适当访问控制的认证和授权系统
- 确保符合安全标准和行业法规

## 关键规则：

### 安全优先架构
- 在所有系统层实施纵深防御策略
- 对所有服务和数据库访问使用最小权限原则
- 使用当前安全标准对静态和传输中的数据进行加密

### 性能导向设计
- 从一开始就为水平扩展进行设计
- 实现适当的数据库索引和查询优化
- 适当使用缓存策略而不造成一致性问题
- 持续监控和衡量性能

## 你的任务：

基于 PRD 和任务列表，设计完整的后端架构：
1. 系统架构设计
2. 数据库架构（Schema 设计）
3. API 设计规范
4. 安全措施
5. 性能优化策略
6. 文件结构清单

## 技术栈约束（必须遵守）

**后端框架**: Node.js + Express
**数据库**: SQLite (使用better-sqlite3或sql.js库，数据库文件存储在backend/data/monopoly.db)
**实时通信**: Socket.io
**认证**: JWT + bcryptjs
**前端**: React + Vite

⚠️ **必须使用SQLite**，因为：
- 不需要额外安装数据库服务器
- 数据存储在文件中，持久化保存
- 禁止使用内存Map或假数据

请按照以下结构输出：

```markdown
# 系统架构设计文档

## 高层架构
**架构模式**: [Microservices/Monolith/Serverless]
**通信模式**: [REST/GraphQL/gRPC]
**数据模式**: [CQRS/Event Sourcing/Traditional CRUD]
**部署模式**: [Container/Serverless/Traditional]

## 服务分解
### 核心服务
**Service 1**: [服务名称]
- 职责: [功能描述]
- 数据库: [数据库类型和配置]
- API: [主要 API 端点]

## 数据库架构

### 表设计

#### users 表
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## API 设计

### 认证相关
- POST /api/auth/register - 用户注册
- POST /api/auth/login - 用户登录

### 业务相关
[主要 API 端点]

## 性能优化
- 缓存策略: [Redis 配置]
- 数据库索引: [关键索引]
- 目标: 95% 请求 < 200ms

## 安全措施
- 认证: JWT/OAuth 2.0
- 数据加密: [加密策略]
- Rate Limiting: [限流配置]
```

现在，请基于需求和任务设计完整的后端架构。
"""


def create_architecture_agent(llm):
    """
    创建 Architecture Agent 工厂函数

    Args:
        llm: 语言模型实例

    Returns:
        architecture_agent: Architecture Agent 函数
    """

    def architecture_agent(state: AgentState) -> AgentState:
        """
        Architecture Agent - 后端架构师
        设计系统架构、数据库和 API

        Args:
            state: 当前状态

        Returns:
            更新后的状态
        """
        print("\n" + "="*70)
        print("🏗️  Architecture Agent - 后端架构师")
        print("="*70)

        # 获取 PRD、任务和前序上下文
        prd = state.get("prd", {})
        tasks = state.get("tasks", [])
        memory_context = state.get("memory_context", "")

        # 使用上下文构建工具获取完整上下文
        full_context = build_context_for_agent(state, "architecture")

        if memory_context:
            print("📚 已读取 PM/Requirements Agent 的决策上下文")

        print(f"🏗️  设计后端架构")
        print(f"   - 基于功能需求: {len(prd.get('features', []))} 个")
        print(f"   - 支持任务: {len(tasks)} 个")
        print("\n⏳ 正在设计架构、数据库和 API...")

        # 获取技术栈约束
        constraints = get_architecture_constraints(state)
        constraints_warning = format_constraints_warning(constraints)

        # 构建 prompt - 包含完整上下文
        messages = [
            SystemMessage(content=ARCHITECTURE_AGENT_PROMPT),
            HumanMessage(content=f"""{full_context}

{constraints_warning}

## 你的任务

基于以上PRD和任务规划，设计完整的后端架构：

1. **数据库Schema设计**：为在线大富翁游戏设计完整的数据表
2. **文件结构设计**：列出所有需要创建的文件及其职责
3. **API端点设计**：定义RESTful API和WebSocket事件
4. **安全措施**：JWT认证、数据加密、Rate Limiting
5. **性能优化**：索引策略、查询优化

⚠️ **关键要求**：
- 数据库文件路径: backend/data/monopoly.db
- 使用 better-sqlite3 库（同步API，性能更好）
- 禁止使用任何内存存储（Map、Set等）
- 所有数据必须持久化到SQLite数据库文件

请按照以下格式输出：

```markdown
# 系统架构设计文档

## 数据库Schema设计

### 表清单
[列出所有数据表及其字段]

### SQL创建语句
[提供完整的CREATE TABLE语句]

## 文件结构设计

### 后端文件
| 文件路径 | 职责 | 导出内容 |
|---------|------|---------|

### 前端文件
| 文件路径 | 职责 | 导出内容 |
|---------|------|---------|

## API端点设计
[列出所有API端点]

## 安全和性能方案
[详细说明]
```
""")
        ]

        # 调用 LLM
        try:
            response = llm.invoke(messages)
            architecture_doc = response.content

            # 提取架构关键信息
            architecture_data = {
                "content": architecture_doc,
                "tech_stack": extract_tech_stack(architecture_doc),
                "database_schema": extract_database_schema(architecture_doc),
                "api_endpoints": extract_api_endpoints(architecture_doc),
                "security_measures": extract_security(architecture_doc),
            }

            # 更新状态
            state["current_agent"] = "Architecture Agent"
            state["architecture"] = architecture_data
            state["messages"].append(AIMessage(content=architecture_doc))

            # 将架构决策传递给后续Agent
            # 从生成的文档中提取关键部分，而不是写死内容
            architecture_memory = f"""

## Architecture Agent 决策过程

### 技术栈选择
{chr(10).join(f"- {t}" for t in architecture_data['tech_stack'])}

### 数据库Schema（完整设计）
{extract_sql_tables(architecture_doc)}

### API端点设计
{chr(10).join(f"- {ep}" for ep in architecture_data['api_endpoints'][:10])}

### 文件结构设计
{extract_file_structure(architecture_doc)}

### 为Coding Agent的指示
- **必须严格按照上述数据库Schema生成真实的数据库连接代码**
- **禁止使用内存Map或假数据**
- **所有Model文件必须使用真实SQL操作**
"""

            # 追加到memory_context
            existing_memory = state.get("memory_context", "")
            state["memory_context"] = existing_memory + architecture_memory

            print("✅ 架构设计完成！")
            print(f"   - 技术栈: {len(architecture_data['tech_stack'])} 项")
            print(f"   - 数据表: {len(architecture_data['database_schema'])} 个")
            print(f"   - API 端点: {len(architecture_data['api_endpoints'])} 个")
            print(f"   - 决策已传递给后续Agent")

        except Exception as e:
            print(f"❌ 架构设计失败: {e}")
            state["current_agent"] = "Architecture Agent"
            state["architecture"] = {"error": str(e)}

        return state

    return architecture_agent


def extract_tech_stack(arch_doc: str) -> list:
    """提取技术栈"""
    stack = []
    # 优先检查SQLite
    if "SQLite" in arch_doc or "sqlite" in arch_doc or "better-sqlite3" in arch_doc or "sql.js" in arch_doc:
        stack.append("SQLite")
    keywords = ["Node.js", "Python", "PostgreSQL", "Redis", "Socket.io", "Express", "FastAPI"]
    for keyword in keywords:
        if keyword in arch_doc and keyword not in stack:
            stack.append(keyword)
    return stack[:10] if stack else ["Express", "Socket.io", "SQLite"]


def extract_database_schema(arch_doc: str) -> list:
    """提取数据库表"""
    tables = []
    # 完整大富翁游戏数据表
    default_tables = [
        "users (用户表)",
        "game_rooms (游戏房间表)",
        "room_players (房间玩家表)",
        "properties (地产属性表)",
        "player_properties (玩家地产所有权表)",
        "game_transactions (游戏交易记录表)"
    ]
    
    if "CREATE TABLE" in arch_doc:
        # 从生成的文档中提取实际表名
        lines = arch_doc.split('\n')
        for line in lines:
            if "CREATE TABLE" in line:
                parts = line.split()
                if len(parts) >= 3:
                    tables.append(parts[2])
    
    return tables if tables else default_tables


def extract_api_endpoints(arch_doc: str) -> list:
    """提取 API 端点"""
    endpoints = []
    lines = arch_doc.split('\n')
    for line in lines:
        stripped = line.strip()
        if (stripped.startswith("POST /") or stripped.startswith("GET /") or 
            stripped.startswith("PUT /") or stripped.startswith("DELETE /") or
            stripped.startswith("WebSocket /")):
            endpoints.append(stripped)
    
    return endpoints[:20] if endpoints else [
        # 认证接口
        "POST /api/v1/auth/register",
        "POST /api/v1/auth/login",
        # 房间接口
        "POST /api/v1/rooms",
        "GET /api/v1/rooms",
        "POST /api/v1/rooms/{room_id}/join",
        "POST /api/v1/rooms/{room_id}/leave",
        # 游戏接口
        "POST /api/v1/games/{room_id}/start",
        "POST /api/v1/games/{room_id}/roll",
        "POST /api/v1/games/{room_id}/buy-property",
        "WebSocket /ws/game/{room_id}"
    ]


def extract_security(arch_doc: str) -> list:
    """提取安全措施"""
    security = []
    if "JWT" in arch_doc or "认证" in arch_doc:
        security.append("JWT 认证")
    if "加密" in arch_doc:
        security.append("数据加密")
    if "Rate Limiting" in arch_doc:
        security.append("Rate Limiting")
    return security if security else ["JWT 认证", "数据加密", "Rate Limiting"]


def extract_sql_tables(arch_doc: str) -> str:
    """从架构文档中提取SQL CREATE TABLE语句"""
    # 查找所有SQL代码块
    import re
    sql_blocks = re.findall(r'```sql\n(.*?)\n```', arch_doc, re.DOTALL)
    if sql_blocks:
        return "\n".join(sql_blocks)
    # 如果没有找到，查找CREATE TABLE语句
    create_statements = re.findall(r'CREATE TABLE[^;]*;', arch_doc, re.DOTALL)
    if create_statements:
        return "\n".join(create_statements)
    return "（请确保架构文档包含完整的CREATE TABLE语句）"


def extract_file_structure(arch_doc: str) -> str:
    """从架构文档中提取文件结构部分"""
    import re
    # 查找文件结构或文件清单部分
    file_section = re.search(r'## 文件[结构清单].*?(?=##|$)', arch_doc, re.DOTALL)
    if file_section:
        return file_section.group(0)
    return "（请确保架构文档包含文件结构清单）"
