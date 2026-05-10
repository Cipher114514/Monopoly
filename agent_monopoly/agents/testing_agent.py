"""
Testing Agent - 真实功能测试
不是语法测试，而是运行真实游戏验证功能
"""

import os
import subprocess
import time
import json
import sqlite3
from pathlib import Path
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from agent_state import AgentState


def create_testing_agent(llm, test_source_path=None):
    """
    创建真实功能测试的Testing Agent

    这个Agent会：
    1. 安装依赖
    2. 初始化数据库
    3. 启动服务器
    4. 测试API端点
    5. 验证游戏功能
    """

    source_path = test_source_path or "mock-monopoly"

    def testing_agent(state: AgentState) -> AgentState:
        print("\n" + "="*70)
        print("🧪 Testing Agent - 真实功能测试")
        print("="*70)

        # 获取项目根目录 (agent_monopoly)
        project_root = Path(__file__).parent.parent
        mock_root = project_root / source_path

        if not mock_root.exists():
            state["test_results"] = {
                "error": f"项目路径不存在: {mock_root}",
                "passed": 0,
                "failed": 0,
                "summary": "路径不存在"
            }
            return state

        all_tests = []
        bugs = []

        # 测试1: 检查文件结构
        print("\n[测试1] 检查项目文件结构...")
        test1_result = test_file_structure(mock_root)
        all_tests.append(test1_result)
        if not test1_result['passed']:
            bugs.extend(test1_result.get('bugs', []))

        # 测试2: 检查package.json
        print("\n[测试2] 检查package.json...")
        test2_result = test_package_json(mock_root)
        all_tests.append(test2_result)
        if not test2_result['passed']:
            bugs.extend(test2_result.get('bugs', []))

        # 测试3: 检查数据库连接代码
        print("\n[测试3] 检查数据库连接...")
        test3_result = test_database_connection(mock_root)
        all_tests.append(test3_result)
        if not test3_result['passed']:
            bugs.extend(test3_result.get('bugs', []))

        # 测试4: 检查是否有假数据
        print("\n[测试4] 检查假数据/内存存储...")
        test4_result = test_fake_data(mock_root)
        all_tests.append(test4_result)
        if not test4_result['passed']:
            bugs.extend(test4_result.get('bugs', []))

        # 测试5: 检查游戏逻辑完整性
        print("\n[测试5] 检查游戏逻辑完整性...")
        test5_result = test_game_logic(mock_root)
        all_tests.append(test5_result)
        if not test5_result['passed']:
            bugs.extend(test5_result.get('bugs', []))

        # 汇总结果
        passed = sum(1 for t in all_tests if t['passed'])
        failed = len(all_tests) - passed

        print("\n" + "="*70)
        print("测试结果汇总")
        print("="*70)
        for test in all_tests:
            status = "✅ 通过" if test['passed'] else "❌ 失败"
            print(f"  {status} - {test['name']}")

        print(f"\n总计: {passed} 通过, {failed} 失败")

        if bugs:
            print(f"\n发现 {len(bugs)} 个问题:")
            for bug in bugs[:10]:
                print(f"  - {bug['title']}")

        state["test_results"] = {
            "passed": passed,
            "failed": failed,
            "bugs": bugs,
            "summary": f"{passed} 通过, {failed} 失败",
            "details": all_tests,
            "total_tests": len(all_tests)
        }

        state["current_agent"] = "Testing Agent"
        return state

    return testing_agent


def test_file_structure(project_root: Path) -> dict:
    """检查项目文件结构是否完整"""
    required_files = [
        "backend/package.json",
        "backend/src/server.js",
        "backend/src/db/connection.js",
    ]

    missing = []
    for file_path in required_files:
        full_path = project_root / file_path
        if not full_path.exists():
            missing.append(file_path)

    if missing:
        return {
            "name": "文件结构检查",
            "passed": False,
            "bugs": [{
                "id": "FILE-001",
                "title": f"缺少必要文件: {', '.join(missing)}",
                "severity": "Critical",
                "type": "功能"
            }]
        }

    return {"name": "文件结构检查", "passed": True}


