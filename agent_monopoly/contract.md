# Agent Monopoly - 接口契约文档

## 概述

本文档定义了9个阶段Agent之间的接口契约，确保各阶段之间的数据传递格式统一、清晰。

## 状态结构

### AgentState

```python
class AgentState(TypedDict):
    # 基础字段
    messages: Annotated[Sequence[BaseMessage], add]
    current_agent: str
    iteration_count: int

    # 9个阶段的输出
    prd: dict
    tasks: list
    architecture: dict
    design: dict
    code: dict
    review: dict
    test_results: dict
    qa_report: dict
    documentation: dict

    # 辅助字段
    memory_context: str
    skill_results: list[str]
    validation_status: list[str]

    # 项目元数据
    project_name: str
    user_requirement: str
```

---

## 阶段1: PM Agent (产品经理)

### 输入

```python
{
    "project_name": str,        # 项目名称
    "user_requirement": str,    # 用户原始需求
    "messages": [],             # 初始为空
    # ... 其他初始字段
}
```

### 输出 - `prd` 字段

```python
{
    "project_name": str,        # 项目名称
    "content": str,             # 完整PRD内容（Markdown格式）
    "features": list[str],      # 功能列表
    "user_stories": list[str],  # 用户故事
    "success_metrics": list[str], # 成功指标
    "risks": list[str],         # 风险列表
    "target_users": str,        # 目标用户
    "market_analysis": str,     # 市场分析
    "timeline": str             # 时间规划
}
```

### 示例

```python
prd = {
    "project_name": "在线大富翁游戏",
    "content": "# 产品需求文档\n\n## 项目概述...",
    "features": [
        "用户注册与登录",
        "创建游戏房间",
        "多人实时对战",
        "完整的游戏规则"
    ],
    "user_stories": [
        "作为玩家，我希望能够注册账号",
        "作为房主，我希望能够创建房间并邀请朋友"
    ],
    "success_metrics": [
        "用户注册量 > 1000",
        "日活用户 > 100",
        "平均游戏时长 > 30分钟"
    ],
    "risks": [
        "实时通信稳定性",
        "移动端性能优化"
    ],
    "target_users": "18-35岁，喜欢桌游的年轻人",
    "market_analysis": "桌游市场分析...",
    "timeline": "3个月完成MVP"
}
```

---

## 阶段2: Requirements Agent (Sprint排序师)

### 输入

```python
{
    "prd": { ... },              # 来自阶段1的PRD
    "project_name": str,
    # ... 其他字段
}
```

### 输出 - `tasks` 字段

```python
[
    {
        "id": str,               # 任务ID
        "name": str,             # 任务名称
        "priority": str,         # 优先级: "P0" | "P1" | "P2" | "Tech"
        "status": str,           # 状态: "pending" | "in_progress" | "completed"
        "assignee": str,         # 负责人
        "estimate_hours": int,   # 预估工时
        "description": str,      # 任务描述
        "acceptance_criteria": list[str],  # 验收标准
        "dependencies": list[str],  # 依赖任务ID
        "rice_score": float      # RICE评分
    }
]
```

### 示例

```python
tasks = [
    {
        "id": "TASK-001",
        "name": "用户注册与登录",
        "priority": "P0",
        "status": "pending",
        "assignee": "TBD",
        "estimate_hours": 8,
        "description": "实现用户注册、登录、JWT认证",
        "acceptance_criteria": [
            "用户可以注册新账号",
            "用户可以使用邮箱密码登录",
            "登录后获取JWT Token"
        ],
        "dependencies": [],
        "rice_score": 25.6
    },
    {
        "id": "TASK-002",
        "name": "创建游戏房间",
        "priority": "P0",
        "status": "pending",
        "assignee": "TBD",
        "estimate_hours": 12,
        "description": "实现房间创建、加入、列表功能",
        "acceptance_criteria": [
            "用户可以创建新房间",
            "用户可以通过房间ID加入房间",
            "可以看到房间列表"
        ],
        "dependencies": ["TASK-001"],
        "rice_score": 18.0
    }
]
```

