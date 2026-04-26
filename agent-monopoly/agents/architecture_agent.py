"""
Architecture Agent - 后端架构师
对应文件: agency-agents-zh-main/engineering/engineering-backend-architect.md
阶段: 阶段3 - 后端架构设计
输出: 架构设计文档
"""

from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from ..types import AgentState


ARCHITECTURE_AGENT_PROMPT = """你是后端架构师，一位资深后端架构师，专精可扩展系统设计、数据库架构和云基础设施。

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

        # 获取 PRD 和任务
        prd = state.get("prd", {})
        tasks = state.get("tasks", [])

        print(f"🏗️  设计后端架构")
        print(f"   - 基于功能需求: {len(prd.get('features', []))} 个")
        print(f"   - 支持任务: {len(tasks)} 个")
        print("\n⏳ 正在设计架构、数据库和 API...")

        # 构建 prompt
        messages = [
            SystemMessage(content=ARCHITECTURE_AGENT_PROMPT),
            HumanMessage(content=f"""
项目信息:
- 项目名称: {prd.get('project_name', 'N/A')}
- 核心功能: {', '.join(prd.get('features', [])[:5])}
- 任务列表: {', '.join([t['name'] for t in tasks[:5]])}

请设计完整的后端架构：
1. 选择合适的技术栈和架构模式
2. 设计数据库 schema（考虑在线大富翁游戏）
3. 定义 RESTful API
4. 考虑实时通信（WebSocket）需求
5. 包含安全和性能优化

注意：
- 使用 PostgreSQL 作为主数据库
- Redis 用于缓存和会话管理
- Socket.io 用于实时游戏通信
- JWT 用于认证
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

            print("✅ 架构设计完成！")
            print(f"   - 技术栈: {len(architecture_data['tech_stack'])} 项")
            print(f"   - 数据表: {len(architecture_data['database_schema'])} 个")
            print(f"   - API 端点: {len(architecture_data['api_endpoints'])} 个")

        except Exception as e:
            print(f"❌ 架构设计失败: {e}")
            state["current_agent"] = "Architecture Agent"
            state["architecture"] = {"error": str(e)}

        return state

    return architecture_agent


def extract_tech_stack(arch_doc: str) -> list:
    """提取技术栈"""
    stack = []
    keywords = ["Node.js", "Python", "PostgreSQL", "Redis", "Socket.io", "Express", "FastAPI"]
    for keyword in keywords:
        if keyword in arch_doc:
            stack.append(keyword)
    return stack[:10] if stack else ["PostgreSQL", "Redis", "Socket.io"]


def extract_database_schema(arch_doc: str) -> list:
    """提取数据库表"""
    tables = []
    if "CREATE TABLE" in arch_doc:
        tables.append("users (用户表)")
        tables.append("game_rooms (游戏房间表)")
        tables.append("games (游戏记录表)")
    return tables


def extract_api_endpoints(arch_doc: str) -> list:
    """提取 API 端点"""
    endpoints = []
    lines = arch_doc.split('\n')
    for line in lines:
        if "POST /" in line or "GET /" in line:
            endpoints.append(line.strip())
    return endpoints[:10] if endpoints else [
        "POST /api/auth/register",
        "POST /api/auth/login",
        "POST /api/rooms",
        "WebSocket /game/{room_id}"
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
