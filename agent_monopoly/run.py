"""
Agent Monopoly - 主运行脚本
用于运行9阶段Agent工作流，生成完整的在线大富翁游戏项目

使用方法:
    python run.py              # 运行完整工作流
    python run.py --resume     # 从断点恢复
    python run.py --stage 5    # 从指定阶段开始
    python run.py --mock       # 使用模拟模式（不消耗API）
"""

import os
import sys
import argparse
from pathlib import Path
from dotenv import load_dotenv

# 设置标准输出编码为UTF-8（解决Windows控制台编码问题）
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# 加载.env文件 - 先尝试当前目录，再尝试父目录
load_dotenv()
if not os.getenv('OPENAI_API_KEY') and not os.getenv('ANTHROPIC_API_KEY'):
    # 尝试从父目录加载
    parent_env = project_root.parent / '.env'
    if parent_env.exists():
        load_dotenv(parent_env)

# 添加项目根目录到Python路径
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))
# 同时添加核心目录到路径，确保子模块可以正确导入
sys.path.insert(0, str(project_root / "core"))
sys.path.insert(0, str(project_root / "config"))
sys.path.insert(0, str(project_root / "agents"))


def setup_llm():
    """
    配置LLM

    支持多种LLM提供商:
    - OpenAI (GPT-4, GPT-3.5)
    - 智谱AI (GLM-4) - 使用OpenAI兼容API
    - Anthropic (Claude)
    """
    # 检查环境变量
    api_key = os.getenv("OPENAI_API_KEY")

    if not api_key:
        print("⚠️ 未检测到API密钥，使用模拟模式")
        print("   请设置 OPENAI_API_KEY 环境变量")
        print("   或在 .env 文件中配置")
        return None

    # 尝试导入LangChain OpenAI
    try:
        from langchain_openai import ChatOpenAI
    except ImportError:
        print("❌ 缺少依赖，请运行: pip install langchain-openai")
        return None

    # 使用OpenAI兼容接口（支持OpenAI、智谱AI等）
    api_base = os.getenv("OPENAI_API_BASE")

    # 检测智谱AI并设置默认模型
    if api_base and "bigmodel" in api_base:
        model_name = os.getenv("OPENAI_MODEL", "glm-4")
    else:
        model_name = os.getenv("OPENAI_MODEL", "gpt-4")

    llm_kwargs = {
        "model": model_name,
        "temperature": 0.7,
        "max_tokens": 8192,
        "api_key": api_key
    }

    # 如果设置了API_BASE（智谱AI等），添加到参数中
    if api_base:
        llm_kwargs["base_url"] = api_base

    llm = ChatOpenAI(**llm_kwargs)

    provider = "智谱AI" if "bigmodel" in (api_base or "") else "OpenAI"
    print(f"✅ 使用 {provider}: {model_name}")
    if api_base:
        print(f"   API地址: {api_base}")
    return llm


