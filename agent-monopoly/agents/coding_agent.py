"""
Coding Agent - 高级开发者
对应文件: agency-agents-zh-main/engineering/engineering-senior-developer.md
阶段: 阶段5 - 代码实现
输出: 前后端代码
"""

import os
import re
import subprocess
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from ..types import AgentState


def format_bugs_for_fix(bugs: list) -> str:
    """格式化Bug列表供Coding Agent修复"""
    if not bugs:
        return "无Bug"

    output = "\n"
    for bug in bugs:
        output += f"### {bug['id']}: {bug['title']}\n"
        output += f"- **严重程度**: {bug['severity']}\n"
        if bug.get('fr'):
            output += f"- **需求ID**: {bug['fr']}\n"
        if bug.get('actual'):
            output += f"- **实际结果**: {bug['actual']}\n"
        if bug.get('expected'):
            output += f"- **期望结果**: {bug['expected']}\n"
        output += "\n"

    return output


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


def save_code_to_disk(content: str, workspace_path: str = "mock-monopoly"):
    """
    解析 AI 输出中的代码块并保存到磁盘
    规范: 期待格式为 [FILE: path/to/file] \n ```language \n code \n ```
    """
    if not os.path.exists(workspace_path):
        os.makedirs(workspace_path)

    # 简单的正则匹配 [FILE: path] 紧跟代码块
    file_pattern = r'\[FILE:\s*(.*?)\]\s*```.*?\n(.*?)\n```'
    matches = re.findall(file_pattern, content, re.DOTALL)

    saved_files = []
    
    # 如果没找到特殊标记，尝试按普通的 Markdown 块寻找（兜底方案）
    if not matches:
        blocks = re.findall(r'```.*?\s+(.*?)\s+```', content, re.DOTALL)
        # 这里逻辑较弱，建议提示词强制要求 [FILE] 标记
    else:
        for file_path, file_content in matches:
            full_path = os.path.join(workspace_path, file_path.strip())
            os.makedirs(os.path.dirname(full_path), exist_ok=True)
            with open(full_path, "w", encoding="utf-8") as f:
                f.write(file_content.strip())
            saved_files.append(file_path.strip())

    # Git 提交逻辑
    try:
        # 检查是否是 git 仓库
        if not os.path.exists(os.path.join(workspace_path, ".git")):
            subprocess.run(["git", "-C", workspace_path, "init"], check=True, capture_output=True)
        
        subprocess.run(["git", "-C", workspace_path, "add", "."], check=True, capture_output=True)
        
        # 检查是否有变更需要 commit
        status = subprocess.run(["git", "-C", workspace_path, "status", "--porcelain"], capture_output=True, text=True).stdout
        if status:
            subprocess.run(["git", "-C", workspace_path, "commit", "-m", "Auto-commit from Coding Agent"], check=True, capture_output=True)
            print(f"📦 Git: 代码已提交到本地仓库")
    except Exception as e:
        print(f"⚠️ Git 操作失败: {e}")

    return saved_files


def create_coding_agent(llm):
    """创建 Coding Agent 工厂函数"""

    def coding_agent(state: AgentState) -> AgentState:
        """Coding Agent - 高级开发者"""
        print("\n" + "="*70)
        print("💻 Coding Agent - 高级开发者")
        print("="*70)

        design = state.get("design", {})
        architecture = state.get("architecture", {})
        iteration = state.get("iteration_count", 0)
        test_results = state.get("test_results", {})
        bugs = test_results.get("bugs", [])

        # 检查是否是返工
        if iteration > 0 and bugs:
            print(f"\n🔧 返工模式 - 第{iteration}次修复")
            print(f"   需要修复的Bug: {len(bugs)} 个")
            for bug in bugs:
                print(f"   - {bug['id']}: {bug['title']} ({bug['severity']})")

            # 基于Bug修复代码
            messages = [
                SystemMessage(content=CODING_AGENT_PROMPT),
                HumanMessage(content=f"""
                项目: {state.get('project_name', '在线大富翁')}

                ## 当前代码
                {state.get('code', {}).get('content', '无')}

                ## 测试发现的Bug
                {format_bugs_for_fix(bugs)}

                ## 任务
                修复上述Bug，只修改有问题的部分，不要改变其他代码。

                要求：
                1. 准确定位Bug位置
                2. 提供修复后的代码
                3. 请严格使用以下格式输出修复后的文件内容：
                   [FILE: 相对路径/文件名]
                   ```语言
                   代码内容
                   ```
                4. 确保修复不引入新问题
                """)
            ]
        else:
            # 首次生成代码
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
                - 请严格使用以下格式输出代码文件：
                  [FILE: 相对路径/文件名]
                  ```语言
                  代码内容
                  ```
                - 代码完整可运行
                - 包含错误处理
                - 实现实时通信
                - 考虑性能优化
                """)
            ]

        try:
            response = llm.invoke(messages)
            code_content = response.content

            # 保存文件到磁盘
            saved_files = save_code_to_disk(code_content)

            code_data = {
                "content": code_content,
                "saved_files": saved_files,
                "backend_files": [f for f in saved_files if "backend" in f or "server" in f],
                "frontend_files": [f for f in saved_files if "frontend" in f or "client" in f],
                "database_files": [f for f in saved_files if "sql" in f or "db" in f],
                "config_files": [f for f in saved_files if "package" in f or "env" in f],
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
