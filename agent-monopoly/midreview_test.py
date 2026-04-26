"""
Code Review Agent 10个测试案例
midreview1-10: 包含各种类型的测试案例
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

TEST_CASES = {
    "midreview1": {
        "name": "正确代码示例",
        "description": "代码质量良好，只有极少的改进空间",
        "code": '''
1 | const express = require('express');
2 | const helmet = require('helmet');
3 | const rateLimit = require('express-rate-limit');
4 |
5 | const app = express();
6 |
7 | app.use(helmet());
8 | app.use(express.json());
9 |
10 | const limiter = rateLimit({
11 |     windowMs: 15 * 60 * 1000,
12 |     max: 100
13 | });
14 | app.use('/api/', limiter);
15 |
16 | app.post('/api/login', async (req, res) => {
17 |     const { username, password } = req.body;
18 |
19 |     if (!username || !password) {
20 |         return res.status(400).json({ error: 'Invalid input' });
21 |     }
22 |
23 |     const user = await validateUser(username, password);
24 |     if (!user) {
25 |         return res.status(401).json({ error: 'Invalid credentials' });
26 |     }
27 |
28 |     const token = generateToken(user.id);
29 |     res.json({ token });
30 | });
31 |
32 | app.listen(3000);
'''
    },
    "midreview2": {
        "name": "少量安全问题",
        "description": "只有1-2个容易修复的问题",
        "code": '''
1 | const express = require('express');
2 | const app = express();
3 |
4 | app.use(express.json());
5 |
6 | app.get('/api/user/:id', (req, res) => {
7 |     const userId = req.params.id;
8 |     const query = `SELECT * FROM users WHERE id = ${userId}`;
9 |     db.query(query, (err, results) => {
10 |         res.json(results[0]);
11 |     });
12 | });
13 |
14 | app.listen(3000);
'''
    },
    "midreview3": {
        "name": "少量性能问题",
        "description": "有性能问题但不影响功能",
        "code": '''
1 | const express = require('express');
2 | const app = express();
3 |
4 | app.get('/api/users', (req, res) => {
5 |     const users = [];
6 |     for (let i = 0; i < 1000; i++) {
7 |         users.push({ id: i, name: `user${i}` });
8 |     }
9 |     res.json(users);
10 | });
11 |
12 | app.listen(3000);
'''
    },
    "midreview4": {
        "name": "多种错误类型",
        "description": "包含安全、性能、代码质量问题各一种",
        "code": '''
1 | const express = require('express');
2 | const mysql = require('mysql');
3 |
4 | const app = express();
5 | const pool = mysql.createPool({ host: 'localhost', user: 'root', password: 'password' });
6 |
7 | app.post('/api/login', (req, res) => {
8 |     const { username, password } = req.body;
9 |     const query = `SELECT * FROM users WHERE username = '${username}'`;
10 |     pool.query(query, (err, results) => {
11 |         if (results.length > 0 && results[0].password === password) {
12 |             res.json({ success: true });
13 |         }
14 |     });
15 | });
16 |
17 | const userCache = {};
18 |
19 | app.get('/api/users/:id', (req, res) => {
20 |     const id = req.params.id;
21 |     if (userCache[id]) {
22 |         return res.json(userCache[id]);
23 |     }
24 |     pool.query(`SELECT * FROM users WHERE id = ${id}`, (err, results) => {
25 |         userCache[id] = results[0];
26 |         res.json(results[0]);
27 |     });
28 | });
29 |
30 | app.listen(3000);
'''
    },
    "midreview5": {
        "name": "大量安全问题",
        "description": "存在5个以上的安全漏洞",
        "code": '''
1 | const express = require('express');
2 | const mysql = require('mysql');
3 | const jwt = require('jsonwebtoken');
4 |
5 | const app = express();
6 | const pool = mysql.createPool({ host: 'localhost', user: 'root', password: 'admin123' });
7 |
8 | const SECRET_KEY = 'my-secret-key';
9 | const API_KEY = 'sk_live_1234567890';
10 |
11 | app.use(express.json());
12 |
13 | app.post('/api/login', (req, res) => {
14 |     const { username, password } = req.body;
15 |     const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
16 |     pool.query(query, (err, results) => {
17 |         if (results.length > 0) {
18 |             const token = jwt.sign({ id: results[0].id }, SECRET_KEY);
19 |             res.json({ token });
20 |         }
21 |     });
22 | });
23 |
24 | app.get('/api/users/:id', (req, res) => {
25 |     const userId = req.params.id;
26 |     pool.query(`SELECT * FROM users WHERE id = ${userId}`, (err, results) => {
27 |         res.json(results[0]);
28 |     });
29 | });
30 |
31 | app.get('/api/search', (req, res) => {
32 |     const q = req.query.q;
33 |     const query = `SELECT * FROM products WHERE name LIKE '%${q}%'`;
34 |     pool.query(query, (err, results) => {
35 |         res.json(results);
36 |     });
37 | });
38 |
39 | app.delete('/api/users/:id', (req, res) => {
40 |     const userId = req.params.id;
41 |     pool.query(`DELETE FROM users WHERE id = ${userId}`, (err) => {
42 |         res.json({ success: true });
43 |     });
44 | });
45 |
46 | app.listen(3000);
'''
    },
    "midreview6": {
        "name": "大量性能问题",
        "description": "存在5个以上的性能问题",
        "code": '''
1 | const express = require('express');
2 | const mysql = require('mysql');
3 |
4 | const app = express();
5 | const pool = mysql.createPool({ host: 'localhost', user: 'root', password: 'password' });
6 |
7 | app.get('/api/users/:id/orders', (req, res) => {
8 |     const userId = req.params.id;
9 |     pool.query(`SELECT * FROM users`, (err, users) => {
10 |         const filtered = users.filter(u => u.id == userId);
11 |         filtered.forEach(user => {
12 |             pool.query(`SELECT * FROM orders WHERE user_id = ${user.id}`, (err, orders) => {
13 |                 orders.forEach(order => {
14 |                     pool.query(`SELECT * FROM order_items WHERE order_id = ${order.id}`, (err, items) => {
15 |                         pool.query(`SELECT * FROM products WHERE id IN (${items.map(i => i.product_id).join(',')})`, (err, products) => {
16 |                             res.json({ user, orders, items, products });
17 |                         });
18 |                     });
19 |                 });
20 |             });
21 |         });
22 |     });
23 | });
24 |
25 | app.get('/api/all-products', (req, res) => {
26 |     pool.query('SELECT * FROM products', (err, results) => {
27 |         res.json(results);
28 |     });
29 | });
30 |
31 | app.get('/api/users', (req, res) => {
32 |     pool.query('SELECT * FROM users', (err, results) => {
33 |         res.json(results);
34 |     });
35 | });
36 |
37 | app.listen(3000);
'''
    },
    "midreview7": {
        "name": "包含前端React代码",
        "description": "前后端混合代码，错误类型多样",
        "code": '''
1 | import React, { useState } from 'react';
2 |
3 | function App() {
4 |     const [data, setData] = useState([]);
5 |     const [input, setInput] = useState('');
6 |
7 |     const fetchData = async () => {
8 |         const response = await fetch(`/api/data?q=${input}`);
9 |         const html = await response.text();
10 |         document.getElementById('result').innerHTML = html;
11 |     };
12 |
13 |     const handleLogin = async () => {
14 |         const password = document.getElementById('password').value;
15 |         await fetch('/api/login', {
16 |             method: 'POST',
17 |             headers: { 'Content-Type': 'application/json' },
18 |             body: JSON.stringify({ password })
19 |         });
20 |     };
21 |
22 |     return (
23 |         <div>
24 |             <input onChange={e => setInput(e.target.value)} />
25 |             <button onClick={fetchData}>Search</button>
26 |             <div id="result"></div>
27 |             <input id="password" type="text" />
28 |             <button onClick={handleLogin}>Login</button>
29 |         </div>
30 |     );
31 | }
32 |
33 | export default App;
'''
    },
    "midreview8": {
        "name": "包含数据库SQL",
        "description": "SQL脚本错误检测",
        "code": '''
1 | CREATE TABLE users (
2 |     id INT PRIMARY KEY AUTO_INCREMENT,
3 |     username VARCHAR(50) NOT NULL,
4 |     email VARCHAR(100) NOT NULL,
5 |     password VARCHAR(255) NOT NULL,
6 |     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
7 | );
8 |
9 | CREATE TABLE products (
10 |     id INT PRIMARY KEY AUTO_INCREMENT,
11 |     name VARCHAR(100) NOT NULL,
12 |     category VARCHAR(50),
13 |     price DECIMAL(10, 2) NOT NULL
14 | );
15 |
16 | CREATE TABLE orders (
17 |     id INT PRIMARY KEY AUTO_INCREMENT,
18 |     user_id INT NOT NULL,
19 |     total DECIMAL(10, 2) NOT NULL,
20 |     status VARCHAR(20) DEFAULT 'pending'
21 | );
22 |
23 | INSERT INTO users (username, email, password) VALUES ('admin', 'admin@example.com', 'admin123');
'''
    },
    "midreview9": {
        "name": "Node.js异步问题",
        "description": "异步处理导致的逻辑错误",
        "code": '''
1 | const fs = require('fs');
2 | const path = require('path');
3 |
4 | function processFiles() {
5 |     const files = ['a.txt', 'b.txt', 'c.txt'];
6 |     const results = [];
7 |
8 |     files.forEach(file => {
9 |         fs.readFile(file, 'utf8', (err, data) => {
10 |             if (err) throw err;
11 |             results.push(data);
12 |         });
13 |     });
14 |
15 |     console.log(results.length);
16 | }
17 |
18 | processFiles();
19 |
20 | const cache = {};
21 |
22 | function getData(key) {
23 |     if (cache[key]) {
24 |         return cache[key];
25 |     }
26 |     fs.readFile(key, 'utf8', (err, data) => {
27 |         cache[key] = data;
28 |     });
29 |     return cache[key];
30 | }
'''
    },
    "midreview10": {
        "name": "综合复杂代码",
        "description": "包含所有类型的错误，问题数量多且类型多样",
        "code": '''
1 | const express = require('express');
2 | const mysql = require('mysql');
3 | const jwt = require('jsonwebtoken');
4 | const bcrypt = require('bcrypt');
5 |
6 | const app = express();
7 | const pool = mysql.createPool({ host: 'localhost', user: 'root', password: 'root123' });
8 |
9 | const SECRET_KEY = 'jwt-secret-123';
10 | const ADMIN_KEY = 'admin-secret-key';
11 | const API_KEY = 'sk_live_api_key_12345';
12 |
13 | app.use(express.json());
14 |
15 | app.post('/api/register', (req, res) => {
16 |     const { username, email, password } = req.body;
17 |     const query = `INSERT INTO users (username, email, password) VALUES ('${username}', '${email}', '${password}')`;
18 |     pool.query(query, (err, results) => {
19 |         res.json({ id: results.insertId });
20 |     });
21 | });
22 |
23 | app.post('/api/login', (req, res) => {
24 |     const { username, password } = req.body;
25 |     const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
26 |     pool.query(query, (err, results) => {
27 |         if (results.length > 0) {
28 |             const token = jwt.sign({ id: results[0].id }, SECRET_KEY);
29 |             res.json({ token, user: results[0] });
30 |         }
31 |     });
32 | });
33 |
34 | app.get('/api/users/:id/profile', (req, res) => {
35 |     const userId = req.params.id;
36 |     const query = `SELECT * FROM users WHERE id = ${userId}`;
37 |     pool.query(query, (err, results) => {
38 |         res.json(results[0]);
39 |     });
40 | });
41 |
42 | app.get('/api/users/:id/orders', (req, res) => {
43 |     const userId = req.params.id;
44 |     pool.query(`SELECT * FROM users WHERE id = ${userId}`, (err, users) => {
45 |         users.forEach(user => {
46 |             pool.query(`SELECT * FROM orders WHERE user_id = ${user.id}`, (err, orders) => {
47 |                 orders.forEach(order => {
48 |                     pool.query(`SELECT * FROM order_items WHERE order_id = ${order.id}`, (err, items) => {
49 |                         order.items = items;
50 |                         res.json({ user, orders });
51 |                     });
52 |                 });
53 |             });
54 |         });
55 |     });
56 | });
57 |
58 | app.get('/api/products/search', (req, res) => {
59 |     const q = req.query.q;
60 |     const query = `SELECT * FROM products WHERE name LIKE '%${q}%'`;
61 |     pool.query(query, (err, results) => {
62 |         res.json(results);
63 |     });
64 | });
65 |
66 | app.delete('/api/admin/users/:id', (req, res) => {
67 |     const userId = req.params.id;
68 |     const query = `DELETE FROM users WHERE id = ${userId}`;
69 |     pool.query(query, (err) => {
70 |         res.json({ success: true });
71 |     });
72 | });
73 |
74 | const userCache = {};
75 | const productCache = {};
76 |
77 | app.get('/api/users/:id', (req, res) => {
78 |     const userId = req.params.id;
79 |     if (userCache[userId]) {
80 |         return res.json(userCache[userId]);
81 |     }
82 |     pool.query(`SELECT * FROM users WHERE id = ${userId}`, (err, results) => {
83 |         userCache[userId] = results[0];
84 |         res.json(results[0]);
85 |     });
86 | });
87 |
88 | app.get('/api/products/:id', (req, res) => {
89 |     const productId = req.params.id;
90 |     if (productCache[productId]) {
91 |         return res.json(productCache[productId]);
92 |     }
93 |     pool.query(`SELECT * FROM products WHERE id = ${productId}`, (err, results) => {
94 |         productCache[productId] = results[0];
95 |         res.json(results[0]);
96 |     });
97 | });
98 |
99 | app.listen(3000);
'''
    }
}

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
    prompt = f"""你是代码审查员，一位提供深入、建设性代码审查的专家。

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

