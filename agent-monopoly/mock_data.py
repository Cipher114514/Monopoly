"""
Agent Monopoly - Mock 数据（课程作业版）

提供各阶段的Mock数据，用于测试、开发和演示。
**特别说明**: 本版本针对2周课程作业进行了大幅简化
"""

# ===== 初始状态 =====

INITIAL_STATE = {
    "messages": [],
    "current_agent": "",
    "iteration_count": 0,
    "prd": {},
    "tasks": [],
    "architecture": {},
    "design": {},
    "code": {},
    "review": {},
    "test_results": {},
    "qa_report": {},
    "documentation": {},
    "memory_context": "",
    "skill_results": [],
    "validation_status": [],
    "project_name": "在线大富翁游戏（课程作业）",
    "user_requirement": """
    开发一个基于Web的多人在线大富翁游戏（课程作业），要求：
    - 支持用户注册和登录
    - 可以创建游戏房间并邀请朋友
    - 支持2-4人实时对战（简化版）
    - 实现基础游戏规则（掷骰子、买地、收租）
    - 基本的响应式设计
    - 时间：2周完成
    """,
}


# ===== 阶段1: PM Agent - Mock PRD =====

MOCK_PRD = {
    "project_name": "在线大富翁游戏（课程作业）",
    "content": """# 产品需求文档 (PRD) - 课程作业版

## 项目概述
开发一个基于Web的多人在线大富翁游戏，作为软件工程课程作业。

## 目标
- **教育目标**: 实践软件开发的完整流程
- **技术目标**: 掌握前后端开发和实时通信技术
- **时间**: 2周完成

## 目标用户
- 课程教师和助教
- 课程同学（演示和测试）

## 核心功能（MVP）

### 1. 用户系统
- 用户注册（邮箱）
- 用户登录
- 简单的个人资料（昵称）

### 2. 房间系统
- 创建游戏房间
- 通过房间ID加入房间
- 房间列表浏览

### 3. 游戏系统（简化版）
- 2-4人实时对战
- 基础游戏规则
  - 掷骰子移动
  - 购买地产
  - 收取租金
- 实时同步游戏状态

### 4. 界面设计
- 简洁的大富翁棋盘
- 基本的棋子和动画
- 响应式设计（桌面优先）

## 非功能需求（课程作业标准）

### 性能
- 页面加载时间 < 3秒（可接受）
- API响应时间 < 500ms（可接受）
- WebSocket延迟 < 100ms（可接受）
- 支持20-50并发用户（课程演示足够）

### 可用性
- 基本功能正常运行
- 适当的错误提示

### 安全
- 基础的密码加密
- 基本的输入验证

## 成功指标（课程作业）

### 完成度指标
- 核心功能完成率 > 80%
- 代码可以正常运行
- 通过课程答辩

### 技术指标
- 代码结构清晰
- 有基本的错误处理
- 有简单的测试

## 主要挑战（课程作业）

### 技术挑战
- WebSocket实时通信（新技术学习）
- 游戏状态同步
- 时间管理（2周紧张）

### 时间挑战
- 需要快速学习新技术
- 需要平衡课程和其他作业
- 需要团队协作

## 时间规划（2周）

### 第1周
- **Day 1-2**: 需求分析、架构设计、技术选型
- **Day 3-4**: 后端开发（用户系统、房间系统）
- **Day 5-6**: 前端开发（登录、房间界面）
- **Day 7**: WebSocket实现

### 第2周
- **Day 8-9**: 游戏核心逻辑实现
- **Day 10**: 前端游戏界面
- **Day 11**: 集成测试和Bug修复
- **Day 12**: 优化和文档
- **Day 13**: 准备演示
- **Day 14**: 课程答辩和展示

## 简化说明
相比完整版，本版本进行了以下简化：
- 玩家人数：2-4人（而非2-6人）
- 游戏规则：只保留核心规则（去除建房、机会卡等）
- 界面：优先桌面端，移动端基础支持
- 性能：降低要求，满足课程演示即可
- 安全：基础安全措施，不追求生产级
- 测试：基本功能测试，不需要完整的测试覆盖
""",
    "features": [
        "用户注册与登录",
        "创建游戏房间",
        "加入游戏房间",
        "房间列表浏览",
        "2-4人实时对战",
        "基础游戏规则（掷骰子、买地、收租）",
        "实时状态同步"
    ],
    "user_stories": [
        "作为学生，我需要完成课程作业",
        "作为玩家，我希望能够注册并登录",
        "作为房主，我希望能够创建房间",
        "作为玩家，我希望能够通过房间ID加入",
        "作为玩家，我希望能够体验基本的游戏流程"
    ],
    "success_metrics": [
        "核心功能完成 > 80%",
        "代码可以正常运行",
        "通过课程答辩",
        "展示完整开发流程"
    ],
    "risks": [
        "时间紧张（只有2周）",
        "WebSocket技术不熟悉",
        "游戏状态同步复杂",
        "团队协作沟通",
        "课程其他任务冲突"
    ],
    "target_users": "课程教师和同学",
    "market_analysis": """
    ## 课程背景
    - 软件工程课程实践项目
    - 展示软件开发流程
    - 2周时间限制

    ## 技术学习目标
    - 前后端分离开发
    - WebSocket实时通信
    - 团队协作开发

    ## 评估标准
    - 功能完成度
    - 代码质量
    - 开发流程规范性
    - 团队协作
    """,
    "timeline": "2周完成MVP，第1周后端+基础前端，第2周游戏逻辑+集成测试"
}


