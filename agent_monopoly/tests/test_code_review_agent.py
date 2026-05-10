"""
测试 Code Review Agent
输入: Coding Agent 输出的 State
输出: 审查报告 + State JSON
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

# 使用 importlib.util 直接加载 code_review_agent
import importlib.util

spec = importlib.util.spec_from_file_location("code_review_agent", project_root / "agents" / "code_review_agent.py")
review_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(review_module)

create_code_review_agent = review_module.create_code_review_agent


def collect_code_content(code_dir: Path) -> str:
    """收集所有代码文件内容用于审查"""
    content_parts = []
    content_parts.append(f"# 代码审查源文件\n")

    # 收集后端文件
    backend_dir = code_dir / "backend" / "src"
    if backend_dir.exists():
        for js_file in sorted(backend_dir.rglob("*.js")):
            rel_path = js_file.relative_to(code_dir)
            content_parts.append(f"\n## {rel_path}\n")
            try:
                with open(js_file, 'r', encoding='utf-8') as f:
                    file_content = f.read()
                    content_parts.append(file_content)
            except Exception as e:
                content_parts.append(f"# 读取失败: {e}")

    # 收集前端文件
    frontend_dir = code_dir / "frontend" / "src"
    if frontend_dir.exists():
        for js_file in sorted(frontend_dir.rglob("*")):
            if js_file.suffix in ['.js', '.jsx']:
                rel_path = js_file.relative_to(code_dir)
                content_parts.append(f"\n## {rel_path}\n")
                try:
                    with open(js_file, 'r', encoding='utf-8') as f:
                        file_content = f.read()
                        content_parts.append(file_content)
                except Exception as e:
                    content_parts.append(f"# 读取失败: {e}")

    return '\n'.join(content_parts)


def main():
    print("=" * 70)
    print("Testing Code Review Agent")
    print("=" * 70)

    # 1. 加载 Coding Agent 的输出作为输入
    input_path = project_root / "tests" / "output" / "coding_agent_result.json"

    if not input_path.exists():
        print(f"❌ 找不到输入文件: {input_path}")
        print("请先运行 test_coding_agent.py")
        return 1

    with open(input_path, 'r', encoding='utf-8') as f:
        input_state = json.load(f)

    print(f"\n📂 加载输入 State:")
    print(f"   - 项目名称: {input_state.get('project_name', 'N/A')}")
    print(f"   - 上一个 Agent: {input_state.get('current_agent', 'N/A')}")

    # 2. 检查生成的代码文件
    code_dir = project_root / "mock-monopoly"
    if not code_dir.exists():
        print(f"\n❌ 代码目录不存在: {code_dir}")
        print("请先运行 test_coding_agent.py 生成代码")
        return 1

    # 收集代码文件列表
    backend_files = list((code_dir / "backend" / "src").rglob("*.js")) if (code_dir / "backend" / "src").exists() else []
    frontend_files = list((code_dir / "frontend" / "src").rglob("*")) if (code_dir / "frontend" / "src").exists() else []

    print(f"\n📂 代码文件检查:")
    print(f"   - 后端文件: {len(backend_files)} 个")
    for f in sorted(backend_files)[:10]:
        print(f"      - {f.relative_to(code_dir)}")
    if len(backend_files) > 10:
        print(f"      ... 还有 {len(backend_files) - 10} 个文件")

    print(f"   - 前端文件: {len([f for f in frontend_files if f.suffix in ['.js', '.jsx']])} 个")
    for f in sorted([f for f in frontend_files if f.suffix in ['.js', '.jsx']])[:10]:
        print(f"      - {f.relative_to(code_dir)}")
    if len([f for f in frontend_files if f.suffix in ['.js', '.jsx']]) > 10:
        print(f"      ... 还有 {len([f for f in frontend_files if f.suffix in ['.js', '.jsx']]) - 10} 个文件")

    # 3. 收集代码内容
    print(f"\n📝 收集代码内容...")
    code_content = collect_code_content(code_dir)
    print(f"   - 代码内容: {len(code_content)} 字符")

    # 更新 input_state 的 code 字段
    input_state["code"] = {
        "content": code_content,
        "backend_files": [str(f.relative_to(code_dir)) for f in backend_files],
        "frontend_files": [str(f.relative_to(code_dir)) for f in frontend_files if f.suffix in ['.js', '.jsx']],
        "database_files": [],
    }

    # 4. 创建 LLM 实例
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
        print(f"❌ 未设置 OPENAI_API_KEY 环境变量")
        return 1

    # 检查是否启用自动修复
    auto_fix = os.environ.get("AUTO_FIX", "true").lower() == "true"

    print(f"\n🔑 API 配置:")
    print(f"   - API Base: {base_url}")
    print(f"   - Model: {model}")
    print(f"   - 自动修复: {'🚨 已启用' if auto_fix else '❌ 已禁用'}")

    llm = ChatOpenAI(
        model=model,
        api_key=api_key,
        base_url=base_url,
        temperature=0.2,  # 审查使用较低温度
        max_tokens=16000,
    )

    # 5. 创建 Code Review Agent (启用自动修复)
    review_agent = create_code_review_agent(llm, auto_fix=auto_fix)

    # 6. 执行 Agent
    print(f"\n{'='*70}")
    print("执行 Code Review Agent...")
    print(f"{'='*70}\n")

    try:
        result_state = review_agent(input_state)
    except Exception as e:
        print(f"\n❌ Code Review Agent 执行失败: {e}")
        import traceback
        traceback.print_exc()
        return 1

    # 7. 保存输出 State
    output_path = project_root / "tests" / "output" / "code_review_agent_result.json"
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
            elif k == "review":
                # 处理 review 字段
                if isinstance(v, dict):
                    output[k] = v
                else:
                    output[k] = {"raw": str(v)}
            else:
                output[k] = v
        json.dump(output, f, ensure_ascii=False, indent=2, default=str)

    print(f"\n✅ 输出 State 已保存到: {output_path}")

    # 8. 显示审查结果摘要
    review_data = result_state.get("review", {})
    if review_data and not review_data.get("error"):
        print(f"\n{'='*70}")
        print("代码审查结果:")
        print(f"{'='*70}")
        print(f"   - 总体评分: {review_data.get('overall_score', 'N/A')}")
        print(f"   - 阻塞问题: {len(review_data.get('blocking_issues', []))} 个")
        print(f"   - 重要问题: {len(review_data.get('important_issues', []))} 个")
        print(f"   - 小改进: {len(review_data.get('minor_improvements', []))} 个")

        if review_data.get("blocking_issues"):
            print(f"\n🔴 阻塞问题:")
            for issue in review_data["blocking_issues"][:5]:
                print(f"   - {issue.get('title', '未命名')}")
                if issue.get('location'):
                    print(f"     位置: {issue['location']}")
            if len(review_data["blocking_issues"]) > 5:
                print(f"   ... 还有 {len(review_data['blocking_issues']) - 5} 个问题")

        if review_data.get("important_issues"):
            print(f"\n🟡 重要问题:")
            for issue in review_data["important_issues"][:5]:
                print(f"   - {issue.get('title', '未命名')}")
            if len(review_data["important_issues"]) > 5:
                print(f"   ... 还有 {len(review_data['important_issues']) - 5} 个问题")

        # 保存审查报告到 workspace
        from core.file_manager import WorkspaceManager
        workspace = WorkspaceManager()
        report_content = review_data.get("content", "")
        if report_content:
            workspace.write_markdown("review", report_content)
            print(f"\n✅ 审查报告已保存到: workspace/review.md")

        # 显示灾后重建报告
        auto_fix_report = result_state.get("auto_fix_report")
        if auto_fix_report:
            print(f"\n{'='*70}")
            print("🚨 灾后重建报告:")
            print(f"{'='*70}")
            print(f"   - 总计修复: {auto_fix_report.get('total_fixes', 0)} 个")
            print(f"   - 已修复: {auto_fix_report.get('applied', 0)} 个 ✅")
            print(f"   - 失败: {auto_fix_report.get('failed', 0)} 个 ❌")
            print(f"   - 跳过: {auto_fix_report.get('skipped', 0)} 个 ⚠️")
            print(f"   - 成功率: {auto_fix_report.get('success_rate', 'N/A')}")

            if auto_fix_report.get("applied_details"):
                print(f"\n✅ 已修复的文件:")
                for detail in auto_fix_report["applied_details"]:
                    print(f"      - {detail['file_path']} (变更: {detail.get('change_ratio', 'N/A')})")

            if auto_fix_report.get("failed_details"):
                print(f"\n❌ 修复失败的文件:")
                for detail in auto_fix_report["failed_details"]:
                    print(f"      - {detail['file_path']}: {detail.get('reason', 'Unknown')}")

            # 保存修复报告到 workspace
            workspace.write_json("auto_fix_report", auto_fix_report)
            print(f"\n✅ 灾后重建报告已保存到: workspace/auto_fix_report.json")
    elif review_data.get("error"):
        print(f"\n❌ 审查失败: {review_data.get('error')}")

    # 9. 总结
    print(f"\n{'='*70}")
    print("Code Review Agent 测试完成")
    print(f"{'='*70}")

    return 0

if __name__ == "__main__":
    sys.exit(main())
