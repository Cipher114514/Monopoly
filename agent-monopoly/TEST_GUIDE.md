# Code Review Agent (增强版) 测试方案

## 文件信息
- **增强版文件**: `code_review_agent.py`
- **备份文件**: `code_review_agent(1).py`

---

## 增强功能清单

| 功能 | 原版 | 增强版 | 说明 |
|------|------|--------|------|
| 完整代码审查 | ❌ 只传递文件名 | ✅ 传递完整代码内容 | 提高审查准确性 |
| 问题解析 | ⚠️ 简单行提取 | ✅ 智能结构化解析 | 提取位置、严重性、风险等 |
| 安全分析 | ❌ 无 | ✅ 专项安全检测 | SQL注入、XSS、认证等 |
| 性能分析 | ❌ 无 | ✅ 性能问题识别 | N+1查询、内存泄漏等 |
| 统计信息 | ❌ 无 | ✅ 详细统计 | 代码行数、问题数量等 |
| 辅助函数 | ⚠️ 2个 | ✅ 6个 | 更多实用工具函数 |

---

## 测试用例清单

### 测试 1: 基础功能测试
**目的**: 验证增强版 Agent 核心功能是否正常

```python
# 测试代码
test_state = {
    "messages": [],
    "current_agent": "",
    "iteration_count": 0,
    "prd": {},
    "tasks": [],
    "architecture": {},
    "design": {},
    "code": {
        "backend_files": ["backend/app.py", "backend/routes/auth.py"],
        "frontend_files": ["frontend/src/App.js", "frontend/src/components/Login.js"],
        "database_files": ["database/schema.sql"],
        "content": '''
# 后端代码示例
@app.route('/api/users')
def get_user(user_id):
    query = f"SELECT * FROM users WHERE id = {user_id}"
    result = db.execute(query)
    return jsonify(result)

# 前端代码示例
function Login() {
    return <div dangerouslySetInnerHTML={{__html: userInput}} />
}
'''
    },
    "review": {},
    "test_results": {},
    "qa_report": {},
    "documentation": {},
    "memory_context": "",
    "skill_results": [],
    "validation_status": [],
    "project_name": "测试项目",
    "user_requirement": "测试需求"
}

# 验证点
1. review["content"] - 审查报告内容不为空
2. review["overall_score"] - 评分为4/5或5/5
3. review["blocking_issues"] - 能检测到SQL注入和XSS问题
4. review["security_analysis"] - 包含sql_injection=True, xss=True
5. review["statistics"] - 包含文件数量统计
```

**预期结果**:
- ✅ 能检测到 `SQL注入风险` (第3行 f-string 拼接)
- ✅ 能检测到 `XSS风险` (dangerouslySetInnerHTML)
- ✅ 阻塞问题数量 ≥ 2

---

### 测试 2: 安全问题检测测试
**目的**: 验证 Agent 能准确识别常见安全问题

```python
test_state = {
    # ... 其他字段省略
    "code": {
        "backend_files": ["auth.py", "api.py"],
        "frontend_files": ["UserProfile.jsx"],
        "database_files": ["schema.sql"],
        "content": '''
# auth.py - 存在多个安全问题
def login(username, password):
    # SQL注入风险
    query = "SELECT * FROM users WHERE name='" + username + "' AND pwd='" + password + "'"
    db.execute(query)

    # 硬编码密码
    API_KEY = "sk-1234567890abcdef"

def verify_token(token):
    # 缺少认证检查
    return True

# api.py
@app.route('/admin')
def admin_panel():
    # 缺少权限检查
    return render_template('admin.html')

# UserProfile.jsx
function UserProfile() {
    const html = "<div>" + user.name + "</div>"
    return <div dangerouslySetInnerHTML={{__html: html}} />
}
'''
    },
    # ... 其他字段
}
```

**验证点**:
| 问题类型 | 检测字段 | 预期值 |
|---------|---------|--------|
| SQL注入 | `security_analysis.sql_injection` | `True` |
| 硬编码密码 | `security_analysis.sensitive_data` | `True` |
| XSS | `security_analysis.xss` | `True` |
| 认证缺失 | `security_analysis.auth` | `True` |

---

### 测试 3: 性能问题检测测试
**目的**: 验证 Agent 能识别性能问题

```python
test_state = {
    # ... 其他字段
    "code": {
        "backend_files": ["models.py"],
        "frontend_files": ["ProductList.jsx"],
        "database_files": ["schema.sql"],
        "content": '''
# models.py - 存在N+1查询问题
def get_users_with_posts():
    users = db.query("SELECT * FROM users")
    for user in users:
        # N+1查询: 每个用户都执行一次查询
        user.posts = db.query(f"SELECT * FROM posts WHERE user_id = {user.id}")
    return users

# ProductList.jsx - 存在内存泄漏风险
function ProductList() {
    const [products, setProducts] = useState([]);

    useEffect(() => {
        fetchProducts().then(data => {
            // 每次更新都添加新数据，从不清理
            setProducts([...products, ...data]);
        });
    }, []);

    return products.map(p => <Product key={p.id} data={p} />);
}
'''
    },
    # ... 其他字段
}
```

**验证点**:
| 问题类型 | 检测字段 | 预期值 |
|---------|---------|--------|
| N+1查询 | `performance_analysis.n_plus_1` | `True` |
| 内存泄漏 | `performance_analysis.memory_leak` | `True` |

---

### 测试 4: 空代码内容测试
**目的**: 验证 Agent 在没有代码内容时仍能工作

```python
test_state = {
    # ... 其他字段
    "code": {
        "backend_files": ["app.py"],
        "frontend_files": [],
        "database_files": [],
        "content": ""  # 空内容
    },
    # ... 其他字段
}
```