# ===== 阶段2: Requirements Agent - Mock Tasks =====

MOCK_TASKS = [
    {
        "id": "TASK-001",
        "name": "项目初始化和技术栈搭建",
        "priority": "P0",
        "status": "pending",
        "assignee": "全组",
        "estimate_hours": 4,
        "description": "初始化项目，配置开发环境，确定技术栈",
        "acceptance_criteria": [
            "创建前后端项目结构",
            "配置开发环境",
            "搭建基础框架",
            "确定开发规范"
        ],
        "dependencies": [],
        "rice_score": 25.0
    },
    {
        "id": "TASK-002",
        "name": "数据库设计",
        "priority": "P0",
        "status": "pending",
        "assignee": "后端开发",
        "estimate_hours": 4,
        "description": "设计简化的数据库Schema",
        "acceptance_criteria": [
            "用户表（users）",
            "房间表（rooms）",
            "游戏表（games）",
            "简单的表结构"
        ],
        "dependencies": [],
        "rice_score": 24.0
    },
    {
        "id": "TASK-003",
        "name": "用户认证系统",
        "priority": "P0",
        "status": "pending",
        "assignee": "后端开发",
        "estimate_hours": 8,
        "description": "实现用户注册、登录功能",
        "acceptance_criteria": [
            "用户可以注册",
            "用户可以登录",
            "简单的密码加密",
            "基础session管理"
        ],
        "dependencies": ["TASK-002"],
        "rice_score": 26.0
    },
    {
        "id": "TASK-004",
        "name": "房间管理API",
        "priority": "P0",
        "status": "pending",
        "assignee": "后端开发",
        "estimate_hours": 8,
        "description": "实现房间创建、加入、列表功能",
        "acceptance_criteria": [
            "创建房间",
            "通过ID加入房间",
            "房间列表展示",
            "基本的状态管理"
        ],
        "dependencies": ["TASK-003"],
        "rice_score": 24.0
    },
    {
        "id": "TASK-005",
        "name": "WebSocket实时通信",
        "priority": "P0",
        "status": "pending",
        "assignee": "后端开发",
        "estimate_hours": 10,
        "description": "实现基本的WebSocket连接和消息广播",
        "acceptance_criteria": [
            "WebSocket连接建立",
            "房间消息广播",
            "基本的连接管理",
            "简单的错误处理"
        ],
        "dependencies": ["TASK-004"],
        "rice_score": 28.0
    },
    {
        "id": "TASK-006",
        "name": "游戏核心逻辑",
        "priority": "P0",
        "status": "pending",
        "assignee": "后端开发",
        "estimate_hours": 16,
        "description": "实现基础游戏规则（掷骰子、移动、买地、收租）",
        "acceptance_criteria": [
            "掷骰子功能",
            "棋子移动",
            "购买地产",
            "收取租金",
            "游戏状态管理"
        ],
        "dependencies": ["TASK-005"],
        "rice_score": 30.0
    },
    {
        "id": "TASK-007",
        "name": "前端登录和房间界面",
        "priority": "P0",
        "status": "pending",
        "assignee": "前端开发",
        "estimate_hours": 10,
        "description": "实现登录、注册、房间列表界面",
        "acceptance_criteria": [
            "登录/注册表单",
            "房间列表展示",
            "创建房间表单",
            "基本的样式"
        ],
        "dependencies": ["TASK-003"],
        "rice_score": 22.0
    },
    {
        "id": "TASK-008",
        "name": "前端游戏界面",
        "priority": "P0",
        "status": "pending",
        "assignee": "前端开发",
        "estimate_hours": 16,
        "description": "实现游戏主界面（棋盘、玩家信息、操作按钮）",
        "acceptance_criteria": [
            "游戏棋盘展示",
            "玩家信息显示",
            "操作按钮",
            "实时状态更新",
            "基础动画"
        ],
        "dependencies": ["TASK-007"],
        "rice_score": 28.0
    },
    {
        "id": "TASK-009",
        "name": "前后端集成和测试",
        "priority": "P0",
        "status": "pending",
        "assignee": "全组",
        "estimate_hours": 8,
        "description": "集成前后端，进行端到端测试",
        "acceptance_criteria": [
            "完整流程可运行",
            "修复主要Bug",
            "基础功能测试",
            "准备演示"
        ],
        "dependencies": ["TASK-006", "TASK-008"],
        "rice_score": 26.0
    },
    {
        "id": "TASK-010",
        "name": "文档和答辩准备",
        "priority": "P1",
        "status": "pending",
        "assignee": "全组",
        "estimate_hours": 6,
        "description": "编写项目文档，准备答辩材料",
        "acceptance_criteria": [
            "README文档",
            "使用说明",
            "答辩PPT",
            "演示视频（可选）"
        ],
        "dependencies": ["TASK-009"],
        "rice_score": 20.0
    }
]


