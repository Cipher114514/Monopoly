"""
Requirements Agent 测试脚本
读取 PM Agent 的输出 → 执行 Requirements Agent → 输出 result JSON
"""

import sys
import os
import json
from pathlib import Path

# 设置UTF-8编码输出（Windows兼容）
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

from dotenv import load_dotenv

# 加载.env文件
load_dotenv()

# 添加项目根目录到路径
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

# 切换工作目录到项目根目录（确保workspace路径正确）
os.chdir(project_root)

# 导入需要的模块
from agent_state import AgentState
from core.file_manager import WorkspaceManager

# 直接导入requirements_agent模块
import importlib.util
spec = importlib.util.spec_from_file_location("requirements_agent", project_root / "agents" / "requirements_agent.py")
requirements_agent_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(requirements_agent_module)
create_requirements_agent = requirements_agent_module.create_requirements_agent


# 文件路径配置
INPUT_FILE = Path(__file__).parent / "output" / "pm_agent_result.json"
OUTPUT_FILE = Path(__file__).parent / "output" / "requirements_agent_result.json"


def load_pm_result() -> AgentState:
    """从 PM Agent 的输出加载状态"""
    if not INPUT_FILE.exists():
        print(f"❌ 输入文件不存在: {INPUT_FILE}")
        print(f"   请先运行: python tests/test_pm_agent.py")
        sys.exit(1)

    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        state = json.load(f)

    print(f"✅ 已加载 PM Agent 输出: {INPUT_FILE}")
    print(f"   项目名称: {state.get('project_name')}")

    # 检查PRD是否已生成
    prd_ref = state.get("prd", {})
    if not prd_ref or prd_ref.get("error"):
        print(f"❌ PRD 未正确生成")
        return None

    print(f"   PRD文件: workspace/{prd_ref.get('file_path')}")
    return state


def save_output_state(state: AgentState):
    """保存输出状态到 JSON 文件"""
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

    # 准备可序列化的数据
    messages_serializable = []
    for msg in state.get("messages", []):
        if hasattr(msg, 'content'):
            messages_serializable.append({
                "type": msg.__class__.__name__,
                "content": msg.content
            })
        else:
            messages_serializable.append(msg)

    save_data = {
        "messages": messages_serializable,
        "current_agent": state.get("current_agent"),
        "iteration_count": state.get("iteration_count"),
        "prd": state.get("prd", {}),
        "tasks": state.get("tasks", {}),
        "architecture": state.get("architecture", {}),
        "design": state.get("design", {}),
        "code": state.get("code", {}),
        "review": state.get("review", {}),
        "test_results": state.get("test_results", {}),
        "qa_report": state.get("qa_report", {}),
        "documentation": state.get("documentation", {}),
        "memory_context": state.get("memory_context", ""),
        "skill_results": state.get("skill_results", []),
        "validation_status": state.get("validation_status", []),
        "project_name": state.get("project_name"),
        "user_requirement": state.get("user_requirement"),
    }

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(save_data, f, ensure_ascii=False, indent=2)

    print(f"✅ 已保存输出状态: {OUTPUT_FILE}")


def setup_llm():
    """配置 LLM"""
    api_key = os.getenv("OPENAI_API_KEY")
    api_base = os.getenv("OPENAI_API_BASE")

    if not api_key:
        print("❌ 未检测到 API 密钥")
        print("   请设置 OPENAI_API_KEY 环境变量")
        return None

    try:
        from langchain_openai import ChatOpenAI
    except ImportError:
        print("❌ 缺少依赖: pip install langchain-openai")
        return None

    model_name = os.getenv("OPENAI_MODEL", "glm-4")
    llm_kwargs = {
        "model": model_name,
        "temperature": 0.7,
        "max_tokens": 4096,
        "api_key": api_key
    }

    if api_base:
        llm_kwargs["base_url"] = api_base

    llm = ChatOpenAI(**llm_kwargs)

    provider = "智谱AI" if "bigmodel" in (api_base or "") else "OpenAI"
    print(f"✅ 使用 {provider}: {model_name}")

    return llm


def print_summary(state: AgentState):
    """打印执行摘要"""
    print("\n" + "="*70)
    print("执行结果摘要")
    print("="*70)

    tasks_ref = state.get("tasks", {})

    if tasks_ref.get("error"):
        print(f"❌ 错误: {tasks_ref.get('error')}")
        return

    print(f"✅ 项目名称: {tasks_ref.get('project_name', 'N/A')}")
    print(f"✅ 文件路径: workspace/{tasks_ref.get('file_path', 'N/A')}")
    print(f"✅ 内容大小: {tasks_ref.get('size', 0)} 字符")
    print(f"✅ 任务总数: {tasks_ref.get('items_count', 0)}")
    print(f"✅ P0 任务: {tasks_ref.get('p0_count', 0)}")
    print(f"✅ P1 任务: {tasks_ref.get('p1_count', 0)}")

    # 显示任务文件位置
    workspace = WorkspaceManager()
    tasks_path = workspace.get_path("tasks")
    if tasks_path.exists():
        print(f"\n📄 任务文件位置: {tasks_path.absolute()}")
        print(f"   可以直接打开查看完整内容")


def print_tasks_preview():
    """打印任务内容预览"""
    workspace = WorkspaceManager()
    tasks_content = workspace.read_markdown("tasks")

    if tasks_content:
        print("\n" + "="*70)
        print("任务列表预览 (前500字符)")
        print("="*70)
        print(tasks_content[:500])
        if len(tasks_content) > 500:
            print("\n... (更多内容请查看 workspace/tasks.md)")
        print("="*70)


def main():
    """主测试函数"""
    print("\n" + "="*70)
    print("Requirements Agent 测试")
    print("="*70)

    # 1. 加载 PM Agent 的输出
    print("\n[步骤1] 加载 PM Agent 输出")
    state = load_pm_result()
    if not state:
        sys.exit(1)

    # 2. 配置 LLM
    print("\n[步骤2] 配置 LLM")
    llm = setup_llm()
    if not llm:
        sys.exit(1)

    # 3. 创建 Requirements Agent
    print("\n[步骤3] 创建 Requirements Agent")
    requirements_agent = create_requirements_agent(llm)
    print("   ✅ Requirements Agent 已创建")

    # 4. 执行 Agent
    print("\n[步骤4] 执行 Requirements Agent")
    print("="*70)

    try:
        result_state = requirements_agent(state)
    except Exception as e:
        print(f"\n❌ Agent 执行失败: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

    # 5. 打印摘要
    print_summary(result_state)

    # 6. 打印任务预览
    print_tasks_preview()

    # 7. 保存输出
    print("\n[步骤5] 保存输出状态")
    save_output_state(result_state)

    print(f"\n比对文件:")
    print(f"  输入(PM输出): {INPUT_FILE}")
    print(f"  输出: {OUTPUT_FILE}")
    print(f"  任务列表: workspace/tasks.md")

    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n\n⚠️ 测试被中断")
        sys.exit(1)