---

## 阶段3: Architecture Agent (后端架构师)

### 输入

```python
{
    "prd": { ... },
    "tasks": [ ... ],           # 来自阶段2的任务列表
    "project_name": str,
    # ... 其他字段
}
```

### 输出 - `architecture` 字段

```python
{
    "content": str,                      # 完整架构文档
    "tech_stack": list[str],             # 技术栈列表
    "database_schema": list[str],        # 数据库表列表
    "api_endpoints": list[str],          # API端点列表
    "security_measures": list[str],      # 安全措施
    "architecture_pattern": str,         # 架构模式
    "communication_pattern": str,        # 通信模式
    "data_pattern": str,                 # 数据模式
    "deployment_pattern": str,           # 部署模式
    "performance_targets": dict,         # 性能目标
    "scalability_strategy": str          # 扩展策略
}
```

### 示例

```python
architecture = {
    "content": "# 系统架构设计文档\n\n...",
    "tech_stack": [
        "Node.js",
        "Express",
        "PostgreSQL",
        "Redis",
        "Socket.io"
    ],
    "database_schema": [
        "users (用户表)",
        "game_rooms (游戏房间表)",
        "games (游戏记录表)"
    ],
    "api_endpoints": [
        "POST /api/auth/register",
        "POST /api/auth/login",
        "POST /api/rooms",
        "GET /api/rooms",
        "WebSocket /game/{room_id}"
    ],
    "security_measures": [
        "JWT认证",
        "数据加密",
        "Rate Limiting",
        "SQL注入防护"
    ],
    "architecture_pattern": "Monolith",
    "communication_pattern": "REST + WebSocket",
    "data_pattern": "Traditional CRUD",
    "deployment_pattern": "Container",
    "performance_targets": {
        "api_response_time": "< 200ms",
        "websocket_latency": "< 50ms",
        "concurrent_users": "> 1000"
    },
    "scalability_strategy": "水平扩展，支持负载均衡"
}
```

---

## 阶段4: Design Agent (软件架构师)

### 输入

```python
{
    "architecture": { ... },   # 来自阶段3的架构设计
    "prd": { ... },
    "tasks": [ ... ],
    # ... 其他字段
}
```

### 输出 - `design` 字段

```python
{
    "content": str,                    # 完整设计文档
    "adr_records": list[str],          # ADR记录列表
    "modules": list[str],              # 模块列表
    "quality_attributes": list[str],   # 质量属性
    "domain_model": dict,              # 领域模型
    "layered_architecture": dict,      # 分层架构
    "bounded_contexts": list[str],     # 限界上下文
    "aggregates": list[str],           # 聚合列表
    "evolution_strategy": dict         # 演进策略
}
```

### 示例

```python
design = {
    "content": "# 系统设计文档\n\n...",
    "adr_records": [
        "ADR-001: 架构模式选择 - 选择模块化单体",
        "ADR-002: 数据存储策略 - PostgreSQL + Redis混合",
        "ADR-003: 实时通信方案 - Socket.io"
    ],
    "modules": [
        "用户模块",
        "游戏模块",
        "房间模块",
        "实时通信模块"
    ],
    "quality_attributes": [
        "可扩展性",
        "可靠性",
        "可维护性"
    ],
    "domain_model": {
        "user_context": ["User", "UserProfile"],
        "game_context": ["GameRoom", "Game", "Player"]
    },
    "layered_architecture": {
        "layers": [
            "前端层 (Frontend)",
            "API层 (API Layer)",
            "业务逻辑层 (Business Layer)",
            "数据访问层 (Data Layer)"
        ]
    },
    "bounded_contexts": [
        "用户上下文 (User Context)",
        "游戏上下文 (Game Context)"
    ],
    "aggregates": [
        "用户聚合: User, UserProfile",
        "游戏聚合: GameRoom, Game, Player"
    ],
    "evolution_strategy": {
        "phase1": "MVP - 单体应用",
        "phase2": "模块化 - 功能拆分",
        "phase3": "微服务 - 独立部署（可选）"
    }
}
```