1. **SQL 注入** - 检查原始 SQL 查询、字符串拼接
2. **XSS 攻击** - 检查用户输入未转义直接输出
3. **认证/授权** - 检查令牌验证、权限检查
4. **敏感数据** - 检查硬编码密码、API Key、Token
5. **输入验证** - 检查参数校验、类型检查

## 性能审查重点：

1. **数据库查询** - N+1 查询、未使用索引
2. **内存使用** - 大对象未释放、内存泄漏
3. **网络请求** - 重复请求、未使用缓存
4. **渲染性能** - 前端大列表无虚拟滚动

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

### 4/5 - 良好
- 无阻塞问题
- 少量重要问题（≤2个）
- **使用了主要安全库**
- 代码结构合理

### 3/5 - 一般
- 无阻塞问题
- 多个重要问题（3-5个）
- **部分使用安全库**
- 代码结构需要改进

### 2/5 - 较差
- 存在阻塞问题
- 多个重要问题
- **未使用安全库**
- 代码结构混乱

### 1/5 - 差
- 多个阻塞问题
- 严重安全漏洞
- 代码质量差

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

---

## 🔴 阻塞问题（必须修复）

### Issue #1: [问题描述]
**位置**: [文件名:行号]
**严重性**: Critical
**类型**: [安全/性能/功能]
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
**类型**: [安全/性能/可维护性]
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
8. 不得使用其他格式，必须严格按照上述模板

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

