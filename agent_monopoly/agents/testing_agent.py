"""
Testing Agent - 健壮的大规模代码测试
支持分批处理、并行测试、失败重试、增量检测
"""

import os
import re
import tempfile
import shutil
import subprocess
import json
import hashlib
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import List, Dict, Tuple, Optional
from datetime import datetime


try:
    from agent_state import AgentState
except ImportError:
    from typing import TypedDict, Annotated, Sequence
    from operator import add
    from langchain_core.messages import BaseMessage

    class AgentState(TypedDict):
        messages: Annotated[Sequence[BaseMessage], add]
        current_agent: str
        iteration_count: int
        prd: dict
        tasks: list
        architecture: dict
        design: dict
        code: dict
        review: dict
        test_results: dict
        qa_report: dict
        documentation: dict
        memory_context: str
        skill_results: list[str]
        validation_status: list[str]
        project_name: str
        user_requirement: str


# 配置常量
BATCH_SIZE = 10  # 每批处理的文件数量
MAX_RETRIES = 2  # LLM生成失败重试次数
MAX_PARALLEL_BATCHES = 3  # 并行批处理数量
FILE_SIZE_LIMIT = 5000  # 单个文件字符数限制（超过则截取）
TOKEN_LIMIT = 8000  # LLM输入token限制（估算）


def get_file_priority(rel_path: str) -> int:
    """获取文件优先级（数字越小优先级越高）"""
    path_lower = rel_path.lower()

    # 核心业务逻辑
    if 'service' in path_lower:
        return 1
    if 'controller' in path_lower or 'handler' in path_lower:
        return 2

    # 数据模型
    if 'model' in path_lower or 'entity' in path_lower or 'domain' in path_lower:
        return 3

    # 数据库
    if 'database' in path_lower or 'db' in path_lower or 'repository' in path_lower:
        return 4

    # 工具类
    if 'util' in path_lower or 'helper' in path_lower or 'common' in path_lower:
        return 5

    # 配置
    if 'config' in path_lower:
        return 6

    return 10  # 默认优先级


def truncate_content(content: str, max_chars: int = FILE_SIZE_LIMIT) -> str:
    """截取文件内容，保留重要部分"""
    if len(content) <= max_chars:
        return content

    # 保留开头和结尾
    half = max_chars // 2
    return content[:half] + "\n\n// ... (内容已截取) ...\n\n" + content[-half:]


def estimate_tokens(text: str) -> int:
    """估算文本的token数量（粗略估算：1 token ≈ 3 字符）"""
    return len(text) // 3


def parse_js_file(content: str) -> Dict:
    """解析JavaScript文件"""
    result = {'requires': [], 'exports': [], 'classes': [], 'is_class_export': False}

    require_pattern = r"require\(['\"]([^'\"]+)['\"]\)"
    for match in re.finditer(require_pattern, content):
        result['requires'].append(match.group(1))

    class_pattern = r"class\s+(\w+)\s*(?:extends\s+(\w+))?\s*\{"
    for match in re.finditer(class_pattern, content):
        result['classes'].append({'name': match.group(1), 'extends': match.group(2) if match.group(2) else None})

    if 'module.exports = ' in content:
        for cls in result['classes']:
            if f'module.exports = {cls["name"]}' in content or f'module.exports={cls["name"]}' in content:
                result['is_class_export'] = True
                result['exports'].append({'type': 'class', 'name': cls['name']})
                break

    if not result['is_class_export']:
        single_export_pattern = r"module\.exports\s*=\s*(\w+)"
        match = re.search(single_export_pattern, content)
        if match:
            name = match.group(1)
            if name not in ['require', 'module', 'exports']:
                result['exports'].append({'type': 'single', 'name': name})

    return result