---

## 阶段5: Coding Agent (高级开发者)

### 输入

```python
{
    "design": { ... },          # 来自阶段4的系统设计
    "architecture": { ... },    # 来自阶段3的架构设计
    "prd": { ... },
    # ... 其他字段
}
```

### 输出 - `code` 字段

```python
{
    "content": str,                    # 完整代码文档
    "backend_files": list[str],        # 后端文件列表
    "frontend_files": list[str],       # 前端文件列表
    "database_files": list[str],       # 数据库文件列表
    "config_files": list[str],         # 配置文件列表
    "project_structure": dict,         # 项目结构
    "dependencies": dict,              # 依赖列表
    "setup_instructions": str          # 安装说明
}
```

### 示例

```python
code = {
    "content": "# 代码实现文档\n\n...",
    "backend_files": [
        "backend/app.js",
        "backend/routes/api.js",
        "backend/services/gameService.js",
        "backend/models/User.js",
        "backend/models/Room.js",
        "backend/socket/gameHandler.js"
    ],
    "frontend_files": [
        "frontend/src/App.jsx",
        "frontend/src/components/GameRoom.jsx",
        "frontend/src/components/LoginForm.jsx",
        "frontend/src/hooks/useGame.js",
        "frontend/src/services/api.js",
        "frontend/src/socket.js"
    ],
    "database_files": [
        "database/schema.sql",
        "database/migrations/001_init.sql",
        "database/seeds/001_users.sql"
    ],
    "config_files": [
        ".env.example",
        "package.json",
        "docker-compose.yml"
    ],
    "project_structure": {
        "backend": {
            "src": ["controllers", "services", "models", "routes"],
            "tests": ["unit", "integration"]
        },
        "frontend": {
            "src": ["components", "pages", "hooks", "services"]
        }
    },
    "dependencies": {
        "backend": [
            "express@^4.18.0",
            "socket.io@^4.6.0",
            "pg@^8.11.0",
            "redis@^4.6.0",
            "jsonwebtoken@^9.0.0"
        ],
        "frontend": [
            "react@^18.2.0",
            "socket.io-client@^4.6.0",
            "react-router-dom@^6.11.0"
        ]
    },
    "setup_instructions": """
    # 安装依赖
    npm install

    # 配置环境变量
    cp .env.example .env

    # 初始化数据库
    npm run db:init

    # 启动服务
    npm run dev
    """
}
```

---

## 阶段6: Code Review Agent (代码审查员)

### 输入

```python
{
    "code": { ... },           # 来自阶段5的代码
    "design": { ... },
    "architecture": { ... },
    # ... 其他字段
}
```

### 输出 - `review` 字段

```python
{
    "content": str,                     # 完整审查报告
    "overall_score": str,               # 总体评分: "5/5" | "4/5" | "3/5" | "2/5" | "未评分"
    "blocking_issues": list[dict],      # 阻塞问题 (🔴)
    "important_issues": list[dict],     # 重要问题 (🟡)
    "minor_improvements": list[dict],   # 小改进 (💭)
    "pass_rate": float,                 # 通过率
    "recommendation": str,              # 审查建议
    "strengths": list[str]              # 优点总结
}
```

### 示例

```python
review = {
    "content": "# 代码审查报告\n\n...",
    "overall_score": "4/5",
    "blocking_issues": [
        {
            "id": "ISSUE-001",
            "severity": "Critical",
            "location": "backend/socket/gameHandler.js:45",
            "description": "未处理Socket连接失败的情况",
            "code": "socket.emit('join', data)",
            "fix": "添加连接状态检查和错误处理"
        }
    ],
    "important_issues": [
        {
            "id": "ISSUE-002",
            "severity": "High",
            "location": "frontend/src/hooks/useGame.js:23",
            "description": "缺少错误边界处理",
            "suggestions": [
                "添加try-catch包裹",
                "使用React Error Boundary"
            ]
        }
    ],
    "minor_improvements": [
        {
            "id": "ISSUE-003",
            "severity": "Low",
            "location": "backend/routes/api.js:12",
            "suggestion": "建议添加更多的日志记录"
        }
    ],
    "pass_rate": 0.85,
    "recommendation": "有条件通过 - 必须修复所有阻塞问题",
    "strengths": [
        "代码结构清晰",
        "注释充分",
        "命名规范"
    ]
}
```

