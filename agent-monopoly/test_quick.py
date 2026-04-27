"""
增强版 Code Review Agent 快速测试
- 包含持久化存储功能
- 复杂测试代码
"""

from langchain_community.chat_models import ChatZhipuAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
import os
import json
from datetime import datetime
from typing import Dict, Any, List, Optional

# 定义 AgentState 类型
type AgentState = Dict[str, Any]

# 导入 Code Review Agent
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from agents.code_review_agent import create_code_review_agent

os.environ["ZHIPUAI_API_KEY"] = "5a89d580eb0b4553b7f1c6f822352f01.mdOB3HRfcI8Xqhze"

# 配置
SAVE_DIR = "reviews"
os.makedirs(SAVE_DIR, exist_ok=True)

def save_to_file(filename, content, subdir=None):
    """保存内容到文件"""
    if subdir:
        save_path = os.path.join(SAVE_DIR, subdir)
        os.makedirs(save_path, exist_ok=True)
    else:
        save_path = SAVE_DIR

    filepath = os.path.join(save_path, filename)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"💾 已保存: {filepath}")
    return filepath


def create_review_summary(report, checks):
    """创建审查摘要"""
    lines = ["=" * 70, "🔍 审查摘要", "=" * 70]
    for check, result in checks.items():
        status = "✅" if result else "❌"
        lines.append(f"  {status} {check}")
    lines.append("=" * 70)
    return "\n".join(lines)


print("=" * 70)
print("🧪 增强版 Code Review Agent 测试")
print("=" * 70)

# 创建 LLM
llm = ChatZhipuAI(model="glm-4")

