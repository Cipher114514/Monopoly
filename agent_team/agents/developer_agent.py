"""
Developer Agent - 开发者
职责：根据PRD生成代码
"""

import json
from langchain_core.messages import HumanMessage, AIMessage
from ..types import AgentState
from ..specs import CodeSpec, SpecValidator
from ..memory import SimpleMemory
from ..skills import SkillSet
from ..config import get_llm_singleton


def create_developer_agent(memory: SimpleMemory, skills: SkillSet):
    """
    创建 Developer Agent 函数

    Args:
        memory: 记忆系统实例
        skills: 技能集合实例

    Returns:
        Developer Agent 函数
    """

    def developer_agent(state: AgentState) -> AgentState:
        """
        Developer Agent - 使用 Spec、Skill 和 Memory
        """
        print("\n" + "=" * 70)
        print("💻 Developer Agent (使用 Spec + Skill + Memory)")
        print("=" * 70)

        # 1. 验证输入规范
        is_valid, message = SpecValidator.validate_prd(state)
        print(f"\n📋 规范验证: {message}")

        if not is_valid:
            state["validation_status"].append(f"Developer: {message}")
            state["current_agent"] = "Developer"
            return state

        # 2. 使用 Memory：获取产品名称等信息
        product_name = memory.get_long_term("product_name")
        print(f"\n📚 从记忆中获取: 产品名称 = {product_name}")

        # 3. 构建提示词（使用 Spec）
        prd_data = state["prd"]
        dev_prompt = f"""你是全栈开发工程师。

## 产品需求（PRD）
产品名称：{prd_data['product_name']}
功能列表：{', '.join(prd_data['features'])}
目标用户：{prd_data['target_users']}
验收标准：{', '.join(prd_data['success_criteria'])}

## 任务
生成可运行的 Python 代码，包含以下信息：
1. language: 编程语言（固定为 "python"）
2. code: 代码内容（必须包含 main 函数）
3. filename: 建议的文件名
4. dependencies: 依赖列表

## 重要
请直接输出纯 JSON 格式，不要使用 markdown 代码块包裹，不要添加任何其他文字。

示例格式：
{{"language": "python", "code": "...", "filename": "...", "dependencies": [...]}}
"""

        # 4. 调用 LLM（使用结构化输出）
        try:
            llm = get_llm_singleton()

            # 先获取原始响应
            response = llm.invoke([HumanMessage(content=dev_prompt)])
            response_text = response.content.strip()

            # 清理可能的 markdown 代码块标记
            if response_text.startswith("```"):
                lines = response_text.split('\n')
                if lines[0].startswith("```"):
                    lines = lines[1:]
                if lines[-1].startswith("```"):
                    lines = lines[:-1]
                response_text = '\n'.join(lines).strip()

            # 解析 JSON
            try:
                code_dict = json.loads(response_text)
            except json.JSONDecodeError as e:
                print(f"\n⚠️  JSON解析失败，尝试提取...")
                # 尝试找到第一个 { 和最后一个 }
                start = response_text.find('{')
                end = response_text.rfind('}') + 1
                if start != -1 and end > start:
                    json_text = response_text[start:end]
                    code_dict = json.loads(json_text)
                else:
                    raise ValueError(f"无法从响应中提取JSON: {e}")

            code_spec = CodeSpec(**code_dict)

            # 5. 验证代码规范
            if code_spec.validate():
                print(f"\n✅ 代码生成成功：")
                print(f"   语言：{code_spec.language}")
                print(f"   文件：{code_spec.filename}")
            else:
                print(f"\n⚠️  代码生成不符合规范")

            # 6. 使用 Skill：保存代码
            result = skills.execute(
                "write_file",
                filename=code_spec.filename,
                content=code_spec.to_markdown()
            )
            print(f"\n🛠️  技能执行: {result}")

            # 7. 使用 Skill：统计代码行数
            lines_result = skills.execute("count_lines", code=code_spec.code)
            print(f"{lines_result}")

            # 8. 保存到记忆
            memory.add_long_term("code_filename", code_spec.filename)
            memory.add_short_term(f"生成了代码: {code_spec.filename}", "Developer")

            # 9. 更新状态
            state["code"] = code_spec.model_dump()
            state["messages"].append(AIMessage(content=code_spec.to_markdown()))
            state["current_agent"] = "Developer"
            state["skill_results"].append(result)
            state["validation_status"].append("Developer: 代码验证通过")

            # 打印代码摘要
            print(f"\n{code_spec.to_markdown()}\n")

        except Exception as e:
            print(f"❌ 代码生成失败: {e}")
            state["code"] = {}
            state["validation_status"].append(f"Developer: 错误 - {e}")
            state["current_agent"] = "Developer"

        return state

    return developer_agent