def create_batch_prompt(js_files: List[Tuple[str, Path, str]], batch_num: int, total_batches: int) -> str:
    """为一批文件创建LLM prompt"""
    files_summary = []
    all_code = "// 批次 " + str(batch_num) + "/" + str(total_batches) + "\n"

    for rel_path, _, content in js_files:
        parsed = parse_js_file(content)
        if parsed['is_class_export']:
            export_type = f"类 {parsed['exports'][0]['name']}"
        elif parsed['exports']:
            export_type = f"导出 {parsed['exports'][0]['name']}"
        else:
            export_type = "模块"

        files_summary.append({'path': rel_path, 'type': export_type})

        # 添加代码（截取长文件）
        truncated = truncate_content(content)
        all_code += f"\n// ===== 文件: {rel_path} ({export_type}) =====\n"
        all_code += truncated + "\n"

    prompt = f"""你是JavaScript测试专家。请为以下{len(js_files)}个文件生成测试代码。

文件列表:
"""
    for info in files_summary:
        prompt += f"  - {info['path']}: {info['type']}\n"

    prompt += f"""

完整代码:
{all_code}

要求：
1. 使用模块包装方式：(function() {{ 'use strict'; ... }})();
2. require路径使用相对于backend/src目录的路径，如:
   - database/db.js -> require('./database/db.js')
   - models/Game.js -> require('./models/Game.js')
   - services/gameService.js -> require('./services/gameService.js')
3. 对于类：创建实例，测试不报错即可
4. 对于函数：测试函数存在且可调用
5. 对于async方法：用async/await包装
6. 每个测试用try-catch包裹
7. 成功时输出: ✓ 测试描述
8. 失败时输出: ✗ 测试描述: 错误信息

输出格式（严格按此格式）：

// ===== 测试文件: database/db.js =====
(async function() {{
    try {{
        const db = require('./database/db.js');
        console.log('✓ db loaded');
    }} catch (e) {{
        console.log(`✗ db failed: ${{e.message}}`);
    }}
}})();

// ===== 测试文件: models/Game.js =====
(async function() {{
    try {{
        const Game = require('./models/Game.js');
        const game = new Game();
        console.log('✓ Game instantiated');
    }} catch (e) {{
        console.log(`✗ Game failed: ${{e.message}}`);
    }}
}})();

请生成所有{len(js_files)}个文件的测试代码："""

    return prompt


def parse_llm_output(test_output: str, js_files: List[Tuple[str, Path, str]]) -> Dict[str, str]:
    """解析LLM输出，返回 {文件路径: 测试代码}"""
    tests_by_file = {}

    # 清理markdown标记
    test_output = test_output.strip()
    if test_output.startswith('```'):
        test_output = test_output.split('```')[1]
        if test_output.startswith(('javascript', 'js')):
            test_output = test_output.split('\n', 1)[1]
    if test_output.endswith('```'):
        test_output = test_output[:-3]

    # 按文件标记分割
    parts = test_output.split('// ===== 测试文件:')

    for i, part in enumerate(parts):
        part = part.strip()
        if not part or i == 0:
            continue

        lines = part.split('\n')
        first_line = lines[0].strip()

        # 匹配文件名
        matched_file = None
        for rel_path, _, _ in js_files:
            path_variants = [
                rel_path,
                rel_path.replace('\\', '/'),
                rel_path.replace('/', '\\'),
            ]
            if any(variant in first_line for variant in path_variants):
                matched_file = rel_path
                break

        if matched_file:
            test_code = '\n'.join(lines[1:]).strip()
            tests_by_file[matched_file] = test_code

    return tests_by_file


def run_single_test(test_code: str, workspace: Path, file_path: str) -> Tuple[str, bool, List[str]]:
    """运行单个测试"""
    backend_src = workspace / "backend" / "src"
    test_file = backend_src / "_test_temp.js"

    # LLM已经生成了包装好的代码，直接写入
    test_file.write_text(test_code, encoding='utf-8')

    result = subprocess.run(
        ["node", "_test_temp.js"],
        cwd=backend_src,
        capture_output=True,
        text=True,
        encoding='utf-8',
        errors='replace',
        timeout=15
    )

    output = result.stdout or ""
    if result.stderr:
        output += "\n" + result.stderr

    has_error = False
    error_lines = []

    for line in output.split('\n'):
        if line.strip().startswith('✗'):
            has_error = True
            error_lines.append(line.strip())

    if 'Error:' in output or 'TypeError:' in output or 'ReferenceError:' in output or 'SyntaxError:' in output:
        has_error = True
        for line in output.split('\n'):
            if any(err in line for err in ['Error:', 'TypeError:', 'ReferenceError:', 'SyntaxError:']):
                error_lines.append(line.strip())

    return output, has_error, error_lines