def create_mock_llm():
    """创建模拟LLM（用于测试）"""
    from unittest.mock import MagicMock

    class MockLLM:
        def __init__(self):
            self.model = "mock"

        def invoke(self, messages):
            """返回模拟响应"""
            from langchain_core.messages import AIMessage

            # 根据最后一条消息的内容返回不同的模拟响应
            last_msg = messages[-1].content.lower()

            # 匹配顺序很重要 - 更具体的条件在前
            if "prd" in last_msg or "产品需求" in last_msg:
                response = self._mock_prd()
            elif "第1轮" in last_msg and "后端" in last_msg:
                response = self._mock_backend_code()
            elif "第2轮" in last_msg and "前端" in last_msg:
                response = self._mock_frontend_code()
            elif ("缺失文件" in last_msg or "缺失" in last_msg) and ("生成" in last_msg or "必须生成" in last_msg):
                # 补全缺失文件阶段
                response = self._mock_completion_files()
            elif "architecture" in last_msg and "architecture agent" in last_msg:
                response = self._mock_architecture()
            elif "design" in last_msg and "design agent" in last_msg:
                response = self._mock_design()
            elif "code" in last_msg and "生成" in last_msg:
                response = self._mock_all_code()
            elif "review" in last_msg or "审查" in last_msg:
                response = self._mock_review()
            elif "test" in last_msg or "测试" in last_msg:
                response = self._mock_test_results()
            elif "qa" in last_msg or "质量" in last_msg:
                response = self._mock_qa_report()
            elif "documentation" in last_msg or "文档" in last_msg:
                response = self._mock_documentation()
            elif "architecture" in last_msg:
                response = self._mock_architecture()
            elif "design" in last_msg:
                response = self._mock_design()
            else:
                response = "已收到请求，正在处理..."

            return AIMessage(content=response)

        def _mock_completion_files(self):
            """返回缺失文件的补全代码（真实API调用版本）"""
            return """[FILE: frontend/src/components/RoomListPage.jsx]
```jsx
import React, { useState, useEffect } from 'react';
import roomService from '../services/roomService';
import './RoomListPage.css';

function RoomListPage({ user }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [roomName, setRoomName] = useState('');

  useEffect(() => {
    loadRooms();
    const interval = setInterval(loadRooms, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadRooms = async () => {
    try {
      const data = await roomService.getRooms();
      setRooms(data || []);
    } catch (err) {
      setError('获取房间列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!roomName.trim()) return;
    try {
      await roomService.createRoom(roomName);
      setRoomName('');
      setShowCreate(false);
      loadRooms();
    } catch (err) {
      setError('创建房间失败');
    }
  };

  const handleJoin = async (roomId) => {
    try {
      await roomService.joinRoom(roomId);
      window.location.href = `/room/${roomId}`;
    } catch (err) {
      setError('加入房间失败');
    }
  };

  return (
    <div className="room-list-page">
      <div className="room-list-header">
        <h1>游戏房间</h1>
        <button onClick={() => setShowCreate(true)} className="btn-primary">创建房间</button>
      </div>

      {showCreate && (
        <div className="create-room-modal">
          <input
            type="text"
            placeholder="输入房间名"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
          />
          <button onClick={handleCreate}>创建</button>
          <button onClick={() => setShowCreate(false)}>取消</button>
        </div>
      )}

      {error && <p className="error">{error}</p>}

      {loading ? (
        <p>加载中...</p>
      ) : (
        <div className="room-grid">
          {rooms.length === 0 ? (
            <p>暂无房间，请创建一个</p>
          ) : (
            rooms.map(room => (
              <div key={room.id} className="room-card">
                <h3>{room.name}</h3>
                <p>{room.players?.length || 0}/6 玩家</p>
                <p>状态: {room.status === 'waiting' ? '等待中' : '游戏中'}</p>
                <button
                  onClick={() => handleJoin(room.id)}
                  disabled={room.status !== 'waiting'}
                >
                  {room.status === 'waiting' ? '加入' : '游戏中'}
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default RoomListPage;
```

[FILE: frontend/src/components/RoomListPage.css]
```css
.room-list-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.room-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.room-list-header h1 {
  color: white;
}

.btn-primary {
  padding: 12px 24px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.room-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
}

.room-card {
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.room-card button {
  width: 100%;
  padding: 10px;
  margin-top: 10px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.room-card button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.create-room-modal {
  background: white;
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 20px;
}

.create-room-modal input {
  padding: 10px;
  margin-right: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
}
```

[FILE: frontend/src/components/RoomPage.jsx]
```jsx
import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import './RoomPage.css';

function RoomPage({ user }) {
  const [players, setPlayers] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    newSocket.on('player-joined', (data) => {
      setPlayers(prev => [...prev, data]);
    });

    return () => newSocket.close();
  }, []);

  const handleStart = () => {
    if (socket && players.length >= 2) {
      socket.emit('start-game');
    }
  };

  return (
    <div className="room-page">
      <h1>房间等待</h1>
      <div className="players-list">
        <h2>已加入玩家 ({players.length}/6)</h2>
        {players.map((p, i) => (
          <div key={i} className="player-item">
            玩家{i+1}: {p.email || 'Guest'}
          </div>
        ))}
        <div className="player-item">你: {user?.email || 'Guest'}</div>
      </div>
      <button
        onClick={handleStart}
        disabled={players.length < 2}
        className="btn-start"
      >
        {players.length < 2 ? '需要至少2名玩家' : '开始游戏'}
      </button>
    </div>
  );
}

export default RoomPage;
```

[FILE: frontend/src/components/RoomPage.css]
```css
.room-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
  text-align: center;
}

.room-page h1 {
  color: white;
  margin-bottom: 40px;
}

.players-list {
  background: white;
  padding: 30px;
  border-radius: 10px;
  margin-bottom: 30px;
}

.player-item {
  padding: 15px;
  border-bottom: 1px solid #eee;
}

.btn-start {
  padding: 15px 40px;
  font-size: 18px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.btn-start:disabled {
  background: #ccc;
  cursor: not-allowed;
}
```

[FILE: frontend/src/components/GamePage.jsx]
```jsx
import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import gameService from '../services/gameService';
import './GamePage.css';

function GamePage({ user }) {
  const [socket, setSocket] = useState(null);
  const [gameState, setGameState] = useState({
    position: 0,
    money: 15000,
    dice: [1, 1],
    properties: []
  });
  const [rolling, setRolling] = useState(false);

  useEffect(() => {
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    newSocket.on('game-update', (data) => {
      setGameState(data);
    });

    newSocket.on('dice-result', (data) => {
      setGameState(prev => ({ ...prev, dice: data.dice, position: data.position }));
      setRolling(false);
    });

    return () => newSocket.close();
  }, []);

  const handleRoll = async () => {
    if (rolling) return;
    setRolling(true);
    try {
      const result = await gameService.rollDice('current-game');
      setGameState(prev => ({
        ...prev,
        dice: result.dice,
        position: result.position
      }));
    } catch (err) {
      console.error('掷骰子失败', err);
    } finally {
      setTimeout(() => setRolling(false), 1000);
    }
  };

  return (
    <div className="game-page">
      <div className="game-header">
        <h1>大富翁</h1>
        <div className="player-info">
          <span>位置: {gameState.position}</span>
          <span>资金: ${gameState.money}</span>
        </div>
      </div>

      <div className="dice-area">
        <div className="dice-display">
          <div className="die">{gameState.dice[0]}</div>
          <div className="die">{gameState.dice[1]}</div>
        </div>
        <button
          onClick={handleRoll}
          disabled={rolling}
          className="btn-roll"
        >
          {rolling ? '投掷中...' : '掷骰子'}
        </button>
      </div>

      <div className="properties-list">
        <h3>我的地产</h3>
        {gameState.properties.length === 0 ? (
          <p>暂无地产</p>
        ) : (
          gameState.properties.map((prop, i) => (
            <div key={i} className="property-card">
              地产 #{prop}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default GamePage;
```

[FILE: frontend/src/components/GamePage.css]
```css
.game-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.game-header h1 {
  color: white;
}

.player-info {
  background: white;
  padding: 15px 25px;
  border-radius: 25px;
  display: flex;
  gap: 20px;
}

.dice-area {
  text-align: center;
  margin: 40px 0;
}

.dice-display {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin-bottom: 20px;
}

.die {
  width: 80px;
  height: 80px;
  background: white;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  font-weight: bold;
  box-shadow: 0 4px 10px rgba(0,0,0,0.2);
}

.btn-roll {
  padding: 15px 40px;
  font-size: 18px;
  background: #FF6B6B;
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
}

.btn-roll:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.properties-list {
  background: white;
  padding: 20px;
  border-radius: 10px;
}
```

[FILE: frontend/src/services/roomService.js]
```javascript
import axios from 'axios';

const API_BASE = 'http://localhost:3001/api/v1';
const getAuthHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`
});

const roomService = {
  async getRooms() {
    const { data } = await axios.get(`${API_BASE}/rooms`, {
      headers: getAuthHeader()
    });
    return data.rooms || data;
  },

  async createRoom(name) {
    const { data } = await axios.post(`${API_BASE}/rooms`, { name }, {
      headers: getAuthHeader()
    });
    return data.room || data;
  },

  async joinRoom(roomId) {
    const { data } = await axios.post(`${API_BASE}/rooms/${roomId}/join`, {}, {
      headers: getAuthHeader()
    });
    return data.room || data;
  }
};

export default roomService;
```

[FILE: frontend/src/services/gameService.js]
```javascript
import axios from 'axios';
import { io } from 'socket.io-client';

const API_BASE = 'http://localhost:3001/api/v1';
const SOCKET_URL = 'http://localhost:3001';
const getAuthHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`
});

let socketInstance = null;

const gameService = {
  async rollDice(gameId) {
    const { data } = await axios.post(`${API_BASE}/games/${gameId}/roll`, {}, {
      headers: getAuthHeader()
    });
    return data;
  },

  async buyProperty(gameId, propertyId) {
    const { data } = await axios.post(`${API_BASE}/games/${gameId}/buy`, {
      propertyId
    }, {
      headers: getAuthHeader()
    });
    return data;
  },

  connect() {
    if (!socketInstance) {
      socketInstance = io(SOCKET_URL, {
        auth: { token: localStorage.getItem('token') }
      });
    }
    return socketInstance;
  },

  disconnect() {
    if (socketInstance) {
      socketInstance.disconnect();
      socketInstance = null;
    }
  }
};

export default gameService;
```
"""
        def _mock_prd(self):
            return """# PRD: 在线大富翁游戏

## 问题陈述
需要开发一个在线多人大富翁游戏，让大学生可以随时随地在线对战。

## 核心功能
1. 用户注册与登录
2. 创建/加入游戏房间
3. 实时多人对战
4. 掷骰子移动
5. 购买地产
6. 建设房屋
7. 收取过路费
8. 机会/命运卡牌
9. 破产判定

## 成功指标
- 支持2-6人同时在线
- 游戏延迟 < 500ms
- 规则符合度 100%
"""

        def _mock_architecture(self):
            return """# 系统架构设计

## 技术栈
- 后端: Node.js + Express + Socket.io
- 前端: React + Vite + Socket.io-client
- 数据库: SQLite (开发) / PostgreSQL (生产)

## 核心API
- POST /api/auth/register - 用户注册
- POST /api/auth/login - 用户登录
- POST /api/rooms - 创建房间
- POST /api/rooms/:id/join - 加入房间
- WebSocket /ws/game/:roomId - 游戏通信

## 数据表
- users (用户表)
- rooms (房间表)
- games (游戏表)
- properties (地产表)
- transactions (交易记录表)
"""

        def _mock_design(self):
            return """# 系统设计

## 架构决策记录 (ADR)
- ADR-001: 选择WebSocket实时通信
- ADR-002: 服务端权威架构防作弊

## 核心算法
1. 玩家移动算法
2. 过路费计算
3. 破产判定算法
4. 回合流转机制

## 模块划分
- 用户模块
- 房间模块
- 游戏逻辑模块
- 实时通信模块
"""

        def _mock_all_code(self):
            return """# 生成的代码

## 后端代码

[FILE: backend/package.json]
```json
{
  "name": "monopoly-backend",
  "version": "1.0.0",
  "description": "在线大富翁游戏后端",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "socket.io": "^4.6.1",
    "cors": "^2.8.5",
    "dotenv": "^16.0.3"
  }
}
```

[FILE: backend/src/server.js]
```javascript
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const config = require('./config');
const gameRoutes = require('./routes/game');
const { handleSocketConnection } = require('./socket/handler');

const app = express();
const server = http.createServer(app);

// Socket.io配置
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 路由
app.use('/api/game', gameRoutes);

// Socket连接处理
io.on('connection', (socket) => handleSocketConnection(socket, io));

// 启动服务器
const PORT = config.port || 3000;
server.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});
```

[FILE: backend/src/config/gameRules.js]
```javascript
// 游戏规则配置
module.exports = {
  // 经济参数
  INITIAL_MONEY: 15000,
  PASS_GO_REWARD: 2000,

  // 地产过路费倍率
  RENT_MULTIPLIERS: {
    empty: 0.1,
    house: 0.3,
    second_house: 0.5,
    hotel: 0.8
  },

  // 建设费用
  BUILD_COSTS: {
    house: 1000,
    second_house: 1500,
    hotel: 2000
  },

  // 游戏规则验证
  canBuildOnProperty(property) {
    return property.type === 'normal' &&
           property.owner &&
           !property.isMortgaged &&
           property.buildingLevel < 3;
  },

  calculateRent(property, buildingLevel) {
    const multipliers = [0.1, 0.3, 0.5, 0.8];
    return Math.floor(property.price * multipliers[buildingLevel]);
  }
};
```

[FILE: backend/src/services/gameService.js]
```javascript
const gameRules = require('../config/gameRules');

class GameService {
  constructor() {
    this.games = new Map();
  }

  createGame(roomId, players) {
    const game = {
      id: roomId,
      players: players.map(p => ({
        id: p.id,
        name: p.name,
        money: gameRules.INITIAL_MONEY,
        position: 0,
        properties: [],
        isInJail: false
      })),
      currentPlayerIndex: 0,
      board: this._initializeBoard(),
      status: 'waiting'
    };
    this.games.set(roomId, game);
    return game;
  }

  rollDice(gameId, playerId) {
    const game = this.games.get(gameId);
    const player = game.players.find(p => p.id === playerId);

    if (player.id !== game.players[game.currentPlayerIndex].id) {
      throw new Error('不是你的回合');
    }

    const dice1 = Math.floor(Math.random() * 6) + 1;
    const dice2 = Math.floor(Math.random() * 6) + 1;
    const total = dice1 + dice2;

    // 移动玩家
    const oldPosition = player.position;
    player.position = (player.position + total) % 40;

    // 检查是否经过起点
    if (player.position < oldPosition) {
      player.money += gameRules.PASS_GO_REWARD;
    }

    return { dice1, dice2, total, newPosition: player.position };
  }

  buyProperty(gameId, playerId, propertyIndex) {
    const game = this.games.get(gameId);
    const player = game.players.find(p => p.id === playerId);
    const property = game.board[propertyIndex];

    if (property.owner) {
      throw new Error('该地产已被购买');
    }

    if (player.money < property.price) {
      throw new Error('资金不足');
    }

    player.money -= property.price;
    property.owner = playerId;
    player.properties.push(propertyIndex);

    return { player, property };
  }

  buildHouse(gameId, playerId, propertyIndex) {
    const game = this.games.get(gameId);
    const player = game.players.find(p => p.id === playerId);
    const property = game.board[propertyIndex];

    if (!gameRules.canBuildOnProperty(property)) {
      throw new Error('不能在该地产上建设');
    }

    const cost = gameRules.BUILD_COSTS[`level_${property.buildingLevel}`];
    if (player.money < cost) {
      throw new Error('资金不足');
    }

    player.money -= cost;
    property.buildingLevel++;

    return { player, property };
  }

  _initializeBoard() {
    // 初始化40个地块
    const board = [];
    for (let i = 0; i < 40; i++) {
      board.push({
        index: i,
        type: this._getTileType(i),
        owner: null,
        buildingLevel: 0,
        isMortgaged: false
      });
    }
    return board;
  }

  _getTileType(index) {
    // 简化版地块类型
    if (index === 0) return 'start';
    if (index === 10) return 'jail';
    if (index === 20) return 'free_parking';
    if (index === 30) return 'go_to_jail';
    return 'property';
  }
}

module.exports = new GameService();
```

## 前端代码

[FILE: frontend/package.json]
```json
{
  "name": "monopoly-frontend",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "socket.io-client": "^4.6.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.0.0",
    "vite": "^4.3.9"
  }
}
```

[FILE: frontend/src/App.js]
```javascript
import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import GameBoard from './components/GameBoard';
import PlayerInfo from './components/PlayerInfo';
import GameControls from './components/GameControls';
import './App.css';

function App() {
  const [socket, setSocket] = useState(null);
  const [game, setGame] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState(null);

  useEffect(() => {
    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    newSocket.on('game_update', (gameData) => {
      setGame(gameData);
    });

    newSocket.on('player_joined', (playerData) => {
      setCurrentPlayer(playerData);
    });

    return () => newSocket.close();
  }, []);

  const handleRollDice = () => {
    if (socket && game) {
      socket.emit('roll_dice', {
        gameId: game.id,
        playerId: currentPlayer?.id
      });
    }
  };

  const handleBuyProperty = () => {
    if (socket && game && currentPlayer) {
      socket.emit('buy_property', {
        gameId: game.id,
        playerId: currentPlayer.id,
        propertyIndex: currentPlayer.position
      });
    }
  };

  return (
    <div className="App">
      <h1>在线大富翁</h1>
      {game ? (
        <div className="game-container">
          <GameBoard game={game} />
          <div className="sidebar">
            <PlayerInfo player={currentPlayer} />
            <GameControls
              onRollDice={handleRollDice}
              onBuyProperty={handleBuyProperty}
              isMyTurn={game.currentPlayerIndex === currentPlayer?.index}
            />
          </div>
        </div>
      ) : (
        <p>等待游戏开始...</p>
      )}
    </div>
  );
}

export default App;
```

[FILE: frontend/src/components/GameBoard.js]
```javascript
import React from 'react';
import './GameBoard.css';

function GameBoard({ game }) {
  const renderTile = (index, tile) => {
    const positionClass = tile.type;
    return (
      <div key={index} className={`tile ${positionClass}`}>
        <span className="tile-number">{index}</span>
        {tile.owner && <span className="owner-marker">{tile.owner}</span>}
        {tile.buildingLevel > 0 && (
          <span className="building-level">{tile.buildingLevel}</span>
        )}
      </div>
    );
  };

  return (
    <div className="game-board">
      <div className="board-center">
        <h2>大富翁</h2>
        {game && <p>当前玩家: {game.players[game.currentPlayerIndex]?.name}</p>}
      </div>
      <div className="board-tiles">
        {game?.board.map((tile, index) => renderTile(index, tile))}
      </div>
    </div>
  );
}

export default GameBoard;
```

[FILE: frontend/src/App.css]
```css
.App {
  text-align: center;
  padding: 20px;
}

.game-container {
  display: flex;
  gap: 20px;
  margin-top: 20px;
}

.game-board {
  flex: 1;
  border: 2px solid #333;
  padding: 20px;
}

.board-tiles {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 5px;
}

.tile {
  aspect-ratio: 1;
  border: 1px solid #666;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.tile.property {
  background-color: #f0f0f0;
}

.tile.start {
  background-color: #90EE90;
}

.tile.jail {
  background-color: #FFB6C1;
}

.sidebar {
  width: 300px;
  padding: 20px;
  background-color: #f5f5f5;
  border-radius: 8px;
}
```

## 生成完成
共生成 8 个文件（4个后端 + 4个前端）
"""

        def _mock_backend_code(self):
            return """[FILE: backend/package.json]
```json
{
  "name": "monopoly-backend",
  "dependencies": {
    "express": "^4.18.2",
    "socket.io": "^4.6.1",
    "jsonwebtoken": "^9.0.0",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.0.3"
  }
}
```

[FILE: backend/src/server.js]
```javascript
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { connectDB } = require('./db/connection');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

connectDB();

const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/rooms');
const gameRoutes = require('./routes/games');

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/rooms', roomRoutes);
app.use('/api/v1/games', gameRoutes);

io.on('connection', (socket) => {
  console.log('用户连接:', socket.id);
  socket.on('join-game', (roomId) => {
    socket.join(roomId);
    io.to(roomId).emit('player-joined', { socketId: socket.id });
  });
  socket.on('disconnect', () => console.log('用户断开'));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`服务器运行在端口${PORT}`));
```

[FILE: backend/src/routes/auth.js]
```javascript
const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

const users = new Map();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-2024';

router.post('/register', async (req, res) => {
  try {
    const { email, password, username } = req.body;
    if (!email || !password || password.length < 6) {
      return res.status(400).json({ error: '邮箱必填，密码至少6位' });
    }
    if (users.has(email)) {
      return res.status(400).json({ error: '该邮箱已注册' });
    }
    const user = { id: Date.now().toString(), email, username };
    users.set(email, user);
    const token = jwt.sign({ userId: user.id, email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email, username }, message: '注册成功' });
  } catch (error) {
    res.status(500).json({ error: '服务器错误' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: '邮箱和密码不能为空' });
    }
    const user = users.get(email);
    if (!user) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }
    const token = jwt.sign({ userId: user.id, email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email, username: user.username }, message: '登录成功' });
  } catch (error) {
    res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = router;
```

[FILE: backend/src/routes/rooms.js]
```javascript
const express = require('express');
const router = express.Router();

const rooms = new Map();
let roomIdCounter = 1;

router.post('/', (req, res) => {
  const { name, createdBy } = req.body;
  if (!name || name.trim().length === 0) {
    return res.status(400).json({ error: '房间名不能为空' });
  }
  const room = {
    id: `room-${roomIdCounter++}`,
    name: name.trim(),
    createdBy,
    players: [],
    status: 'waiting',
    maxPlayers: 6,
    createdAt: new Date().toISOString()
  };
  rooms.set(room.id, room);
  res.status(201).json({ room, message: '房间创建成功' });
});

router.get('/', (req, res) => {
  const roomList = Array.from(rooms.values()).filter(r => r.status === 'waiting');
  res.json({ rooms: roomList });
});

router.post('/:roomId/join', (req, res) => {
  const { roomId } = req.params;
  const { userId } = req.body;
  const room = rooms.get(roomId);
  if (!room) {
    return res.status(404).json({ error: '房间不存在' });
  }
  if (room.players.length >= room.maxPlayers) {
    return res.status(400).json({ error: '房间已满' });
  }
  if (!room.players.find(p => p.id === userId)) {
    room.players.push({ id: userId, joinedAt: new Date().toISOString() });
  }
  res.json({ room, message: '已加入房间' });
});

module.exports = router;
```

[FILE: backend/src/routes/games.js]
```javascript
const express = require('express');
const router = express.Router();

const games = new Map();

router.post('/:gameId/roll', (req, res) => {
  const { gameId } = req.params;
  const { playerId } = req.body;
  if (!playerId) {
    return res.status(400).json({ error: '玩家ID不能为空' });
  }
  const dice1 = Math.floor(Math.random() * 6) + 1;
  const dice2 = Math.floor(Math.random() * 6) + 1;
  const total = dice1 + dice2;
  let game = games.get(gameId);
  if (!game) {
    game = { players: {}, properties: {} };
    games.set(gameId, game);
  }
  if (!game.players[playerId]) {
    game.players[playerId] = { position: 0, money: 15000, properties: [] };
  }
  const newPosition = (game.players[playerId].position + total) % 40;
  game.players[playerId].position = newPosition;
  res.json({ dice: [dice1, dice2], total, position: newPosition });
});

module.exports = router;
```

[FILE: backend/src/middleware/auth.js]
```javascript
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-2024';
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: '令牌无效或已过期' });
  }
};
module.exports = auth;
```

[FILE: backend/src/middleware/errorHandler.js]
```javascript
const errorHandler = (err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({ error: '服务器内部错误' });
};
module.exports = errorHandler;
```

[FILE: backend/src/db/connection.js]
```javascript
const connectDB = () => {
  console.log('数据库连接已建立（内存模式）');
};
module.exports = { connectDB };
```

[FILE: backend/src/models/User.js]
```javascript
const User = {
  findById: async (id) => ({ id, email: 'user@example.com', username: 'User' }),
  findByEmail: async (email) => ({ id: '1', email, username: 'User' }),
  create: async (userData) => ({ id: Date.now().toString(), ...userData })
};
module.exports = User;
```
"""
        def _mock_frontend_code(self):
            return """[FILE: frontend/package.json]
```json
{
  "name": "monopoly-frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.1",
    "socket.io-client": "^4.5.4",
    "axios": "^1.4.0"
  },
  "devDependencies": {
    "vite": "^4.3.9"
  }
}
```

[FILE: frontend/index.html]
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>大富翁游戏</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>
```

[FILE: frontend/src/main.jsx]
```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
```

[FILE: frontend/src/App.css]
```css
.app {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
```

[FILE: frontend/src/App.jsx]
```jsx
import React, { useState } from 'react';
import HomePage from './components/HomePage';
import RoomListPage from './components/RoomListPage';
import RoomPage from './components/RoomPage';
import GamePage from './components/GamePage';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [user, setUser] = useState(null);

  const handleLogin = (userData) => {
    setUser(userData);
    setCurrentPage('rooms');
  };

  const renderPage = () => {
    switch(currentPage) {
      case 'home': return <HomePage onLogin={handleLogin} />;
      case 'rooms': return <RoomListPage user={user} />;
      case 'room': return <RoomPage user={user} />;
      case 'game': return <GamePage user={user} />;
      default: return <HomePage onLogin={handleLogin} />;
    }
  };

  return <div className="app">{renderPage()}</div>;
}

export default App;
```

[FILE: frontend/src/components/HomePage.css]
```css
.home-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
}

.home-page h1 {
  color: white;
  margin-bottom: 30px;
  font-size: 2.5rem;
}

.home-page form {
  background: white;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
  width: 100%;
  max-width: 400px;
}

.home-page input {
  width: 100%;
  padding: 12px;
  margin: 10px 0;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 16px;
}

.home-page button {
  width: 100%;
  padding: 12px;
  margin-top: 10px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 16px;
  cursor: pointer;
}

.home-page button:hover {
  background: #5568d3;
}
```

[FILE: frontend/src/components/HomePage.jsx]
```jsx
import React, { useState } from 'react';
import authService from '../services/authService';
import './HomePage.css';

function HomePage({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = isLogin
        ? await authService.login(email, password)
        : await authService.register(email, password);
      onLogin(result.user);
    } catch (err) {
      setError(err.response?.data?.error || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-page">
      <h1>{isLogin ? '登录' : '注册'}</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="邮箱"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="密码（至少6位）"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p style={{color: 'red'}}>{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? '处理中...' : (isLogin ? '登录' : '注册')}
        </button>
      </form>
      <button onClick={() => setIsLogin(!isLogin)} style={{background: 'transparent', color: 'white', marginTop: '20px'}}>
        {isLogin ? '没有账号？去注册' : '已有账号？去登录'}
      </button>
    </div>
  );
}

export default HomePage;
```

[FILE: frontend/src/services/authService.js]
```javascript
import axios from 'axios';

const API_BASE = 'http://localhost:3001/api/v1';

const authService = {
  async login(email, password) {
    const { data } = await axios.post(`${API_BASE}/auth/login`, { email, password });
    localStorage.setItem('token', data.token);
    return data;
  },
  async register(email, password) {
    const { data } = await axios.post(`${API_BASE}/auth/register`, { email, password });
    localStorage.setItem('token', data.token);
    return data;
  },
  logout() {
    localStorage.removeItem('token');
  },
  getToken() {
    return localStorage.getItem('token');
  }
};

export default authService;
```

[FILE: frontend/src/services/roomService.js]
```javascript
import axios from 'axios';

const API_BASE = 'http://localhost:3001/api/v1';
const getAuthHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

const roomService = {
  async getRooms() {
    const { data } = await axios.get(`${API_BASE}/rooms`, { headers: getAuthHeader() });
    return data.rooms;
  },
  async createRoom(name) {
    const { data } = await axios.post(`${API_BASE}/rooms`, { name }, { headers: getAuthHeader() });
    return data.room;
  },
  async joinRoom(roomId) {
    const { data } = await axios.post(`${API_BASE}/rooms/${roomId}/join`, {}, { headers: getAuthHeader() });
    return data.room;
  }
};

export default roomService;
```

[FILE: frontend/src/services/gameService.js]
```javascript
import axios from 'axios';

const API_BASE = 'http://localhost:3001/api/v1';
const getAuthHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

const gameService = {
  async rollDice(gameId) {
    const { data } = await axios.post(`${API_BASE}/games/${gameId}/roll`, {}, { headers: getAuthHeader() });
    return data;
  }
};

export default gameService;
```
"""
        def _mock_review(self):
            return """# 代码审查报告

## 总体评分: 4/5

## 审查摘要
- 代码文件: 8个
- 阻塞问题: 0个
- 建议项: 2个

## 优点
- 代码结构清晰
- 前后端分离

## 建议项
1. 添加更多错误处理
2. 添加输入验证
"""

        def _mock_test_results(self):
            return """# 测试报告

## 测试结果
- 测试用例: 15个
- 通过: 13个
- 失败: 2个

## Bug列表
- Bug-001: 游戏状态同步问题 (P1)
- Bug-002: 破产判定逻辑 (P2)
"""

        def _mock_qa_report(self):
            return """# QA评估报告

## 质量评分: B+

## 评估结论
- 核心功能: 85% 完成
- 代码质量: 良好
- 测试覆盖: 基本覆盖

## 生产就绪性
状态: NEEDS WORK
建议: 修复P1问题后可发布
"""

        def _mock_documentation(self):
            return """# 技术文档

## README.md
在线大富翁游戏 - 基于React + Node.js的多人在线游戏

## 快速开始
1. 安装依赖: npm install
2. 启动后端: cd backend && npm start
3. 启动前端: cd frontend && npm run dev

## API文档
- POST /api/rooms - 创建房间
- WebSocket /ws/game - 游戏通信
"""

    return MockLLM()