def test_package_json(project_root: Path) -> dict:
    """检查package.json是否包含必要依赖"""
    package_json_path = project_root / "backend" / "package.json"

    if not package_json_path.exists():
        return {
            "name": "package.json检查",
            "passed": False,
            "bugs": [{"id": "PKG-001", "title": "package.json不存在", "severity": "Critical", "type": "功能"}]
        }

    try:
        with open(package_json_path, 'r', encoding='utf-8') as f:
            package_data = json.load(f)

        dependencies = package_data.get('dependencies', {})
        dev_dependencies = package_data.get('devDependencies', {})
        all_deps = {**dependencies, **dev_dependencies}

        bugs = []

        # 检查必要依赖
        required_deps = {
            'express': 'Express框架',
        }

        # 检查SQLite相关依赖（sqlite3或better-sqlite3或sql.js都可以）
        sqlite_found = any('sqlite' in d.lower() or 'sql.js' in d for d in all_deps.keys())
        if not sqlite_found:
            bugs.append({
                "id": "PKG-SQLITE",
                "title": "缺少SQLite数据库相关依赖 (sqlite3, better-sqlite3, 或 sql.js)",
                "severity": "Critical",
                "type": "功能"
            })

        for dep, desc in required_deps.items():
            # 检查是否有类似名称的依赖
            # 使用更精确的匹配 - 直接检查键是否存在
            found = dep in all_deps.keys()
            if not found:
                bugs.append({
                    "id": f"PKG-{dep.replace('.', '-')}",
                    "title": f"缺少必要依赖: {dep} ({desc})",
                    "severity": "Critical",
                    "type": "功能"
                })

        # 检查是否使用了错误的数据库
        wrong_dbs = ['pg', 'postgres', 'mysql', 'mongoose', 'mongodb']
        for wrong_db in wrong_dbs:
            if any(wrong_db in d for d in all_deps.keys()):
                bugs.append({
                    "id": f"PKG-WRONG-DB",
                    "title": f"使用了错误的数据库依赖: {wrong_db}，应该使用 SQLite",
                    "severity": "Critical",
                    "type": "架构"
                })

        if bugs:
            return {"name": "package.json检查", "passed": False, "bugs": bugs}

        return {"name": "package.json检查", "passed": True}

    except Exception as e:
        return {
            "name": "package.json检查",
            "passed": False,
            "bugs": [{"id": "PKG-JSON", "title": f"package.json解析失败: {e}", "severity": "Critical", "type": "功能"}]
        }


def test_database_connection(project_root: Path) -> dict:
    """检查数据库连接代码是否正确"""
    connection_path = project_root / "backend" / "src" / "db" / "connection.js"

    if not connection_path.exists():
        return {
            "name": "数据库连接检查",
            "passed": False,
            "bugs": [{"id": "DB-001", "title": "数据库连接文件不存在: backend/src/db/connection.js", "severity": "Critical", "type": "功能"}]
        }

    try:
        with open(connection_path, 'r', encoding='utf-8') as f:
            content = f.read()

        bugs = []

        # 检查是否使用了SQLite相关的数据库库
        has_sqlite = ('sqlite3' in content or 'better-sqlite3' in content or
                       'sql.js' in content or 'initSqlJs' in content or
                       'Database(' in content)  # 通用SQLite检查

        if not has_sqlite:
            bugs.append({
                "id": "DB-002",
                "title": "未使用SQLite数据库 (sqlite3, better-sqlite3, 或 sql.js)",
                "severity": "Critical",
                "type": "架构"
            })

        # 检查是否错误使用了PostgreSQL或MySQL
        if 'require("pg")' in content or 'require("postgres")' in content:
            bugs.append({
                "id": "DB-002-B",
                "title": "使用了PostgreSQL，但架构要求使用SQLite",
                "severity": "Critical",
                "type": "架构"
            })

        if 'require("mysql")' in content:
            bugs.append({
                "id": "DB-002-C",
                "title": "使用了MySQL，但架构要求使用SQLite",
                "severity": "Critical",
                "type": "架构"
            })

        # 检查数据库路径是否指向monopoly.db
        if 'monopoly.db' not in content:
            bugs.append({
                "id": "DB-003",
                "title": "数据库文件路径不正确，应该指向 monopoly.db",
                "severity": "High",
                "type": "配置"
            })

        # 检查是否导出了数据库实例
        if 'module.exports' not in content and 'export' not in content:
            bugs.append({
                "id": "DB-004",
                "title": "数据库连接未导出，其他模块无法使用",
                "severity": "Critical",
                "type": "功能"
            })

        if bugs:
            return {"name": "数据库连接检查", "passed": False, "bugs": bugs}

        return {"name": "数据库连接检查", "passed": True}

    except Exception as e:
        return {
            "name": "数据库连接检查",
            "passed": False,
            "bugs": [{"id": "DB-READ", "title": f"读取数据库连接文件失败: {e}", "severity": "Critical", "type": "功能"}]
        }


