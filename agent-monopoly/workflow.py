"""
Agent Workflow - 总领文件
定义完整的9阶段瀑布流工作流程

阶段流程:
1. PM Agent (产品经理) → 2. Requirements Agent (Sprint排序师)
→ 3. Architecture Agent (后端架构师) → 4. Design Agent (软件架构师)
→ 5. Coding Agent (高级开发者) → 6. Code Review Agent (代码审查员)
→ 7. Testing Agent (证据收集者) → 8. QA Agent (现实检验者)
→ 9. Documentation Agent (技术文档工程师)
"""

from langchain_core.runnables import RunnableLambda
from langgraph.graph import StateGraph, END

from .types import AgentState
from .agents.pm_agent import create_pm_agent
from .agents.requirements_agent import create_requirements_agent
from .agents.architecture_agent import create_architecture_agent
from .agents.design_agent import create_design_agent
from .agents.coding_agent import create_coding_agent
from .agents.code_review_agent import create_code_review_agent
from .agents.testing_agent import create_testing_agent
from .agents.qa_agent import create_qa_agent
from .agents.documentation_agent import create_documentation_agent


class AgentWorkflow:
    """
    Agent工作流程管理器

    管理9个阶段的瀑布流开发流程:
    - 阶段1: PM Agent - 需求分析和PRD生成
    - 阶段2: Requirements Agent - 任务分解和Sprint规划
    - 阶段3: Architecture Agent - 后端架构设计
    - 阶段4: Design Agent - 系统设计和软件架构
    - 阶段5: Coding Agent - 代码实现
    - 阶段6: Code Review Agent - 代码审查
    - 阶段7: Testing Agent - 测试执行与证据收集
    - 阶段8: QA Agent - 质量保证与集成测试
    - 阶段9: Documentation Agent - 技术文档编写
    """

    def __init__(self, llm):
        """
        初始化工作流程

        Args:
            llm: 语言模型实例 (用于所有Agent)
        """
        self.llm = llm

        # 创建所有Agent工厂函数
        self.pm_agent = create_pm_agent(llm)
        self.requirements_agent = create_requirements_agent(llm)
        self.architecture_agent = create_architecture_agent(llm)
        self.design_agent = create_design_agent(llm)
        self.coding_agent = create_coding_agent(llm)
        self.code_review_agent = create_code_review_agent(llm)
        self.testing_agent = create_testing_agent(llm)
        self.qa_agent = create_qa_agent(llm)
        self.documentation_agent = create_documentation_agent(llm)

        # 构建工作流图
        self.workflow = self._build_workflow()

    def _build_workflow(self):
        """
        构建StateGraph工作流

        定义9个阶段的顺序执行流程
        """
        # 创建状态图
        workflow = StateGraph(AgentState)

        # 添加所有节点 (9个Agent)
        workflow.add_node("pm_agent", self.pm_agent)
        workflow.add_node("requirements_agent", self.requirements_agent)
        workflow.add_node("architecture_agent", self.architecture_agent)
        workflow.add_node("design_agent", self.design_agent)
        workflow.add_node("coding_agent", self.coding_agent)
        workflow.add_node("code_review_agent", self.code_review_agent)
        workflow.add_node("testing_agent", self.testing_agent)
        workflow.add_node("qa_agent", self.qa_agent)
        workflow.add_node("documentation_agent", self.documentation_agent)

        # 定义工作流入口
        workflow.set_entry_point("pm_agent")

        # 定义工作流边 (9阶段瀑布流)
        # PM → Requirements
        workflow.add_edge("pm_agent", "requirements_agent")

        # Requirements → Architecture
        workflow.add_edge("requirements_agent", "architecture_agent")

        # Architecture → Design
        workflow.add_edge("architecture_agent", "design_agent")

        # Design → Coding
        workflow.add_edge("design_agent", "coding_agent")

        # Coding → Code Review
        workflow.add_edge("coding_agent", "code_review_agent")

        # Code Review → Testing
        workflow.add_edge("code_review_agent", "testing_agent")

        # Testing → QA 或 返工到 Coding
        # 如果发现P0/P1 Bug，返回Coding Agent修复
        def should_rework(state: AgentState) -> str:
            """判断是否需要返工修复Bug"""
            test_results = state.get("test_results", {})
            bugs = test_results.get("bugs", [])
            iteration = state.get("iteration_count", 0)

            # 最多返工3次，防止无限循环
            if iteration >= 3:
                print(f"\n⚠️ 已达到最大返工次数({iteration}次)，强制继续到QA")
                return "qa"

            # 检查是否有P0或P1的严重Bug
            for bug in bugs:
                if bug.get("severity") in ["P0", "P1"]:
                    print(f"\n🔧 发现严重Bug，返工到Coding Agent: {bug['id']}")
                    state["iteration_count"] = iteration + 1
                    return "rework_coding"

            # 没有严重Bug，继续到QA
            return "qa"

        workflow.add_conditional_edges(
            "testing_agent",
            should_rework,
            {
                "rework_coding": "coding_agent",  # 返工修复
                "qa": "qa_agent"                  # 继续到QA
            }
        )

        # QA → Documentation
        workflow.add_edge("qa_agent", "documentation_agent")

        # Documentation → END
        workflow.add_edge("documentation_agent", END)

        # 编译工作流
        return workflow.compile()

    def run(self, project_name: str, user_requirement: str, verbose: bool = True):
        """
        运行完整的9阶段工作流

        Args:
            project_name: 项目名称
            user_requirement: 用户需求描述
            verbose: 是否显示详细输出

        Returns:
            final_state: 最终状态，包含所有阶段的输出
        """
        if verbose:
            print("\n" + "="*70)
            print("🚀 启动 Agent Monopoly 工作流")
            print("="*70)
            print(f"📋 项目名称: {project_name}")
            print(f"📝 用户需求: {user_requirement[:100]}...")
            print("="*70)

        # 初始状态
        initial_state = {
            "messages": [],
            "current_agent": "",
            "iteration_count": 0,
            "prd": {},
            "tasks": [],
            "architecture": {},
            "design": {},
            "code": {},
            "review": {},
            "test_results": {},
            "qa_report": {},
            "documentation": {},
            "memory_context": "",
            "skill_results": [],
            "validation_status": [],
            "project_name": project_name,
            "user_requirement": user_requirement,
        }

        if verbose:
            print("\n🔄 开始执行9阶段瀑布流...\n")

        # 执行工作流
        final_state = self.workflow.invoke(initial_state)

        if verbose:
            print("\n" + "="*70)
            print("✅ 工作流执行完成！")
            print("="*70)
            self._print_summary(final_state)

        return final_state

    def _print_summary(self, final_state: dict):
        """
        打印工作流执行摘要

        Args:
            final_state: 最终状态
        """
        print("\n📊 工作流执行摘要:")
        print("-" * 70)

        # 阶段1: PM Agent
        prd = final_state.get("prd", {})
        if prd and "error" not in prd:
            print("✅ 阶段1 - PM Agent (产品经理)")
            print(f"   - PRD生成: {prd.get('project_name', 'N/A')}")
            print(f"   - 核心功能: {len(prd.get('features', []))} 个")
            print()

        # 阶段2: Requirements Agent
        tasks = final_state.get("tasks", [])
        if tasks and "error" not in tasks[0]:
            print("✅ 阶段2 - Requirements Agent (Sprint排序师)")
            print(f"   - 规划任务: {len(tasks)} 个")
            p0_count = sum(1 for t in tasks if t.get('priority') == 'P0')
            print(f"   - P0任务: {p0_count} 个")
            print()

        # 阶段3: Architecture Agent
        architecture = final_state.get("architecture", {})
        if architecture and "error" not in architecture:
            print("✅ 阶段3 - Architecture Agent (后端架构师)")
            print(f"   - 技术栈: {len(architecture.get('tech_stack', []))} 项")
            print(f"   - 数据表: {len(architecture.get('database_schema', []))} 个")
            print(f"   - API端点: {len(architecture.get('api_endpoints', []))} 个")
            print()

        # 阶段4: Design Agent
        design = final_state.get("design", {})
        if design and "error" not in design:
            print("✅ 阶段4 - Design Agent (软件架构师)")
            print(f"   - ADR记录: {len(design.get('adr_records', []))} 个")
            print(f"   - 模块: {len(design.get('modules', []))} 个")
            print()

        # 阶段5: Coding Agent
        code = final_state.get("code", {})
        if code and "error" not in code:
            print("✅ 阶段5 - Coding Agent (高级开发者)")
            print(f"   - 后端文件: {len(code.get('backend_files', []))} 个")
            print(f"   - 前端文件: {len(code.get('frontend_files', []))} 个")
            print(f"   - 数据库文件: {len(code.get('database_files', []))} 个")
            print()

        # 阶段6: Code Review Agent
        review = final_state.get("review", {})
        if review and "error" not in review:
            print("✅ 阶段6 - Code Review Agent (代码审查员)")
            print(f"   - 总体评分: {review.get('overall_score', 'N/A')}")
            print(f"   - 阻塞问题: {len(review.get('blocking_issues', []))} 个")
            print(f"   - 重要问题: {len(review.get('important_issues', []))} 个")
            print()

        # 阶段7: Testing Agent
        test_results = final_state.get("test_results", {})
        if test_results and "error" not in test_results:
            print("✅ 阶段7 - Testing Agent (证据收集者)")
            print(f"   - 发现Bug: {len(test_results.get('bugs', []))} 个")
            print(f"   - 测试覆盖: {test_results.get('test_coverage', 'N/A')}")
            print(f"   - 质量评分: {test_results.get('quality_score', 'N/A')}")
            print()

        # 阶段8: QA Agent
        qa_report = final_state.get("qa_report", {})
        if qa_report and "error" not in qa_report:
            print("✅ 阶段8 - QA Agent (现实检验者)")
            print(f"   - 质量评分: {qa_report.get('overall_score', 'N/A')}")
            print(f"   - 生产就绪: {qa_report.get('production_ready', 'N/A')}")
            print(f"   - 关键问题: {len(qa_report.get('critical_issues', []))} 个")
            print(f"   - 需要修订: {qa_report.get('revision_needed', 'N/A')}")
            print()

        # 阶段9: Documentation Agent
        documentation = final_state.get("documentation", {})
        if documentation and "error" not in documentation:
            print("✅ 阶段9 - Documentation Agent (技术文档工程师)")
            print(f"   - 文档数量: {len(documentation.get('documents', []))} 个")
            print(f"   - 字数统计: {documentation.get('word_count', 0)} 字")
            print(f"   - 包含文档: {', '.join(documentation.get('documents', []))}")
            print()

        print("="*70)
        print("🎉 所有阶段已完成！")

    def run_stage(self, stage: int, state: dict):
        """
        运行单个阶段

        Args:
            stage: 阶段编号 (1-9)
            state: 当前状态

        Returns:
            updated_state: 更新后的状态
        """
        stage_agents = {
            1: self.pm_agent,
            2: self.requirements_agent,
            3: self.architecture_agent,
            4: self.design_agent,
            5: self.coding_agent,
            6: self.code_review_agent,
            7: self.testing_agent,
            8: self.qa_agent,
            9: self.documentation_agent,
        }

        if stage not in stage_agents:
            raise ValueError(f"Invalid stage: {stage}. Must be 1-9.")

        agent = stage_agents[stage]
        return agent(state)

    def get_stage_name(self, stage: int) -> str:
        """
        获取阶段名称

        Args:
            stage: 阶段编号 (1-9)

        Returns:
            stage_name: 阶段名称
        """
        stage_names = {
            1: "PM Agent - 产品经理",
            2: "Requirements Agent - Sprint排序师",
            3: "Architecture Agent - 后端架构师",
            4: "Design Agent - 软件架构师",
            5: "Coding Agent - 高级开发者",
            6: "Code Review Agent - 代码审查员",
            7: "Testing Agent - 证据收集者",
            8: "QA Agent - 现实检验者",
            9: "Documentation Agent - 技术文档工程师",
        }

        return stage_names.get(stage, "Unknown Stage")