def parse_review_result(report):
    result = {
        "has_blocking": "🔴" in report,
        "has_important": "🟡" in report,
        "has_minor": "💭" in report,
        "has_line_numbers": "行号" in report or "第" in report,
        "has_fix_suggestions": "修复" in report or "建议" in report,
        "score": "",
        "line_count": len(report.split('\n'))
    }

    score_match = re.search(r'总体评分.*?(\d)/5', report)
    if score_match:
        result["score"] = score_match.group(1)

    return result

print("=" * 70)
print("🧪 Code Review Agent 10个测试案例")
print("=" * 70)

llm = ChatZhipuAI(model="glm-4")

timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
batch_id = f"midreview_{timestamp}"
batch_dir = os.path.join(SAVE_DIR, batch_id)
print(f"创建目录: {batch_dir}")
os.makedirs(batch_dir, exist_ok=True)
print(f"目录创建成功: {os.path.exists(batch_dir)}")

results = []

for case_id, case_info in TEST_CASES.items():
    print(f"\n{'='*70}")
    print(f"📋 测试案例: {case_id} - {case_info['name']}")
    print(f"📝 描述: {case_info['description']}")
    print("="*70)

    try:
        report = run_review(llm, case_info['code'], case_id, case_info['name'])
        parsed = parse_review_result(report)

        report_file = save_to_file(f"{case_id}_report.md", report, batch_id)
        code_file = save_to_file(f"{case_id}_code.txt", case_info['code'], batch_id)

        result = {
            "case_id": case_id,
            "case_name": case_info['name'],
            "description": case_info['description'],
            "report_file": report_file,
            "code_file": code_file,
            "parsed_result": parsed,
            "report_length": len(report)
        }
        results.append(result)

        print(f"\n✅ 审查完成")
        print(f"   评分: {parsed['score']}/5" if parsed['score'] else "   评分: 未评分")
        print(f"   阻塞问题: {'有' if parsed['has_blocking'] else '无'}")
        print(f"   重要问题: {'有' if parsed['has_important'] else '无'}")
        print(f"   小改进: {'有' if parsed['has_minor'] else '无'}")
        print(f"   行号标注: {'有' if parsed['has_line_numbers'] else '无'}")
        print(f"   修复建议: {'有' if parsed['has_fix_suggestions'] else '无'}")
        print(f"   报告长度: {len(report)} 字符")

    except Exception as e:
        print(f"❌ 审查失败: {e}")
        results.append({
            "case_id": case_id,
            "case_name": case_info['name'],
            "error": str(e)
        })

summary_file = save_to_file("midreview_summary.json", json.dumps(results, ensure_ascii=False, indent=2), batch_id)

print("\n" + "=" * 70)
print("📊 测试结果汇总")
print("=" * 70)

for r in results:
    if "error" not in r:
        status = "✅" if r["parsed_result"]["has_line_numbers"] else "❌"
        print(f"{status} {r['case_id']}: {r['case_name']} - 评分: {r['parsed_result']['score']}/5")
    else:
        print(f"❌ {r['case_id']}: {r['case_name']} - 错误: {r['error']}")

print(f"\n📁 所有结果已保存到: {batch_dir}")
print("=" * 70)
