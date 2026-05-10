"""
Agent Workflow - 总领文件
定义完整的9阶段瀑布流工作流程

阶段流程:
1. PM Agent (产品经理) → 2. Requirements Agent (Sprint排序师)
→ 3. Architecture Agent (后端架构师) → 4. Design Agent (软件架构师)
→ 5. Coding Agent (高级开发者) → 6. Code Review Agent (代码审查员)
→ 7. Testing Agent (证据收集者) → 8. QA Agent (现实检验者)
→ 9. Documentation Agent (技术文档工程师)

v4增强:
- 完整迭代机制: Review/Testing/QA都能触发返工
- 最大迭代次数限制防止无限循环
- 增强的错误处理
- 状态持久化
- v4模块验证: 检查34个模块完整性
- v4前后端一致性检查
- v4代码解析增强: 支持多种代码块格式
"""

from langchain_core.runnables import RunnableLambda
from langgraph.graph import StateGraph, END
import os
import subprocess

from agent_state import AgentState
from core import (
    check_environment,
    save_workflow_state,
    load_workflow_state,
    AgentErrorHandler
)
from agents.pm_agent import create_pm_agent
from agents.requirements_agent import create_requirements_agent
from agents.architecture_agent import create_architecture_agent
from agents.design_agent import create_design_agent
from agents.coding_agent import create_coding_agent
from agents.code_review_agent import create_code_review_agent
from agents.testing_agent import create_testing_agent
from agents.qa_agent import create_qa_agent
from agents.documentation_agent import create_documentation_agent


# 迭代配置
MAX_ITERATIONS = 3  # 最大返工次数


