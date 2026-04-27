"""
测试修复后的 Code Review Agent
验证行号标注功能
"""

import os
import sys
from langchain_community.chat_models import ChatZhipuAI
from typing import Dict, Any

# 添加项目根目录到路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# 直接导入 code_review_agent 模块
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))

from agents.code_review_agent import create_code_review_agent

os.environ["ZHIPUAI_API_KEY"] = "5a89d580eb0b4553b7f1c6f822352f01.mdOB3HRfcI8Xqhze"

print("=" * 70)
print("🧪 测试修复后的 Code Review Agent")
print("=" * 70)

# 创建 LLM
llm = ChatZhipuAI(model="glm-4")

# 测试代码
test_code = '''
// test.js
1 | const express = require('express');
2 | const mysql = require('mysql');
3 | 
4 | const app = express();
5 | 
6 | // 硬编码密码
7 | const DB_PASSWORD = "secret123";
8 | 
9 | // SQL注入风险
10 | app.post('/login', (req, res) => {
11 |     const { username, password } = req.body;
12 |     const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
13 |     pool.query(query, (err, results) => {
14 |         res.json(results);
15 |     });
16 | });
17 | 
18 | // 内存泄漏
19 | const userCache = {};
20 | 
21 | app.get('/user/:id', (req, res) => {
22 |     const id = req.params.id;
23 |     if (userCache[id]) {
24 |         return res.json(userCache[id]);
25 |     }
26 |     pool.query('SELECT * FROM users WHERE id = ?', [id], (err, results) => {
27 |         userCache[id] = results[0]; // 无过期机制
28 |         res.json(results[0]);
29 |     });
30 | });
31 | 
32 | app.listen(3000);
'''

# 创建代理
agent = create_code_review_agent(llm)

# 构建状态
state = {
    "code": {
        "content": test_code,
        "backend_files": ["test.js"],
        "frontend_files": [],
        "database_files": []
    },
    "project_name": "Test Project",
    "messages": [],
    "current_agent": "",
    "iteration_count": 0
}

print("\n⏳ 正在执行代码审查...")

# 执行审查
result = agent(state)

# 检查结果
review = result.get("review", {})
report = review.get("content", "")

print("\n" + "=" * 70)
print("📝 审查报告:")
print("=" * 70)
print(report)
print("=" * 70)

# 检查行号标注
print("\n🔍 行号标注检查:")
issues = review.get("blocking_issues", []) + review.get("important_issues", []) + review.get("minor_improvements", [])

if issues:
    print(f"发现 {len(issues)} 个问题")
    for i, issue in enumerate(issues, 1):
        line_numbers = issue.get("issue_line_numbers", "")
        location = issue.get("location", "")
        title = issue.get("title", "")
        
        if line_numbers or location:
            print(f"  ✅ 问题 {i}: {title}")
            if line_numbers:
                print(f"     行号: {line_numbers}")
            if location:
                print(f"     位置: {location}")
        else:
            print(f"  ❌ 问题 {i}: {title} - 无行号标注")
else:
    print("未发现问题")

print("\n" + "=" * 70)
print("🎉 测试完成!")
