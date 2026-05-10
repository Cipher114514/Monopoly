"""
测试 Testing Agent
输入: Code Review Agent 输出的 State
输出: 测试报告 + State JSON
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

# 切换工作目录到项目根目录
os.chdir(project_root)

# 加载 .env 文件
from dotenv import load_dotenv
env_path = project_root / ".env"
if env_path.exists():
    load_dotenv(env_path)
    print(f"已加载 .env 文件")
else:
    print(f"⚠️ .env 文件不存在，使用环境变量")

from langchain_openai import ChatOpenAI
from agent_state import AgentState

# 使用 importlib.util 直接加载 testing_agent
import importlib.util

spec = importlib.util.spec_from_file_location("testing_agent", project_root / "agents" / "testing_agent.py")
testing_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(testing_module)

create_testing_agent = testing_module.create_testing_agent


def main():
    print("=" * 70)
    print("Testing Testing Agent")
    print("=" * 70)

    # 1. 加载 Code Review Agent 的输出作为输入
    input_path = project_root / "tests" / "output" / "code_review_agent_result.json"

    if not input_path.exists():
        print(f"❌ 找不到输入文件: {input_path}")
        print("请先运行 test_code_review_agent.py")
        return 1

    with open(input_path, 'r', encoding='utf-8') as f:
        input_state = json.load(f)

    print(f"\n📂 加载输入 State:")
    print(f"   - 项目名称: {input_state.get('project_name', 'N/A')}")
    print(f"   - 上一个 Agent: {input_state.get('current_agent', 'N/A')}")

    # 2. 检查代码目录
    code_dir = project_root / "mock-monopoly"
    if not code_dir.exists():
        print(f"\n❌ 代码目录不存在: {code_dir}")
        print("请先运行 test_coding_agent.py 生成代码")
        return 1

    # 3. 统计代码文件
    backend_files = list((code_dir / "backend" / "src").rglob("*.js")) if (code_dir / "backend" / "src").exists() else []
    frontend_files = list((code_dir / "frontend" / "src").rglob("*")) if (code_dir / "frontend" / "src").exists() else []

    print(f"\n📂 代码文件统计:")
    print(f"   - 后端文件: {len(backend_files)} 个")
    print(f"   - 前端文件: {len([f for f in frontend_files if f.suffix in ['.js', '.jsx']])} 个")

    # 4. 创建 LLM 实例 (Testing Agent 可能需要 LLM 进行智能分析)
    api_key = os.environ.get("OPENAI_API_KEY")
    base_url = os.environ.get("OPENAI_API_BASE", os.environ.get("OPENAI_BASE_URL", "https://api.openai.com/v1"))

    # 根据不同的 API 端点选择默认模型
    model = os.environ.get("OPENAI_MODEL", "")
    if not model:
        if "bigmodel.cn" in base_url:
            model = "glm-4-plus"
        elif "grok" in base_url or "xAI" in base_url:
            model = "grok-2-1212"
        else:
            model = "gpt-4o"

    if not api_key:
        print(f"⚠️ 未设置 OPENAI_API_KEY 环境变量，Testing Agent 将运行静态检查")

    print(f"\n🔑 API 配置:")
    print(f"   - API Base: {base_url}")
    print(f"   - Model: {model}")

    llm = None
    if api_key:
        llm = ChatOpenAI(
            model=model,
            api_key=api_key,
            base_url=base_url,
            temperature=0.2,
            max_tokens=8000,
        )

    # 5. 创建 Testing Agent
    testing_agent = create_testing_agent(llm, test_source_path="mock-monopoly")

    # 6. 执行 Agent
    print(f"\n{'='*70}")
    print("执行 Testing Agent...")
    print(f"{'='*70}\n")

    try:
        result_state = testing_agent(input_state)
    except Exception as e:
        print(f"\n❌ Testing Agent 执行失败: {e}")
        import traceback
        traceback.print_exc()
        return 1

    # 7. 保存输出 State
    output_path = project_root / "tests" / "output" / "testing_agent_result.json"
    with open(output_path, 'w', encoding='utf-8') as f:
        # 转换为可序列化的格式
        output = {}
        for k, v in result_state.items():
            if k == "messages":
                # 处理消息列表
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
            elif k == "test_results":
                # 处理测试结果
                if isinstance(v, dict):
                    output[k] = v
                else:
                    output[k] = {"raw": str(v)}
            elif k == "review":
                # 保留审查报告
                if isinstance(v, dict):
                    output[k] = {
                        "overall_score": v.get('overall_score'),
                        "blocking_issues": len(v.get('blocking_issues', [])),
                        "important_issues": len(v.get('important_issues', [])),
                        "auto_fix_report": v.get('auto_fix_report')
                    }
            else:
                output[k] = v
        json.dump(output, f, ensure_ascii=False, indent=2, default=str)

    print(f"\n✅ 输出 State 已保存到: {output_path}")

    # 8. 显示测试结果摘要
    test_results = result_state.get("test_results", {})
    if test_results and "error" not in test_results:
        print(f"\n{'='*70}")
        print("测试结果:")
        print(f"{'='*70}")
        print(f"   - 总测试: {test_results.get('total_tests', 0)} 个")
        print(f"   - 通过: {test_results.get('passed', 0)} 个 ✅")
        print(f"   - 失败: {test_results.get('failed', 0)} 个 ❌")
        print(f"   - 摘要: {test_results.get('summary', 'N/A')}")

        # 显示详细测试结果
        if test_results.get("details"):
            print(f"\n📋 详细测试结果:")
            for detail in test_results["details"]:
                status = "✅ 通过" if detail.get("passed") else "❌ 失败"
                print(f"   {status} - {detail.get('name', '未命名')}")

        # 显示发现的问题
        bugs = test_results.get("bugs", [])
        if bugs:
            print(f"\n🐛 发现 {len(bugs)} 个问题:")
            for bug in bugs[:10]:
                severity_emoji = {
                    "Critical": "🔴",
                    "High": "🟠",
                    "Medium": "🟡",
                    "Low": "💭"
                }.get(bug.get("severity", "Low"), "⚪")
                print(f"   {severity_emoji} [{bug.get('id', 'N/A')}] {bug.get('title', '未命名')}")
                print(f"      类型: {bug.get('type', 'N/A')}")
            if len(bugs) > 10:
                print(f"   ... 还有 {len(bugs) - 10} 个问题")

        # 保存测试报告到 workspace
        from core.file_manager import WorkspaceManager
        workspace = WorkspaceManager()

        # 生成 Markdown 测试报告
        report_md = generate_test_report_markdown(test_results, input_state.get("project_name", "项目"))
        workspace.write_markdown("test_report", report_md)
        print(f"\n✅ 测试报告已保存到: workspace/test_report.md")

        # 保存 JSON 格式的测试报告
        workspace.write_json("test_report", test_results)
        print(f"✅ 测试数据已保存到: workspace/test_report.json")

    elif test_results.get("error"):
        print(f"\n❌ 测试失败: {test_results.get('error')}")

    # 9. 总结
    print(f"\n{'='*70}")
    print("Testing Agent 测试完成")
    print(f"{'='*70}")

    return 0


def generate_test_report_markdown(test_results: dict, project_name: str) -> str:
    """生成 Markdown 格式的测试报告"""
    lines = [
        f"# 测试报告 - {project_name}\n",
        f"## 总体结果",
        f"- **总测试数**: {test_results.get('total_tests', 0)}",
        f"- **通过**: {test_results.get('passed', 0)} ✅",
        f"- **失败**: {test_results.get('failed', 0)} ❌",
        f"- **摘要**: {test_results.get('summary', 'N/A')}\n",
    ]

    # 详细测试结果
    if test_results.get("details"):
        lines.append("## 详细测试结果\n")
        for detail in test_results["details"]:
            status_icon = "✅" if detail.get("passed") else "❌"
            lines.append(f"### {status_icon} {detail.get('name', '未命名')}\n")

            if detail.get("bugs"):
                lines.append("**发现的问题:**\n")
                for bug in detail["bugs"]:
                    severity = bug.get("severity", "Low")
                    lines.append(f"- **{severity}** [{bug.get('id', 'N/A')}] {bug.get('title', '未命名')}")
                    lines.append(f"  - 类型: {bug.get('type', 'N/A')}\n")

    # 问题汇总
    bugs = test_results.get("bugs", [])
    if bugs:
        lines.append("\n## 问题汇总\n")

        # 按严重程度分组
        critical_bugs = [b for b in bugs if b.get("severity") == "Critical"]
        high_bugs = [b for b in bugs if b.get("severity") == "High"]
        other_bugs = [b for b in bugs if b.get("severity") not in ["Critical", "High"]]

        if critical_bugs:
            lines.append(f"### 🔴 严重问题 ({len(critical_bugs)})\n")
            for bug in critical_bugs:
                lines.append(f"- [{bug.get('id', 'N/A')}] {bug.get('title', '未命名')}")
                lines.append(f"  - 文件: {bug.get('file', 'N/A')}")
                lines.append(f"  - 类型: {bug.get('type', 'N/A')}\n")

        if high_bugs:
            lines.append(f"### 🟠 高优先级问题 ({len(high_bugs)})\n")
            for bug in high_bugs:
                lines.append(f"- [{bug.get('id', 'N/A')}] {bug.get('title', '未命名')}")
                lines.append(f"  - 类型: {bug.get('type', 'N/A')}\n")

        if other_bugs:
            lines.append(f"### 💭 其他问题 ({len(other_bugs)})\n")
            for bug in other_bugs:
                lines.append(f"- [{bug.get('id', 'N/A')}] {bug.get('title', '未命名')}\n")

    return "\n".join(lines)


if __name__ == "__main__":
    sys.exit(main())
