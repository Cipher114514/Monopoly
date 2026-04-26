"""
最终测试脚本 - 验证行号标注功能
"""

from langchain_community.chat_models import ChatZhipuAI
from langchain_core.messages import HumanMessage, SystemMessage
import os
import re
from typing import Dict, Any, List

os.environ["ZHIPUAI_API_KEY"] = "5a89d580eb0b4553b7f1c6f822352f01.mdOB3HRfcI8Xqhze"

# 核心提示模板
CODE_REVIEW_PROMPT = """你是专业的代码审查员，专注于安全性、性能和代码质量。

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

**强制要求：**
- 必须为每个问题提供精确的行号
- 行号必须与代码内容中的实际位置对应
- 必须在每个问题中明确标注行号
- 不得使用其他格式，必须严格按照要求输出

代码（带行号）：
```
{code_with_lines}
```

请开始审查并输出详细报告。"""

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

def extract_issues_with_lines(report: str) -> List[Dict[str, Any]]:
    """提取问题并检查行号标注"""
    issues = []
    
    # 提取所有问题
    issue_pattern = r'(🔴|🟡|💭).*?Issue #\d+:\s*(.*?)(?=\n\d+\.|$)'
    matches = re.findall(issue_pattern, report, re.DOTALL)
    
    for marker, issue_text in matches:
        # 提取行号
        line_numbers = ""
        line_match = re.search(r'问题行号[:：]\s*(.*?)(?=\n|$)', issue_text)
        if line_match:
            line_numbers = line_match.group(1).strip()
        
        # 提取位置信息
        location = ""
        location_match = re.search(r'位置[:：]\s*(.*?)(?=\n|$)', issue_text)
        if location_match:
            location = location_match.group(1).strip()
        
        issues.append({
            "marker": marker,
            "text": issue_text.strip(),
            "line_numbers": line_numbers,
            "location": location
        })
    
    return issues

print("=" * 70)
print("🧪 最终行号标注测试")
print("=" * 70)

# 创建 LLM
llm = ChatZhipuAI(model="glm-4")

# 测试代码 - 带行号
test_code = '''
1 | const express = require('express');
2 | const mysql = require('mysql');
3 | const jwt = require('jsonwebtoken');
4 |
5 | const app = express();
6 |
7 | // 硬编码密码和密钥
8 | const DB_PASSWORD = "MyS3cr3tP@ssw0rd123";
9 | const JWT_SECRET = "super-secret-key-12345";
10 |
11 | // 登录接口 - SQL注入风险
12 | app.post('/api/login', (req, res) => {
13 |     const { username, password } = req.body;
14 |     const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
15 |
16 |     pool.query(query, (err, results) => {
17 |         if (err) {
18 |             res.status(500).json({ error: err.message });
19 |             return;
20 |         }
21 |         if (results.length > 0) {
22 |             const token = jwt.sign({ id: results[0].id }, JWT_SECRET);
23 |             res.json({ token });
24 |         } else {
25 |             res.status(401).json({ error: 'Invalid credentials' });
26 |         }
27 |     });
28 | });
29 |
30 | // 内存泄漏 - 缓存无过期
31 | const userCache = {};
32 |
33 | app.get('/api/users/:id', (req, res) => {
34 |     const userId = req.params.id;
35 |     
36 |     if (userCache[userId]) {
37 |         return res.json(userCache[userId]);
38 |     }
39 |     
40 |     pool.query(`SELECT * FROM users WHERE id = ${userId}`, (err, results) => {
41 |         if (err) {
42 |             res.status(500).json({ error: err.message });
43 |             return;
44 |         }
45 |         
46 |         // 存入缓存（无过期）
47 |         userCache[userId] = results[0];
48 |         res.json(results[0]);
49 |     });
50 | });
'''

print("\n📋 测试代码:")
print(test_code)
print("\n⏳ 正在调用 LLM...")

# 构建消息
messages = [
    SystemMessage(content=CODE_REVIEW_PROMPT.format(code_with_lines=test_code)),
    HumanMessage(content="请详细审查以上代码，确保每个问题都包含精确的行号。")
]

# 调用 LLM
response = llm.invoke(messages)
review_report = response.content

print("\n" + "=" * 70)
print("📝 审查报告:")
print("=" * 70)
print(review_report)
print("=" * 70)

# 提取并检查行号
issues = extract_issues_with_lines(review_report)

print("\n🔍 行号标注检查:")
if issues:
    print(f"发现 {len(issues)} 个问题")
    for i, issue in enumerate(issues, 1):
        line_numbers = issue.get("line_numbers", "")
        location = issue.get("location", "")
        marker = issue.get("marker", "")
        
        if line_numbers or location:
            print(f"  {marker} 问题 {i}: 有行号标注")
            if line_numbers:
                print(f"     行号: {line_numbers}")
            if location:
                print(f"     位置: {location}")
        else:
            print(f"  {marker} 问题 {i}: 无行号标注")
else:
    print("未发现问题")

# 统计行号标注率
total_issues = len(issues)
issues_with_lines = sum(1 for issue in issues if issue.get("line_numbers") or issue.get("location"))

if total_issues > 0:
    print(f"\n📊 行号标注统计:")
    print(f"  总问题数: {total_issues}")
    print(f"  带行号的问题: {issues_with_lines}")
    print(f"  行号标注率: {(issues_with_lines/total_issues*100):.1f}%")

print("\n" + "=" * 70)
print("🎉 测试完成!")