# ===== 阶段3: Architecture Agent - Mock Architecture =====

MOCK_ARCHITECTURE = {
    "content": """# 系统架构设计文档 - 课程作业版

## 高层架构

**架构模式**: 简化的单体架构
**通信模式**: REST + WebSocket
**数据模式**: 简化的CRUD
**部署模式**: 本地开发环境

## 服务分解

### 核心服务
**单一体应用**: 在线大富翁游戏服务
- 职责: 处理所有业务逻辑（用户、房间、游戏）
- 数据库: SQLite（开发简单，适合课程作业）
- API: RESTful API + WebSocket
- 部署: 本地运行，Heroku免费部署（可选）

## 技术选型（简化版）

### 后端
- **Node.js + Express**: 简单易学，快速开发
- **SQLite**: 无需配置数据库服务器，适合小项目
- **Socket.io**: WebSocket库，实现实时通信
- **JWT**: 简单的Token认证

### 前端
- **React + Vite**: 快速开发
- **Socket.io Client**: WebSocket客户端
- **CSS Modules**: 简单的样式管理

## 简化的架构

```
┌─────────────┐
│   Browser   │  React App
└──────┬──────┘
       │ HTTP + WebSocket
┌──────▼──────┐
│  Express    │  REST API + WebSocket
│   Server    │
└──────┬──────┘
       │
┌──────▼──────┐
│   SQLite    │  本地数据库
└─────────────┘
```
""",

    "tech_stack": [
        "Node.js",
        "Express",
        "SQLite",
        "Socket.io",
        "React",
        "Vite"
    ],

    "database_schema": [
        "users (用户表) - id, email, password_hash, nickname, created_at",
        "rooms (房间表) - id, name, owner_id, max_players, status, created_at",
        "games (游戏表) - id, room_id, status, current_player_index, game_state_json, created_at"
    ],

    "api_endpoints": [
        "POST /api/auth/register - 用户注册",
        "POST /api/auth/login - 用户登录",
        "GET /api/auth/me - 获取当前用户",
        "POST /api/rooms - 创建房间",
        "GET /api/rooms - 获取房间列表",
        "POST /api/rooms/:id/join - 加入房间",
        "WebSocket /socket.io/ - 实时通信"
    ],

    "security_measures": [
        "简单的密码加密（bcrypt）",
        "基础的输入验证",
        "JWT Token认证",
        "基本的错误处理"
    ],

    "architecture_pattern": "简化的单体架构",
    "communication_pattern": "REST API + WebSocket",
    "data_pattern": "简化的CRUD",
    "deployment_pattern": "本地开发 + Heroku免费部署（可选）",

    "performance_targets": {
        "api_response_time": "< 500ms（可接受）",
        "websocket_latency": "< 100ms（可接受）",
        "concurrent_users": "20-50人（课程演示足够）",
        "page_load_time": "< 3s（可接受）"
    },

    "scalability_strategy": """
    ## 课程作业不考虑扩展性
    - 本地开发运行即可
    - 不需要复杂的负载均衡
    - 不需要数据库优化
    - 重点在功能完成，不在性能

    ## 部署方案（可选）
    - Heroku免费层部署
    - 或者本地演示
    - 或者录屏演示
    """
}


