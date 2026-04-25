"""
需求组任务演示
展示Requirements Agent和UI Designer Agent的完整工作流程
"""

from agent_team.agents import create_requirements_agent, create_ui_designer_agent
from agent_team.memory import SimpleMemory
from agent_team.types import AgentState
from langchain_core.messages import HumanMessage


def demo_requirements_group():
    """演示需求组的完整工作流程"""

    print("=" * 80)
    print("🎯 需求组任务演示")
    print("=" * 80)

    # 初始化
    memory = SimpleMemory()
    req_agent = create_requirements_agent(memory)
    ui_agent = create_ui_designer_agent(memory)

    # 初始化状态
    initial_state = AgentState(
        messages=[HumanMessage(content='创建一个在线大富翁游戏，支持多人对战和实时互动')],
        current_agent='',
        memory_context='',
        prd={},
        code={},
        skill_results=[],
        validation_status=[],
        prd_text='',
        prd_data={},
        ui_text='',
        ui_data={}
    )

    print("\n📋 阶段1：需求分析 (Requirements Agent)")
    print("-" * 50)

    # 执行Requirements Agent
    state_after_req = req_agent(initial_state)

    print("\n📋 阶段2：UI设计 (UI Designer Agent)")
    print("-" * 50)

    # 执行UI Designer Agent
    final_state = ui_agent(state_after_req)

    print("\n🎉 需求组任务完成！")
    print("=" * 80)

    # 输出总结
    print("\n📊 任务完成总结：")
    print(f"✅ PRD文档生成：{len(final_state['prd_text'])} 字符")
    print(f"✅ 产品名称：{final_state['prd_data']['product_name']}")
    print(f"✅ 功能数量：{len(final_state['prd_data']['features'])} 个")
    print(f"✅ UI页面数量：{len(final_state['ui_data']['pages'])} 个")
    print(f"✅ UI组件数量：{len(final_state['ui_data']['components'])} 个")

    print("\n📝 记忆系统状态：")
    print(memory.summarize_context())

    return final_state


if __name__ == "__main__":
    demo_requirements_group()