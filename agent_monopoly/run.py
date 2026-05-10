"""
Agent Monopoly - 主运行脚本
用于运行9阶段Agent工作流，生成完整的在线大富翁游戏项目

使用方法:
    python run.py              # 运行完整工作流
    python run.py --resume     # 从断点恢复
    python run.py --stage 5    # 从指定阶段开始
"""

import os
import sys
import argparse
from pathlib import Path
from dotenv import load_dotenv

# 设置标准输出编码为UTF-8（解决Windows控制台编码问题）
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# 加载.env文件
load_dotenv()

# 添加项目根目录到Python路径
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))
sys.path.insert(0, str(project_root / "core"))
sys.path.insert(0, str(project_root / "config"))
sys.path.insert(0, str(project_root / "agents"))


def setup_llm():
    """
    配置LLM

    支持多种LLM提供商:
    - OpenAI (GPT-4, GPT-3.5)
    - 智谱AI (GLM-4) - 使用OpenAI兼容API
    - xAI (Grok)
    - 其他OpenAI兼容API
    """
    # 检查环境变量
    api_key = os.getenv("OPENAI_API_KEY")

    if not api_key:
        print("❌ 未检测到 OPENAI_API_KEY")
        print("   请设置 OPENAI_API_KEY 环境变量")
        print("   或在 .env 文件中配置")
        return None

    # 尝试导入LangChain OpenAI
    try:
        from langchain_openai import ChatOpenAI
    except ImportError:
        print("❌ 缺少依赖，请运行: pip install langchain-openai")
        return None

    # 使用OpenAI兼容接口（支持OpenAI、智谱AI、xAI等）
    api_base = os.getenv("OPENAI_API_BASE")

    # 根据API_BASE自动选择默认模型
    if api_base:
        if "bigmodel" in api_base:
            model_name = os.getenv("OPENAI_MODEL", "glm-4-plus")
            provider = "智谱AI"
        elif "grok" in api_base or "xAI" in api_base:
            model_name = os.getenv("OPENAI_MODEL", "grok-2-1212")
            provider = "xAI Grok"
        else:
            model_name = os.getenv("OPENAI_MODEL", "gpt-4o")
            provider = "OpenAI兼容API"
    else:
        model_name = os.getenv("OPENAI_MODEL", "gpt-4o")
        provider = "OpenAI"

    llm_kwargs = {
        "model": model_name,
        "temperature": 0.7,
        "max_tokens": 8192,
        "api_key": api_key
    }

    # 如果设置了API_BASE，添加到参数中
    if api_base:
        llm_kwargs["base_url"] = api_base

    try:
        llm = ChatOpenAI(**llm_kwargs)
        print(f"✅ 使用 {provider}: {model_name}")
        if api_base:
            print(f"   API地址: {api_base}")
        return llm
    except Exception as e:
        print(f"❌ LLM初始化失败: {e}")
        return None


def main():
    """主函数"""
    parser = argparse.ArgumentParser(description="运行Agent Monopoly工作流")
    parser.add_argument("--resume", action="store_true", help="从断点恢复")
    parser.add_argument("--stage", type=int, choices=range(1, 10), help="从指定阶段开始(1-9)")
    parser.add_argument("--project", default="在线大富翁游戏", help="项目名称")
    parser.add_argument("--verbose", action="store_true", default=True, help="显示详细输出")

    args = parser.parse_args()

    # 打印欢迎信息
    print("\n" + "="*70)
    print("🎮 Agent Monopoly - 9阶段Agent工作流")
    print("="*70)

    # 用户需求
    user_requirement = """
    开发一个在线大富翁游戏，支持2-6人实时对战。
    核心功能包括：用户注册登录、创建房间、掷骰子移动、购买地产、
    建设房屋、收取过路费、机会命运卡牌、破产判定等。
    技术要求：使用React+Node.js+Socket.io实现，服务端权威架构。
    """

    # 配置LLM
    llm = setup_llm()
    if not llm:
        print("\n❌ 无法配置LLM，退出程序")
        return 1

    # 导入并运行工作流
    try:
        from workflow import AgentWorkflow

        workflow = AgentWorkflow(llm)

        # 运行工作流
        final_state = workflow.run(
            project_name=args.project,
            user_requirement=user_requirement,
            verbose=args.verbose,
            resume=args.resume,
            start_stage=args.stage
        )

        # 打印最终状态
        print("\n" + "="*70)
        print("📊 最终状态摘要")
        print("="*70)

        stage_keys = ["prd", "tasks", "architecture", "design",
                     "code", "review", "test_results", "qa_report", "documentation"]

        for stage_num, key in enumerate(stage_keys, 1):
            data = final_state.get(key, {})

            if data and "error" not in data:
                print(f"✅ 阶段{stage_num}: 完成")
            elif data and "error" in data:
                print(f"❌ 阶段{stage_num}: 错误 - {data.get('error')}")
            else:
                print(f"⚠️ 阶段{stage_num}: 未执行")

        print("\n🎉 工作流执行完成！")
        print(f"📁 输出目录: mock-monopoly/")
        print("="*70 + "\n")

        return 0

    except Exception as e:
        print(f"\n❌ 执行失败: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())
