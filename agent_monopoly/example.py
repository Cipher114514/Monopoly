"""
Agent Monopoly - 使用示例

演示如何使用 Agent Monopoly 工作流系统
"""

from langchain_openai import ChatOpenAI
from agent_monopoly import create_workflow, WORKFLOW_DIAGRAM


def example_basic_usage():
    """
    基础使用示例 - 运行完整的9阶段工作流
    """
    print("\n" + "="*70)
    print("📚 示例1: 基础使用 - 运行完整工作流")
    print("="*70)

    # 1. 初始化 LLM
    print("\n🔧 步骤1: 初始化LLM...")
    llm = ChatOpenAI(
        model="gpt-4",
        temperature=0.7,
        api_key="your-api-key-here"  # 替换为你的API key
    )

    # 2. 创建工作流
    print("🔧 步骤2: 创建工作流...")
    workflow = create_workflow(llm)

    # 3. 运行工作流
    print("🔧 步骤3: 运行完整工作流...")
    result = workflow.run(
        project_name="在线大富翁游戏",
        user_requirement="""
        开发一个基于Web的多人在线大富翁游戏，要求：
        - 支持用户注册和登录
        - 可以创建游戏房间并邀请朋友
        - 支持2-6人实时对战
        - 实现完整的大富翁游戏规则（掷骰子、买地、收租等）
        - 响应式设计，完美支持桌面、平板和移动端
        - 流畅的动画和用户体验
        """,
        verbose=True  # 显示详细输出
    )

    # 4. 查看结果
    print("\n" + "="*70)
    print("📊 工作流执行结果")
    print("="*70)

    print("\n1️⃣ PRD (产品需求文档):")
    prd = result.get("prd", {})
    print(f"   - 项目: {prd.get('project_name', 'N/A')}")
    print(f"   - 功能数: {len(prd.get('features', []))}")

    print("\n2️⃣ 任务列表:")
    tasks = result.get("tasks", [])
    print(f"   - 总任务: {len(tasks)}")
    p0_tasks = [t for t in tasks if t.get('priority') == 'P0']
    print(f"   - P0任务: {len(p0_tasks)}")

    print("\n3️⃣ 架构设计:")
    arch = result.get("architecture", {})
    print(f"   - 技术栈: {', '.join(arch.get('tech_stack', [])[:5])}")

    print("\n4️⃣ 系统设计:")
    design = result.get("design", {})
    print(f"   - ADR记录: {len(design.get('adr_records', []))}")

    print("\n5️⃣ 生成的代码:")
    code = result.get("code", {})
    print(f"   - 后端文件: {len(code.get('backend_files', []))}")
    print(f"   - 前端文件: {len(code.get('frontend_files', []))}")

    print("\n6️⃣ 代码审查:")
    review = result.get("review", {})
    print(f"   - 评分: {review.get('overall_score', 'N/A')}")
    print(f"   - 阻塞问题: {len(review.get('blocking_issues', []))}")

    print("\n7️⃣ 测试报告:")
    test = result.get("test_results", {})
    print(f"   - Bug数量: {len(test.get('bugs', []))}")
    print(f"   - 覆盖率: {test.get('test_coverage', 'N/A')}")

    print("\n8️⃣ QA报告:")
    qa = result.get("qa_report", {})
    print(f"   - 评分: {qa.get('overall_score', 'N/A')}")
    print(f"   - 生产就绪: {qa.get('production_ready', 'N/A')}")

    print("\n9️⃣ 技术文档:")
    docs = result.get("documentation", {})
    print(f"   - 文档数: {len(docs.get('documents', []))}")
    print(f"   - 字数: {docs.get('word_count', 0)}")

    return result


