"""
工作流统领文件
定义 Agent 协作流程，组装所有组件
"""

from langgraph.graph import StateGraph, END
from langchain_core.messages import HumanMessage

from .types import AgentState
from .memory import SimpleMemory
from .specs import SpecValidator
from .skills import SkillSet
from .agents import create_pm_agent, create_developer_agent


class AgentWorkflow:
    """Agent 工作流"""

    def __init__(self):
        """初始化工作流"""
        print("=" * 70)
        print("🚀 初始化 Agent 团队工作流")
        print("=" * 70)

        # 1. 初始化共享组件
        self.memory = SimpleMemory()
        self.skills = SkillSet()

        print("✅ 记忆系统初始化完成")
        print("✅ 技能系统初始化完成")

        # 2. 创建 Agent
        self.pm_agent = create_pm_agent(self.memory)
        self.developer_agent = create_developer_agent(self.memory, self.skills)

        print("✅ PM Agent 初始化完成")
        print("✅ Developer Agent 初始化完成\n")

        # 3. 构建流程图
        self.workflow = self._build_workflow()

        # 4. 编译流程
        self.app = self.workflow.compile()

        print("✅ 工作流构建完成\n")

    def _build_workflow(self) -> StateGraph:
        """构建工作流图"""
        print("📋 构建 Agent 协作流程...")

        # 创建流程图
        workflow = StateGraph(AgentState)

        # 添加节点（Agent）
        workflow.add_node("pm", self.pm_agent)
        workflow.add_node("developer", self.developer_agent)

        # 设置入口点
        workflow.set_entry_point("pm")

        # 添加条件边（根据路由决定下一步）
        workflow.add_conditional_edges(
            "pm",
            self._route_after_pm,
            {
                "developer": "developer",
                "end": END,
            }
        )

        workflow.add_conditional_edges(
            "developer",
            self._route_after_developer,
            {
                "end": END,
            }
        )

        return workflow

    def _route_after_pm(self, state: AgentState) -> str:
        """PM Agent 之后的路由决策"""
        # 验证 PRD 后再继续
        is_valid, _ = SpecValidator.validate_prd(state)
        if is_valid:
            print("➡️  流程: PM Agent → Developer Agent")
            return "developer"
        else:
            print("❌ PRD 验证失败，结束流程")
            return "end"

    def _route_after_developer(self, state: AgentState) -> str:
        """Developer Agent 之后的路由决策"""
        # 验证代码后结束
        is_valid, _ = SpecValidator.validate_code(state)
        if is_valid:
            print("➡️  流程: Developer Agent → 结束")
            return "end"
        else:
            print("⚠️  代码验证失败，可以返回重做（本示例直接结束）")
            return "end"

    def run(self, user_request: str) -> AgentState:
        """
        运行工作流

        Args:
            user_request: 用户需求

        Returns:
            最终状态
        """
        print("\n" + "=" * 70)
        print("📝 执行任务")
        print("=" * 70)
        print(user_request)
        print("\n" + "=" * 70)
        print("🎬 开始执行...")
        print("=" * 70)

        # 初始状态
        initial_state: AgentState = {
            "messages": [HumanMessage(content=user_request)],
            "current_agent": "",
            "memory_context": "",
            "prd": {},
            "code": {},
            "skill_results": [],
            "validation_status": [],
        }

        # 运行流程
        try:
            print("\n⏳ Agent 协作开始...\n")

            result = self.app.invoke(initial_state)

            print("\n" + "=" * 70)
            print("✅ 项目开发完成！")
            print("=" * 70)

            # 输出总结
            print("\n📊 执行总结:")
            print(f"  - 经过的Agent: PM → Developer")
            print(f"  - 总消息数: {len(result['messages'])}")
            print(f"  - 技能执行次数: {len(result['skill_results'])}")
            print(f"  - 验证状态: {result['validation_status']}")

            # 显示记忆内容
            print("\n📚 记忆系统内容:")
            print(f"  - 长期记忆条目: {len(self.memory.long_term)}")
            for key, value in self.memory.long_term.items():
                display_value = value[:50] + "..." if len(value) > 50 else value
                print(f"    • {key}: {display_value}")
            print(f"  - 短期记忆条目: {len(self.memory.short_term)}")

            if result.get("code"):
                print(f"\n💾 生成的文件:")
                print(f"  - output/{result['code'].get('filename', 'N/A')}")

            return result

        except Exception as e:
            print(f"\n❌ 执行出错: {e}")
            import traceback
            traceback.print_exc()
            return initial_state


def create_workflow() -> AgentWorkflow:
    """
    创建工作流实例（工厂函数）

    Returns:
        AgentWorkflow 实例
    """
    return AgentWorkflow()