---

## 阶段7: Testing Agent (证据收集者)

### 输入

```python
{
    "code": { ... },           # 来自阶段5的代码
    "design": { ... },
    "prd": { ... },
    # ... 其他字段
}
```

### 输出 - `test_results` 字段

```python
{
    "content": str,                    # 完整测试报告
    "bugs": list[dict],                # Bug列表
    "test_coverage": str,              # 测试覆盖率
    "quality_score": str,              # 质量评分
    "release_recommendation": str,     # 发布建议
    "test_cases": list[dict],          # 测试用例
    "summary": dict                    # 测试摘要
}
```

### 示例

```python
test_results = {
    "content": "# 测试报告\n\n...",
    "bugs": [
        {
            "id": "BUG-001",
            "severity": "P0",
            "title": "房间创建Socket连接失败",
            "module": "游戏房间",
            "steps": [
                "1. 登录系统",
                "2. 点击创建房间",
                "3. 填写房间信息",
                "4. 点击确认"
            ],
            "actual_result": "页面显示空白，控制台报错",
            "expected_result": "成功创建房间并跳转",
            "evidence": {
                "console_log": "TypeError: Cannot read property 'emit'...",
                "screenshot": "bug_001.png",
                "network_request": "POST /api/rooms/create - 500"
            },
            "reproduction_rate": "100%"
        }
    ],
    "test_coverage": "80-90%",
    "quality_score": "8/10",
    "release_recommendation": "不建议发布",
    "test_cases": [
        {
            "id": "TC-001",
            "name": "用户注册",
            "status": "PASS",
            "module": "用户模块"
        },
        {
            "id": "TC-002",
            "name": "创建房间",
            "status": "FAIL",
            "module": "游戏模块"
        }
    ],
    "summary": {
        "total_cases": 45,
        "passed": 38,
        "failed": 5,
        "blocked": 2,
        "pass_rate": 0.844
    }
}
```

---

## 阶段8: QA Agent (现实检验者)

### 输入

```python
{
    "test_results": { ... },   # 来自阶段7的测试结果
    "code": { ... },
    "prd": { ... },
    # ... 其他字段
}
```

### 输出 - `qa_report` 字段

```python
{
    "content": str,                      # 完整QA报告
    "overall_score": str,                # 质量评分: "A" | "B+" | "B" | "C+" | "C"
    "production_ready": str,             # 生产就绪状态: "READY" | "NEEDS_WORK" | "FAILED"
    "critical_issues": list[dict],       # 关键问题
    "compliance_rate": float,            # 规格合规率
    "revision_needed": str,              # 是否需要修订
    "estimated_revision_time": str,      # 预计修订时间
    "user_journey": dict,                # 用户旅程测试
    "cross_device_compatibility": dict   # 跨设备兼容性
}
```

### 示例

```python
qa_report = {
    "content": "# 集成测试报告\n\n...",
    "overall_score": "B+",
    "production_ready": "NEEDS_WORK",
    "critical_issues": [
        {
            "id": "QA-001",
            "severity": "P0",
            "description": "Socket连接问题导致核心功能不可用",
            "evidence": "端到端测试失败，无法完成游戏流程",
            "fix_required": "重构Socket事件处理逻辑",
            "estimated_time": "8-12小时"
        }
    ],
    "compliance_rate": 0.65,
    "revision_needed": "YES - 需要1-2个修订周期",
    "estimated_revision_time": "5-8个工作日",
    "user_journey": {
        "journey": "注册 → 创建房间 → 邀请玩家 → 开始游戏",
        "status": "FAIL",
        "failed_at": "步骤3: Socket连接不稳定",
        "evidence": ["user_journey_fail.png", "socket_log.txt"]
    },
    "cross_device_compatibility": {
        "desktop": {"status": "PASS", "notes": "Chrome/Firefox表现良好"},
        "tablet": {"status": "PASS", "notes": "基本正常"},
        "mobile": {"status": "PARTIAL", "notes": "部分交互问题"},
        "safari": {"status": "FAIL", "notes": "兼容性问题"}
    }
}
```

