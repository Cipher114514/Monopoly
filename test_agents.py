"""
测试 agency-agents-zh 智能体可用性
使用智谱 AI API 测试单个智能体是否能正常工作
"""

import os
import sys
import json
import requests

# 设置控制台编码
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# 配置智谱 API key
API_KEY = "5a89d580eb0b4553b7f1c6f822352f01.mdOB3HRfcI8Xqhze"
API_URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions"

def test_single_agent(agent_file: str, user_query: str):
    """
    测试单个智能体

    Args:
        agent_file: 智能体 markdown 文件路径
        user_query: 测试查询
    """
    print(f"\n{'='*70}")
    print(f"测试智能体: {agent_file}")
    print(f"{'='*70}\n")

    # 读取智能体定义
    if not os.path.exists(agent_file):
        print(f"❌ 文件不存在: {agent_file}")
        return False

    with open(agent_file, 'r', encoding='utf-8') as f:
        agent_prompt = f.read()

    print(f"📄 智能体定义长度: {len(agent_prompt)} 字符")
    print(f"❓ 测试查询: {user_query}\n")

    # 构建完整提示
    full_prompt = f"""{agent_prompt}

## 用户任务
{user_query}

请按照你的角色设定，提供专业的回答。
"""

    try:
        print("⏳ 正在调用智谱 AI...")

        # 调用 API
        headers = {
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": "glm-4-flash",
            "messages": [
                {"role": "user", "content": full_prompt}
            ],
            "temperature": 0.7,
            "max_tokens": 1000
        }

        response = requests.post(API_URL, headers=headers, json=payload, timeout=60)
        response.raise_for_status()

        result = response.json()

        # 显示结果
        print("\n✅ API 调用成功！\n")
        print("📝 智能体回复:")
        print("-" * 70)
        print(result["choices"][0]["message"]["content"])
        print("-" * 70)

        return True

    except Exception as e:
        print(f"\n❌ 调用失败: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """主测试函数"""
    print("\n" + "="*70)
    print("🧪 agency-agents-zh 智能体可用性测试")
    print("="*70)

    # 测试案例
    test_cases = [
        {
            "agent": "agency-agents-zh-main/engineering/engineering-backend-architect.md",
            "query": "请为一个在线大富翁游戏设计数据库架构，需要支持用户管理、游戏房间、实时状态同步等功能。",
            "name": "后端架构师"
        },
        {
            "agent": "agency-agents-zh-main/product/product-manager.md",
            "query": "基于在线大富翁需求，帮我生成产品需求文档（PRD）的核心章节。",
            "name": "产品经理"
        }
    ]

    results = []

    for i, test in enumerate(test_cases, 1):
        print(f"\n【测试 {i}/{len(test_cases)}】{test['name']}")

        success = test_single_agent(
            test['agent'],
            test['query']
        )

        results.append({
            "name": test['name'],
            "success": success
        })

    # 测试总结
    print("\n" + "="*70)
    print("📊 测试总结")
    print("="*70)

    passed = sum(1 for r in results if r['success'])
    total = len(results)

    for r in results:
        status = "✅ 通过" if r['success'] else "❌ 失败"
        print(f"{status}: {r['name']}")

    print(f"\n总计: {passed}/{total} 通过")

    if passed == total:
        print("\n🎉 所有测试通过！智能体库可用！")
    else:
        print("\n⚠️  部分测试失败，请检查配置和网络连接。")


if __name__ == "__main__":
    main()
