"""
Code Review Agent - 代码审查员 v4
阶段: 阶段6 - 代码审查
输出: 审查报告

v4修复:
- 从prompts目录加载提示词
- 修复can only join an iterable错误
- 增加表结构一致性检查
- 增加前端文件依赖完整性检查
- 支持检查35个模块的完整性
"""

import sys
import hashlib
import re
from pathlib import Path
from typing import Dict, List, Any
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

sys.path.insert(0, str(Path(__file__).parent.parent))
from agent_state import AgentState
from core.context_builder import build_context_for_agent, validate_architecture_compliance


def _load_code_review_prompt():
    """从prompts目录加载提示词"""
    prompt_path = Path(__file__).resolve().parents[1] / "prompts" / "code_review_prompt.md"
    try:
        with open(prompt_path, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception:
        return """你是代码审查员，专注于发现代码中的实际问题。

检查：
1. 假数据 - 硬编码返回
2. 内存存储 - Map/Set
3. SQLite连接
4. Model方法完整性 - findById/getById
5. 表结构一致性 - snake_case vs camelCase
6. Socket导出/调用签名
7. JWT字段一致

输出格式：
# 代码审查报告
## 总体评分: X/5
## 阻塞问题
### Issue #1: 标题
**文件**: path
**行号**: n
**修复建议**: code
"""


CODE_REVIEW_AGENT_PROMPT = _load_code_review_prompt()


class ReviewCache:
    """代码审查结果缓存"""
    def __init__(self):
        self.cache = {}

    def get_key(self, code_content: str) -> str:
        return hashlib.md5(code_content.encode()).hexdigest()

    def get(self, code_content: str) -> dict:
        return self.cache.get(self.get_key(code_content))

    def set(self, code_content: str, review_data: dict):
        self.cache[self.get_key(code_content)] = review_data


review_cache = ReviewCache()


def extract_issues_by_type(report: str, marker: str) -> List[Dict[str, Any]]:
    """提取问题列表"""
    issues = []
    lines = report.split('\n')
    current_issue = None

    for i, line in enumerate(lines):
        if "### Issue #" in line:
            if current_issue:
                issues.append(current_issue)
            issue_match = re.search(r'Issue #(\d+):\s*(.+)', line)
            current_issue = {
                "line": i + 1,
                "title": issue_match.group(1) if issue_match else line.strip(),
                "severity": "Critical" if marker == "🔴" else "High",
                "description": "",
                "location": "",
                "issue_line_numbers": ""
            }
        elif current_issue:
            if "**文件**:" in line or "**位置**:" in line:
                match = re.search(r':\s*(.+)', line)
                if match:
                    current_issue["location"] = match.group(1).strip()
            elif "**行号**:" in line or "**问题行号**:" in line:
                match = re.search(r':\s*(.+)', line)
                if match:
                    current_issue["issue_line_numbers"] = match.group(1).strip()
            elif "```" in line:
                break
            elif line.strip() and not line.startswith("#"):
                current_issue["description"] += line.strip() + " "

    if current_issue:
        issues.append(current_issue)
    return issues


def extract_score(report: str) -> str:
    """提取总体评分"""
    score_match = re.search(r'总体评分:\s*[⭐🭐]*\s*\(?(\d)/5\)?', report)
    if score_match:
        return f"{score_match.group(1)}/5"
    if "5/5" in report or "⭐⭐⭐⭐⭐" in report:
        return "5/5"
    elif "4/5" in report or "⭐⭐⭐⭐" in report:
        return "4/5"
    elif "3/5" in report or "⭐⭐⭐" in report:
        return "3/5"
    elif "2/5" in report or "⭐⭐" in report:
        return "2/5"
    elif "1/5" in report or "⭐" in report:
        return "1/5"
    return "未评分"


def create_code_review_agent(llm, auto_fix: bool = True):
    """创建 Code Review Agent 工厂函数"""

    def code_review_agent(state: AgentState) -> AgentState:
        """Code Review Agent v4"""
        print("\n" + "="*70)
        print("Code Review Agent - 代码审查员 (v4)")
        print("="*70)

        code = state.get("code", {})
        code_content = code.get("content", "")

        # v4修复: 处理文件数量的类型检查，支持34个模块验证
        backend_files = code.get('backend_files', [])
        if isinstance(backend_files, int):
            backend_count = backend_files
            backend_list_str = str(backend_files)
        else:
            backend_count = len(backend_files) if backend_files else 0
            backend_list_str = ', '.join(backend_files) if backend_files else '无'

        frontend_files = code.get('frontend_files', [])
        if isinstance(frontend_files, int):
            frontend_count = frontend_files
            frontend_list_str = str(frontend_files)
        else:
            frontend_count = len(frontend_files) if frontend_files else 0
            frontend_list_str = ', '.join(frontend_files) if frontend_files else '无'

        full_context = build_context_for_agent(state, "code_review")
        compliance = validate_architecture_compliance(state)

        print(f"审查代码: 后端{backend_count} 前端{frontend_count} 架构{'✅' if compliance['compliant'] else '⚠️'}")

        # 检查缓存
        cached = review_cache.get(code_content)
        if cached:
            print("使用缓存结果")
            state["current_agent"] = "Code Review Agent"
            state["review"] = cached
            return state

        # 调用LLM
        messages = [
            SystemMessage(content=CODE_REVIEW_AGENT_PROMPT),
            HumanMessage(content=f"""{full_context}

## 架构合规
{'✅ 合规' if compliance['compliant'] else '⚠️ ' + str(compliance.get('issues', []))}

## 生成的文件
- 后端: {backend_list_str}
- 前端: {frontend_list_str}

## 代码内容
{code_content[:5000] if code_content else '空'}

**v4重点检查**:
- 表结构一致性 (snake_case vs camelCase)
- Model方法完整性 (findById/getById)
- Socket导出/调用签名
- JWT字段 (userId vs id)
- 前端文件完整性 (35个模块是否全部生成)
- CSS文件是否存在
- 前端import路径是否匹配实际文件位置
- 前后端API契约是否一致
""")
        ]

        try:
            response = llm.invoke(messages)
            report = response.content

            review_data = {
                "content": report,
                "blocking_issues": extract_issues_by_type(report, "🔴"),
                "important_issues": extract_issues_by_type(report, "🟡"),
                "overall_score": extract_score(report)
            }

            review_cache.set(code_content, review_data)
            state["current_agent"] = "Code Review Agent"
            state["review"] = review_data
            state["messages"].append(AIMessage(content=report))

            print(f"完成: 评分{review_data['overall_score']} 阻塞{len(review_data['blocking_issues'])}个")

        except Exception as e:
            print(f"错误: {e}")
            import traceback
            traceback.print_exc()
            state["current_agent"] = "Code Review Agent"
            state["review"] = {"error": str(e)}

        return state

    return code_review_agent