# ===== 阶段4: Design Agent - Mock Design =====

MOCK_DESIGN = {
    "content": """# 系统设计文档 - 课程作业版

## 架构决策记录 (ADR)

### ADR-001: 架构模式选择
**决策**: 简化的单体架构
**理由**:
- 2周时间，不适合复杂的微服务
- 团队规模小，单体更容易开发
- 课程作业不需要考虑扩展性

### ADR-002: 数据存储策略
**决策**: SQLite
**理由**:
- 无需配置数据库服务器
- 开发简单，适合小项目
- 单个文件，易于管理

### ADR-003: 实时通信方案
**决策**: Socket.io
**理由**:
- 学习成本低
- 文档丰富
- 自动处理连接管理

## 简化的领域模型

### 核心实体
- **User**: 用户（id, email, nickname）
- **Room**: 房间（id, name, owner, players）
- **Game**: 游戏（id, room, players, state）

### 简化的分层架构

```
┌───────────────────┐
│   Frontend (React) │
└─────────┬─────────┘
          │
┌─────────▼─────────┐
│  API Layer        │  Express Routes
└─────────┬─────────┘
          │
┌─────────▼─────────┐
│  Business Logic   │  Game Logic
└─────────┬─────────┘
          │
┌─────────▼─────────┐
│  Data Layer       │  SQLite
└───────────────────┘
```
""",

    "adr_records": [
        "ADR-001: 架构模式 - 简化单体",
        "ADR-002: 数据库 - SQLite",
        "ADR-003: 实时通信 - Socket.io",
        "ADR-004: 前端框架 - React + Vite"
    ],

    "modules": [
        "用户模块 (User)",
        "房间模块 (Room)",
        "游戏模块 (Game)"
    ],

    "quality_attributes": [
        "可完成性 (Completable) - 2周内完成",
        "可演示性 (Demonstrable) - 课程展示",
        "代码清晰 (Clean Code)"
    ],

    "domain_model": {
        "user": {"fields": ["id", "email", "nickname", "password_hash"]},
        "room": {"fields": ["id", "name", "owner_id", "max_players", "status"]},
        "game": {"fields": ["id", "room_id", "players", "state", "current_turn"]}
    },

    "layered_architecture": {
        "layers": ["Frontend", "API", "Business Logic", "Data"]
    }
}


# ===== 阶段5: Coding Agent - Mock Code =====

