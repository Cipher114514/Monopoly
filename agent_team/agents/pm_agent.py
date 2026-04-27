"""
PM Agent - 产品经理
职责：理解需求，生成产品需求文档
"""

import json
from langchain_core.messages import HumanMessage, AIMessage
from ..types import AgentState
from ..specs import PRDSpec
from ..memory import SimpleMemory
from ..config import get_llm_singleton


def create_pm_agent(memory: SimpleMemory):
    """
    创建 PM Agent 函数

    Args:
        memory: 记忆系统实例

    Returns:
        PM Agent 函数
    """

    def pm_agent(state: AgentState) -> AgentState:
        """
        PM Agent - 使用 Memory 和 Spec
        """
        print("\n" + "=" * 70)
        print("🤖 PM Agent (使用 Memory + Spec)")
        print("=" * 70)

        # 1. 使用 Memory：获取上下文
        context = memory.summarize_context()
        print(f"\n📚 记忆上下文：\n{context}")

        # 2. 构建带记忆的提示词
        user_request = state["messages"][-1].content

        pm_prompt = f"""你是资深产品经理。

## 上下文记忆
{context}

## 当前需求
{user_request}

## 任务
生成产品需求文档（PRD），包含以下信息：
1. product_name: 产品名称
2. features: 功能列表（数组）
3. target_users: 目标用户
4. success_criteria: 验收标准（数组）

## 重要
请直接输出纯 JSON 格式，不要使用 markdown 代码块包裹，不要添加任何其他文字。

示例格式：
{{"product_name": "...", "features": [...], "target_users": "...", "success_criteria": [...]}}
"""

        # 3. 调用 LLM（使用结构化输出）
        try:
            llm = get_llm_singleton()

            # 先获取原始响应
            response = llm.invoke([HumanMessage(content=pm_prompt)])
            response_text = response.content.strip()

            # 清理可能的 markdown 代码块标记
            if response_text.startswith("```"):
                # 移除 ```json 或 ``` 标记
                lines = response_text.split('\n')
                if lines[0].startswith("```"):
                    lines = lines[1:]  # 移除第一行
                if lines[-1].startswith("```"):
                    lines = lines[:-1]  # 移除最后一行
                response_text = '\n'.join(lines).strip()

            # 解析 JSON
            try:
                prd_dict = json.loads(response_text)
            except json.JSONDecodeError as e:
                print(f"\n⚠️  JSON解析失败，尝试提取...")
                # 尝试找到第一个 { 和最后一个 }
                start = response_text.find('{')
                end = response_text.rfind('}') + 1
                if start != -1 and end > start:
                    json_text = response_text[start:end]
                    prd_dict = json.loads(json_text)
                else:
                    raise ValueError(f"无法从响应中提取JSON: {e}")

            prd_spec = PRDSpec(**prd_dict)

            print(f"\n✅ PRD 生成成功：")
            print(f"   产品：{prd_spec.product_name}")
            print(f"   功能数：{len(prd_spec.features)}")

            # 4. 保存到记忆
            memory.add_long_term("product_name", prd_spec.product_name)
            memory.add_long_term("features", json.dumps(prd_spec.features, ensure_ascii=False))
            memory.add_short_term(f"生成了PRD: {prd_spec.product_name}", "PM")

            # 5. 更新状态（使用 Spec）
            state["prd"] = prd_spec.model_dump()
            state["messages"].append(AIMessage(content=prd_spec.to_markdown()))
            state["current_agent"] = "PM"
            state["memory_context"] = memory.summarize_context()

            # 打印 PRD
            print(f"\n{prd_spec.to_markdown()}\n")

        except Exception as e:
            print(f"❌ PRD 生成失败: {e}")
            state["prd"] = {}
            state["current_agent"] = "PM"

        return state

    return pm_agent
