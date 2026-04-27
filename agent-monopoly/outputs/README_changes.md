# 变更摘要（需求组交付）

以下变更由需求组自动化任务完成，用于支持 Agent 开发与并行工作流：

新增文件：
- `prompts/pm_prompt.md` - PM Agent 的提示词（可维护文本）
- `prompts/requirements_prompt.md` - Requirements Agent 的提示词模板
- `outputs/PRD_example.md` - 基于主需求规格的精简 PRD 示例
- `outputs/sprint1_plan.md` - 基于 PRD 的 Sprint #1 规划（RICE 表 + 任务列表）
- `outputs/sprint1_tasks.json` - 机器可读的任务清单（供后续 Agent/脚本使用）
- `mock/run_agents_dryrun.py` - 本地验证脚本（检查 prompts/outputs 可读性）

更新文件：
- `agents/pm_agent.py` - 修改为优先从 `prompts/pm_prompt.md` 加载提示词，带回退逻辑
- `agents/requirements_agent.py` - 修改为优先从 `prompts/requirements_prompt.md` 加载提示词，带回退逻辑

验证：
- 已运行本地验证脚本，确认所有新增文件可读且格式正常（见 `mock/run_agents_dryrun.py` 输出）。

建议的下一步：
1. 请代码审查团队确认 prompt 内容是否满足团队风格/合规要求（特别是安全与隐私用语）。
2. 将 `outputs/sprint1_tasks.json` 导入到项目的任务管理工具或转换为 Issue 模板并分配负责人。
3. 如需，继续把其他 Agent 的长提示词抽取到 `prompts/` 以统一管理。

审阅者可运行以下命令在本地验证（PowerShell）：

```powershell
python .\agent-monopoly\mock\run_agents_dryrun.py
```
