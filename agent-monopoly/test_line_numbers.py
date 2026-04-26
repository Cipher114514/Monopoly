"""
行号标注测试脚本
直接集成 Code Review Agent 核心功能
"""

from langchain_community.chat_models import ChatZhipuAI
from langchain_core.messages import HumanMessage, SystemMessage
import os
import json
from datetime import datetime
import re
from typing import Dict, Any, List, Optional

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


def parse_line_numbers(line_info: str) -> Dict[str, Any]:
    """解析行号信息，支持多种格式"""
    result = {
        "start_line": None,
        "end_line": None,
        "ranges": [],
        "raw": line_info
    }

    if not line_info:
        return result

    line_info = line_info.strip()

    range_pattern = r'(\d+)\s*[-~]\s*(\d+)'
    range_match = re.search(range_pattern, line_info)
    if range_match:
        result["start_line"] = int(range_match.group(1))
        result["end_line"] = int(range_match.group(2))
        result["ranges"] = [(result["start_line"], result["end_line"])]

    single_pattern = r'(?:第\s*)?(\d+)(?:\s*行)?'
    single_matches = re.findall(single_pattern, line_info)
    if single_matches:
        nums = [int(m) for m in single_matches]
        if result["start_line"] is None:
            result["start_line"] = nums[0]
            result["end_line"] = nums[-1]
        for num in nums:
            if (num, num) not in result["ranges"]:
                result["ranges"].append((num, num))

    return result

def validate_issue_line_numbers(issues: List[Dict[str, Any]], code_content: str) -> List[Dict[str, Any]]:
    """验证问题的行号是否在代码范围内，并尝试根据代码片段推断实际行号"""
    if not code_content:
        return issues

    code_lines = code_content.split('\n')
    total_lines = len(code_lines)

    for issue in issues:
        issue_line_info = issue.get("issue_line_numbers", "")

        if issue_line_info:
            parsed = parse_line_numbers(issue_line_info)

            if parsed["start_line"] and parsed["end_line"]:
                if parsed["start_line"] > total_lines or parsed["end_line"] > total_lines:
                    issue["line_warning"] = f"行号超出范围 (1-{total_lines})"
                    issue["issue_line_numbers"] = f"~{parsed['start_line']}-{min(parsed['end_line'], total_lines)}"
                else:
                    issue["line_validation"] = "valid"
        else:
            code_snippet = issue.get("code_snippet", "").strip()
            if code_snippet and code_snippet in code_content:
                start_pos = code_content.index(code_snippet)
                start_line = code_content[:start_pos].count('\n') + 1
                end_line = start_line + code_snippet.count('\n')
                issue["issue_line_numbers"] = f"{start_line}"
                if end_line > start_line:
                    issue["issue_line_numbers"] += f"-{end_line}"
                issue["line_validation"] = "inferred"
            else:
                issue["line_validation"] = "unknown"

    return issues

def extract_issues_by_type(review_content: str, code_content: str) -> Dict[str, List[Dict[str, Any]]]:
    """从审查内容中提取按类型分类的问题"""
    issues = {
        "blocking": [],
        "important": [],
        "minor": []
    }

    # 提取问题部分
    sections = {
        "blocking": r"## 🔴 阻塞问题(.*?)(?=## 🟡 重要问题|## 💭 小改进|$)",
        "important": r"## 🟡 重要问题(.*?)(?=## 💭 小改进|$)",
        "minor": r"## 💭 小改进(.*?)(?=$)"
    }

    for issue_type, pattern in sections.items():
        matches = re.findall(pattern, review_content, re.DOTALL)
        if matches:
            section_content = matches[0].strip()
            # 提取每个问题
            issue_pattern = r"\d+\.\s*(.*?)(?=\n\d+\.|$)"
            issue_matches = re.findall(issue_pattern, section_content, re.DOTALL)
            
            for i, issue_match in enumerate(issue_matches):
                issue_text = issue_match.strip()
                
                # 提取行号信息
                line_numbers = ""
                line_match = re.search(r'问题行号[:：]\s*(.*?)(?=\n|$)', issue_text)
                if line_match:
                    line_numbers = line_match.group(1).strip()
                
                # 提取代码片段
                code_snippet = ""
                code_match = re.search(r'```[\s\S]*?```', issue_text)
                if code_match:
                    code_snippet = code_match.group(0).strip()
                
                issue_data = {
                    "id": f"{issue_type}_{i+1}",
                    "description": issue_text,
                    "issue_line_numbers": line_numbers,
                    "code_snippet": code_snippet
                }
                issues[issue_type].append(issue_data)

    # 验证行号
    for issue_type in issues:
        issues[issue_type] = validate_issue_line_numbers(issues[issue_type], code_content)

    return issues

