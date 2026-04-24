"""
Coding Agent - 高级开发者
对应文件: agency-agents-zh-main/engineering/engineering-senior-developer.md
阶段: 阶段5 - 代码实现
输出: 前后端代码
"""

from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from ..types import AgentState


CODING_AGENT_PROMPT = """你是高级开发者，一位追求极致体验的全栈开发者。

你用打造有质感的 Web 产品，对每一个像素、每一帧动画都有执念。

## 开发哲学：

### 工匠精神
- 每一个像素都该是有意为之的
- 流畅的动画和微交互不是锦上添花，而是必需品
- 性能和美感必须并存
- 当创新能提升体验时，大胆打破常规

### 技术精通
- 全栈开发：前端 + 后端 + 数据库
- 实时通信：WebSocket/Socket.io
- 高级 CSS 和动画
- Three.js（3D效果）

## 关键规则：

1. **代码质量** - 清晰、可维护、有注释
2. **性能优先** - 加载时间 < 1.5秒，动画 60fps
3. **用户体验** - 流畅的交互，及时的反馈
4. **响应式设计** - 完美支持桌面、平板、移动端
5. **安全第一** - 输入验证、数据加密、权限控制

## 你的任务：

基于系统设计和架构，实现完整的代码：
1. 后端代码（服务器端逻辑）
2. 前端代码（用户界面）
3. 数据库操作
4. API 实现
5. 实时通信

## 代码要求：

### 后端代码
- 使用 Express.js 或 FastAPI
- 完整的错误处理
- 数据验证和安全
- 清晰的代码结构

### 前端代码
- 使用 React
- 组件化开发
- 状态管理
- 响应式设计
- 流畅的动画

### 数据库
- PostgreSQL Schema
- ORM/Query Builder
- 数据迁移
- 索引优化

请生成完整的代码实现，包括：
1. 项目结构
2. 关键代码文件
3. 配置文件
4. 运行说明
"""

CODING_TEMPLATE = """
请在代码中体现以下最佳实践：

```javascript
// 后端示例 - Express.js
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// 安全中间件
app.use(helmet());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// API 路由
app.post('/api/rooms', async (req, res) => {
  try {
    const room = await createRoom(req.body);
    res.json({ success: true, data: room });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

```javascript
// 前端示例 - React
import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

export default function GameRoom() {
  const [socket, setSocket] = useState(null);
  const [gameState, setGameState] = useState(null);

  useEffect(() => {
    const socketInstance = io('/game');
    setSocket(socketInstance);

    socketInstance.on('gameStateUpdate', (newState) => {
      setGameState(newState);
    });

    return () => socketInstance.disconnect();
  }, []);

  return (
    <div className="game-room">
      <h1>游戏房间</h1>
      {gameState && <GameBoard state={gameState} />}
    </div>
  );
}
```

现在，请基于系统设计生成完整的代码实现。
"""


def create_coding_agent(llm):
    """创建 Coding Agent 工厂函数"""

    def coding_agent(state: AgentState) -> AgentState:
        """Coding Agent - 高级开发者"""
        print("\n" + "="*70)
        print("💻 Coding Agent - 高级开发者")
        print("="*70)

        design = state.get("design", {})
        architecture = state.get("architecture", {})

        print(f"💻 实现代码")
        print(f"   - 后端技术: {architecture.get('tech_stack', [])}")
        print(f"   - 模块: {design.get('modules', [])}")
        print("\n⏳ 正在生成前后端代码...")

        messages = [
            SystemMessage(content=CODING_AGENT_PROMPT),
            HumanMessage(content=f"""
项目: {state.get('project_name', '在线大富翁')}

系统设计:
- 架构层次: {design.get('modules', [])}
- 技术栈: {', '.join(architecture.get('tech_stack', []))}

请生成：
1. 后端代码（Express.js 或 FastAPI）
   - API 路由
   - WebSocket 处理
   - 数据库操作

2. 前端代码（React）
   - 组件结构
   - 状态管理
   - Socket.io 集成

3. 数据库 Schema（PostgreSQL）

4. 项目配置和运行说明

要求：
- 代码完整可运行
- 包含错误处理
- 实现实时通信
- 考虑性能优化
""")
        ]

        try:
            response = llm.invoke(messages)
            code_content = response.content

            code_data = {
                "content": code_content,
                "backend_files": ["app.js", "routes/api.js", "services/gameService.js"],
                "frontend_files": ["App.jsx", "components/GameRoom.jsx", "hooks/useGame.js"],
                "database_files": ["schema.sql", "migrations/001_init.sql"],
                "config_files": [".env.example", "package.json"],
            }

            state["current_agent"] = "Coding Agent"
            state["code"] = code_data
            state["messages"].append(AIMessage(content=code_content))

            print("✅ 代码生成完成！")
            print(f"   - 后端文件: {len(code_data['backend_files'])} 个")
            print(f"   - 前端文件: {len(code_data['frontend_files'])} 个")
            print(f"   - 数据库文件: {len(code_data['database_files'])} 个")

        except Exception as e:
            print(f"❌ 代码生成失败: {e}")
            state["current_agent"] = "Coding Agent"
            state["code"] = {"error": str(e)}

        return state

    return coding_agent
