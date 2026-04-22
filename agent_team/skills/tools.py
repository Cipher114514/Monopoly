"""
工具定义
Agent可以使用的技能工具
"""

from langchain_core.tools import tool


# 定义工具
@tool
def write_file(filename: str, content: str) -> str:
    """写入文件"""
    try:
        filepath = f"output/{filename}"
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return f"✅ 文件已保存: {filepath}"
    except Exception as e:
        return f"❌ 写入失败: {e}"


@tool
def read_file(filename: str) -> str:
    """读取文件"""
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            content = f.read()
        return f"📄 文件内容:\n{content}"
    except FileNotFoundError:
        return f"❌ 文件不存在: {filename}"


@tool
def count_lines(code: str) -> str:
    """统计代码行数"""
    lines = code.strip().split('\n')
    return f"📊 代码统计: {len(lines)} 行"


class SkillSet:
    """技能集合"""

    def __init__(self):
        self.tools = {
            "write_file": write_file,
            "read_file": read_file,
            "count_lines": count_lines
        }

    def execute(self, tool_name: str, **kwargs) -> str:
        """执行技能"""
        if tool_name not in self.tools:
            return f"未知的技能: {tool_name}"

        tool = self.tools[tool_name]

        # 调用工具的invoke方法
        try:
            result = tool.invoke(kwargs)
            return result
        except Exception as e:
            return f"工具执行失败: {e}"

    def register(self, name: str, tool):
        """注册新技能"""
        self.tools[name] = tool