def create_workflow(llm):
    """
    创建工作流实例的工厂函数

    Args:
        llm: 语言模型实例

    Returns:
        workflow: AgentWorkflow 实例
    """
    return AgentWorkflow(llm)


# 工作流程图示
WORKFLOW_DIAGRAM = """
┌─────────────────────────────────────────────────────────────────┐
│                    9阶段瀑布流工作流程                            │
└─────────────────────────────────────────────────────────────────┘

  ┌──────────────┐
  │ 阶段1: PM    │ → 需求分析 & PRD生成
  │    产品经理   │
  └──────┬───────┘
         │
         ↓
  ┌──────────────┐
  │ 阶段2:       │ → 任务分解 & Sprint规划
  │ Sprint排序师 │
  └──────┬───────┘
         │
         ↓
  ┌──────────────┐
  │ 阶段3:       │ → 后端架构设计
  │ 后端架构师   │
  └──────┬───────┘
         │
         ↓
  ┌──────────────┐
  │ 阶段4:       │ → 系统设计 & 软件架构
  │ 软件架构师   │
  └──────┬───────┘
         │
         ↓
  ┌──────────────┐
  │ 阶段5:       │ → 代码实现
  │ 高级开发者   │
  └──────┬───────┘
         │
         ↓
  ┌──────────────┐
  │ 阶段6:       │ → 代码审查
  │ 代码审查员   │
  └──────┬───────┘
         │
         ↓
  ┌──────────────┐
  │ 阶段7:       │ → 测试 & 证据收集
  │ 证据收集者   │
  └──────┬───────┘
         │
         ↓
  ┌──────────────┐
  │ 阶段8:       │ → 质量保证 & 集成测试
  │ 现实检验者   │
  └──────┬───────┘
         │
         ↓
  ┌──────────────┐
  │ 阶段9:       │ → 技术文档编写
  │技术文档工程师│
  └──────────────┘

        ↓
   [项目交付]
"""