def main():
    """主函数"""
    parser = argparse.ArgumentParser(description="运行Agent Monopoly工作流")
    parser.add_argument("--resume", action="store_true", help="从断点恢复")
    parser.add_argument("--stage", type=int, choices=range(1, 10), help="从指定阶段开始(1-9)")
    parser.add_argument("--mock", action="store_true", help="使用模拟LLM（不消耗API额度）")
    parser.add_argument("--project", default="在线大富翁游戏", help="项目名称")
    parser.add_argument("--verbose", action="store_true", default=True, help="显示详细输出")

    args = parser.parse_args()

    # 打印欢迎信息
    print("\n" + "="*70)
    print("🎮 Agent Monopoly - 9阶段Agent工作流")
    print("="*70)

    # 用户需求
    user_requirement = """
    开发一个在线大富翁游戏，支持2-6人实时对战。
    核心功能包括：用户注册登录、创建房间、掷骰子移动、购买地产、
    建设房屋、收取过路费、机会命运卡牌、破产判定等。
    技术要求：使用React+Node.js+Socket.io实现，服务端权威架构。
    """

    # 配置LLM
    if args.mock:
        llm = create_mock_llm()
        print("📌 使用模拟LLM模式（不消耗API额度）")
    else:
        llm = setup_llm()

    if not llm and not args.mock:
        print("\n❌ 无法配置LLM，退出程序")
        print("   请设置环境变量或使用 --mock 参数")
        return 1

    # 导入并运行工作流
    try:
        from workflow import AgentWorkflow
        import shutil

        # 清理旧的代码目录结构，避免新旧文件混在一起
        workspace = Path("mock-monopoly")
        if workspace.exists():
            old_dirs = ["public", "src"]  # 旧结构的目录
            for old_dir in old_dirs:
                old_path = workspace / old_dir
                if old_path.exists():
                    print(f"🧹 清理旧目录: {old_dir}/")
                    shutil.rmtree(old_path)

        workflow = AgentWorkflow(llm)

        # 运行工作流
        final_state = workflow.run(
            project_name=args.project,
            user_requirement=user_requirement,
            verbose=args.verbose,
            resume=args.resume,
            start_stage=args.stage
        )

        # 打印最终状态
        print("\n" + "="*70)
        print("📊 最终状态摘要")
        print("="*70)

        for stage_num in range(1, 10):
            stage_keys = ["prd", "tasks", "architecture", "design",
                         "code", "review", "test_results", "qa_report", "documentation"]
            key = stage_keys[stage_num - 1]
            data = final_state.get(key, {})

            if data and "error" not in data:
                print(f"✅ 阶段{stage_num}: 完成")
            elif data and "error" in data:
                print(f"❌ 阶段{stage_num}: 错误 - {data.get('error')}")
            else:
                print(f"⚠️ 阶段{stage_num}: 未执行")

        print("\n🎉 工作流执行完成！")
        print(f"📁 输出目录: mock-monopoly/")
        print("="*70 + "\n")

        return 0

    except Exception as e:
        print(f"\n❌ 执行失败: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())
