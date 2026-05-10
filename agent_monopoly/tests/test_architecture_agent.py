"""
测试 Architecture Agent
输入: Requirements Agent 输出的 State
输出: architecture.md 文件 + State JSON
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
    print(f"✅ 已加载 .env 文件")
else:
    print(f"⚠️ .env 文件不存在，使用环境变量")

# 设置默认环境变量
os.environ.setdefault('TAVILY_API_KEY', 'test_key')
os.environ.setdefault('LANGCHAIN_API_KEY', 'test_key')
os.environ.setdefault('LANGCHAIN_TRACING_V2', 'false')

from langchain_openai import ChatOpenAI
from agent_state import AgentState

# 使用 importlib.util 直接加载 architecture_agent
import importlib.util

spec = importlib.util.spec_from_file_location("architecture_agent", project_root / "agents" / "architecture_agent.py")
architecture_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(architecture_module)

create_architecture_agent = architecture_module.create_architecture_agent

def main():
    print("=" * 70)
    print("Testing Architecture Agent")
    print("=" * 70)

    # 1. 加载 Requirements Agent 的输出作为输入
    input_path = project_root / "tests" / "output" / "requirements_agent_result.json"

    if not input_path.exists():
        print(f"❌ 找不到输入文件: {input_path}")
        print("请先运行 test_requirements_agent.py")
        return 1

    with open(input_path, 'r', encoding='utf-8') as f:
        input_state = json.load(f)

    print(f"\n📂 加载输入 State:")
    print(f"   - 项目名称: {input_state.get('project_name', 'N/A')}")
    print(f"   - 上一个 Agent: {input_state.get('current_agent', 'N/A')}")
    print(f"   - PRD 文件: {input_state.get('prd', {}).get('file_path', 'N/A')}")
    print(f"   - Tasks 文件: {input_state.get('tasks', {}).get('file_path', 'N/A')}")

    # 2. 检查 workspace 中是否存在 prd.md 和 tasks.md
    from core.file_manager import WorkspaceManager
    workspace = WorkspaceManager()

    prd_content = workspace.read_markdown("prd")
    tasks_content = workspace.read_markdown("tasks")

    if not prd_content:
        print(f"\n❌ workspace/prd.md 不存在或为空")
        return 1

    if not tasks_content:
        print(f"\n❌ workspace/tasks.md 不存在或为空")
        return 1

    print(f"\n📂 Workspace 文件检查:")
    print(f"   - prd.md: {len(prd_content)} 字符 ✓")
    print(f"   - tasks.md: {len(tasks_content)} 字符 ✓")

    # 3. 创建 LLM 实例（从环境变量读取配置）
    api_key = os.environ.get("OPENAI_API_KEY")
    base_url = os.environ.get("OPENAI_API_BASE", os.environ.get("OPENAI_BASE_URL", "https://api.openai.com/v1"))

    # 根据不同的 API 端点选择默认模型
    model = os.environ.get("OPENAI_MODEL", "")
    if not model:
        if "bigmodel.cn" in base_url:
            model = "glm-4"  # 使用完整版模型以获得更长输出
        else:
            model = "gpt-4o-mini"

    if not api_key:
        print(f"❌ 未设置 OPENAI_API_KEY 环境变量")
        return 1

    print(f"   - API Base: {base_url}")
    print(f"   - Model: {model}")

    llm = ChatOpenAI(
        model=model,
        api_key=api_key,
        base_url=base_url,
        temperature=0.7,
        max_tokens=32768,  # 确保输出完整的架构文档
    )

    # 4. 创建 Architecture Agent
    architecture_agent = create_architecture_agent(llm)

    # 5. 执行 Agent
    print(f"\n{'='*70}")
    print("执行 Architecture Agent...")
    print(f"{'='*70}\n")

    # 清空 architecture 字段，让 Agent 重新生成
    input_state["architecture"] = {}

    try:
        result_state = architecture_agent(input_state)
    except Exception as e:
        print(f"\n❌ Architecture Agent 执行失败: {e}")
        import traceback
        traceback.print_exc()
        return 1

    # 6. 保存输出 State
    output_path = project_root / "tests" / "output" / "architecture_agent_result.json"
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

    # 7. 显示生成的 architecture.md 预览
    architecture_content = workspace.read_markdown("architecture")
    if architecture_content:
        print(f"\n{'='*70}")
        print("生成的 architecture.md 预览:")
        print(f"{'='*70}")
        lines = architecture_content.split('\n')
        preview_lines = min(50, len(lines))
        for i, line in enumerate(lines[:preview_lines], 1):
            print(f"{i:3d}: {line}")
        if len(lines) > preview_lines:
            print(f"\n... (还有 {len(lines) - preview_lines} 行)")
    else:
        print(f"\n⚠️ architecture.md 文件不存在或为空")

    # 8. 总结
    print(f"\n{'='*70}")
    print("Architecture Agent 测试完成")
    print(f"{'='*70}")
    arch_ref = result_state.get("architecture", {})
    if arch_ref and "file_path" in arch_ref:
        print(f"✅ 架构文档已生成")
        print(f"   - 文件路径: workspace/{arch_ref['file_path']}")
        if "metadata" in arch_ref:
            meta = arch_ref["metadata"]
            print(f"   - 内容大小: {meta.get('size', 'N/A')} 字符")
            print(f"   - 数据表/数据项: {meta.get('tables_count', 'N/A')} 个")
            print(f"   - API端点: {meta.get('api_count', 'N/A')} 个")
    else:
        print(f"❌ 架构文档生成失败")

    return 0

if __name__ == "__main__":
    sys.exit(main())
