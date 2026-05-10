"""
测试 Coding Agent
输入: Architecture Agent 输出的 State
输出: 代码文件 + code_structure.md + State JSON
"""

import sys
import json
import os
from pathlib import Path

# 设置UTF-8编码输出（Windows兼容）
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# 添加项目根目录到路径
project_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(project_root))

# 切换工作目录到项目根目录（确保workspace路径正确）
os.chdir(project_root)

# 加载 .env 文件
from dotenv import load_dotenv
env_path = project_root / ".env"
if env_path.exists():
    load_dotenv(env_path)
    print(f"已加载 .env 文件")
else:
    print(f"⚠️ .env 文件不存在，使用环境变量")

# 设置默认环境变量
os.environ.setdefault('TAVILY_API_KEY', 'test_key')
os.environ.setdefault('LANGCHAIN_API_KEY', 'test_key')
os.environ.setdefault('LANGCHAIN_TRACING_V2', 'false')

from langchain_openai import ChatOpenAI
from agent_state import AgentState

# 使用 importlib.util 直接加载 coding_agent
import importlib.util

spec = importlib.util.spec_from_file_location("coding_agent", project_root / "agents" / "coding_agent.py")
coding_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(coding_module)

create_coding_agent = coding_module.create_coding_agent

def main():
    print("=" * 70)
    print("Testing Coding Agent")
    print("=" * 70)

    # 1. 加载 Architecture Agent 的输出作为输入
    input_path = project_root / "tests" / "output" / "architecture_agent_result.json"

    if not input_path.exists():
        print(f"❌ 找不到输入文件: {input_path}")
        print("请先运行 test_architecture_agent.py")
        return 1

    with open(input_path, 'r', encoding='utf-8') as f:
        input_state = json.load(f)

    print(f"\n📂 加载输入 State:")
    print(f"   - 项目名称: {input_state.get('project_name', 'N/A')}")
    print(f"   - 上一个 Agent: {input_state.get('current_agent', 'N/A')}")
    print(f"   - Architecture 文件: {input_state.get('architecture', {}).get('file_path', 'N/A')}")

    # 2. 检查 workspace 中是否存在架构文档
    from core.file_manager import WorkspaceManager
    workspace = WorkspaceManager()

    # 检查架构文档是否存在
    architecture_files = []
    workspace_path = Path(workspace.workspace_root)

    # 查找所有 architecture_*.md 文件
    arch_files = list(workspace_path.glob("architecture_*.md"))
    if arch_files:
        print(f"\n📂 Workspace 架构文档检查:")
        for f in sorted(arch_files):
            content = workspace.read_markdown(f.stem)
            if content:
                architecture_files.append(f.name)
                print(f"   - {f.name}: {len(content)} 字符 ✓")
    else:
        print(f"\n❌ workspace 中没有找到 architecture_*.md 文件")
        return 1

    # 检查 tasks.md
    tasks_content = workspace.read_markdown("tasks")
    if not tasks_content:
        print(f"\n❌ workspace/tasks.md 不存在或为空")
        return 1

    print(f"   - tasks.md: {len(tasks_content)} 字符 ✓")

    # 3. 创建 LLM 实例（从环境变量读取配置）
    api_key = os.environ.get("OPENAI_API_KEY")
    base_url = os.environ.get("OPENAI_API_BASE", os.environ.get("OPENAI_BASE_URL", "https://api.openai.com/v1"))

    # 根据不同的 API 端点选择默认模型
    model = os.environ.get("OPENAI_MODEL", "")
    if not model:
        if "bigmodel.cn" in base_url:
            model = "glm-4-plus"  # 使用更强大的模型处理代码生成
        elif "grok" in base_url or "xAI" in base_url:
            model = "grok-2-1212"
        else:
            model = "gpt-4o"

    if not api_key:
        print(f"❌ 未设置 OPENAI_API_KEY 环境变量")
        return 1

    print(f"\n🔑 API 配置:")
    print(f"   - API Base: {base_url}")
    print(f"   - Model: {model}")

    llm = ChatOpenAI(
        model=model,
        api_key=api_key,
        base_url=base_url,
        temperature=0.3,  # 代码生成使用较低温度
        max_tokens=65000,  # 确保输出完整代码
    )

    # 4. 创建 Coding Agent
    coding_agent = create_coding_agent(llm)

    # 5. 执行 Agent
    print(f"\n{'='*70}")
    print("执行 Coding Agent...")
    print(f"{'='*70}\n")

    # 清空 code 字段，让 Agent 重新生成
    input_state["code"] = {}

    try:
        result_state = coding_agent(input_state)
    except Exception as e:
        print(f"\n❌ Coding Agent 执行失败: {e}")
        import traceback
        traceback.print_exc()
        return 1

    # 6. 保存输出 State
    output_path = project_root / "tests" / "output" / "coding_agent_result.json"
    with open(output_path, 'w', encoding='utf-8') as f:
        # 转换为可序列化的格式
        output = {}
        for k, v in result_state.items():
            if k == "messages":
                # 处理消息列表（可能是 AIMessage 对象或 dict）
                serialized_messages = []
                for m in v:
                    if isinstance(m, dict):
                        serialized_messages.append(m)
                    else:
                        # AIMessage/HumanMessage 对象
                        serialized_messages.append({
                            "type": m.__class__.__name__,
                            "content": getattr(m, 'content', str(m))
                        })
                output[k] = serialized_messages
            else:
                output[k] = v
        json.dump(output, f, ensure_ascii=False, indent=2, default=str)

    print(f"\n✅ 输出 State 已保存到: {output_path}")

    # 7. 检查生成的代码文件
    code_project_path = project_root / "mock-monopoly"
    if code_project_path.exists():
        print(f"\n{'='*70}")
        print("生成的代码文件:")
        print(f"{'='*70}")

        # 遍历所有生成的文件
        for root, dirs, files in os.walk(code_project_path):
            root_path = Path(root)
            rel_path = root_path.relative_to(code_project_path)
            if rel_path != Path('.'):
                print(f"\n📁 {rel_path}/")
            for file in sorted(files):
                file_path = root_path / file
                file_size = file_path.stat().st_size
                print(f"   - {file} ({file_size} bytes)")
    else:
        print(f"\n⚠️ mock-monopoly 目录不存在或没有生成代码文件")

    # 8. 显示生成的 code_structure.md 预览
    code_structure_content = workspace.read_markdown("code_structure")
    if code_structure_content:
        print(f"\n{'='*70}")
        print("生成的 code_structure.md 预览:")
        print(f"{'='*70}")
        lines = code_structure_content.split('\n')
        preview_lines = min(50, len(lines))
        for i, line in enumerate(lines[:preview_lines], 1):
            print(f"{i:3d}: {line}")
        if len(lines) > preview_lines:
            print(f"\n... (还有 {len(lines) - preview_lines} 行)")
    else:
        print(f"\n⚠️ workspace/code_structure.md 文件不存在或为空")

    # 9. 显示 code_overview.md 预览
    code_overview_content = workspace.read_markdown("code_overview")
    if code_overview_content:
        print(f"\n{'='*70}")
        print("生成的 code_overview.md 预览:")
        print(f"{'='*70}")
        lines = code_overview_content.split('\n')
        preview_lines = min(30, len(lines))
        for i, line in enumerate(lines[:preview_lines], 1):
            print(f"{i:3d}: {line}")
        if len(lines) > preview_lines:
            print(f"\n... (还有 {len(lines) - preview_lines} 行)")
    else:
        print(f"\n⚠️ workspace/code_overview.md 文件不存在或为空")

    # 10. 总结
    print(f"\n{'='*70}")
    print("Coding Agent 测试完成")
    print(f"{'='*70}")
    code_ref = result_state.get("code", {})
    if code_ref and "file_path" in code_ref:
        print(f"✅ 代码已生成")
        print(f"   - 总览文档: workspace/{code_ref['file_path']}")
        if "metadata" in code_ref:
            meta = code_ref["metadata"]
            print(f"   - 总文件数: {meta.get('total_files', 'N/A')} 个")
            print(f"   - 后端文件: {meta.get('backend_files', 'N/A')} 个")
            print(f"   - 前端文件: {meta.get('frontend_files', 'N/A')} 个")
    else:
        print(f"❌ 代码生成失败")

    return 0

if __name__ == "__main__":
    sys.exit(main())
