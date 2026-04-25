"""
Testing Agent 集成测试脚本
支持大规模代码测试，分批处理、并行执行
"""

import sys
import os
import io
import argparse
from pathlib import Path

# 设置UTF-8输出
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# 添加路径
sys.path.insert(0, str(Path(__file__).parent))

from dotenv import load_dotenv
from langchain_openai import ChatOpenAI

# 加载环境变量
env_path = Path(__file__).parent / "agent-monopoly" / ".env"
load_dotenv(env_path)

# 导入Testing Agent
import importlib.util
spec = importlib.util.spec_from_file_location(
    "testing_agent",
    "agent-monopoly/agents/testing_agent.py"
)
testing_module = importlib.util.module_from_spec(spec)
sys.modules['testing_agent'] = testing_module
spec.loader.exec_module(testing_module)
create_testing_agent = testing_module.create_testing_agent


def main():
    """主函数：启动Testing Agent测试"""
    parser = argparse.ArgumentParser(description='Testing Agent - 大规模代码测试')
    parser.add_argument('--path', default='mock-monopoly/backend/src', help='测试源代码路径')
    parser.add_argument('--batch-size', type=int, default=10, help='每批处理的文件数量')
    parser.add_argument('--parallel', type=int, default=3, help='并行批处理数量')
    parser.add_argument('--include', nargs='*', help='只测试包含这些模式的文件')
    parser.add_argument('--exclude', nargs='*', help='排除包含这些模式的文件')
    parser.add_argument('--keep-workspace', action='store_true', help='保留工作空间用于调试')
    parser.add_argument('--model', default='glm-4-flash', help='LLM模型名称')

    args = parser.parse_args()

    print("\n" + "="*70)
    print("🧪 Testing Agent - 大规模代码测试")
    print("="*70)
    print(f"配置:")
    print(f"  源代码路径: {args.path}")
    print(f"  批处理大小: {args.batch_size}")
    print(f"  并行数量: {args.parallel}")
    if args.include:
        print(f"  包含模式: {args.include}")
    if args.exclude:
        print(f"  排除模式: {args.exclude}")

    # 创建LLM
    llm = ChatOpenAI(
        model=args.model,
        openai_api_key=os.getenv("ZHIPUAI_API_KEY"),
        openai_api_base="https://open.bigmodel.cn/api/paas/v4/",
        temperature=0.1
    )

    # 创建Testing Agent
    testing_agent = create_testing_agent(
        llm,
        test_source_path=args.path,
        batch_size=args.batch_size,
        max_parallel=args.parallel,
        include_patterns=args.include,
        exclude_patterns=args.exclude,
        keep_workspace=args.keep_workspace
    )

    # 准备测试状态
    test_state = {
        "project_name": "在线大富翁游戏",
        "user_requirement": "实现一个大富翁游戏，支持多人在线对战",
        "messages": [],
        "current_agent": "",
        "iteration_count": 0,
        "code": {}
    }

    # 执行测试
    print("\n⚡ 启动Testing Agent...\n")
    result_state = testing_agent(test_state)

    # 显示结果
    print("\n" + "="*70)
    print("📊 测试完成")
    print("="*70)

    test_results = result_state.get("test_results", {})

    print(f"\n📋 最终结果:")
    print(f"   - 通过: {test_results.get('passed', 0)} 个")
    print(f"   - 失败: {test_results.get('failed', 0)} 个")
    print(f"   - 跳过: {test_results.get('skipped', 0)} 个")
    print(f"   - 摘要: {test_results.get('summary', 'N/A')}")

    # 如果有执行错误，显示
    if 'error' in test_results:
        print(f"\n⚠️ 执行错误:")
        print(f"   {test_results['error']}")

    return result_state


if __name__ == "__main__":
    try:
        main()
        print("\n✅ 测试成功完成！")
    except KeyboardInterrupt:
        print("\n\n⚠️ 测试被中断")
    except Exception as e:
        print(f"\n❌ 测试失败: {e}")
        import traceback
        traceback.print_exc()