# 复杂测试代码 - 包含多种安全问题、性能问题、代码质量问题
test_code = '''

// backend/app.js - Express.js 后端 (行号 1-99)
1 | const express = require('express');
2 | const mysql = require('mysql');
3 | const jwt = require('jsonwebtoken');
4 | const bcrypt = require('bcrypt');
5 |
6 | const app = express();
7 |
8 | // 硬编码密码和密钥
9 | const DB_PASSWORD = "MyS3cr3tP@ssw0rd123";
10 | const JWT_SECRET = "super-secret-key-12345";
11 | const API_KEY = "api-key-here";
12 |
13 | // 登录接口 - SQL注入风险
14 | app.post('/api/login', (req, res) => {
15 |     const { username, password } = req.body;
16 |     const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
17 |
18 |     pool.query(query, (err, results) => {
19 |         if (err) {
20 |             res.status(500).json({ error: err.message });
21 |             return;
22 |         }
23 |
24 |         if (results.length > 0) {
25 |             const token = jwt.sign({ id: results[0].id }, JWT_SECRET);
26 |             res.json({ token, user: results[0] });
27 |         } else {
28 |             res.status(401).json({ error: 'Invalid credentials' });
29 |         }
30 |     });
31 | });
32 |
33 | // 用户资料接口 - 权限问题
34 | app.get('/api/users/:id/profile', (req, res) => {
35 |     const userId = req.params.id;
36 |     const query = `SELECT * FROM users WHERE id = ${userId}`;
37 |
38 |     pool.query(query, (err, results) => {
39 |         if (err) {
40 |             res.status(500).json({ error: err.message });
41 |             return;
42 |         }
43 |         res.json(results[0]);
44 |     });
45 | });
46 |
47 | // 用户订单接口 - N+1查询问题
48 | app.get('/api/users/:id/orders', (req, res) => {
49 |     const userId = req.params.id;
50 |     
51 |     pool.query(`SELECT * FROM users WHERE id = ${userId}`, (err, userResults) => {
52 |         if (err) {
53 |             res.status(500).json({ error: err.message });
54 |             return;
55 |         }
56 |
57 |         const user = userResults[0];
58 |         
59 |         pool.query(`SELECT * FROM orders WHERE user_id = ${user.id}`, (err, orderResults) => {
60 |             if (err) {
61 |                 res.status(500).json({ error: err.message });
62 |                 return;
63 |             }
64 |
65 |             const orders = [];
66 |             orderResults.forEach(order => {
67 |                 // N+1查询：每个订单都单独查询
68 |                 pool.query(`SELECT * FROM order_items WHERE order_id = ${order.id}`, (err, itemResults) => {
69 |                     if (err) {
70 |                         res.status(500).json({ error: err.message });
71 |                         return;
72 |                     }
73 |                     order.items = itemResults;
74 |                     orders.push(order);
75 |                     
76 |                     if (orders.length === orderResults.length) {
77 |                         res.json(orders);
78 |                     }
79 |                 });
80 |             });
81 |         });
82 |     });
83 | });
84 |
85 | // 搜索商品接口 - 无LIMIT限制
86 | app.get('/api/products/search', (req, res) => {
87 |     const q = req.query.q;
88 |     const query = `SELECT * FROM products WHERE 1=1` + (q ? ` AND name LIKE '%${q}%'` : '');
89 |
90 |     pool.query(query, (err, results) => {
91 |         if (err) {
92 |             res.status(500).json({ error: err.message });
93 |             return;
94 |         }
95 |         res.json(results);
96 |     });
97 | });
98 |
99 | // 创建订单接口 - 事务问题
100 | app.post('/api/orders', (req, res) => {
101 |     const { userId, items } = req.body;
102 |     let total = 0;
103 |     
104 |     // 计算总价
105 |     items.forEach(item => {
106 |         pool.query(`SELECT price FROM products WHERE id = ${item.productId}`, (err, results) => {
107 |             if (err) {
108 |                 res.status(500).json({ error: err.message });
109 |                 return;
110 |             }
111 |             total += results[0].price * item.quantity;
112 |         });
113 |     });
114 |     
115 |     // 创建订单
116 |     pool.query(`INSERT INTO orders (user_id, total) VALUES (${userId}, ${total})`, (err, results) => {
117 |         if (err) {
118 |             res.status(500).json({ error: err.message });
119 |             return;
120 |         }
121 |         
122 |         const orderId = results.insertId;
123 |         
124 |         // 添加订单项
125 |         items.forEach(item => {
126 |             pool.query(`INSERT INTO order_items (order_id, product_id, quantity) VALUES (${orderId}, ${item.productId}, ${item.quantity})`, (err, results) => {
127 |                 if (err) {
128 |                     res.status(500).json({ error: err.message });
129 |                     return;
130 |                 }
131 |             });
132 |         });
133 |         
134 |         res.json({ orderId, total });
135 |     });
136 | });
137 |
138 | // 管理员删除用户接口 - 权限绕过
139 | app.delete('/api/admin/users/:id', (req, res) => {
140 |     const userId = req.params.id;
141 |     const query = `DELETE FROM users WHERE id = ${userId}`;
142 |
143 |     pool.query(query, (err, results) => {
144 |         if (err) {
145 |             res.status(500).json({ error: err.message });
146 |             return;
147 |         }
148 |         res.json({ message: 'User deleted' });
149 |     });
150 | });
151 |
152 | // 内存泄漏 - 缓存无过期
153 | const userCache = {};
154 |
155 | app.get('/api/users/:id', (req, res) => {
156 |     const userId = req.params.id;
157 |     
158 |     // 检查缓存
159 |     if (userCache[userId]) {
160 |         res.json(userCache[userId]);
161 |         return;
162 |     }
163 |     
164 |     // 缓存未命中，查询数据库
165 |     pool.query(`SELECT * FROM users WHERE id = ${userId}`, (err, results) => {
166 |         if (err) {
167 |             res.status(500).json({ error: err.message });
168 |             return;
169 |         }
170 |         
171 |         // 存入缓存（无过期）
172 |         userCache[userId] = results[0];
173 |         res.json(results[0]);
174 |     });
175 | });
176 |
177 | app.listen(3000, () => {
178 |     console.log('Server running on port 3000');
179 | });
180 |
181 |
182 | // frontend/src/App.jsx - React 前端 (行号 1-150)
183 | 1 | import React, { useState, useEffect } from 'react';
184 | 2 |
185 | 3 | function App() {
186 | 4 |     const [searchQuery, setSearchQuery] = useState('');
187 | 5 |     const [searchResults, setSearchResults] = useState('');
188 | 6 |     const [user, setUser] = useState(null);
189 | 7 |     const [orders, setOrders] = useState([]);
190 | 8 |
191 | 9 |     // 登录函数 - 密码明文传输
192 | 10 |     const login = async (username, password) => {
193 | 11 |         const response = await fetch('/api/login', {
194 | 12 |             method: 'POST',
195 | 13 |             headers: { 'Content-Type': 'application/json' },
196 | 14 |             body: JSON.stringify({ username, password }) // 明文传输
197 | 15 |         });
198 | 16 |         const data = await response.json();
199 | 17 |         if (data.token) {
200 | 18 |             localStorage.setItem('token', data.token);
201 | 19 |             setUser(data.user);
202 | 20 |         }
203 | 21 |     };
204 | 22 |
205 | 23 |     // 搜索函数 - XSS风险
206 | 24 |     const handleSearch = async () => {
207 | 25 |         const response = await fetch(`/api/products/search?q=${searchQuery}`);
208 | 26 |         const data = await response.json();
209 | 27 |         // 构建HTML结果 - XSS风险
210 | 28 |         let html = '<ul>';
211 | 29 |         data.forEach(product => {
212 | 30 |             html += `<li>${product.name} - $${product.price}</li>`;
213 | 31 |         });
214 | 32 |         html += '</ul>';
215 | 33 |         setSearchResults(html);
216 | 34 |     };
217 | 35 |
218 | 36 |     // 渲染搜索结果 - XSS风险
219 | 37 |     const renderSearchResults = () => {
220 | 38 |         if (!searchResults) return null;
221 | 39 |         return <div dangerouslySetInnerHTML={{ __html: searchResults }} />;
222 | 40 |     };
223 | 41 |
224 | 42 |     // 获取用户资料 - 权限问题
225 | 43 |     const getProfile = async (userId) => {
226 | 44 |         const token = localStorage.getItem('token');
227 | 45 |         const response = await fetch(`/api/users/${userId}/profile`, {
228 | 46 |             headers: { 'Authorization': `Bearer ${token}` }
229 | 47 |         });
230 | 48 |         const data = await response.json();
231 | 49 |         return data;
232 | 50 |     };
233 | 51 |
234 | 52 |     // 获取订单列表
235 | 53 |     const getOrders = async (userId) => {
236 | 54 |         const token = localStorage.getItem('token');
237 | 55 |         const response = await fetch(`/api/users/${userId}/orders`, {
238 | 56 |             headers: { 'Authorization': `Bearer ${token}` }
239 | 57 |         });
240 | 58 |         const data = await response.json();
241 | 59 |         setOrders(data);
242 | 60 |     };
243 | 61 |
244 | 62 |     // 订单组件 - 重复请求
245 | 63 |     const OrderItem = ({ orderId }) => {
246 | 64 |         const [order, setOrder] = useState(null);
247 | 65 |         
248 | 66 |         // 每次渲染都重新获取 - 性能问题
249 | 67 |         useEffect(() => {
250 | 68 |             const fetchOrder = async () => {
251 | 69 |                 const token = localStorage.getItem('token');
252 | 70 |                 const response = await fetch(`/api/orders/${orderId}`, {
253 | 71 |                     headers: { 'Authorization': `Bearer ${token}` }
254 | 72 |                 });
255 | 73 |                 const data = await response.json();
256 | 74 |                 setOrder(data);
257 | 75 |             };
258 | 76 |             fetchOrder();
259 | 77 |         }, [orderId]);
260 | 78 |         
261 | 79 |         return (
262 | 80 |             <div className="order-item">
263 | 81 |                 <h3>Order {orderId}</h3>
264 | 82 |                 {order && (
265 | 83 |                     <div>
266 | 84 |                         <p>Total: ${order.total}</p>
267 | 85 |                         <h4>Items:</h4>
268 | 86 |                         <ul>
269 | 87 |                             {order.items.map(item => (
270 | 88 |                                 <li key={item.id}>
271 | 89 |                                     {item.productName} - {item.quantity} x ${item.price}
272 | 90 |                                 </li>
273 | 91 |                             ))}
274 | 92 |                         </ul>
275 | 93 |                     </div>
276 | 94 |                 )}
277 | 95 |             </div>
278 | 96 |         );
279 | 97 |     };
280 | 98 |
281 | 99 |     // 订单列表组件 - 无虚拟滚动
100 | 100 |     const OrderList = ({ orders }) => {
101 | 101 |         return (
102 | 102 |             <div className="order-list">
103 | 103 |                 <h2>Orders</h2>
104 | 104 |                 {orders.map(order => (
105 | 105 |                     <OrderItem key={order.id} orderId={order.id} />
106 | 106 |                 ))}
107 | 107 |             </div>
108 | 108 |         );
109 | 109 |     };
110 | 110 |
111 | 111 |     // 产品列表组件 - 内存泄漏
112 | 112 |     const ProductList = () => {
113 | 113 |         const [products, setProducts] = useState([]);
114 | 114 |         const [page, setPage] = useState(1);
115 | 115 |         
116 | 116 |         // 加载更多产品 - 内存泄漏
117 | 117 |         const loadMore = async () => {
118 | 118 |             const response = await fetch(`/api/products?page=${page}`);
119 | 119 |             const data = await response.json();
120 | 120 |             // 不断添加，从不清理 - 内存泄漏
121 | 121 |             setProducts(prev => [...prev, ...data]);
122 | 122 |             setPage(prev => prev + 1);
123 | 123 |         };
124 | 124 |         
125 | 125 |         return (
126 | 126 |             <div className="product-list">
127 | 127 |                 <h2>Products</h2>
128 | 128 |                 <div className="products">
129 | 129 |                     {products.map(product => (
130 | 130 |                         <div key={product.id} className="product">
131 | 131 |                             <h3>{product.name}</h3>
132 | 132 |                             <p>${product.price}</p>
133 | 133 |                         </div>
134 | 134 |                     ))}
135 | 135 |                 </div>
136 | 136 |                 <button onClick={loadMore}>Load More</button>
137 | 137 |             </div>
138 | 138 |         );
139 | 139 |     };
140 | 140 |
141 | 141 |     // 评论组件 - XSS风险
142 | 142 |     const CommentSection = ({ productId }) => {
143 | 143 |         const [comments, setComments] = useState([]);
144 | 144 |         
145 | 145 |         useEffect(() => {
146 | 146 |             const fetchComments = async () => {
147 | 147 |                 const response = await fetch(`/api/products/${productId}/comments`);
148 | 148 |                 const data = await response.json();
149 | 149 |                 setComments(data);
150 | 150 |             };
151 | 151 |             fetchComments();
152 | 152 |         }, [productId]);
153 | 153 |         
154 | 154 |         return (
155 | 155 |             <div className="comments">
156 | 156 |                 <h3>Comments</h3>
157 | 157 |                 {comments.map(comment => (
158 | 158 |                     <div key={comment.id} className="comment">
159 | 159 |                         <p>{comment.user}</p>
160 | 160 |                         {/* XSS风险：直接渲染用户输入 */}
161 | 161 |                         <div dangerouslySetInnerHTML={{ __html: comment.content }} />
162 | 162 |                     </div>
163 | 163 |                 ))}
164 | 164 |             </div>
165 | 165 |         );
166 | 166 |     };
167 | 167 |
168 | 168 |     return (
169 | 169 |         <div className="app">
170 | 170 |             <h1>Shop App</h1>
171 | 171 |             
172 | 172 |             <div className="search">
173 | 173 |                 <input 
174 | 174 |                     type="text" 
175 | 175 |                     value={searchQuery} 
176 | 176 |                     onChange={(e) => setSearchQuery(e.target.value)}
177 | 177 |                 />
178 | 178 |                 <button onClick={handleSearch}>Search</button>
179 | 179 |                 {renderSearchResults()}
180 | 180 |             </div>
181 | 181 |             
182 | 182 |             {user && (
183 | 183 |                 <div className="user-section">
184 | 184 |                     <h2>Welcome, {user.username}</h2>
185 | 185 |                     <button onClick={() => getOrders(user.id)}>My Orders</button>
186 | 186 |                     <OrderList orders={orders} />
187 | 187 |                 </div>
188 | 188 |             )}
189 | 189 |             
190 | 190 |             <ProductList />
191 | 191 |             <CommentSection productId={1} />
192 | 192 |         </div>
193 | 193 |     );
194 | 194 | }
195 | 195 |
196 | 196 | export default App;
197 |
198 |
199 | // database/schema.sql - 数据库结构 (行号 1-36)
200 | 1 | CREATE DATABASE shop;
201 | 2 | USE shop;
202 | 3 |
203 | 4 | CREATE TABLE users (
204 | 5 |     id INT AUTO_INCREMENT PRIMARY KEY,
205 | 6 |     username VARCHAR(50) NOT NULL,
206 | 7 |     email VARCHAR(100) NOT NULL,
207 | 8 |     password VARCHAR(255) NOT NULL, -- 密码明文存储
208 | 9 |     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
209 | 10 | );
210 | 11 |
211 | 12 | CREATE TABLE products (
212 | 13 |     id INT AUTO_INCREMENT PRIMARY KEY,
213 | 14 |     name VARCHAR(100) NOT NULL,
214 | 15 |     price DECIMAL(10, 2) NOT NULL,
215 | 16 |     category VARCHAR(50) NOT NULL, -- 缺少索引
216 | 17 |     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
218 | );
219 |
220 | 20 | CREATE TABLE orders (
221 | 21 |     id INT AUTO_INCREMENT PRIMARY KEY,
222 | 22 |     user_id INT NOT NULL, -- 缺少外键
223 | 23 |     total DECIMAL(10, 2) NOT NULL,
224 | 24 |     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
225 | 25 | );
226 |
227 | 26 | CREATE TABLE order_items (
228 | 27 |     id INT AUTO_INCREMENT PRIMARY KEY,
229 | 28 |     order_id INT NOT NULL, -- 缺少外键
230 | 29 |     product_id INT NOT NULL, -- 缺少外键
231 | 30 |     quantity INT NOT NULL,
232 | 31 |     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
233 | 32 | );
234 |
235 | 33 | -- 注释掉的索引
236 | 34 | -- CREATE INDEX idx_products_category ON products(category);
237 | 35 | -- CREATE INDEX idx_orders_user_id ON orders(user_id);
238 | 36 | -- CREATE INDEX idx_comments_product_id ON comments(product_id);
'''