def process_batch(llm, js_files: List[Tuple[str, Path, str]], workspace: Path,
                  batch_num: int, total_batches: int, retry_count: int = 0) -> Dict:
    """处理一批文件的测试生成和运行"""
    batch_result = {
        'batch_num': batch_num,
        'files': [],
        'retry_count': retry_count,
        'success': False
    }

    try:
        # 生成prompt
        prompt = create_batch_prompt(js_files, batch_num, total_batches)

        # 调用LLM
        response = llm.invoke(prompt)
        test_output = response.content.strip()

        # 解析输出
        tests_by_file = parse_llm_output(test_output, js_files)

        if not tests_by_file:
            if retry_count < MAX_RETRIES:
                return process_batch(llm, js_files, workspace, batch_num, total_batches, retry_count + 1)
            batch_result['error'] = "解析失败，已达最大重试次数"
            return batch_result

        # 运行测试
        for rel_path, dst_file, content in js_files:
            test_code = tests_by_file.get(rel_path)

            if not test_code:
                batch_result['files'].append({
                    'file': rel_path,
                    'status': 'skipped',
                    'reason': '无测试代码'
                })
                continue

            output, has_error, error_lines = run_single_test(test_code, workspace, rel_path)

            if has_error:
                batch_result['files'].append({
                    'file': rel_path,
                    'status': 'failed',
                    'output': output,
                    'errors': error_lines
                })
            else:
                passed_count = output.count('✓')
                batch_result['files'].append({
                    'file': rel_path,
                    'status': 'passed',
                    'test_count': passed_count,
                    'output': output
                })

        batch_result['success'] = True

    except Exception as e:
        if retry_count < MAX_RETRIES:
            return process_batch(llm, js_files, workspace, batch_num, total_batches, retry_count + 1)
        batch_result['error'] = str(e)

    return batch_result


