"""
大富翁游戏代码审查测试
"""

from langchain_community.chat_models import ChatZhipuAI
from langchain_core.messages import HumanMessage, SystemMessage
import os
import json
from datetime import datetime
from typing import Dict, Any, List
import re

os.environ["ZHIPUAI_API_KEY"] = "5a89d580eb0b4553b7f1c6f822352f01.mdOB3HRfcI8Xqhze"

SAVE_DIR = "reviews"
os.makedirs(SAVE_DIR, exist_ok=True)

# 大富翁游戏测试代码
MONOPOLY_CODE = '''
1 | class MonopolyGame {
2 |     constructor() {
3 |         this.players = [];
4 |         this.board = [];
5 |         this.currentPlayerIndex = 0;
6 |         this.gameState = 'waiting'; // waiting, playing, ended
7 |     }
8 |     
9 |     addPlayer(name) {
10 |         if (this.players.length >= 4) {
11 |             return false;
12 |         }
13 |         this.players.push({
14 |             name,
15 |             money: 1500,
16 |             properties: [],
17 |             inJail: false,
18 |             jailTurns: 0
19 |         });
20 |         return true;
21 |     }
22 |     
23 |     startGame() {
24 |         if (this.players.length < 2) {
25 |             return false;
26 |         }
27 |         this.gameState = 'playing';
28 |         this.initializeBoard();
29 |         return true;
30 |     }
31 |     
32 |     initializeBoard() {
33 |         // 硬编码的棋盘数据
34 |         this.board = [
35 |             { name: 'Go', type: 'go', value: 0 },
36 |             { name: 'Mediterranean Avenue', type: 'property', value: 60, rent: 2 },
37 |             { name: 'Community Chest', type: 'community', value: 0 },
38 |             { name: 'Baltic Avenue', type: 'property', value: 60, rent: 4 },
39 |             { name: 'Income Tax', type: 'tax', value: 200 },
40 |             { name: 'Reading Railroad', type: 'railroad', value: 200, rent: 25 },
41 |             { name: 'Oriental Avenue', type: 'property', value: 100, rent: 6 },
42 |             { name: 'Chance', type: 'chance', value: 0 },
43 |             { name: 'Vermont Avenue', type: 'property', value: 100, rent: 6 },
44 |             { name: 'Connecticut Avenue', type: 'property', value: 120, rent: 8 }
45 |         ];
46 |     }
47 |     
48 |     rollDice() {
49 |         // 不安全的随机数生成
50 |         const die1 = Math.floor(Math.random() * 6) + 1;
51 |         const die2 = Math.floor(Math.random() * 6) + 1;
52 |         return { die1, die2, total: die1 + die2 };
53 |     }
54 |     
55 |     movePlayer(playerIndex, spaces) {
56 |         const player = this.players[playerIndex];
57 |         if (!player) return false;
58 |         
59 |         // 计算新位置
60 |         let newPosition = (player.position || 0) + spaces;
61 |         if (newPosition >= this.board.length) {
62 |             newPosition -= this.board.length;
63 |             // 经过Go，获得200
64 |             player.money += 200;
65 |         }
66 |         
67 |         player.position = newPosition;
68 |         this.handleSpace(newPosition, playerIndex);
69 |         return true;
70 |     }
71 |     
72 |     handleSpace(position, playerIndex) {
73 |         const space = this.board[position];
74 |         const player = this.players[playerIndex];
75 |         
76 |         switch (space.type) {
77 |             case 'go':
78 |                 // 已经在movePlayer中处理
79 |                 break;
80 |             case 'property':
81 |                 this.handleProperty(space, player);
82 |                 break;
83 |             case 'community':
84 |                 this.handleCommunityChest(player);
85 |                 break;
86 |             case 'chance':
87 |                 this.handleChance(player);
88 |                 break;
89 |             case 'tax':
90 |                 player.money -= space.value;
91 |                 break;
92 |             case 'railroad':
93 |                 this.handleProperty(space, player);
94 |                 break;
95 |         }
96 |     }
97 |     
98 |     handleProperty(property, player) {
99 |         // 检查是否已被购买
100 |         const owner = this.players.find(p => 
101 |             p.properties.some(p => p.name === property.name)
102 |         );
103 |         
104 |         if (!owner) {
105 |             // 可以购买
106 |             if (player.money >= property.value) {
107 |                 player.money -= property.value;
108 |                 player.properties.push(property);
109 |             }
110 |         } else if (owner !== player) {
111 |             // 支付租金
112 |             player.money -= property.rent;
113 |             owner.money += property.rent;
114 |         }
115 |     }
116 |     
117 |     handleCommunityChest(player) {
118 |         // 硬编码的机会卡
119 |         const cards = [
120 |             { type: 'money', value: 100, text: '获得100元' },
121 |             { type: 'money', value: -50, text: '支付50元' },
122 |             { type: 'go', text: '移动到Go' },
123 |             { type: 'jail', text: '进监狱' }
124 |         ];
125 |         
126 |         const card = cards[Math.floor(Math.random() * cards.length)];
127 |         
128 |         switch (card.type) {
129 |             case 'money':
130 |                 player.money += card.value;
131 |                 break;
132 |             case 'go':
133 |                 player.position = 0;
134 |                 player.money += 200;
135 |                 break;
136 |             case 'jail':
137 |                 player.inJail = true;
138 |                 player.jailTurns = 0;
139 |                 break;
140 |         }
141 |     }
142 |     
143 |     handleChance(player) {
144 |         // 与Community Chest类似
145 |         const cards = [
146 |             { type: 'money', value: 50, text: '获得50元' },
147 |             { type: 'money', value: -100, text: '支付100元' },
148 |             { type: 'go', text: '移动到Go' },
149 |             { type: 'jail', text: '进监狱' }
150 |         ];
151 |         
152 |         const card = cards[Math.floor(Math.random() * cards.length)];
153 |         
154 |         switch (card.type) {
155 |             case 'money':
156 |                 player.money += card.value;
157 |                 break;
158 |             case 'go':
159 |                 player.position = 0;
160 |                 player.money += 200;
161 |                 break;
162 |             case 'jail':
163 |                 player.inJail = true;
164 |                 player.jailTurns = 0;
165 |                 break;
166 |         }
167 |     }
168 |     
169 |     nextTurn() {
170 |         if (this.gameState !== 'playing') return false;
171 |         
172 |         this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
173 |         return true;
174 |     }
175 |     
176 |     checkGameOver() {
177 |         // 检查是否只有一个玩家还有钱
178 |         const activePlayers = this.players.filter(p => p.money > 0);
179 |         if (activePlayers.length === 1) {
180 |             this.gameState = 'ended';
181 |             return true;
182 |         }
183 |         return false;
184 |     }
185 | }
186 | 
187 | // 测试游戏
188 | const game = new MonopolyGame();
189 | game.addPlayer('Alice');
190 | game.addPlayer('Bob');
191 | game.startGame();
192 | 
193 | // 模拟回合
194 | for (let i = 0; i < 10; i++) {
195 |     const currentPlayer = game.players[game.currentPlayerIndex];
196 |     console.log(`\n${currentPlayer.name}'s turn`);
197 |     
198 |     const dice = game.rollDice();
199 |     console.log(`Rolled: ${dice.die1} + ${dice.die2} = ${dice.total}`);
200 |     
201 |     game.movePlayer(game.currentPlayerIndex, dice.total);
202 |     console.log(`${currentPlayer.name} now has $${currentPlayer.money}`);
203 |     
204 |     if (game.checkGameOver()) {
205 |         console.log(`Game over! ${activePlayers[0].name} wins!`);
206 |         break;
207 |     }
208 |     
209 |     game.nextTurn();
210 | }
'''