---

## 阶段9: Documentation Agent (技术文档工程师)

### 输入

```python
{
    "qa_report": { ... },      # 来自阶段8的QA报告
    "architecture": { ... },
    "design": { ... },
    "code": { ... },
    "prd": { ... },
    # ... 其他字段
}
```

### 输出 - `documentation` 字段

```python
{
    "content": str,                # 完整文档内容
    "documents": list[str],        # 文档列表
    "total_sections": int,         # 总章节数
    "word_count": int,             # 字数统计
    "files": dict                  # 各文档文件
}
```

### 示例

```python
documentation = {
    "content": "# 技术文档\n\n...",
    "documents": [
        "README.md",
        "API.md",
        "ARCHITECTURE.md",
        "DEPLOYMENT.md",
        "DEVELOPMENT.md"
    ],
    "total_sections": 5,
    "word_count": 15000,
    "files": {
        "README.md": {
            "sections": [
                "项目介绍",
                "快速开始",
                "安装指南",
                "技术栈",
                "项目结构"
            ],
            "word_count": 1200
        },
        "API.md": {
            "sections": [
                "认证接口",
                "用户接口",
                "房间接口",
                "WebSocket事件"
            ],
            "word_count": 3500
        },
        "ARCHITECTURE.md": {
            "sections": [
                "架构概览",
                "技术选型",
                "数据库设计",
                "ADR记录"
            ],
            "word_count": 2800
        },
        "DEPLOYMENT.md": {
            "sections": [
                "部署架构",
                "部署步骤",
                "监控和日志",
                "备份策略"
            ],
            "word_count": 2500
        },
        "DEVELOPMENT.md": {
            "sections": [
                "开发环境",
                "代码规范",
                "测试指南",
                "常见问题"
            ],
            "word_count": 2000
        }
    }
}
```

---

## 数据流图

```
用户需求
    ↓
┌─────────────┐
│ PM Agent    │ → prd: {...}
└──────┬──────┘
       │ prd
       ↓
┌─────────────┐
│ Requirements │ → tasks: [...]
│ Agent       │
└──────┬──────┘
       │ tasks + prd
       ↓
┌─────────────┐
│ Architecture │ → architecture: {...}
│ Agent       │
└──────┬──────┘
       │ architecture + tasks + prd
       ↓
┌─────────────┐
│ Design      │ → design: {...}
│ Agent       │
└──────┬──────┘
       │ design + architecture
       ↓
┌─────────────┐
│ Coding      │ → code: {...}
│ Agent       │
└──────┬──────┘
       │ code
       ↓
┌─────────────┐
│ Code Review │ → review: {...}
│ Agent       │
└──────┬──────┘
       │ code + review
       ↓
┌─────────────┐
│ Testing     │ → test_results: {...}
│ Agent       │
└──────┬──────┘
       │ test_results
       ↓
┌─────────────┐
│ QA Agent    │ → qa_report: {...}
└──────┬──────┘
       │ qa_report + 所有阶段输出
       ↓
┌─────────────┐
│ Documentation│ → documentation: {...}
│ Agent       │
└─────────────┘
```

---

## 错误处理

每个Agent在执行失败时，应该在其输出字段中设置错误信息：

```python
{
    "prd": {"error": "错误描述"},
    "tasks": [{"error": "错误描述"}],
    # ... 等等
}
```

消费方需要检查输出中是否包含 `error` 字段。

---

## 版本控制

- **当前版本**: v1.0.0
- **最后更新**: 2025-01-XX
- **维护者**: Agent Monopoly Team
