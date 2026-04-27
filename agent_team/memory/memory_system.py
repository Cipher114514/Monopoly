"""
简单记忆系统实现
支持短期记忆、长期记忆、上下文总结
"""

import json


class SimpleMemory:
    """简单记忆系统"""

    def __init__(self):
        self.short_term = []  # 短期记忆
        self.long_term = {}  # 长期记忆（键值对存储）

    def add_short_term(self, message: str, role: str):
        """添加短期记忆"""
        self.short_term.append({"role": role, "content": message})

    def add_long_term(self, key: str, value: str):
        """添加长期记忆"""
        self.long_term[key] = value

    def get_recent(self, n: int = 3) -> list:
        """获取最近N条记忆"""
        return self.short_term[-n:]

    def get_long_term(self, key: str) -> str:
        """获取长期记忆"""
        return self.long_term.get(key, "")

    def summarize_context(self) -> str:
        """总结上下文"""
        summary_parts = []

        # 长期记忆总结
        if self.long_term:
            summary_parts.append("## 已知信息：\n")
            for key, value in self.long_term.items():
                summary_parts.append(f"- {key}: {value}\n")

        # 短期记忆总结
        if self.short_term:
            summary_parts.append("\n## 最近对话：\n")
            for msg in self.short_term[-3:]:
                content = msg['content']
                if len(content) > 100:
                    content = content[:100] + "..."
                summary_parts.append(f"{msg['role']}: {content}\n")

        return "".join(summary_parts)

    def clear(self):
        """清空所有记忆"""
        self.short_term = []
        self.long_term = {}