def save_to_file(filename, content, subdir=None):
    if subdir:
        save_path = os.path.join(SAVE_DIR, subdir)
        os.makedirs(save_path, exist_ok=True)
    else:
        save_path = SAVE_DIR

    filepath = os.path.join(save_path, filename)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    return filepath

def run_review(llm, test_code, case_id, case_name):
    prompt = f"""
你是代码审查员，一位提供深入、建设性代码审查的专家。

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

### 🔴 阻塞项（必须修复）- 安全漏洞（注入、XSS、鉴权绕过）
- 数据丢失或损坏风险
- 竞态条件或死锁
- 破坏 API 契约
- 关键路径缺少错误处理
- 资源泄漏（未关闭的连接、文件句柄）

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

1. **SQL 注入** - 检查原始SQL、字符串拼接
2. **XSS 攻击** - 检查用户输入未转义
3. **认证/授权** - 检查token验证、权限控制
4. **敏感数据** - 检查硬编码密码、API Key、Token
5. **输入验证** - 检查参数校验、类型检查

## 性能审查重点：

1. **数据库查询** - N+1 查询、未使用索引
2. **内存使用** - 大对象未释放、内存泄漏
3. **网络请求** - 重复请求、未使用缓存
4. **渲染性能** - 前端大列表无虚拟滚动

## 大富翁游戏特定审查重点：

### 游戏逻辑问题：
1. **游戏规则实现** - 地产购买、租赁、抵押逻辑
2. **随机事件系统** - 骰子投掷、机会卡、公共基金
3. **玩家状态管理** - 金钱、地产、监狱状态
4. **游戏流程控制** - 回合管理、胜利条件判断

### 性能问题：
1. **游戏循环** - 帧率控制、更新逻辑效率
2. **资源管理** - 图片、音频资源加载和释放
3. **对象管理** - 大量游戏对象的创建和销毁
4. **碰撞检测** - 玩家移动和位置计算

### 安全问题：
1. **客户端验证** - 防止游戏状态篡改
2. **作弊防护** - 随机数生成安全性
3. **数据同步** - 多人游戏状态一致性

### 代码质量问题：
1. **游戏状态管理** - 状态机设计、状态持久化
2. **硬编码参数** - 游戏规则参数、价格表
3. **模块化设计** - 游戏组件分离、职责单一
4. **代码重复** - 游戏逻辑重复实现

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

## 评分标准：

### 5/5 - 优秀
- 无阻塞问题
- 无重要问题
- **使用了安全库和最佳实践**
- 代码结构清晰，注释完整
- 性能优化良好
- **游戏逻辑实现正确，无明显漏洞**

### 4/5 - 良好
- 无阻塞问题
- 少量重要问题（≤2个）
- **使用了主要安全库**
- 代码结构合理
- **游戏逻辑基本正确，性能良好**

### 3/5 - 一般
- 无阻塞问题
- 多个重要问题（3-5个）
- **部分使用安全库**
- 代码结构需要改进
- **游戏逻辑存在部分问题**

### 2/5 - 较差
- 存在阻塞问题
- 多个重要问题
- **未使用安全库**
- 代码结构混乱
- **游戏逻辑存在明显错误**

### 1/5 - 差
- 多个阻塞问题
- 严重安全漏洞
- 代码质量差
- **游戏逻辑严重错误**

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

## 安全性分析
- SQL注入风险: [有/无]
- XSS风险: [有/无]
- 认证问题: [有/无]
- 敏感数据泄露: [有/无]

## 性能分析
- N+1查询: [有/无]
- 内存泄漏: [有/无]
- 优化建议: [列出]

## 大富翁游戏特定分析
- 游戏逻辑正确性: [良好/一般/较差]
- 性能优化: [良好/一般/较差]
- 代码质量: [良好/一般/较差]
- 安全防护: [良好/一般/较差]

---

## 🔴 阻塞问题（必须修复）

### Issue #1: [问题描述]
**位置**: [文件名:行号]
**严重性**: Critical
**类型**: [安全/性能/功能/游戏逻辑]
**问题行号**: [行号]

**问题代码**:
```[语言]
[问题代码片段]
```

**风险**: [风险说明]

**修复建议**:
```[语言]
[修复代码]
```

**修复行号**: [行号]

---

## 🟡 重要问题（应该修复）

### Issue #2: [问题描述]
**位置**: [文件名:行号]
**严重性**: High
**类型**: [安全/性能/可维护性/游戏逻辑]
**问题行号**: [行号]

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

**建议行号**: [行号]

---

## 💭 小改进（可选）

### Issue #3: [改进建议]
**位置**: [文件名:行号]
**问题行号**: [行号]
**建议**: [具体建议]

**修复建议**:
```[语言]
[修复代码]
```

---

## ✅ 优点总结

- [优点1]
- [优点2]
- [优点3]

---

## 审查结论

**是否通过**: ⚠️ 有条件通过 / ✅ 通过 / ❌ 不通过

**条件**:
1. 必须修复所有阻塞问题
2. 强烈建议修复重要问题
3. 建议问题可在后续迭代中修复

**预计修复时间**: [时间估算]
**代码质量趋势**: 📈 提升 / 📉 下降 / ➡️ 持平
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

代码（带行号）：
{test_code}
"""

    messages = [
        SystemMessage(content="你是专业的代码审查员，专注于安全性、性能和代码质量。"),
        HumanMessage(content=prompt)
    ]

    response = llm.invoke(messages)
    return response.content