def create_code_review_agent(llm):
    """创建代码审查代理"""
    def code_review_agent(state):
        code = state.get("code", {})
        code_content = code.get("content", "")
        project_name = state.get("project_name", "Unknown Project")
        
        # 构建消息
        messages = [
            SystemMessage(content="""你是专业的代码审查员，专注于安全性、性能和代码质量。

请按照以下要求进行代码审查：
1. 安全性：SQL注入、XSS、硬编码密码、权限问题等
2. 性能：N+1查询、内存泄漏、缺少索引等
3. 代码质量：错误处理、事务、约束等

输出格式要求：
- 必须包含总体评分（1-5星）
- 按照 🔴 阻塞问题、🟡 重要问题、💭 小改进 分类
- 每个问题必须包含：
  - 问题描述
  - 问题行号（精确到具体行号或行号范围）
  - 修复建议
  - 严重程度
  - 相关代码片段（可选）

示例输出：
```markdown
# 代码审查报告
## 总体评分: ⭐⭐⭐ (3/5)

## 🔴 阻塞问题
1. **SQL注入风险**
   - 问题：直接拼接SQL语句
   - 问题行号：16
   - 修复建议：使用参数化查询
   - 严重程度：高
   - 代码：
   ```javascript
   const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
   ```

2. **硬编码密码**
   - 问题：敏感信息硬编码
   - 问题行号：9-11
   - 修复建议：使用环境变量
   - 严重程度：高
   ```javascript
   const DB_PASSWORD = "MyS3cr3tP@ssw0rd123";
   const JWT_SECRET = "super-secret-key-12345";
   ```
""")
        ]
        
        # 添加代码（带行号）
        code_with_lines = ""
        for i, line in enumerate(code_content.split('\n'), 1):
            code_with_lines += f"{i:3d} | {line}\n"
        
        messages.append(HumanMessage(content=f"""# {project_name} 代码审查

请审查以下代码，重点关注安全性、性能和代码质量问题。

代码（带行号）：
```
{code_with_lines}
```

请按照要求的格式输出审查结果，确保每个问题都包含准确的行号。"""))
        
        # 调用LLM
        response = llm.invoke(messages)
        review_content = response.content
        
        # 提取问题并验证行号
        issues = extract_issues_by_type(review_content, code_content)
        
        # 生成带有行号标注的报告
        enhanced_report = generate_enhanced_report(review_content, issues)
        
        return {
            "review": {
                "content": enhanced_report,
                "issues": issues
            },
            "messages": state.get("messages", []) + [response]
        }
    
    return code_review_agent

def generate_enhanced_report(original_report: str, issues: Dict[str, List[Dict[str, Any]]]) -> str:
    """生成增强的报告，确保所有问题都有行号标注"""
    # 这里可以根据需要增强报告，确保行号信息完整
    return original_report

print("=" * 70)
print("🧪 行号标注测试")
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
print("     - 硬编码密码/密钥 (DB_PASSWORD, JWT_SECRET, API_KEY)")
print("     - 权限绕过 (删除用户无权限检查)")
print("  🟡 性能问题:")
print("     - N+1查询 (订单列表)")
print("     - 没有LIMIT限制 (搜索)")
print(f"\n📁 批次目录: {batch_dir}")
print("\n⏳ 正在调用 LLM...")

try:
    # 创建 Code Review Agent
    code_review_agent = create_code_review_agent(llm)
    
    # 构建状态
    state = {
        "code": {
            "content": test_code,
            "backend_files": ["backend/app.js"],
            "frontend_files": [],
            "database_files": []
        },
        "project_name": "E-Commerce Platform",
        "messages": [],
        "current_agent": "",
        "iteration_count": 0
    }
    
    # 执行代码审查
    result = code_review_agent(state)
    review_data = result.get("review", {})
    review_report = review_data.get("content", "")
    issues = review_data.get("issues", {})
    
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

    # 检查行号标注
    print("\n🔍 行号标注检查:")
    total_issues = 0
    issues_with_lines = 0
    
    for issue_type, issue_list in issues.items():
        for issue in issue_list:
            total_issues += 1
            line_numbers = issue.get("issue_line_numbers", "")
            if line_numbers:
                issues_with_lines += 1
                print(f"  ✅ {issue_type}: {issue.get('description', '')[:50]}... -> 行号: {line_numbers}")
            else:
                print(f"  ❌ {issue_type}: {issue.get('description', '')[:50]}... -> 无行号")
    
    print(f"\n📊 行号标注统计:")
    print(f"  总问题数: {total_issues}")
    print(f"  带行号的问题: {issues_with_lines}")
    print(f"  行号标注率: {(issues_with_lines/total_issues*100):.1f}%")

    print("\n" + "=" * 70)
    print("📁 已保存的文件:")
    print(f"  📄 被审查代码: {os.path.join(batch_dir, 'backend_app.js')}")
    print(f"  📄 审查报告: {report_file}")
    print("=" * 70)
    print("🎉 测试完成!")

except Exception as e:
    print(f"❌ 测试失败: {e}")
    import traceback
    traceback.print_exc()