class AgentWorkflow:
    """
    Agent工作流程管理器 v4

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

    v4迭代机制:
    - Code Review: 阻塞问题 > 0 → 返工到Coding
    - Testing: P0/P1 Bug → 返工到Coding
    - QA: revision_needed = YES → 返工到Coding
    """

    def __init__(self, llm, enable_checkpoint: bool = True, state_file: str = ".workflow_state.json"):
        """
        初始化工作流程

        Args:
            llm: 语言模型实例 (用于所有Agent)
            enable_checkpoint: 是否启用断点续传
            state_file: 状态文件路径
        """
        self.llm = llm
        self.enable_checkpoint = enable_checkpoint
        self.state_file = state_file

        # 初始化错误处理器
        self.error_handler = AgentErrorHandler()

        # 执行环境检查
        self.env_check = check_environment()

        # 创建所有Agent工厂函数
        self.pm_agent = create_pm_agent(llm)
        self.requirements_agent = create_requirements_agent(llm)
        self.architecture_agent = create_architecture_agent(llm)
        self.design_agent = create_design_agent(llm)
        self.coding_agent = create_coding_agent(llm)
        self.code_review_agent = create_code_review_agent(llm, auto_fix=True)
        self.testing_agent = create_testing_agent(llm)
        self.qa_agent = create_qa_agent(llm)
        self.documentation_agent = create_documentation_agent(llm)

        # 构建工作流图
        self.workflow = self._build_workflow()

        # 阶段名称映射
        self.stage_names = {
            1: "pm_agent",
            2: "requirements_agent",
            3: "architecture_agent",
            4: "design_agent",
            5: "coding_agent",
            6: "code_review_agent",
            7: "testing_agent",
            8: "qa_agent",
            9: "documentation_agent",
        }

    def _build_workflow(self):
        """
        构建StateGraph工作流 v4

        定义9个阶段的顺序执行流程 + 迭代返工机制
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

        # ========== v4迭代机制: Code Review → Testing 或 返工到 Coding ==========
        def should_rework_after_review(state: AgentState) -> str:
            """代码审查后判断是否需要返工"""
            review = state.get("review", {})
            iteration = state.get("iteration_count", 0)

            # 最多返工MAX_ITERATIONS次
            if iteration >= MAX_ITERATIONS:
                print(f"\n⚠️ 已达到最大返工次数({iteration}次)，继续到Testing")
                return "testing"

            # 检查是否有阻塞问题
            blocking_issues = review.get("blocking_issues", [])
            if isinstance(blocking_issues, list) and len(blocking_issues) > 0:
                print(f"\n🔧 Code Review发现 {len(blocking_issues)} 个阻塞问题，返工到Coding")
                state["iteration_count"] = iteration + 1
                state["rework_source"] = "code_review"
                state["rework_issues"] = blocking_issues
                return "rework_coding"

            # 检查评分
            score = review.get("overall_score", "")
            if score and score[0] in ["1", "2"]:  # 1/5 或 2/5
                print(f"\n🔧 Code Review评分过低({score})，返工到Coding")
                state["iteration_count"] = iteration + 1
                state["rework_source"] = "code_review"
                state["rework_issues"] = [{"reason": f"评分过低: {score}"}]
                return "rework_coding"

            # 继续到Testing
            return "testing"

        workflow.add_conditional_edges(
            "code_review_agent",
            should_rework_after_review,
            {
                "rework_coding": "coding_agent",  # 返工修复
                "testing": "testing_agent"         # 继续到Testing
            }
        )

        # ========== v4迭代机制: Testing → QA 或 返工到 Coding ==========
        def should_rework_after_testing(state: AgentState) -> str:
            """测试后判断是否需要返工"""
            test_results = state.get("test_results", {})
            bugs = test_results.get("bugs", [])
            iteration = state.get("iteration_count", 0)

            # 最多返工MAX_ITERATIONS次
            if iteration >= MAX_ITERATIONS:
                print(f"\n⚠️ 已达到最大返工次数({iteration}次)，继续到QA")
                return "qa"

            # 检查是否有P0或P1的严重Bug
            critical_bugs = [b for b in bugs if b.get("severity") in ["P0", "P1", "Critical"]]
            if critical_bugs:
                print(f"\n🔧 Testing发现 {len(critical_bugs)} 个严重Bug，返工到Coding")
                state["iteration_count"] = iteration + 1
                state["rework_source"] = "testing"
                state["rework_issues"] = critical_bugs
                return "rework_coding"

            # 继续到QA
            return "qa"

        workflow.add_conditional_edges(
            "testing_agent",
            should_rework_after_testing,
            {
                "rework_coding": "coding_agent",  # 返工修复
                "qa": "qa_agent"                  # 继续到QA
            }
        )

        # ========== v4迭代机制: QA → Documentation 或 返工到 Coding ==========
        def should_rework_after_qa(state: AgentState) -> str:
            """QA评估后判断是否需要返工"""
            qa_report = state.get("qa_report", {})
            iteration = state.get("iteration_count", 0)

            # 最多返工MAX_ITERATIONS次
            if iteration >= MAX_ITERATIONS:
                print(f"\n⚠️ 已达到最大返工次数({iteration}次)，继续到Documentation")
                return "documentation"

            # 检查是否需要修订
            revision_needed = qa_report.get("revision_needed", "")
            if "YES" in revision_needed or "需要" in revision_needed:
                # 检查生产就绪状态
                production_ready = qa_report.get("production_ready", "")
                if production_ready in ["NEEDS WORK", "FAILED", "UNKNOWN"]:
                    print(f"\n🔧 QA评估需要修订({revision_needed})，返工到Coding")
                    state["iteration_count"] = iteration + 1
                    state["rework_source"] = "qa"
                    state["rework_issues"] = qa_report.get("critical_issues", [])
                    return "rework_coding"

            # 检查评分
            score = qa_report.get("overall_score", "")
            if score in ["C", "D", "F"]:  # 低评分需要返工
                print(f"\n🔧 QA评分过低({score})，返工到Coding")
                state["iteration_count"] = iteration + 1
                state["rework_source"] = "qa"
                state["rework_issues"] = [{"reason": f"评分过低: {score}"}]
                return "rework_coding"

            # 继续到Documentation
            return "documentation"

        workflow.add_conditional_edges(
            "qa_agent",
            should_rework_after_qa,
            {
                "rework_coding": "coding_agent",  # 返工修复
                "documentation": "documentation_agent"  # 继续到Documentation
            }
        )

        # Documentation → END
        workflow.add_edge("documentation_agent", END)

        # 编译工作流
        return workflow.compile()

    def run(self, project_name: str, user_requirement: str, verbose: bool = True,
            resume: bool = False, start_stage: int = None):
        """
        运行完整的9阶段工作流 v4

        Args:
            project_name: 项目名称
            user_requirement: 用户需求描述
            verbose: 是否显示详细输出
            resume: 是否从断点恢复
            start_stage: 指定开始阶段（1-9）

        Returns:
            final_state: 最终状态，包含所有阶段的输出
        """
        if verbose:
            print("\n" + "="*70)
            print("🚀 启动 Agent Monopoly 工作流 v4")
            print("="*70)
            print(f"📋 项目名称: {project_name}")
            print(f"📝 用户需求: {user_requirement[:100]}...")
            if resume:
                print("🔄 断点续传模式: 已启用")
            print(f"🔁 最大迭代次数: {MAX_ITERATIONS}")
            print("="*70)

        # 初始化输出文件夹和 Git
        workspace_path = "mock-monopoly"
        if not os.path.exists(workspace_path):
            os.makedirs(workspace_path)

        try:
            if not os.path.exists(os.path.join(workspace_path, ".git")):
                subprocess.run(["git", "-C", workspace_path, "init"], check=True, capture_output=True)
                if verbose:
                    print(f"📁 已初始化工作目录: {workspace_path} (Git 已就绪)")
        except Exception:
            pass

        # 尝试恢复状态
        current_state = None
        current_stage = 1

        if resume or start_stage:
            saved = load_workflow_state(self.state_file)
            if saved:
                current_state = saved.get('state')
                saved_stage = saved.get('stage')
                if start_stage:
                    current_stage = start_stage
                else:
                    # 从下一个阶段继续
                    current_stage = self._get_next_stage(saved_stage)
                if verbose:
                    print(f"📂 从阶段 {current_stage} 恢复执行")
            elif start_stage:
                current_stage = start_stage
                if verbose:
                    print(f"📂 从指定阶段 {current_stage} 开始")

        # 初始状态
        if current_state is None:
            current_state = {
                "messages": [],
                "current_agent": "",
                "iteration_count": 0,
                "rework_source": None,
                "rework_issues": [],
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

        # 执行工作流（分阶段执行以支持断点续传）
        final_state = self._run_with_checkpoint(current_state, current_stage, verbose)

        # 清除状态文件
        if self.enable_checkpoint:
            try:
                os.remove(self.state_file)
            except:
                pass

        if verbose:
            print("\n" + "="*70)
            print("✅ 工作流执行完成！")
            print("="*70)
            self._print_summary(final_state)

            # 打印错误报告
            error_report = self.error_handler.get_report()
            if error_report['total_errors'] > 0:
                print(f"\n⚠️ 执行过程中发现 {error_report['total_errors']} 个错误")
                for agent, count in error_report['errors_by_agent'].items():
                    print(f"   - {agent}: {count} 个")

        return final_state

    def _run_with_checkpoint(self, state: dict, start_stage: int, verbose: bool) -> dict:
        """带断点续传的分阶段执行 v4 - 支持完整迭代循环"""
        current_state = state

        # 定义阶段执行顺序
        stages = [
            (1, "pm_agent", self.pm_agent, "PRD生成"),
            (2, "requirements_agent", self.requirements_agent, "任务规划"),
            (3, "architecture_agent", self.architecture_agent, "架构设计"),
            (4, "design_agent", self.design_agent, "系统设计"),
            (5, "coding_agent", self.coding_agent, "代码实现"),
            (6, "code_review_agent", self.code_review_agent, "代码审查"),
            (7, "testing_agent", self.testing_agent, "测试执行"),
            (8, "qa_agent", self.qa_agent, "质量评估"),
            (9, "documentation_agent", self.documentation_agent, "文档编写"),
        ]

        # 迭代循环状态
        iteration = current_state.get("iteration_count", 0)

        for stage_num, stage_name, agent_func, description in stages:
            # 跳过已完成的阶段
            if stage_num < start_stage:
                continue

            # 检查迭代状态
            if iteration > 0 and stage_num == 5:
                if verbose:
                    print(f"\n🔧 迭代循环 {iteration}/{MAX_ITERATIONS}...")
                    rework_source = current_state.get("rework_source", "unknown")
                    rework_issues = current_state.get("rework_issues", [])
                    print(f"   来源: {rework_source}")
                    print(f"   问题: {len(rework_issues)} 个")

            try:
                if verbose:
                    print(f"\n{'='*70}")
                    print(f"📍 阶段 {stage_num}/9: {description}")
                    print(f"{'='*70}")

                # 执行Agent
                current_state = agent_func(current_state)

                # 检查是否有错误
                if current_state.get(stage_name.replace("_agent", ""), {}).get("error"):
                    error_msg = current_state[stage_name.replace("_agent", "")].get("error")
                    raise Exception(f"Agent执行失败: {error_msg}")

                # 保存检查点
                if self.enable_checkpoint:
                    save_workflow_state(current_state, f"stage_{stage_num}", self.state_file)

                # ========== v4迭代判断逻辑 ==========
                iteration = current_state.get("iteration_count", 0)

                # Code Review后判断 (stage 6)
                if stage_num == 6:
                    if self._should_trigger_rework(current_state, "code_review") and iteration < MAX_ITERATIONS:
                        if verbose:
                            print(f"\n🔧 Code Review触发返工，回到Coding阶段...")
                        # 回退到coding阶段
                        start_stage = 5
                        iteration += 1
                        current_state["iteration_count"] = iteration
                        current_state["rework_source"] = "code_review"
                        # 重置循环以返回coding
                        break

                # Testing后判断 (stage 7)
                elif stage_num == 7:
                    if self._should_trigger_rework(current_state, "testing") and iteration < MAX_ITERATIONS:
                        if verbose:
                            print(f"\n🔧 Testing触发返工，回到Coding阶段...")
                        start_stage = 5
                        iteration += 1
                        current_state["iteration_count"] = iteration
                        current_state["rework_source"] = "testing"
                        break

                # QA后判断 (stage 8)
                elif stage_num == 8:
                    if self._should_trigger_rework(current_state, "qa") and iteration < MAX_ITERATIONS:
                        if verbose:
                            print(f"\n🔧 QA触发返工，回到Coding阶段...")
                        start_stage = 5
                        iteration += 1
                        current_state["iteration_count"] = iteration
                        current_state["rework_source"] = "qa"
                        break

            except Exception as e:
                # 错误处理
                recovery = self.error_handler.handle_agent_error(
                    stage_name, e, current_state, iteration
                )

                if verbose:
                    print(f"\n❌ 阶段 {stage_num} 出错: {e}")

                # 根据恢复策略决定是否继续
                if recovery.get('action') == 'retry' and recovery.get('max_retries', 0) > iteration:
                    iteration += 1
                    if verbose:
                        print(f"🔄 重试阶段 {stage_num}...")
                    start_stage = stage_num
                    return self._run_with_checkpoint(current_state, start_stage, verbose)
                elif not recovery.get('continue', True):
                    raise
                else:
                    current_state[stage_name.replace("_agent", "")] = {"error": str(e)}

        # 检查是否需要继续迭代（有start_stage重置）
        if start_stage <= 5 and iteration < MAX_ITERATIONS:
            # 继续循环
            return self._run_with_checkpoint(current_state, start_stage, verbose)

        return current_state

    def _should_trigger_rework(self, state: dict, source: str) -> bool:
        """判断是否应该触发返工"""
        if source == "code_review":
            review = state.get("review", {})
            blocking_issues = review.get("blocking_issues", [])
            if isinstance(blocking_issues, list) and len(blocking_issues) > 0:
                return True
            score = review.get("overall_score", "")
            if score and score[0] in ["1", "2"]:
                return True

        elif source == "testing":
            test_results = state.get("test_results", {})
            bugs = test_results.get("bugs", [])
            critical_bugs = [b for b in bugs if b.get("severity") in ["P0", "P1", "Critical"]]
            return len(critical_bugs) > 0

        elif source == "qa":
            qa_report = state.get("qa_report", {})
            revision_needed = qa_report.get("revision_needed", "")
            if "YES" in revision_needed or "需要" in revision_needed:
                production_ready = qa_report.get("production_ready", "")
                if production_ready in ["NEEDS WORK", "FAILED", "UNKNOWN"]:
                    return True
            score = qa_report.get("overall_score", "")
            if score in ["C", "D", "F"]:
                return True

        return False

    def _get_next_stage(self, current_stage: str) -> int:
        """获取下一个阶段编号"""
        stage_map = {
            "stage_1": 2, "stage_2": 3, "stage_3": 4, "stage_4": 5,
            "stage_5": 6, "stage_6": 7, "stage_7": 8, "stage_8": 9, "stage_9": 10
        }
        return stage_map.get(current_stage, 1)

    def _print_summary(self, final_state: dict):
        """
        打印工作流执行摘要

        Args:
            final_state: 最终状态
        """
        print("\n📊 工作流执行摘要:")
        print("-" * 70)

        # 迭代次数
        iteration_count = final_state.get("iteration_count", 0)
        if iteration_count > 0:
            print(f"🔁 迭代次数: {iteration_count}")
            rework_source = final_state.get("rework_source", "")
            if rework_source:
                print(f"   最后返工来源: {rework_source}")
            print()

        # 阶段1: PM Agent
        prd = final_state.get("prd", {})
        if prd and "error" not in prd:
            print("✅ 阶段1 - PM Agent (产品经理)")
            print(f"   - PRD生成: {prd.get('project_name', 'N/A')}")
            print(f"   - 核心功能: {len(prd.get('features', []))} 个")
            print()

        # 阶段2: Requirements Agent
        tasks = final_state.get("tasks", {})
        if tasks and not isinstance(tasks, list) and "error" not in tasks:
            print("✅ 阶段2 - Requirements Agent (Sprint排序师)")
            items_count = tasks.get('items_count', tasks.get('p0_count', 0) + tasks.get('p1_count', 0))
            print(f"   - 规划任务: {items_count} 个")
            print(f"   - P0任务: {tasks.get('p0_count', 0)} 个")
            print()
        elif tasks and isinstance(tasks, list) and len(tasks) > 0 and "error" not in tasks[0]:
            print("✅ 阶段2 - Requirements Agent (Sprint排序师)")
            print(f"   - 规划任务: {len(tasks)} 个")
            p0_count = sum(1 for t in tasks if isinstance(t, dict) and t.get('priority') == 'P0')
            print(f"   - P0任务: {p0_count} 个")
            print()

        # 阶段3: Architecture Agent
        architecture = final_state.get("architecture", {})
        if architecture and "error" not in architecture:
            print("✅ 阶段3 - Architecture Agent (后端架构师)")
            tables_count = architecture.get('tables_count', 0)
            api_count = architecture.get('api_count', 0)
            modules_count = len(architecture.get('modules', {}))
            print(f"   - 模块文件: {modules_count} 个")
            print(f"   - 数据表: {tables_count} 个")
            print(f"   - API端点: {api_count} 个")
            print()

        # 阶段4: Design Agent
        design = final_state.get("design", {})
        if design and "error" not in design:
            print("✅ 阶段4 - Design Agent (软件架构师)")
            adr_count = len(design.get('adr_records', []))
            modules_count = len(design.get('modules', []))
            print(f"   - ADR记录: {adr_count} 个")
            print(f"   - 模块: {modules_count} 个")
            print()

        # 阶段5: Coding Agent
        code = final_state.get("code", {})
        if code and "error" not in code:
            print("✅ 阶段5 - Coding Agent (高级开发者)")

            backend_files = code.get('backend_files', [])
            if isinstance(backend_files, int):
                backend_count = backend_files
            else:
                backend_count = len(backend_files) if backend_files else 0

            frontend_files = code.get('frontend_files', [])
            if isinstance(frontend_files, int):
                frontend_count = frontend_files
            else:
                frontend_count = len(frontend_files) if frontend_files else 0

            database_files = code.get('database_files', [])
            if isinstance(database_files, int):
                database_count = database_files
            else:
                database_count = len(database_files) if database_files else 0

            print(f"   - 后端文件: {backend_count} 个")
            print(f"   - 前端文件: {frontend_count} 个")
            print(f"   - 数据库文件: {database_count} 个")
            print()

        # 阶段6: Code Review Agent
        review = final_state.get("review", {})
        if review and "error" not in review:
            print("✅ 阶段6 - Code Review Agent (代码审查员)")
            print(f"   - 总体评分: {review.get('overall_score', 'N/A')}")
            blocking_count = len(review.get('blocking_issues', [])) if isinstance(review.get('blocking_issues'), list) else 0
            important_count = len(review.get('important_issues', [])) if isinstance(review.get('important_issues'), list) else 0
            print(f"   - 阻塞问题: {blocking_count} 个")
            print(f"   - 重要问题: {important_count} 个")
            print()

        # 阶段7: Testing Agent
        test_results = final_state.get("test_results", {})
        if test_results and "error" not in test_results:
            print("✅ 阶段7 - Testing Agent (证据收集者)")
            bugs_count = len(test_results.get('bugs', [])) if isinstance(test_results.get('bugs'), list) else 0
            print(f"   - 发现Bug: {bugs_count} 个")
            print(f"   - 测试覆盖: {test_results.get('test_coverage', 'N/A')}")
            print(f"   - 质量评分: {test_results.get('quality_score', 'N/A')}")
            print()

        # 阶段8: QA Agent
        qa_report = final_state.get("qa_report", {})
        if qa_report and "error" not in qa_report:
            print("✅ 阶段8 - QA Agent (现实检验者)")
            print(f"   - 质量评分: {qa_report.get('overall_score', 'N/A')}")
            print(f"   - 生产就绪: {qa_report.get('production_ready', 'N/A')}")
            critical_count = len(qa_report.get('critical_issues', [])) if isinstance(qa_report.get('critical_issues'), list) else 0
            print(f"   - 关键问题: {critical_count} 个")
            print(f"   - 需要修订: {qa_report.get('revision_needed', 'N/A')}")
            print()

        # 阶段9: Documentation Agent
        documentation = final_state.get("documentation", {})
        if documentation and "error" not in documentation:
            print("✅ 阶段9 - Documentation Agent (技术文档工程师)")
            docs_count = len(documentation.get('documents', [])) if isinstance(documentation.get('documents'), list) else 0
            print(f"   - 文档数量: {docs_count} 个")
            print(f"   - 字数统计: {documentation.get('word_count', 0)} 字")
            if isinstance(documentation.get('documents'), list):
                docs_list = ', '.join(documentation.get('documents', []))
                print(f"   - 包含文档: {docs_list}")
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


# 工作流程图示 v4
WORKFLOW_DIAGRAM = """
┌─────────────────────────────────────────────────────────────────┐
│              9阶段瀑布流工作流程 v4 (带迭代机制)                  │
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
  │ 阶段5:       │ ←─────────────────────────────────────┐
  │ 高级开发者   │                                          │
  └──────┬───────┘                                          │
         │                                                  │
         ↓                                                  │
  ┌──────────────┐                                   🔁 迭代
  │ 阶段6:       │ ──阻塞问题?────────── YES ──────────────────┤
  │ 代码审查员   │                                          │
  └──────┬───────┘    NO (继续)                              │
         │                                                  │
         ↓                                                  │
  ┌──────────────┐                                   🔁 迭代
  │ 阶段7:       │ ──P0/P1 Bug?───────── YES ──────────────────┤
  │ 证据收集者   │                                          │
  └──────┬───────┘    NO (继续)                              │
         │                                                  │
         ↓                                                  │
  ┌──────────────┐                                   🔁 迭代
  │ 阶段8:       │ ──需要修订?────────── YES ──────────────────┤
  │ 现实检验者   │                                          │
  └──────┬───────┘    NO (继续)                              │
         │                                                  │
         ↓                                                  │
  ┌──────────────┐                                          │
  │ 阶段9:       │ → 技术文档编写                             │
  │技术文档工程师│                                          │
  └──────────────┘                                          │
         │                                                  │
         ↓                                                  │
   [项目交付] ──────────────────────────────────────────────┘

最大迭代次数: 3次
返工触发条件:
  - Code Review: 阻塞问题 > 0 或 评分 ≤ 2/5
  - Testing: P0/P1/Critical Bug > 0
  - QA: 需要修订 或 评分 ≤ C
"""