def example_single_stage():
    """
    单阶段运行示例 - 只运行特定阶段
    """
    print("\n" + "="*70)
    print("📚 示例2: 单阶段运行 - 只运行架构设计")
    print("="*70)

    # 初始化
    llm = ChatOpenAI(
        model="gpt-4",
        temperature=0.7,
        api_key="your-api-key-here"
    )

    workflow = create_workflow(llm)

    # 准备状态（假设前面阶段已完成）
    state = {
        "messages": [],
        "current_agent": "",
        "iteration_count": 0,
        "prd": {
            "project_name": "在线大富翁游戏",
            "features": [
                "用户注册与登录",
                "创建游戏房间",
                "多人实时对战",
                "完整的游戏规则"
            ]
        },
        "tasks": [
            {"name": "用户系统", "priority": "P0"},
            {"name": "房间系统", "priority": "P0"},
            {"name": "游戏逻辑", "priority": "P1"}
        ],
        "architecture": {},  # 待生成
        "design": {},
        "code": {},
        "review": {},
        "test_results": {},
        "qa_report": {},
        "documentation": {},
        "memory_context": "",
        "skill_results": [],
        "validation_status": [],
        "project_name": "在线大富翁游戏",
        "user_requirement": "开发一个多人在线大富翁游戏",
    }

    print("\n🔧 只运行阶段3: 架构设计...")
    print(f"阶段名称: {workflow.get_stage_name(3)}")

    # 运行阶段3
    state = workflow.run_stage(3, state)

    # 查看结果
    print("\n📊 架构设计结果:")
    architecture = state.get("architecture", {})
    print(f"   - 技术栈: {', '.join(architecture.get('tech_stack', []))}")
    print(f"   - 数据表: {len(architecture.get('database_schema', []))}")
    print(f"   - API端点: {len(architecture.get('api_endpoints', []))}")

    return state


def example_custom_llm():
    """
    自定义LLM示例 - 使用不同的LLM提供商
    """
    print("\n" + "="*70)
    print("📚 示例3: 自定义LLM - 使用智谱AI")
    print("="*70)

    # 使用智谱AI
    from langchain_community.chat_models import ChatZhipuAI

    llm = ChatZhipuAI(
        model="chatglm-turbo",
        api_key="your-zhipu-api-key"  # 替换为你的智谱API key
    )

    print("\n🔧 使用智谱AI创建工作流...")
    workflow = create_workflow(llm)

    print("✅ 工作流创建成功！可以运行完整流程。")

    return workflow


def example_access_stage_outputs():
    """
    访问各阶段详细输出的示例
    """
    print("\n" + "="*70)
    print("📚 示例4: 访问各阶段详细输出")
    print("="*70)

    # 运行工作流
    llm = ChatOpenAI(
        model="gpt-4",
        temperature=0.7,
        api_key="your-api-key-here"
    )

    workflow = create_workflow(llm)

    result = workflow.run(
        project_name="在线大富翁游戏",
        user_requirement="开发一个多人在线大富翁游戏",
        verbose=False  # 关闭详细输出
    )

    # 访问PRD详细内容
    print("\n📄 PRD详细内容:")
    prd = result.get("prd", {})
    if "content" in prd:
        print(prd["content"][:500] + "...")  # 打印前500字符

    # 访问生成的代码
    print("\n💻 生成的代码:")
    code = result.get("code", {})
    if "content" in code:
        print(code["content"][:500] + "...")

    # 访问测试报告
    print("\n🧪 测试报告:")
    test = result.get("test_results", {})
    if "content" in test:
        print(test["content"][:500] + "...")

    return result


def main():
    """
    主函数 - 展示工作流程图和运行示例
    """
    print("\n" + "="*70)
    print("🎯 Agent Monopoly - 9阶段瀑布流智能体工作流")
    print("="*70)

    # 显示工作流程图
    print("\n📊 工作流程图:")
    print(WORKFLOW_DIAGRAM)

    # 选择要运行的示例
    print("\n" + "="*70)
    print("请选择要运行的示例:")
    print("1. 基础使用 - 运行完整工作流")
    print("2. 单阶段运行 - 只运行架构设计")
    print("3. 自定义LLM - 使用智谱AI")
    print("4. 访问详细输出 - 查看各阶段内容")
    print("0. 退出")
    print("="*70)

    choice = input("\n请输入选项 (0-4): ").strip()

    if choice == "1":
        example_basic_usage()
    elif choice == "2":
        example_single_stage()
    elif choice == "3":
        example_custom_llm()
    elif choice == "4":
        example_access_stage_outputs()
    elif choice == "0":
        print("\n👋 再见！")
    else:
        print("\n❌ 无效选项，请重新运行程序。")


if __name__ == "__main__":
    # 直接运行基础示例
    print("\n⚠️ 注意: 运行前请确保已配置有效的API Key")
    print("⚠️ 可以修改 example.py 中的 api_key 字段\n")

    # 取消注释以运行特定示例
    # example_basic_usage()
    # example_single_stage()
    # example_custom_llm()
    # example_access_stage_outputs()

    # 或运行交互式菜单
    # main()
