"""
Architecture Agent - 后端架构师
阶段: 阶段3 - 后端架构设计
输出: 架构设计文档分模块保存为多个文件（避免输出截断）
"""

from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
import sys
from pathlib import Path

# 添加 core 目录到路径
sys.path.insert(0, str(Path(__file__).parent.parent))
from core.file_manager import WorkspaceManager, create_file_reference
from core.context_builder import build_context_for_agent
from agent_state import AgentState


def _load_architecture_prompt():
    prompt_path = Path(__file__).resolve().parents[1] / "prompts" / "architecture_prompt.md"
    try:
        with open(prompt_path, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception:
        return """你是后端架构师，请基于 PRD 和任务列表设计系统架构。

注意：这是课程作业项目，使用 Node.js + Express + SQLite + Socket.io 技术栈。"""


ARCHITECTURE_AGENT_PROMPT = _load_architecture_prompt()


def _call_llm_section(llm, system_prompt: str, user_prompt: str) -> str:
    """
    调用 LLM 生成单个模块的内容

    Args:
        llm: 语言模型实例
        system_prompt: 系统提示词
        user_prompt: 用户提示词

    Returns:
        LLM 生成的文本内容
    """
    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=user_prompt)
    ]
    response = llm.invoke(messages)
    return response.content


