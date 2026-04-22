"""
共享配置
包含LLM初始化、环境变量等
"""

import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI

# 加载环境变量
load_dotenv()


def get_llm():
    """获取配置好的LLM实例"""
    api_key = os.getenv("ZHIPUAI_API_KEY")

    if not api_key:
        raise ValueError("未找到 ZHIPUAI_API_KEY，请在 .env 文件中配置")

    return ChatOpenAI(
        model="glm-4",
        api_key=api_key,
        openai_api_base="https://open.bigmodel.cn/api/paas/v4/",
        temperature=0.7,
    )


# 全局LLM实例（懒加载）
_llm_instance = None


def get_llm_singleton():
    """获取LLM单例"""
    global _llm_instance
    if _llm_instance is None:
        _llm_instance = get_llm()
    return _llm_instance