MOCK_CODE = {
    "content": """# 代码实现文档 - 课程作业版

## 简化的项目结构

```
monopoly-game/
├── backend/
│   ├── src/
│   │   ├── routes/           # 路由
│   │   │   ├── auth.js
│   │   │   ├── rooms.js
│   │   │   └── games.js
│   │   ├── services/         # 业务逻辑
│   │   │   ├── authService.js
│   │   │   ├── roomService.js
│   │   │   └── gameService.js
│   │   ├── models/           # 数据模型
│   │   │   ├── db.js         # SQLite数据库
│   │   │   └── schemas.js    # 表结构
│   │   ├── socket/           # WebSocket
│   │   │   └── gameHandler.js
│   │   └── app.js            # 入口
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/       # React组件
│   │   │   ├── Login.jsx
│   │   │   ├── RoomList.jsx
│   │   │   └── GameBoard.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
└── README.md
```

## 关键代码示例

### 后端 - app.js
```javascript
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// 路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/rooms', require('./routes/rooms'));

// WebSocket
require('./socket/gameHandler')(io);

server.listen(3000, () => console.log('Server running on 3000'));
```

### 前端 - GameBoard.jsx
```javascript
import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

export default function GameBoard({ roomId }) {
    const [game, setGame] = useState(null);
    const socket = io(`http://localhost:3000`);

    useEffect(() => {
        socket.emit('join_room', roomId);
        socket.on('game_update', setGame);
        return () => socket.disconnect();
    }, [roomId]);

    const rollDice = () => socket.emit('roll_dice', { roomId });

    if (!game) return <div>Loading...</div>;
    return (
        <div>
            <h1>Game Room</h1>
            <button onClick={rollDice}>🎲 掷骰子</button>
            {/* 游戏棋盘 */}
        </div>
    );
}
```
""",

    "backend_files": [
        "backend/src/app.js",
        "backend/src/routes/auth.js",
        "backend/src/routes/rooms.js",
        "backend/src/services/authService.js",
        "backend/src/services/roomService.js",
        "backend/src/services/gameService.js",
        "backend/src/models/db.js",
        "backend/src/socket/gameHandler.js"
    ],

    "frontend_files": [
        "frontend/src/App.jsx",
        "frontend/src/components/Login.jsx",
        "frontend/src/components/RoomList.jsx",
        "frontend/src/components/GameBoard.jsx",
        "frontend/src/main.jsx"
    ],

    "config_files": [
        "backend/package.json",
        "frontend/package.json",
        "README.md"
    ],

    "dependencies": {
        "backend": [
            "express@^4.18.0",
            "socket.io@^4.6.0",
            "sqlite3@^5.1.0",
            "bcrypt@^5.1.0",
            "jsonwebtoken@^9.0.0",
            "cors@^2.8.5"
        ],
        "frontend": [
            "react@^18.2.0",
            "socket.io-client@^4.6.0",
            "vite@^4.4.0"
        ]
    },

    "setup_instructions": """
# 安装和运行

## 后端
\`\`\`bash
cd backend
npm install
npm start
\`\`\`

## 前端
\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`

## 访问
打开浏览器访问 http://localhost:5173
"""
}


# ===== 阶段6: Code Review Agent - Mock Review =====

MOCK_REVIEW = {
    "content": """# 代码审查报告 - 课程作业版

## 总体评分: ⭐⭐⭐⭐ (4/5)

## 审查摘要
- 代码行数: ~1500行（简化版）
- 问题数量: 6个
- 阻塞问题: 0个
- 重要问题: 3个
- 建议问题: 3个

## 🟡 重要问题（应该修复）

### Issue #1: 缺少输入验证
**位置**: backend/routes/auth.js
**建议**: 添加基本的输入验证（邮箱格式、密码长度）

### Issue #2: 错误处理不完整
**位置**: 多处
**建议**: 添加try-catch和错误提示

### Issue #3: Socket断线处理
**位置**: frontend/GameBoard.jsx
**建议**: 添加断线重连逻辑

## 💭 小改进（可选）

### Issue #4: 缺少注释
**位置**: 游戏逻辑部分
**建议**: 为复杂逻辑添加注释

### Issue #5: 代码重复
**位置**: API调用部分
**建议**: 提取通用逻辑

### Issue #6: 变量命名
**位置**: 部分变量
**建议**: 使用更具描述性的名称

## ✅ 优点总结

- 代码结构清晰
- 功能模块划分合理
- 使用了合适的技术栈
- 基本功能完整

## 审查结论

**是否通过**: ✅ 通过（课程作业标准）

**评价**: 作为2周的课程作业，代码质量良好，功能完整，符合要求。
""",

    "overall_score": "4/5",
    "blocking_issues": [],
    "important_issues": [
        {
            "id": "ISSUE-001",
            "severity": "Medium",
            "location": "backend/routes/auth.js",
            "title": "缺少输入验证",
            "suggestions": ["添加邮箱格式验证", "添加密码长度验证"]
        },
        {
            "id": "ISSUE-002",
            "severity": "Medium",
            "location": "多处",
            "title": "错误处理不完整",
            "suggestions": ["添加try-catch", "添加用户友好的错误提示"]
        },
        {
            "id": "ISSUE-003",
            "severity": "Medium",
            "location": "frontend/GameBoard.jsx",
            "title": "Socket断线处理",
            "suggestions": ["添加断线提示", "实现重连逻辑"]
        }
    ],
    "minor_improvements": [
        {"id": "ISSUE-004", "severity": "Low", "suggestion": "添加代码注释"},
        {"id": "ISSUE-005", "severity": "Low", "suggestion": "减少代码重复"},
        {"id": "ISSUE-006", "severity": "Low", "suggestion": "改善变量命名"}
    ],
    "pass_rate": 0.85,
    "recommendation": "通过 - 符合课程作业标准",
    "strengths": [
        "代码结构清晰",
        "功能模块划分合理",
        "技术栈选择合适",
        "基本功能完整"
    ]
}