def test_fake_data(project_root: Path) -> dict:
    """检查代码中是否使用了假数据或内存存储"""
    backend_src = project_root / "backend" / "src"

    if not backend_src.exists():
        return {"name": "假数据检查", "passed": True, "skipped": True}

    bugs = []
    js_files = list(backend_src.rglob("*.js")) + list(backend_src.rglob("*.jsx"))

    for js_file in js_files:
        try:
            with open(js_file, 'r', encoding='utf-8') as f:
                content = f.read()
                lines = content.split('\n')

            # 检查是否有返回硬编码数据的模式
            fake_data_patterns = [
                ('return [', '返回硬编码数组'),
                ('return {', '返回硬编码对象'),
                ('const data = [', '定义硬编码数据'),
            ]

            for i, line in enumerate(lines, 1):
                # 跳过注释和配置
                if line.strip().startswith('//') or line.strip().startswith('*'):
                    continue

                # 检查是否有明显的数据模型返回假数据
                if 'models' in str(js_file).lower() or 'services' in str(js_file).lower():
                    if 'return' in line and ('[' in line or '{' in line) and 'SELECT' not in content[max(0, i-10):i+10]:
                        # 检查上下文是否是SQL查询
                        if 'db.prepare' not in content[max(0, i-100):i+100]:
                            bugs.append({
                                "id": f"FAKE-{js_file.name}-{i}",
                                "title": f"{js_file.relative_to(project_root)}:{i} 可能返回假数据而非数据库查询",
                                "severity": "Critical",
                                "type": "功能"
                            })

                # 只收集前20个bug避免过多
                if len(bugs) >= 20:
                    break

        except Exception:
            pass

    # 检查是否有内存Map/Set
    for js_file in js_files:
        try:
            with open(js_file, 'r', encoding='utf-8') as f:
                content = f.read()

            if 'new Map()' in content or 'new Set()' in content:
                # 检查是否用于存储游戏数据
                if 'game' in content.lower() or 'player' in content.lower() or 'room' in content.lower():
                    bugs.append({
                        "id": f"MEM-{js_file.name}",
                        "title": f"{js_file.relative_to(project_root)} 使用内存Map/Set存储游戏数据",
                        "severity": "Critical",
                        "type": "架构"
                    })
        except Exception:
            pass

    if bugs:
        return {"name": "假数据/内存存储检查", "passed": False, "bugs": bugs}

    return {"name": "假数据/内存存储检查", "passed": True}


def test_game_logic(project_root: Path) -> dict:
    """检查游戏逻辑是否完整"""
    backend_src = project_root / "backend" / "src"

    if not backend_src.exists():
        return {
            "name": "游戏逻辑检查",
            "passed": False,
            "bugs": [{"id": "LOGIC-001", "title": "backend/src目录不存在", "severity": "Critical", "type": "功能"}]
        }

    # 读取所有JS文件内容
    all_content = ""
    js_files = list(backend_src.rglob("*.js")) + list(backend_src.rglob("*.jsx"))

    for js_file in js_files:
        try:
            with open(js_file, 'r', encoding='utf-8') as f:
                all_content += f.read() + "\n"
        except Exception:
            pass

    bugs = []

    # 检查核心游戏功能
    required_features = {
        'roll|dice|骰子': '掷骰子功能',
        'move|position|移动': '玩家移动功能',
        'buy|purchase|购买': '地产购买功能',
        'rent|租金': '收租功能',
        'jail|监狱': '监狱功能',
        'bankrupt|破产': '破产处理功能',
    }

    for pattern, feature_name in required_features.items():
        import re
        if not re.search(pattern, all_content, re.IGNORECASE):
            bugs.append({
                "id": f"LOGIC-{feature_name[:2].upper()}",
                "title": f"缺少{feature_name}",
                "severity": "High",
                "type": "功能"
            })

    if bugs:
        return {"name": "游戏逻辑检查", "passed": False, "bugs": bugs}

    return {"name": "游戏逻辑检查", "passed": True}
