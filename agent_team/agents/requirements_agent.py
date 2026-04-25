"""
Requirements Agent - 需求分析
职责：分析用户需求，生成PRD
"""

import json
from langchain_core.messages import HumanMessage, AIMessage
from ..types import AgentState, PrdData
from ..memory import SimpleMemory
from ..config import get_llm_singleton


def create_requirements_agent(memory: SimpleMemory):
    """
    创建 Requirements Agent 函数

    Args:
        memory: 记忆系统实例

    Returns:
        Requirements Agent 函数
    """

    def requirements_agent(state: AgentState) -> AgentState:
        """
        Requirements Agent - 生成PRD
        """
        print("\n" + "=" * 70)
        print("📋 Requirements Agent (需求分析)")
        print("=" * 70)

        # 1. 使用 Memory：获取上下文
        context = memory.summarize_context()
        print(f"\n📚 记忆上下文：\n{context}")

        # 2. 构建提示词
        user_request = state["messages"][-1].content

        requirements_prompt = f"""你是资深产品经理。

## 上下文记忆
{context}

## 当前需求
{user_request}

## 任务
生成产品需求文档（PRD），包含以下信息：
1. product_name: 产品名称
2. features: 功能列表（数组，至少包含核心功能）
3. target_users: 目标用户群体
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
            response = llm.invoke([HumanMessage(content=requirements_prompt)])
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

            prd_data = PrdData(**prd_dict)

            print(f"\n✅ PRD 生成成功：")
            print(f"   产品：{prd_data['product_name']}")
            print(f"   功能数：{len(prd_data['features'])}")

            # 4. 生成PRD文档（Markdown格式）
            prd_text = f"""# 产品需求文档 (PRD)

## 产品概述
**产品名称**：{prd_data['product_name']}

**目标用户**：{prd_data['target_users']}

## 功能需求

### 核心功能
{chr(10).join(f"- {feature}" for feature in prd_data['features'])}

## 验收标准
{chr(10).join(f"- {criteria}" for criteria in prd_data['success_criteria'])}

## 技术要求
- 支持多人在线对战
- 实时同步游戏状态
- 良好的用户体验

---
*生成时间：2026年4月25日*
*生成者：Requirements Agent*
"""

            # 5. 保存到记忆
            memory.add_long_term("product_name", prd_data['product_name'])
            memory.add_long_term("features", json.dumps(prd_data['features'], ensure_ascii=False))
            memory.add_short_term(f"生成了PRD: {prd_data['product_name']}", "Requirements")

            # 6. 更新状态
            state["prd_text"] = prd_text
            state["prd_data"] = prd_data
            state["messages"].append(AIMessage(content=prd_text))
            state["current_agent"] = "Requirements"
            state["memory_context"] = memory.summarize_context()

            # 打印 PRD
            print(f"\n{prd_text}\n")

        except Exception as e:
            print(f"❌ PRD 生成失败: {e}")
            state["prd_text"] = ""
            state["prd_data"] = {}
            state["current_agent"] = "Requirements"

        return state

    return requirements_agent