# ===== 阶段7: Testing Agent - Mock Test Results =====

MOCK_TEST_RESULTS = {
    "content": """# 测试报告 - 课程作业版

## 测试概述
- 测试时间: 2小时
- 测试版本: v1.0.0
- 测试环境: 本地开发环境

## 测试结果

### 功能测试
- [x] 用户注册 - PASS
- [x] 用户登录 - PASS
- [x] 创建房间 - PASS
- [x] 加入房间 - PASS
- [x] 掷骰子 - PASS
- [x] 购买地产 - PASS
- [ ] 实时状态同步 - FAIL（小Bug）

### Bug列表

### Bug #001: 状态同步偶尔延迟
**严重程度**: P2
**复现**: 低概率（20%）
**影响**: 部分情况下游戏状态更新慢
**建议**: 优化WebSocket消息广播

## 测试统计

- 总测试用例: 15
- 通过: 14 (93.3%)
- 失败: 1 (6.7%)

## 质量评估

### 功能完整性
- 核心功能: 95% 可用

### 用户体验
- 界面美观度: 7/10
- 交互流畅度: 7/10

### 性能指标
- 页面加载: 1.5s ✅
- API 响应: 250ms ✅
- WebSocket延迟: 60ms ✅

## 发布建议

**当前状态**: ✅ 可以提交

**评价**: 核心功能完整，只有1个小Bug，不影响课程演示。
""",

    "bugs": [
        {
            "id": "BUG-001",
            "severity": "P2",
            "title": "状态同步偶尔延迟",
            "module": "实时通信",
            "actual_result": "部分情况下游戏状态更新慢",
            "expected_result": "状态实时同步",
            "reproduction_rate": "20%"
        }
    ],
    "test_coverage": "90%",
    "quality_score": "8/10",
    "release_recommendation": "可以提交",
    "test_cases": [
        {"id": "TC-001", "name": "用户注册", "status": "PASS"},
        {"id": "TC-002", "name": "用户登录", "status": "PASS"},
        {"id": "TC-003", "name": "创建房间", "status": "PASS"},
        {"id": "TC-004", "name": "加入房间", "status": "PASS"},
        {"id": "TC-005", "name": "掷骰子", "status": "PASS"},
        {"id": "TC-006", "name": "购买地产", "status": "PASS"},
        {"id": "TC-007", "name": "状态同步", "status": "FAIL"}
    ],
    "summary": {
        "total_cases": 15,
        "passed": 14,
        "failed": 1,
        "pass_rate": 0.933
    }
}


# ===== 阶段8: QA Agent - Mock QA Report =====