def create_architecture_agent(llm):
    """
    创建 Architecture Agent 工厂函数

    Args:
        llm: 语言模型实例

    Returns:
        architecture_agent: Architecture Agent 函数
    """

    def architecture_agent(state: AgentState) -> AgentState:
        """
        Architecture Agent - 后端架构师
        设计系统架构、数据库和 API，分模块保存为多个文件

        Args:
            state: 当前状态（包含PM和Requirements Agent的输出引用）

        Returns:
            更新后的状态（architecture字段包含多个文件引用）
        """
        print("\n" + "="*70)
        print("🏗️  Architecture Agent - 后端架构师")
        print("="*70)

        # 获取项目信息
        project_name = state.get("project_name", "未命名项目")
        workspace = WorkspaceManager()

        # 使用 context_builder 获取前序上下文
        base_context = build_context_for_agent(state, "architecture")

        # 验证必要的前序输出
        prd_content = workspace.read_markdown("prd")
        tasks_content = workspace.read_markdown("tasks")

        if not prd_content:
            print("❌ 未找到PRD文件，请先运行 PM Agent")
            state["current_agent"] = "Architecture Agent"
            state["architecture"] = {
                "file_path": "",
                "artifact_type": "architecture",
                "updated_at": "",
                "error": "PRD文件不存在"
            }
            return state

        if not tasks_content:
            print("❌ 未找到任务文件，请先运行 Requirements Agent")
            state["current_agent"] = "Architecture Agent"
            state["architecture"] = {
                "file_path": "",
                "artifact_type": "architecture",
                "updated_at": "",
                "error": "Tasks文件不存在"
            }
            return state

        print(f"🏗️  设计后端架构（分模块生成）")
        print(f"   - 项目: {project_name}")
        print(f"   - PRD大小: {len(prd_content)} 字符")
        print(f"   - 任务数量: {tasks_content.count('T0') + tasks_content.count('T1') + tasks_content.count('T02')}")

        # 在 context_builder 提供的上下文基础上追加技术约束
        context = base_context + f"""

⚠️ **SQLite 语法规则**（必须严格遵守）：
- UUID 使用 `TEXT` 类型，由应用层生成
- 布尔值使用 `INTEGER` 类型（0=false, 1=true）
- 时间戳使用 `INTEGER` 类型（Unix 时间戳）
- 禁止使用: `UUID` 类型、`BOOLEAN` 类型、`TIMESTAMP` 类型、`gen_random_uuid()`、`NOW()` 等PostgreSQL语法
- 正确示例: `id TEXT PRIMARY KEY`, `is_active INTEGER DEFAULT 1`, `created_at INTEGER DEFAULT (strftime('%s', 'now'))

⚠️ **文件命名规则**：
- 所有文件名必须使用英文（PascalCase 或 camelCase）
- 禁止使用中文文件名（如 "大厅.js"、"房间.js" 等）
- React 组件使用 PascalCase: 如 `UserList.jsx`, `GameBoard.jsx`
- Node.js 模块使用 camelCase: 如 `apiClient.js`, `gameUtils.js`
"""

        # 存储所有生成的文件引用
        architecture_files = {}
        total_size = 0
        total_tables = 0
        total_apis = 0

        try:
            # ========== 模块1: 数据库Schema设计 ==========
            print("\n📦 生成模块1: 数据库Schema设计...")
            db_prompt = f"""{context}

请设计完整的数据库Schema，包括：

1. **表清单**：列出所有数据表及其字段说明
2. **SQL创建语句**：提供完整的 SQLite CREATE TABLE 语句

需要设计的表：
- users（用户表）
- rooms（房间表）
- players（玩家表）
- properties（地产表）
- cards（卡牌表）
- game_records（游戏记录表）

请直接输出Markdown格式的数据库设计文档，不要有任何前缀或后缀说明。
"""
            db_content = _call_llm_section(llm, ARCHITECTURE_AGENT_PROMPT, db_prompt)
            db_path = workspace.write_markdown("architecture_db", db_content)
            architecture_files["database"] = {
                "file_path": db_path,
                "size": len(db_content),
                "tables_count": db_content.count("CREATE TABLE")
            }
            total_tables += db_content.count("CREATE TABLE")
            total_size += len(db_content)
            print(f"   ✅ 数据库Schema: workspace/{db_path} ({len(db_content)} 字符)")

            # ========== 模块2: 文件结构设计 ==========
            print("\n📁 生成模块2: 文件结构设计...")
            structure_prompt = f"""{context}

请设计完整的项目文件结构，包括：

1. **后端文件**：列出所有后端模块文件及其职责
2. **前端文件**：列出所有前端组件文件及其职责

技术栈：
- 后端: Node.js + Express + Socket.io
- 前端: React
- 数据库: SQLite

请直接输出Markdown格式的文件结构文档，使用表格形式，不要有任何前缀或后缀说明。
"""
            structure_content = _call_llm_section(llm, ARCHITECTURE_AGENT_PROMPT, structure_prompt)
            structure_path = workspace.write_markdown("architecture_structure", structure_content)
            architecture_files["structure"] = {
                "file_path": structure_path,
                "size": len(structure_content)
            }
            total_size += len(structure_content)
            print(f"   ✅ 文件结构: workspace/{structure_path} ({len(structure_content)} 字符)")

            # ========== 模块3: Socket.io 事件设计 ==========
            print("\n🔌 生成模块3: Socket.io 事件设计...")
            socketio_prompt = f"""{context}

请设计完整的 Socket.io 实时通信事件，包括：

1. **客户端 → 服务端事件**：列出所有客户端发送到服务端的事件
2. **服务端 → 客户端事件**：列出所有服务端推送到客户端的事件

需要设计的事件包括：
- 房间相关：加入房间、离开房间、玩家准备
- 游戏相关：掷骰子、移动、结束回合
- 地产相关：购买地产、建设房屋
- 卡牌相关：抽取卡牌
- 其他：破产判定、游戏结束等

请直接输出Markdown格式的Socket.io事件文档，使用表格形式，不要有任何前缀或后缀说明。
"""
            socketio_content = _call_llm_section(llm, ARCHITECTURE_AGENT_PROMPT, socketio_prompt)
            socketio_path = workspace.write_markdown("architecture_socketio", socketio_content)
            architecture_files["socketio"] = {
                "file_path": socketio_path,
                "size": len(socketio_content)
            }
            total_size += len(socketio_content)
            print(f"   ✅ Socket.io事件: workspace/{socketio_path} ({len(socketio_content)} 字符)")

            # ========== 模块4-8: 各系统API设计 ==========
            api_modules = [
                ("users", "用户系统", ["注册", "登录", "获取用户信息", "更新用户信息"]),
                ("rooms", "房间系统", ["创建房间", "获取房间列表", "加入房间", "离开房间", "获取房间详情"]),
                ("players", "玩家系统", ["获取玩家信息", "玩家准备/取消准备", "获取玩家状态"]),
                ("properties", "地产系统", ["获取所有地产", "获取地产详情", "购买地产", "建设房屋", "出售地产"]),
                ("cards", "卡牌系统", ["抽取卡牌", "获取卡牌列表"]),
            ]

            for module_name, module_title, api_list in api_modules:
                print(f"\n🌐 生成模块: {module_title}API...")
                api_prompt = f"""{context}

请设计 {module_title} 的完整 RESTful API。

需要包含的API功能：
{chr(10).join(f'- {api}' for api in api_list)}

对于每个API，请提供：
1. **HTTP方法**：GET / POST / PUT / DELETE
2. **路径**：如 /api/users/register
3. **描述**：API功能说明
4. **请求参数**：包括路径参数、查询参数、请求体
5. **响应示例**：JSON格式示例

请直接输出Markdown格式的API文档，不要有任何前缀或后缀说明。
"""
                api_content = _call_llm_section(llm, ARCHITECTURE_AGENT_PROMPT, api_prompt)
                api_path = workspace.write_markdown(f"architecture_api_{module_name}", api_content)
                architecture_files[f"api_{module_name}"] = {
                    "file_path": api_path,
                    "size": len(api_content),
                    "apis_count": api_content.count("POST /") + api_content.count("GET /") + api_content.count("PUT /") + api_content.count("DELETE /")
                }
                total_apis += api_content.count("POST /") + api_content.count("GET /") + api_content.count("PUT /") + api_content.count("DELETE /")
                total_size += len(api_content)
                print(f"   ✅ {module_title}API: workspace/{api_path} ({len(api_content)} 字符)")

            # ========== 模块9: 安全和性能方案 ==========
            print("\n🔒 生成模块: 安全和性能方案...")
            security_prompt = f"""{context}

请设计完整的安全和性能方案，包括：

1. **安全措施**：
   - 用户认证（JWT）
   - 密码加密（bcrypt）
   - 输入验证
   - Rate Limiting（速率限制）
   - SQL注入防护
   - XSS防护

2. **性能优化**：
   - 数据库查询优化
   - 缓存策略
   - 连接池管理

3. **其他考虑**：
   - 错误处理
   - 日志记录
   - 部署建议

请直接输出Markdown格式的安全和性能方案文档，不要有任何前缀或后缀说明。
"""
            security_content = _call_llm_section(llm, ARCHITECTURE_AGENT_PROMPT, security_prompt)
            security_path = workspace.write_markdown("architecture_security", security_content)
            architecture_files["security"] = {
                "file_path": security_path,
                "size": len(security_content)
            }
            total_size += len(security_content)
            print(f"   ✅ 安全和性能方案: workspace/{security_path} ({len(security_content)} 字符)")

            # 生成总览文档
            print("\n📄 生成总览文档...")
            overview_content = f"""# 系统架构设计文档 - 总览

> 项目: {project_name}
> 生成时间: {Path(__file__).resolve().parents[1]}

## 📋 文档索引

本文档分为多个模块，每个模块保存为独立文件以确保完整性。

### 核心模块

| 模块 | 文件 | 说明 |
|------|------|------|
| 数据库设计 | `architecture_db.md` | SQLite数据库Schema和创建语句 |
| 文件结构 | `architecture_structure.md` | 前后端文件结构和职责划分 |
| Socket.io事件 | `architecture_socketio.md` | 实时通信事件定义 |

### API模块

| 模块 | 文件 | 说明 |
|------|------|------|
| 用户系统API | `architecture_api_users.md` | 用户注册、登录、信息管理 |
| 房间系统API | `architecture_api_rooms.md` | 房间创建、加入、管理 |
| 玩家系统API | `architecture_api_players.md` | 玩家状态、准备机制 |
| 地产系统API | `architecture_api_properties.md` | 地产购买、建设、交易 |
| 卡牌系统API | `architecture_api_cards.md` | 卡牌抽取和效果 |

### 其他模块

| 模块 | 文件 | 说明 |
|------|------|------|
| 安全和性能 | `architecture_security.md` | 认证、加密、优化策略 |

## 📊 统计信息

- **数据表数量**: {total_tables} 个
- **API端点数量**: {total_apis} 个
- **文档总大小**: {total_size} 字符
- **模块文件数**: {len(architecture_files)} 个

## 🔍 快速导航

- 快速查看数据库设计: [architecture_db.md](architecture_db.md)
- 快速查看API列表: [architecture_api_users.md](architecture_api_users.md)
- 快速查看Socket.io事件: [architecture_socketio.md](architecture_socketio.md)

---

*本文档由 Architecture Agent 自动生成*
"""
            overview_path = workspace.write_markdown("architecture", overview_content)
            architecture_files["overview"] = {
                "file_path": overview_path,
                "size": len(overview_content)
            }
            print(f"   ✅ 总览文档: workspace/{overview_path}")

            # 创建文件引用（用于State）
            architecture_ref = create_file_reference(
                artifact_type="architecture",
                filename=overview_path,  # 主文件是总览
                metadata={
                    "project_name": project_name,
                    "size": total_size,
                    "tables_count": total_tables,
                    "api_count": total_apis,
                    "modules": architecture_files,
                    "is_modular": True
                }
            )

            # 更新状态
            state["current_agent"] = "Architecture Agent"
            state["architecture"] = architecture_ref
            state["messages"].append(AIMessage(content=f"架构设计已保存到 {len(architecture_files)} 个文件，主文档: {overview_path}"))

            print("\n" + "="*70)
            print("✅ 架构设计完成！")
            print("="*70)
            print(f"   📁 生成文件数: {len(architecture_files)} 个")
            print(f"   📄 总览文档: workspace/{overview_path}")
            print(f"   📊 总大小: {total_size} 字符")
            print(f"   🗄️  数据表: {total_tables} 个")
            print(f"   🌐 API端点: {total_apis} 个")
            print(f"\n   各模块文件:")
            for module_name, info in architecture_files.items():
                print(f"      - {module_name}: workspace/{info['file_path']}")

        except Exception as e:
            print(f"❌ 架构设计失败: {e}")
            import traceback
            traceback.print_exc()
            state["current_agent"] = "Architecture Agent"
            state["architecture"] = {
                "file_path": "",
                "artifact_type": "architecture",
                "updated_at": "",
                "error": str(e)
            }

        return state

    return architecture_agent


# 辅助函数：从文件引用加载架构内容（供后续Agent使用）
def load_architecture_content(state: AgentState) -> str:
    """
    从State中的文件引用加载架构内容（加载所有模块）

    Args:
        state: 当前状态

    Returns:
        所有架构内容拼接成的字符串
    """
    workspace = WorkspaceManager()

    # 尝试读取总览文档
    content = workspace.read_markdown("architecture")
    if content:
        return content

    # 如果总览不存在，读取所有模块
    modules = ["architecture_db", "architecture_structure", "architecture_socketio",
               "architecture_api_users", "architecture_api_rooms", "architecture_api_players",
               "architecture_api_properties", "architecture_api_cards", "architecture_security"]

    all_content = []
    for module in modules:
        module_content = workspace.read_markdown(module.replace("architecture_", ""))
        if module_content:
            all_content.append(f"## {module}\n\n{module_content}")

    return "\n\n".join(all_content) if all_content else ""