# 生成批次标识
timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
batch_id = f"review_{timestamp}"
batch_dir = os.path.join(SAVE_DIR, batch_id)
os.makedirs(batch_dir, exist_ok=True)

# 保存被审查的代码
code_files = {
    "backend_app.js": test_code,
}
for filename, content in code_files.items():
    save_to_file(filename, content, batch_id)

print("\n📋 测试代码包含:")
print("  🔴 安全问题:")
print("     - SQL注入 (登录、搜索、资料查询)")
print("     - XSS (dangerouslySetInnerHTML)")
print("     - 硬编码密码/密钥 (DB_PASSWORD, JWT_SECRET, API_KEY)")
print("     - 权限绕过 (删除用户无权限检查)")
print("     - 密码明文传输")
print("     - 缺少token过期检查")
print("  🟡 性能问题:")
print("     - N+1查询 (订单列表)")
print("     - 没有LIMIT限制 (搜索)")
print("     - 内存泄漏 (用户缓存)")
print("     - 大列表无虚拟滚动")
print("     - 重复请求无缓存")
print("  💭 代码质量问题:")
print("     - 缺少事务处理")
print("     - 缺少外键约束")
print("     - 缺少数据库索引")
print("     - 错误处理不完善")
print(f"\n📁 批次目录: {batch_dir}")
print("\n⏳ 正在调用 LLM...")