MOCK_QA_REPORT = {
    "content": """# QA评估报告 - 课程作业版

## 综合评估

**整体评分**: **B+**（良好）

**生产就绪性**: N/A（课程作业不需要）

## 功能完成度

### 核心功能评估
- ✅ 用户系统: 95% 完成
- ✅ 房间系统: 90% 完成
- ✅ 游戏逻辑: 90% 完成
- ⚠️ 实时通信: 85% 完成（有小Bug）

**总体完成度**: **90%**

## 端到端用户旅程

**旅程**: 注册 → 创建房间 → 邀请玩家 → 开始游戏 → 完成游戏

**结果**: ✅ 基本成功
- 注册流程: ✅ 流畅
- 创建房间: ✅ 正常
- 开始游戏: ✅ 可用
- 游戏进行: ⚠️ 偶尔有延迟（不影响演示）

## 技术质量

### 代码质量: ⭐⭐⭐⭐ (4/5)
- 结构清晰
- 命名规范
- 有基本注释

### 功能稳定性: ⭐⭐⭐⭐ (4/5)
- 核心功能稳定
- 有1个小Bug但不影响演示

### 用户体验: ⭐⭐⭐ (3.5/5)
- 界面简洁
- 基本交互流畅
- 有改进空间

## 课程作业评价

### 优点 ✅
1. **时间管理**: 2周内完成了核心功能
2. **技术选型**: 选择合适，易于实现
3. **团队协作**: 分工明确，协作良好
4. **完整性**: 展示了完整的开发流程
5. **可演示性**: 可以进行课程展示

### 可改进点 ⚠️
1. 错误处理可以更完善
2. 界面可以更美观
3. 代码注释可以更多

## 答辩准备建议

### 必须准备 ✅
1. **演示视频/现场演示**
   - 展示完整的游戏流程
   - 突出实时通信功能

2. **技术文档**
   - README
   - 架构说明
   - API文档（简化版）

3. **答辩PPT**
   - 项目概述
   - 技术架构
   - 开发流程
   - 遇到的挑战和解决方案
   - 演示Demo

### 强调亮点 ⭐
1. 完整的前后端分离开发
2. WebSocket实时通信实现
3. 游戏状态管理
4. 2周时间的高效开发

### 应对提问 💡
1. **为什么选择这个技术栈？**
   答: 2周时间限制，选择简单快速的技术栈

2. **最大的挑战是什么？**
   答: WebSocket实时通信和游戏状态同步

3. **如果给你更多时间会怎么改进？**
   答: 完善错误处理、优化UI、添加更多游戏规则

## 最终结论

**评级**: **B+**（良好）

**是否符合课程要求**: ✅ **是**

**是否可以参加答辩**: ✅ **是**

**评价**: 作为2周的课程作业，项目完成度高，功能完整，技术展示充分，符合课程要求。虽然有一些小问题，但不影响整体展示和答辩。
""",

    "overall_score": "B+",
    "production_ready": "N/A",
    "critical_issues": [],
    "compliance_rate": 0.90,
    "revision_needed": "NO - 可以直接参加答辩",
    "estimated_revision_time": "0",
    "user_journey": {
        "journey": "注册 → 创建房间 → 邀请玩家 → 开始游戏",
        "status": "SUCCESS",
        "notes": "核心流程可用，偶尔有延迟但不影响演示"
    },
    "cross_device_compatibility": {
        "desktop": {"status": "PASS", "notes": "桌面端表现良好"}
    }
}


# ===== 阶段9: Documentation Agent - Mock Documentation =====

MOCK_DOCUMENTATION = {
    "content": """# 技术文档 - 课程作业版

## 文档结构

1. **README.md** - 项目说明
2. **ARCHITECTURE.md** - 架构设计
3. **API.md** - API文档（简化版）
4. **DEVELOPMENT.md** - 开发指南
""",

    "documents": [
        "README.md",
        "ARCHITECTURE.md",
        "API.md",
        "DEVELOPMENT.md"
    ],

    "total_sections": 4,
    "word_count": 3000,

    "files": {
        "README.md": {
            "sections": [
                "项目介绍",
                "功能特性",
                "技术栈",
                "安装指南",
                "运行说明",
                "注意事项"
            ],
            "word_count": 800
        },
        "ARCHITECTURE.md": {
            "sections": [
                "架构概述",
                "技术选型",
                "数据库设计",
                "项目结构"
            ],
            "word_count": 1000
        },
        "API.md": {
            "sections": [
                "认证接口",
                "房间接口",
                "WebSocket事件"
            ],
            "word_count": 800
        },
        "DEVELOPMENT.md": {
            "sections": [
                "开发环境",
                "代码规范",
                "常见问题"
            ],
            "word_count": 400
        }
    }
}


# ===== 便捷函数 =====