**预期结果**: Agent 应能基于文件列表进行"推断性审查"

---

### 测试 5: 错误处理测试
**目的**: 验证 Agent 的错误处理能力

```python
# 测试场景1: LLM调用失败
class ErrorLLM:
    def invoke(self, messages):
        raise Exception("API调用失败")

# 测试场景2: 无效状态
test_state = {
    "messages": [],
    "code": {},  # 空code对象
    # 缺少其他必要字段
}
```

**验证点**: `review["error"]` 字段应包含错误信息

---

## 运行测试

### 方法 1: 在 workflow 中测试（推荐）

```python
from agent_monopoly import create_workflow
from langchain_community.chat_models import ChatZhipuAI
import os

os.environ["ZHIPUAI_API_KEY"] = "你的API Key"

llm = ChatZhipuAI(model="glm-4")
workflow = create_workflow(llm)

# 准备测试状态
test_state = {
    "messages": [],
    "current_agent": "",
    "iteration_count": 0,
    "prd": {},
    "tasks": [],
    "architecture": {},
    "design": {},
    "code": {
        "backend_files": ["backend/app.py"],
        "frontend_files": ["frontend/App.js"],
        "database_files": ["database/schema.sql"],
        "content": "# 你的测试代码"
    },
    "review": {},
    "test_results": {},
    "qa_report": {},
    "documentation": {},
    "memory_context": "",
    "skill_results": [],
    "validation_status": [],
    "project_name": "测试项目",
    "user_requirement": "测试需求"
}

# 运行阶段6 (Code Review Agent)
result = workflow.run_stage(6, test_state)

# 查看结果
print(result["review"])
```

### 方法 2: 单元测试

```python
# 在项目根目录创建 test_code_review_enhanced.py

import sys
sys.path.insert(0, 'agent-monopoly')

from langchain_community.chat_models import ChatZhipuAI
from agent_monopoly.agents.code_review_agent import (
    create_code_review_agent,
    extract_issues_by_type,
    extract_security_analysis,
    extract_performance_analysis,
    extract_score,
    generate_statistics
)
import os

os.environ["ZHIPUAI_API_KEY"] = "你的API Key"

def test_extract_functions():
    """测试辅助函数"""
    sample_report = """
    # 代码审查报告

    ## 总体评分: ⭐⭐⭐⭐ (4/5)

    ## 🔴 阻塞问题（必须修复）

    ### Issue #1: SQL注入风险
    **位置**: auth.py:15
    **严重性**: Critical

    ```python
    query = f"SELECT * FROM users WHERE id = {user_id}"
    ```

    ---

    ## 🟡 重要问题（应该修复）

    ### Issue #2: 缺少索引
    **位置**: schema.sql:10
    **严重性**: High

    ---

    ## 💭 小改进（可选）

    ### Issue #3: 命名建议
    **建议**: 函数命名可以更清晰
    """

    # 测试各函数
    score = extract_score(sample_report)
    assert score == "4/5", f"Expected 4/5, got {score}"

    blocking = extract_issues_by_type(sample_report, "🔴")
    assert len(blocking) == 1, f"Expected 1 blocking issue, got {len(blocking)}"
    assert "SQL注入" in blocking[0]["title"]

    important = extract_issues_by_type(sample_report, "🟡")
    assert len(important) == 1

    minor = extract_issues_by_type(sample_report, "💭")
    assert len(minor) == 1

    sec = extract_security_analysis(sample_report)
    assert sec["sql_injection"] == True

    perf = extract_performance_analysis(sample_report)
    # 根据内容判断

    print("✅ 所有辅助函数测试通过!")

def test_agent_integration():
    """测试 Agent 集成"""
    llm = ChatZhipuAI(model="glm-4")
    agent = create_code_review_agent(llm)

    test_state = {
        "messages": [],
        "current_agent": "",
        "iteration_count": 0,
        "prd": {},
        "tasks": [],
        "architecture": {},
        "design": {},
        "code": {
            "backend_files": ["test.py"],
            "frontend_files": [],
            "database_files": [],
            "content": "print('hello')"
        },
        "review": {},
        "test_results": {},
        "qa_report": {},
        "documentation": {},
        "memory_context": "",
        "skill_results": [],
        "validation_status": [],
        "project_name": "测试",
        "user_requirement": "测试"
    }

    result = agent(test_state)
    assert "review" in result
    assert "error" not in result["review"]
    assert "content" in result["review"]
    print("✅ Agent 集成测试通过!")

if __name__ == "__main__":
    test_extract_functions()
    test_agent_integration()
```

---

## 验证检查清单

完成测试后，请确认以下检查点：

- [ ] **测试1**: 基础功能运行成功
- [ ] **测试2**: SQL注入检测正常
- [ ] **测试3**: XSS检测正常
- [ ] **测试4**: N+1查询检测正常
- [ ] **测试5**: 内存泄漏检测正常
- [ ] **测试6**: 错误处理正常
- [ ] **统计信息**: `review["statistics"]` 包含正确的数据
- [ ] **安全分析**: `review["security_analysis"]` 结构完整
- [ ] **性能分析**: `review["performance_analysis"]` 结构完整

---

## 与原版对比

| 对比项 | 原版 `code_review_agent(1).py` | 增强版 `code_review_agent.py` |
|--------|-------------------------------|------------------------------|
| 代码行数 | ~255行 | ~543行 |
| 辅助函数 | 2个 | 6个 |
| 问题解析 | 简单行匹配 | 结构化解析 |
| 安全分析 | ❌ | ✅ 5项检测 |
| 性能分析 | ❌ | ✅ 4项检测 |
| 统计信息 | ❌ | ✅ 完整统计 |
| 代码传递 | 只传文件名 | 传递完整内容 |