def main():
    print("=" * 70)
    print("🧪 大富翁游戏代码审查测试")
    print("=" * 70)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    batch_id = f"monopoly_{timestamp}"
    batch_dir = os.path.join(SAVE_DIR, batch_id)
    print(f"创建目录: {batch_dir}")
    os.makedirs(batch_dir, exist_ok=True)
    print(f"目录创建成功: {os.path.exists(batch_dir)}")
    
    llm = ChatZhipuAI(model="glm-4", temperature=0.3)
    
    print("\n" + "=" * 70)
    print("📋 测试案例: 大富翁游戏代码")
    print("📝 描述: 大富翁游戏的核心逻辑代码，包含游戏规则、玩家状态管理等")
    print("=" * 70)
    
    try:
        review_content = run_review(llm, MONOPOLY_CODE, "monopoly1", "大富翁游戏代码")
        
        # 保存代码文件
        code_file = save_to_file("monopoly1_code.js", MONOPOLY_CODE, batch_dir)
        
        # 保存审查报告
        report_file = save_to_file("monopoly1_report.md", review_content, batch_dir)
        
        # 提取评分
        score_match = re.search(r"总体评分: (⭐+) \((\d)/5\)", review_content)
        score = score_match.group(2) if score_match else "N/A"
        
        # 提取问题数量
        blocking_issues = re.search(r"阻塞问题: (\d+)", review_content)
        important_issues = re.search(r"重要问题: (\d+)", review_content)
        suggestion_issues = re.search(r"建议问题: (\d+)", review_content)
        
        print(f"\n✅ 审查完成")
        print(f"   评分: {score}/5")
        print(f"   阻塞问题: {'有' if (blocking_issues and int(blocking_issues.group(1)) > 0) else '无'}")
        print(f"   重要问题: {'有' if (important_issues and int(important_issues.group(1)) > 0) else '无'}")
        print(f"   小改进: {'有' if (suggestion_issues and int(suggestion_issues.group(1)) > 0) else '无'}")
        print(f"   报告长度: {len(review_content)} 字符")
        print(f"   代码文件: {code_file}")
        print(f"   报告文件: {report_file}")
        
    except Exception as e:
        print(f"\n❌ 审查失败: {str(e)}")
    
    print("\n" + "=" * 70)
    print(f"📁 所有结果已保存到: {batch_dir}")
    print("=" * 70)

if __name__ == "__main__":
    main()