def get_mock_state(stage: int = 0):
    """
    获取指定阶段的Mock状态

    Args:
        stage: 阶段编号 (0-9)
            0: 初始状态
            1: PM Agent完成后
            2: Requirements Agent完成后
            ...
            9: Documentation Agent完成后

    Returns:
        模拟的AgentState
    """
    state = INITIAL_STATE.copy()

    if stage >= 1:
        state["prd"] = MOCK_PRD.copy()
        state["current_agent"] = "PM Agent"

    if stage >= 2:
        state["tasks"] = MOCK_TASKS.copy()
        state["current_agent"] = "Requirements Agent"

    if stage >= 3:
        state["architecture"] = MOCK_ARCHITECTURE.copy()
        state["current_agent"] = "Architecture Agent"

    if stage >= 4:
        state["design"] = MOCK_DESIGN.copy()
        state["current_agent"] = "Design Agent"

    if stage >= 5:
        state["code"] = MOCK_CODE.copy()
        state["current_agent"] = "Coding Agent"

    if stage >= 6:
        state["review"] = MOCK_REVIEW.copy()
        state["current_agent"] = "Code Review Agent"

    if stage >= 7:
        state["test_results"] = MOCK_TEST_RESULTS.copy()
        state["current_agent"] = "Testing Agent"

    if stage >= 8:
        state["qa_report"] = MOCK_QA_REPORT.copy()
        state["current_agent"] = "QA Agent"

    if stage >= 9:
        state["documentation"] = MOCK_DOCUMENTATION.copy()
        state["current_agent"] = "Documentation Agent"

    state["iteration_count"] = stage

    return state


def print_stage_summary(stage: int):
    """打印指定阶段的Mock数据摘要"""
    state = get_mock_state(stage)

    print(f"\n{'='*70}")
    print(f"阶段 {stage} Mock 数据摘要（课程作业版）")
    print(f"{'='*70}")

    if stage >= 1:
        prd = state["prd"]
        print(f"\n✅ PRD:")
        print(f"   - 项目: {prd['project_name']}")
        print(f"   - 功能数: {len(prd['features'])}")
        print(f"   - 时间: 2周")

    if stage >= 2:
        tasks = state["tasks"]
        print(f"\n✅ 任务列表:")
        print(f"   - 总任务: {len(tasks)}")
        p0 = [t for t in tasks if t['priority'] == 'P0']
        print(f"   - P0任务: {len(p0)}")
        total_hours = sum(t['estimate_hours'] for t in tasks)
        print(f"   - 总工时: {total_hours}小时")

    if stage >= 3:
        arch = state["architecture"]
        print(f"\n✅ 架构设计:")
        print(f"   - 技术栈: {', '.join(arch['tech_stack'][:3])}...")
        print(f"   - 数据库: SQLite")

    if stage >= 4:
        design = state["design"]
        print(f"\n✅ 系统设计:")
        print(f"   - ADR记录: {len(design['adr_records'])} 个")

    if stage >= 5:
        code = state["code"]
        print(f"\n✅ 代码实现:")
        print(f"   - 后端文件: {len(code['backend_files'])} 个")
        print(f"   - 前端文件: {len(code['frontend_files'])} 个")

    if stage >= 6:
        review = state["review"]
        print(f"\n✅ 代码审查:")
        print(f"   - 评分: {review['overall_score']}")
        print(f"   - 阻塞问题: {len(review['blocking_issues'])} 个")

    if stage >= 7:
        test = state["test_results"]
        print(f"\n✅ 测试报告:")
        print(f"   - Bug: {len(test['bugs'])} 个")
        print(f"   - 通过率: {test['summary']['pass_rate']*100:.1f}%")

    if stage >= 8:
        qa = state["qa_report"]
        print(f"\n✅ QA评估:")
        print(f"   - 评分: {qa['overall_score']}")
        print(f"   - 完成度: {qa['compliance_rate']*100:.0f}%")

    if stage >= 9:
        docs = state["documentation"]
        print(f"\n✅ 技术文档:")
        print(f"   - 文档数: {len(docs['documents'])} 个")
        print(f"   - 字数: {docs['word_count']}")

    print(f"\n{'='*70}\n")


if __name__ == "__main__":
    # 打印所有阶段的摘要
    for i in range(10):
        print_stage_summary(i)