try:
    # 创建 Code Review Agent
    code_review_agent = create_code_review_agent(llm)
    
    # 构建状态
    state = AgentState({
        "code": {
            "content": test_code,
            "backend_files": ["backend/app.js"],
            "frontend_files": ["frontend/src/App.jsx"],
            "database_files": ["database/schema.sql"]
        },
        "project_name": "E-Commerce Platform",
        "messages": [],
        "current_agent": "",
        "iteration_count": 0
    })
    
    # 执行代码审查
    result_state = code_review_agent(state)
    review_data = result_state.get("review", {})
    review_report = review_data.get("content", "")
    
    # 保存审查报告
    report_file = save_to_file("review_report.md", review_report, batch_id)
    print("✅ LLM 调用成功!")

    print("=" * 70)
    print("📝 审查报告:")
    print("=" * 70)
    print(review_report[:2000] if len(review_report) > 2000 else review_report)
    if len(review_report) > 2000:
        print(f"\n... (报告共 {len(review_report)} 字符)")
    print("=" * 70)

    # 验证检测结果
    checks = {
        "SQL注入": "SQL" in review_report or "注入" in review_report or "injection" in review_report.lower(),
        "XSS": "XSS" in review_report or "跨站" in review_report,
        "硬编码密码": "硬编码" in review_report or "敏感信息" in review_report or ("密码" in review_report and ("暴露" in review_report or "泄露" in review_report)),
        "权限问题": "权限" in review_report or "授权" in review_report or "认证绕过" in review_report,
        "N+1查询": "N+1" in review_report or "n+1" in review_report.lower() or "循环查询" in review_report,
        "内存泄漏": "内存" in review_report or "泄漏" in review_report or "无限增长" in review_report or ("缓存" in review_report and "过期" in review_report),
        "索引缺失": "索引" in review_report or "index" in review_report.lower() or "缺少索引" in review_report,
        "修复建议": "建议" in review_report or "修复" in review_report or "应" in review_report or "应该" in review_report or "必须" in review_report,
    }

    # 保存审查摘要
    summary = create_review_summary(review_report, checks)
    summary_file = save_to_file("review_summary.txt", summary, batch_id)

    # 保存结构化数据 (JSON)
    structured_data = {
        "batch_id": batch_id,
        "timestamp": datetime.now().isoformat(),
        "code_files": list(code_files.keys()),
        "code_stats": {
            "total_lines": len(test_code.split('\n')),
            "backend_files": 1,
            "frontend_files": 1,
            "database_files": 1,
        },
        "checks": checks,
        "issues_detected": {
            "sql_injection": checks.get("SQL注入", False),
            "xss": checks.get("XSS", False),
            "hardcoded_secrets": checks.get("硬编码密码", False),
            "permission_issues": checks.get("权限问题", False),
            "n_plus_1": checks.get("N+1查询", False),
            "memory_leak": checks.get("内存泄漏", False),
            "missing_indexes": checks.get("索引缺失", False),
        },
        "all_checks_passed": all(checks.values()),
        "report_length": len(review_report),
    }
    json_file = save_to_file(
        "review_metadata.json",
        json.dumps(structured_data, ensure_ascii=False, indent=2),
        batch_id
    )

    print("\n🔍 检测结果:")
    print(summary)

    print("\n" + "=" * 70)
    print("📁 已保存的文件:")
    print(f"  📄 被审查代码: {os.path.join(batch_dir, 'backend_app.js')}")
    print(f"  📄 审查报告: {report_file}")
    print(f"  📄 审查摘要: {summary_file}")
    print(f"  📄 元数据: {json_file}")
    print("=" * 70)
    print("🎉 测试完成!")

except Exception as e:
    print(f"❌ 测试失败: {e}")
    import traceback
    traceback.print_exc()