"""
Coding Agent - 高级开发者 v5
阶段: 阶段5 - 代码实现
输出: 前后端代码

v5设计原则:
- 两阶段生成: 先生成文件列表，再按依赖顺序逐个生成
- LLM 自主决定: 不硬编码文件列表，由架构文档推导
- 依赖正确: 按拓扑顺序生成，确保导入关系正确
"""

import os
import re
import sys
from pathlib import Path
from typing import Dict, List
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

# 添加项目路径
sys.path.insert(0, str(Path(__file__).parent.parent))
from agent_state import AgentState
from core.file_manager import WorkspaceManager, create_file_reference


def _load_coding_prompt():
    """从prompts目录加载Coding Agent提示词"""
    prompt_path = Path(__file__).resolve().parents[1] / "prompts" / "coding_prompt.md"
    try:
        with open(prompt_path, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        print(f"警告: 无法加载 prompts/coding_prompt.md: {e}")
        return "你是高级全栈开发者，负责编写生产级别的代码。详细规范请参考 prompts/coding_prompt.md"


CODING_AGENT_PROMPT = _load_coding_prompt()


def parse_file_list(llm_response: str) -> List[Dict]:
    """
    解析 LLM 返回的文件列表
    返回格式: [{"path": "backend/src/models/User.js", "type": "Model", "deps": [...]}]
    """
    files = []

    # 支持多种格式：
    # 格式1: [FILE: path] type: xxx deps: xxx
    # 格式2: - path (type: xxx, deps: xxx)
    # 格式3: 表格或列表

    # 提取 [FILE: path] 格式
    file_pattern = r'\[FILE:\s*([^\]]+)\]'
    matches = re.findall(file_pattern, llm_response)

    for path in matches:
        files.append({"path": path.strip(), "deps": []})

    # 如果没找到 [FILE:] 格式，尝试其他格式
    if not files:
        # 尝试提取 - path 格式
        lines = llm_response.split('\n')
        for line in lines:
            line = line.strip()
            if line.startswith('- ') or line.startswith('* '):
                # 提取路径
                path_match = re.search(r'`?([a-zA-Z0-9_/\.-]+)`?', line)
                if path_match:
                    path = path_match.group(1)
                    files.append({"path": path, "deps": []})
            elif line.endswith('.js') or line.endswith('.jsx') or line.endswith('.css'):
                files.append({"path": line.strip(), "deps": []})

    return files


def build_dependency_order(files: List[Dict]) -> List[Dict]:
    """
    构建依赖顺序，使用拓扑排序
    返回: 按依赖顺序排列的文件列表
    """
    # 简单的依赖层级排序
    # 层级 0: 无依赖 (基础模块、utils)
    # 层级 1: 依赖层级 0
    # 层级 2: 依赖层级 1
    # ...

    levels = {}
    remaining = list(files)

    max_iterations = len(files) + 2
    iteration = 0

    while remaining and iteration < max_iterations:
        iteration += 1

        # 找出可以放在当前层的文件
        current_level = []
        still_waiting = []

        for file_info in remaining:
            file_path = file_info["path"]

            # 判断层级
            level = 0

            # 基础模块 (db, middleware, utils)
            if any(x in file_path for x in ['/db/', '/middleware/', '/utils/', 'connection.js']):
                level = 0
            # Models (依赖 db)
            elif '/models/' in file_path:
                level = 1
            # Services (依赖 models)
            elif '/services/' in file_path:
                level = 2
            # Routes (依赖 models, services)
            elif '/routes/' in file_path:
                level = 3
            # Socket (依赖 services, models)
            elif '/socket/' in file_path or 'handler.js' in file_path:
                level = 3
            # Server (依赖所有)
            elif '/server.js' in file_path:
                level = 10
            # API client (前端基础)
            elif '/api/client.js' in file_path:
                level = 20
            # Hooks (依赖 api)
            elif '/hooks/' in file_path:
                level = 21
            # Components (依赖 hooks, api)
            elif '/components/' in file_path:
                # CSS files can be generated alongside components
                level = 22
            # CSS files (App.css 等)
            elif file_path.endswith('.css'):
                level = 21  # CSS 可以与组件同级或之前
            # App (依赖所有组件)
            elif '/App.jsx' in file_path or '/App.js' in file_path:
                level = 30
            # Main, index, config
            elif any(x in file_path for x in ['/main.jsx', '/index.html', '/vite.config', '/package.json']):
                level = 40
            else:
                level = 25

            file_info["_level"] = level
            current_level.append(file_info)

        remaining = still_waiting
        levels[iteration] = current_level

    # 按层级排序
    sorted_files = []
    for level in sorted(levels.keys()):
        sorted_files.extend(sorted(levels[level], key=lambda x: x["path"]))

    return sorted_files


def generate_file_list(llm, project_name: str, architecture_docs: Dict) -> List[Dict]:
    """
    第一阶段: 让 LLM 根据架构文档生成文件列表
    """
    print("[阶段1] 生成文件列表...")

    # 构建架构文档上下文
    arch_context = ""
    for name, doc in architecture_docs.items():
        arch_context += f"## {name}\n{doc['content']}\n\n"

    prompt = f"""项目: {project_name}

## 架构文档
{arch_context}

## 任务
请根据上述架构文档，列出实现该项目所需的所有文件。

请按以下格式输出:
```
[FILE: backend/src/db/connection.js] - 数据库连接
[FILE: backend/src/models/User.js] - 用户模型
[FILE: backend/src/models/Room.js] - 房间模型
...
```

要求:
1. 包含所有后端和前端文件
2. 文件路径使用相对路径，如 backend/src/...
3. 简要说明每个文件的用途
"""

    response = llm.invoke([
        SystemMessage(content=CODING_AGENT_PROMPT),
        HumanMessage(content=prompt)
    ])

    files = parse_file_list(response.content)

    # 如果解析失败，尝试从 response 中手动提取
    if not files:
        lines = response.content.split('\n')
        for line in lines:
            if '.js' in line or '.jsx' in line or '.css' in line:
                # 提取文件路径
                path_match = re.search(r'([a-zA-Z0-9_/\.-]+\.(?:js|jsx|css|html|json))', line)
                if path_match:
                    files.append({"path": path_match.group(1), "deps": []})

    print(f"  识别到 {len(files)} 个文件")

    # 按依赖排序
    sorted_files = build_dependency_order(files)

    print(f"  按依赖顺序排列:")
    for i, f in enumerate(sorted_files[:10], 1):  # 只显示前10个
        print(f"    {i}. {f['path']}")
    if len(sorted_files) > 10:
        print(f"    ... 还有 {len(sorted_files) - 10} 个文件")

    return sorted_files


def generate_single_file(llm, file_info: Dict, project_name: str,
                         architecture_docs: Dict, generated_files: List[str],
                         all_files: List[Dict], rework_issues: List = None) -> str:
    """
    第二阶段: 生成单个文件

    Args:
        file_info: 当前文件信息 {"path": "...", "_level": ...}
        generated_files: 已生成的文件列表
        all_files: 所有文件列表（按依赖顺序）
        rework_issues: 需要修复的问题列表（返工模式）
    """
    file_path = file_info["path"]

    # 构建上下文
    arch_context = ""
    for name, doc in architecture_docs.items():
        arch_context += f"## {name}\n{doc['content'][:500]}\n\n"  # 截断避免过长

    # 已生成文件（可以导入的）
    available_imports = ""
    if generated_files:
        available_imports = "## 已生成的文件（可以导入）:\n"
        for f in generated_files:
            available_imports += f"- {f}\n"

    # 待生成文件列表（让 LLM 知道后续会有什么）
    upcoming_files = "## 待生成的文件:\n"
    remaining = [f["path"] for f in all_files if f["path"] != file_path]
    for f in remaining[:20]:  # 只显示前20个
        upcoming_files += f"- {f}\n"
    if len(remaining) > 20:
        upcoming_files += f"... 还有 {len(remaining) - 20} 个文件\n"

    # 返工问题（如果有）
    rework_context = ""
    if rework_issues:
        rework_context = "\n## ⚠️ 需要修复的问题:\n"
        rework_context += f"本次返工需要解决以下问题，生成代码时请特别注意:\n\n"
        for issue in rework_issues[:5]:  # 只显示前5个
            title = issue.get("title", issue.get("reason", "未知问题"))
            location = issue.get("location", "")
            severity = issue.get("severity", "")
            rework_context += f"- [{severity}] {title}\n"
            if location:
                rework_context += f"  位置: {location}\n"
            desc = issue.get("description", "")
            if desc and len(desc) < 200:
                rework_context += f"  描述: {desc[:150]}...\n"
        rework_context += "\n"

    # 导入提示
    import_hint = ""
    if file_path.endswith('.jsx') or file_path.endswith('.js'):
        import_hint = "\n## 导入注意事项:\n"
        import_hint += "- 使用相对路径导入\n"
        import_hint += "- 检查已生成文件列表，确保导入路径正确\n"

        if '/components/layout/' in file_path:
            import_hint += "- layout组件应从 '../../hooks/' 导入 hooks\n"
            import_hint += "- layout组件无需导入 api\n"
        elif '/components/' in file_path:
            import_hint += "- 组件应从 '../hooks/' 导入 hooks\n"
            import_hint += "- 组件应从 '../api/' 导入 api (如果需要)\n"
        elif '/hooks/' in file_path:
            import_hint += "- hooks 应从 '../api/' 导入 api\n"
            import_hint += "- 使用 named export: export function useAuth() {...}\n"
        elif '/api/' in file_path:
            import_hint += "- 使用 default export: const api = {...}; export default api\n"
        elif '/models/' in file_path:
            import_hint += "- Model 使用 static 方法\n"
            import_hint += "- 必须包含 findById, getById, create, update\n"
            if rework_issues:  # 返工时额外提醒
                import_hint += "- ⚠️ 确保字段映射正确: SQL用snake_case, 返回用camelCase\n"
                import_hint += "- ⚠️ 确保所有方法都已实现\n"
        elif file_path.endswith('App.jsx'):
            import_hint += "- App.jsx 应从 './hooks/' 导入 hooks\n"
            import_hint += "- App.jsx 应从 './components/' 导入组件\n"
            import_hint += "- App.jsx 应导入 './App.css'\n"

    prompt = f"""项目: {project_name}

{arch_context}

{available_imports}

{upcoming_files}

{rework_context}

{import_hint}

## 当前任务
生成文件: {file_path}

根据 prompts/coding_prompt.md 中的规范生成代码。
使用 [FILE: {file_path}] 标记输出。
"""

    response = llm.invoke([
        SystemMessage(content=CODING_AGENT_PROMPT),
        HumanMessage(content=prompt)
    ])

    return response.content


def save_code_file(content: str, workspace_path: str) -> List[str]:
    """
    从 LLM 响应中提取并保存代码文件
    """
    saved_files = []

    # 提取 [FILE: path] 格式
    file_pattern = r'\[FILE:\s*([^\]]+)\]\s*```[^\n]*\n(.*?)\n```'
    matches = re.findall(file_pattern, content, re.DOTALL)

    for file_path, file_content in matches:
        full_path = os.path.join(workspace_path, file_path.strip())
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(file_content.strip())
        saved_files.append(file_path.strip())

    # 如果没有找到代码块，检查是否是纯代码
    if not matches and content.strip():
        # 尝试查找文件标记
        file_match = re.search(r'\[FILE:\s*([^\]]+)\]', content)
        if file_match:
            file_path = file_match.group(1)
            # 移除文件标记后的内容
            code_content = re.sub(r'\[FILE:[^\]]+\]\s*', '', content)
            if code_content.strip():
                full_path = os.path.join(workspace_path, file_path.strip())
                os.makedirs(os.path.dirname(full_path), exist_ok=True)
                with open(full_path, "w", encoding="utf-8") as f:
                    f.write(code_content.strip())
                saved_files.append(file_path.strip())

    return saved_files


def create_coding_agent(llm):
    """创建 Coding Agent 工厂函数 v5"""

    def coding_agent(state: AgentState) -> AgentState:
        """Coding Agent v5 - 两阶段生成"""
        print("\n" + "="*70)
        print("Coding Agent - 高级开发者 (v5)")
        print("="*70)

        workspace = WorkspaceManager()
        project_name = state.get("project_name", "在线大富翁")
        architecture = state.get("architecture", {})
        iteration = state.get("iteration_count", 0)
        rework_source = state.get("rework_source", "")
        rework_issues = state.get("rework_issues", [])
        test_results = state.get("test_results", {})
        bugs = test_results.get("bugs", [])

        # 返工模式
        if iteration > 0 and (rework_issues or bugs):
            print(f"\n🔧 返工模式 - 第{iteration}次修复")
            print(f"   来源: {rework_source}")
            print(f"   问题数: {len(rework_issues) if rework_issues else len(bugs)}")

            issues = rework_issues if rework_issues else bugs

            # TODO: 根据问题修复代码
            # 目前先打印问题，完整修复需要根据问题类型处理
            for issue in issues[:3]:  # 只显示前3个
                title = issue.get("title", issue.get("reason", "未知问题"))
                location = issue.get("location", "")
                severity = issue.get("severity", "")
                print(f"   - [{severity}] {title}")
                if location:
                    print(f"     位置: {location}")

            # 加载架构文档进行重新生成
            print("\n   重新生成受影响的文件...")
            # 这里应该根据问题重新生成特定文件，暂时继续正常流程

            state["current_agent"] = "Coding Agent"
            # 注意：这里应该先修复再生成，但完整修复逻辑较复杂
            # 暂时继续执行正常生成流程，LLM会根据架构文档重新生成

        # 正常模式第一次生成时也需要处理
        # 不要 return，继续执行下面的逻辑

        # 加载架构文档
        arch_docs = {}
        modules = architecture.get("modules", {})

        if modules:
            for module_name, module_info in modules.items():
                file_path = module_info.get("file_path", "")
                if file_path:
                    artifact_type = file_path.replace(".md", "")
                    content = workspace.read_markdown(artifact_type)
                    if content:
                        arch_docs[module_name] = {
                            "content": content,
                            "file_path": file_path
                        }

        # 扫描其他架构文档
        workspace_path = Path(workspace.workspace_root)
        for arch_file in workspace_path.glob("architecture_*.md"):
            artifact_type = arch_file.stem
            content = workspace.read_markdown(artifact_type)
            if content and artifact_type.replace("architecture_", "") not in arch_docs:
                arch_docs[artifact_type.replace("architecture_", "")] = {
                    "content": content,
                    "file_path": arch_file.name
                }

        if not arch_docs:
            print("缺少架构文档")
            state["current_agent"] = "Coding Agent"
            state["code"] = {"error": "缺少架构文档"}
            return state

        print(f"架构文档: {len(arch_docs)}个")

        # ========== 阶段1: 生成文件列表 ==========
        all_files = generate_file_list(llm, project_name, arch_docs)

        if not all_files:
            print("错误: 无法生成文件列表")
            state["current_agent"] = "Coding Agent"
            state["code"] = {"error": "无法生成文件列表"}
            return state

        # ========== 阶段2: 按依赖顺序逐个生成文件 ==========
        print(f"\n[阶段2] 逐个生成文件...")

        generated_files = []
        workspace_path = "mock-monopoly"

        for idx, file_info in enumerate(all_files, 1):
            file_path = file_info["path"]
            print(f"[{idx}/{len(all_files)}] {file_path}...")

            try:
                response = generate_single_file(
                    llm, file_info, project_name, arch_docs,
                    generated_files, all_files, rework_issues if iteration > 0 else None
                )

                saved = save_code_file(response, workspace_path)
                generated_files.extend(saved)

                if saved:
                    print(f"    生成: {', '.join(saved)}")
                else:
                    print(f"    警告: 未找到文件标记")
            except Exception as e:
                print(f"    错误: {e}")

        # 统计
        backend_count = sum(1 for f in generated_files if f.startswith('backend/'))
        frontend_count = sum(1 for f in generated_files if f.startswith('frontend/'))

        print(f"\n完成! 总计 {len(generated_files)} 个文件 (后端 {backend_count}, 前端 {frontend_count})")

        # 生成代码结构文档
        print("生成代码结构文档...")
        doc_prompt = f"""项目: {project_name}

## 生成的文件
{chr(10).join(f'- {f}' for f in generated_files)}

## 架构文档
{chr(10).join(f'## {n}' for n in arch_docs.keys())}

生成代码结构说明文档（项目结构、文件说明、启动说明）
"""

        doc_response = llm.invoke([
            SystemMessage(content=CODING_AGENT_PROMPT),
            HumanMessage(content=doc_prompt)
        ])

        doc_path = workspace.write_markdown("code_structure", doc_response.content)
        generated_files.append(doc_path)

        state["current_agent"] = "Coding Agent"
        state["code"] = {
            "files": generated_files,
            "total": len(generated_files),
            "backend": backend_count,
            "frontend": frontend_count
        }
        state["messages"].append(AIMessage(content=f"代码已生成，共{len(generated_files)}个文件"))

        return state

    return coding_agent