def create_testing_agent(
    llm,
    test_source_path=None,
    keep_workspace=False,
    batch_size=BATCH_SIZE,
    max_parallel=MAX_PARALLEL_BATCHES,
    include_patterns=None,
    exclude_patterns=None
):
    """
    创建健壮的Testing Agent

    Args:
        llm: LLM实例
        test_source_path: 测试源代码路径
        keep_workspace: 是否保留工作空间
        batch_size: 每批处理的文件数量
        max_parallel: 最大并行批处理数量
        include_patterns: 包含的文件模式列表
        exclude_patterns: 排除的文件模式列表
    """
    source_path = test_source_path or "mock-monopoly/backend/src"

    def testing_agent(state: AgentState, keep_ws=keep_workspace) -> AgentState:
        print("\n" + "="*70)
        print("🧪 Testing Agent - 大规模代码测试")
        print("="*70)

        workspace = Path(tempfile.mkdtemp(prefix="test_"))
        print(f"工作空间: {workspace}")

        all_results = {'passed': 0, 'failed': 0, 'skipped': 0, 'files': []}

        try:
            # 1. 收集所有文件
            print("\n收集文件...")
            project_root = Path(__file__).parent.parent.parent
            mock_src = project_root / source_path

            if not mock_src.exists():
                state["test_results"] = {"error": "源代码路径不存在", "passed": 0, "failed": 0, "summary": "路径不存在"}
                return state

            backend_dir = workspace / "backend" / "src"
            os.makedirs(backend_dir, exist_ok=True)

            js_files = []
            for root, dirs, files in os.walk(mock_src):
                for file in files:
                    if not file.endswith(('.js', '.jsx', '.ts', '.tsx')):
                        continue

                    src_file = Path(root) / file
                    rel_path = src_file.relative_to(mock_src)
                    dst_file = backend_dir / rel_path
                    dst_file.parent.mkdir(parents=True, exist_ok=True)

                    with open(src_file, 'r', encoding='utf-8') as f:
                        content = f.read()
                    with open(dst_file, 'w', encoding='utf-8') as f:
                        f.write(content)

                    js_files.append((str(rel_path), dst_file, content))

            # 过滤文件
            if include_patterns:
                js_files = [f for f in js_files if any(p in f[0] for p in include_patterns)]
            if exclude_patterns:
                js_files = [f for f in js_files if not any(p in f[0] for p in exclude_patterns)]

            print(f"  找到 {len(js_files)} 个文件")

            if not js_files:
                state["test_results"] = {"error": "没有找到需要测试的文件", "passed": 0, "failed": 0, "summary": "无文件"}
                return state

            # 2. 按优先级排序
            js_files.sort(key=lambda x: (get_file_priority(x[0]), x[0]))

            # 3. 分批
            batches = []
            for i in range(0, len(js_files), batch_size):
                batch = js_files[i:i + batch_size]
                batches.append(batch)

            print(f"  分成 {len(batches)} 批，每批最多 {batch_size} 个文件")

            # 4. 并行处理批次
            print("\n" + "-"*50)
            print("生成并运行测试")
            print("-"*50)

            completed_batches = 0

            with ThreadPoolExecutor(max_workers=max_parallel) as executor:
                futures = {}
                for batch_idx, batch in enumerate(batches, 1):
                    future = executor.submit(
                        process_batch,
                        llm,
                        batch,
                        workspace,
                        batch_idx,
                        len(batches)
                    )
                    futures[future] = batch_idx

                for future in as_completed(futures):
                    batch_idx = futures[future]
                    try:
                        result = future.result(timeout=120)

                        if not result.get('success'):
                            print(f"\n[批次 {batch_idx}] ✗ 失败: {result.get('error', '未知错误')}")
                            continue

                        # 处理结果
                        for file_result in result.get('files', []):
                            status = file_result['status']
                            all_results['files'].append(file_result)

                            if status == 'passed':
                                all_results['passed'] += 1
                                print(f"\n[批次 {batch_idx}] ✓ {file_result['file']} ({file_result['test_count']} 个测试)")
                            elif status == 'failed':
                                all_results['failed'] += 1
                                errors = file_result.get('errors', [])
                                print(f"\n[批次 {batch_idx}] ✗ {file_result['file']}")
                                for err in errors[:2]:
                                    print(f"    {err[:80]}")
                            else:
                                all_results['skipped'] += 1
                                print(f"\n[批次 {batch_idx}] ⚠ {file_result['file']} - {file_result.get('reason', '跳过')}")

                    except Exception as e:
                        print(f"\n[批次 {batch_idx}] ✗ 异常: {e}")

                    completed_batches += 1
                    print(f"  进度: {completed_batches}/{len(batches)} 批完成", end='\r')

            print()  # 换行

            # 5. 汇总结果
            print("\n" + "="*70)
            print("测试汇总")
            print("="*70)

            for result in all_results['files']:
                if result['status'] == 'passed':
                    print(f"  ✓ {result['file']} ({result['test_count']} 个测试)")
                elif result['status'] == 'failed':
                    print(f"  ✗ {result['file']}")
                else:
                    print(f"  ⚠ {result['file']} - {result.get('reason', '跳过')}")

            print(f"\n总计: {all_results['passed']} 通过, {all_results['failed']} 失败, {all_results['skipped']} 跳过")

            state["test_results"] = {
                "passed": all_results['passed'],
                "failed": all_results['failed'],
                "skipped": all_results['skipped'],
                "summary": f"{all_results['passed']} 通过, {all_results['failed']} 失败",
                "details": all_results['files'],
                "total_tests": all_results['passed'] + all_results['failed']
            }

        except Exception as e:
            print(f"\n错误: {e}")
            import traceback
            traceback.print_exc()

            state["test_results"] = {
                "error": str(e),
                "passed": all_results['passed'],
                "failed": all_results['failed'],
                "summary": f"执行错误: {e}"
            }

        finally:
            if not keep_ws:
                shutil.rmtree(workspace, ignore_errors=True)
            else:
                print(f"\n💾 工作空间已保留: {workspace}")

        state["current_agent"] = "Testing Agent"
        return state

    return testing_agent
