"""
运行模块化的 Agent Team 演示
"""

from agent_team.workflow import create_workflow


def main():
    """主函数"""
    import sys
    import io

    # 设置标准输出为UTF-8编码
    if sys.platform == "win32":
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

    print("\n" + "=" * 70)
    print("模块化 Agent Team 演示")
    print("=" * 70)

    # 创建工作流
    workflow = create_workflow()

    # 用户需求
    user_request = """
我想开发一个简单的学生成绩管理系统，具有以下功能：
1. 添加学生成绩
2. 查询学生成绩
3. 计算平均分
4. 生成成绩报告

目标用户是学校老师，希望能简单易用。
"""

    # 运行工作流
    result = workflow.run(user_request)

    # 显示结果
    print("\n" + "=" * 70)
    print("模块化架构说明")
    print("=" * 70)
    print("""
本示例展示了模块化的 Agent Team 架构：

目录结构：
agent_team/
├── types.py          # 共享类型定义
├── config.py         # LLM 配置
├── memory/           # 记忆系统
│   └── memory_system.py
├── specs/            # 规范验证
│   └── validators.py
├── skills/           # 技能工具
│   └── tools.py
├── agents/           # Agent 实现
│   ├── pm_agent.py
│   └── developer_agent.py
└── workflow.py       # 流程统领

优势：
1. 职责分离 - 每个模块独立
2. 易于维护 - 修改单个Agent不影响其他
3. 可复用 - 组件可在不同项目中复用
4. 易于测试 - 可单独测试每个模块
5. 清晰的结构 - 一目了然

扩展方式：
1. 添加新Agent：在 agents/ 目录创建新文件
2. 添加新技能：在 skills/ 目录添加工具
3. 添加新规范：在 specs/ 目录添加验证器
""")

    print("\n演示完成！\n")


if __name__ == "__main__":
    main()
