"""
UI Designer Agent - UI设计
职责：根据PRD生成UI设计文档
"""

import json
from langchain_core.messages import HumanMessage, AIMessage
from ..types import AgentState, UIData
from ..memory import SimpleMemory
from ..config import get_llm_singleton


def create_ui_designer_agent(memory: SimpleMemory):
    """
    创建 UI Designer Agent 函数

    Args:
        memory: 记忆系统实例

    Returns:
        UI Designer Agent 函数
    """

    def ui_designer_agent(state: AgentState) -> AgentState:
        """
        UI Designer Agent - 生成UI设计
        """
        print("\n" + "=" * 70)
        print("🎨 UI Designer Agent (UI设计)")
        print("=" * 70)

        # 1. 检查PRD是否存在
        if "prd_data" not in state or not state["prd_data"]:
            print("❌ 未找到PRD数据，请先运行Requirements Agent")
            state["current_agent"] = "UI Designer"
            return state

        prd_data = state["prd_data"]

        # 2. 使用 Memory：获取上下文
        context = memory.summarize_context()
        print(f"\n📚 记忆上下文：\n{context}")

        # 3. 构建UI设计提示词
        ui_prompt = f"""你是资深UI/UX设计师。

## 产品信息
产品名称：{prd_data['product_name']}
功能列表：{', '.join(prd_data['features'])}
目标用户：{prd_data['target_users']}

## 任务
为该产品设计完整的UI界面，包含以下信息：
1. color_scheme: 颜色方案（包含主色、辅色、强调色）
2. pages: 页面列表（核心页面名称）
3. components: 组件列表（每个组件包含name, type, description）
4. interactions: 交互列表（核心交互行为）

## 颜色方案格式
{{
    "primary": "#HEX",
    "secondary": "#HEX",
    "accent": "#HEX",
    "background": "#HEX",
    "text": "#HEX"
}}

## 组件格式
[{{
    "name": "组件名称",
    "type": "button|input|card|etc",
    "description": "组件描述"
}}]

## 重要
请直接输出纯 JSON 格式，不要使用 markdown 代码块包裹，不要添加任何其他文字。

示例格式：
{{
    "color_scheme": {{"primary": "#007AFF", "secondary": "#5856D6", "accent": "#FF9500", "background": "#FFFFFF", "text": "#000000"}},
    "pages": ["首页", "游戏大厅", "游戏界面"],
    "components": [{{"name": "开始游戏按钮", "type": "button", "description": "触发游戏开始"}}],
    "interactions": ["点击按钮开始游戏", "拖拽棋子移动"]
}}
"""

        # 4. 调用 LLM（使用结构化输出）
        try:
            llm = get_llm_singleton()

            # 先获取原始响应
            response = llm.invoke([HumanMessage(content=ui_prompt)])
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
                ui_dict = json.loads(response_text)
            except json.JSONDecodeError as e:
                print(f"\n⚠️  JSON解析失败，尝试提取...")
                # 尝试找到第一个 { 和最后一个 }
                start = response_text.find('{')
                end = response_text.rfind('}') + 1
                if start != -1 and end > start:
                    json_text = response_text[start:end]
                    ui_dict = json.loads(json_text)
                else:
                    raise ValueError(f"无法从响应中提取JSON: {e}")

            ui_data = UIData(**ui_dict)

            print(f"\n✅ UI设计生成成功：")
            print(f"   页面数：{len(ui_data['pages'])}")
            print(f"   组件数：{len(ui_data['components'])}")

            # 5. 生成UI设计文档（Markdown格式）
            ui_text = f"""# UI设计文档

## 产品信息
**产品名称**：{prd_data['product_name']}
**目标用户**：{prd_data['target_users']}

## 颜色方案
- **主色**：{ui_data['color_scheme'].get('primary', '#007AFF')}
- **辅色**：{ui_data['color_scheme'].get('secondary', '#5856D6')}
- **强调色**：{ui_data['color_scheme'].get('accent', '#FF9500')}
- **背景色**：{ui_data['color_scheme'].get('background', '#FFFFFF')}
- **文字色**：{ui_data['color_scheme'].get('text', '#000000')}

## 页面结构

### 核心页面
{chr(10).join(f"1. {page}" for page in ui_data['pages'])}

## 组件设计

### UI组件
{chr(10).join(f"- **{comp['name']}** ({comp['type']}): {comp['description']}" for comp in ui_data['components'])}

## 交互设计

### 核心交互
{chr(10).join(f"- {interaction}" for interaction in ui_data['interactions'])}

## 设计原则
- 简洁直观的用户界面
- 符合目标用户的使用习惯
- 支持响应式设计
- 良好的可访问性

---
*生成时间：2026年4月25日*
*生成者：UI Designer Agent*
"""

            # 6. 保存到记忆
            memory.add_long_term("ui_pages", json.dumps(ui_data['pages'], ensure_ascii=False))
            memory.add_long_term("ui_colors", json.dumps(ui_data['color_scheme'], ensure_ascii=False))
            memory.add_short_term(f"生成了UI设计: {len(ui_data['pages'])}个页面", "UI Designer")

            # 7. 更新状态
            state["ui_text"] = ui_text
            state["ui_data"] = ui_data
            state["messages"].append(AIMessage(content=ui_text))
            state["current_agent"] = "UI Designer"
            state["memory_context"] = memory.summarize_context()

            # 打印 UI 设计
            print(f"\n{ui_text}\n")

        except Exception as e:
            print(f"❌ UI设计生成失败: {e}")
            state["ui_text"] = ""
            state["ui_data"] = {}
            state["current_agent"] = "UI Designer"

        return state

    return ui_designer_agent