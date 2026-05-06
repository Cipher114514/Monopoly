"""
Agent工具模块
包含环境检查、代码解析等实用功能
"""

import os
import re
import subprocess
import shutil
import logging
from pathlib import Path
from typing import List, Dict, Tuple, Any, Optional
from datetime import datetime

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# ========================================
# P0-2: 环境检查功能
# ========================================

class EnvironmentChecker:
    """环境检查器"""

    def __init__(self):
        self.checks = []
        self.results = {}

    def check_all(self) -> Dict[str, Any]:
        """执行所有环境检查"""
        self.results = {
            'python': self.check_python(),
            'node': self.check_node(),
            'dependencies': self.check_python_dependencies(),
            'env_file': self.check_env_file(),
            'workspace': self.check_workspace(),
            'timestamp': datetime.now().isoformat()
        }

        # 汇总结果 - 排除非字典值（如timestamp）
        check_results = {k: v for k, v in self.results.items() if k != 'timestamp'}
        all_passed = all(r.get('status') == 'ok' for r in check_results.values())
        self.results['overall'] = 'pass' if all_passed else 'fail'

        return self.results

    def check_python(self) -> Dict[str, Any]:
        """检查Python环境"""
        try:
            import sys
            version = sys.version_info
            return {
                'status': 'ok',
                'version': f"{version.major}.{version.minor}.{version.micro}",
                'executable': sys.executable
            }
        except Exception as e:
            return {'status': 'error', 'message': str(e)}

    def check_node(self) -> Dict[str, Any]:
        """检查Node.js环境"""
        try:
            result = subprocess.run(
                ['node', '--version'],
                capture_output=True,
                text=True,
                timeout=5
            )
            if result.returncode == 0:
                version = result.stdout.strip()
                return {'status': 'ok', 'version': version}
            else:
                return {'status': 'error', 'message': 'Node.js not found'}
        except FileNotFoundError:
            return {'status': 'error', 'message': 'Node.js not installed'}
        except Exception as e:
            return {'status': 'error', 'message': str(e)}

    def check_python_dependencies(self) -> Dict[str, Any]:
        """检查Python依赖"""
        required = ['langchain', 'langchain_core', 'langgraph']
        missing = []

        for package in required:
            try:
                __import__(package.replace('_', '-'))
            except ImportError:
                try:
                    __import__(package)
                except ImportError:
                    missing.append(package)

        if missing:
            return {
                'status': 'warning',
                'message': f'Missing packages: {", ".join(missing)}',
                'missing': missing
            }
        return {'status': 'ok', 'installed': required}

    def check_env_file(self) -> Dict[str, Any]:
        """检查.env文件"""
        env_paths = [
            Path.cwd() / '.env',
            Path(__file__).parent.parent.parent / '.env'
        ]

        for path in env_paths:
            if path.exists():
                # 检查是否包含必要的API密钥
                content = path.read_text()
                has_key = any(k in content for k in ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY'])
                return {
                    'status': 'ok',
                    'path': str(path),
                    'has_api_key': has_key
                }

        return {
            'status': 'warning',
            'message': '.env file not found',
            'suggestion': 'Create .env file with API keys'
        }

    def check_workspace(self) -> Dict[str, Any]:
        """检查工作空间"""
        workspace = Path.cwd() / 'mock-monopoly'

        if workspace.exists():
            return {
                'status': 'ok',
                'path': str(workspace),
                'exists': True
            }

        # 尝试创建
        try:
            workspace.mkdir(parents=True, exist_ok=True)
            return {
                'status': 'ok',
                'path': str(workspace),
                'created': True
            }
        except Exception as e:
            return {'status': 'error', 'message': str(e)}

    def print_report(self):
        """打印环境检查报告"""
        print("\n" + "="*70)
        print("🔍 环境检查报告")
        print("="*70)

        for name, result in self.results.items():
            if name == 'timestamp' or name == 'overall':
                continue

            status_icon = {
                'ok': '✅',
                'warning': '⚠️',
                'error': '❌'
            }.get(result.get('status', 'unknown'), '❓')

            print(f"\n{status_icon} {name.upper()}")
            if result.get('status') == 'ok':
                for key, value in result.items():
                    if key != 'status':
                        print(f"   - {key}: {value}")
            else:
                print(f"   - 问题: {result.get('message', 'Unknown error')}")

        print("\n" + "="*70)
        overall = self.results.get('overall', 'unknown')
        overall_icon = '✅' if overall == 'pass' else '⚠️'
        print(f"{overall_icon} 总体状态: {overall.upper()}")
        print("="*70 + "\n")


# ========================================
# P0-1: 增强的代码解析功能
# ========================================

class EnhancedCodeParser:
    """增强的代码解析器，支持多种格式"""

    def __init__(self, workspace_path: str = "mock-monopoly"):
        self.workspace_path = workspace_path
        self.saved_files = []
        self.parse_errors = []

    def parse_and_save(self, content: str) -> Tuple[List[str], List[Dict]]:
        """
        解析AI输出并保存文件

        支持的格式:
        1. [FILE: path] ```lang\ncode\n```
        2. [FILE: path] `lang\ncode\n`
        3. ```lang filename="path"\ncode\n```
        4. <file path="path">code</file>
        """
        self.saved_files = []
        self.parse_errors = []

        # 确保工作空间存在
        os.makedirs(self.workspace_path, exist_ok=True)

        # 尝试多种解析策略
        strategies = [
            self._parse_triple_backtick,
            self._parse_single_backtick,
            self._parse_xml_style,
            self._parse_indented_code
        ]

        for strategy in strategies:
            try:
                files = strategy(content)
                if files:
                    self.saved_files.extend(files)
                    logger.info(f"策略 {strategy.__name__} 解析到 {len(files)} 个文件")
            except Exception as e:
                self.parse_errors.append({
                    'strategy': strategy.__name__,
                    'error': str(e)
                })

        # 去重
        unique_files = list({f[0]: f for f in self.saved_files}.values())
        self.saved_files = unique_files

        return self.saved_files, self.parse_errors

    def _parse_triple_backtick(self, content: str) -> List[Tuple[str, str]]:
        """解析三反引号格式: [FILE: path] ```lang\ncode\n```"""
        files = []
        # 使用更健壮的正则表达式 - 按文件块分割而不是全局匹配
        # 这样可以正确处理代码中包含```的情况
        file_block_pattern = r'\[FILE:\s*([^\]]+?)\]\s*```(?:[a-zA-Z+]*)?\n'

        # 分割内容找到所有文件块
        parts = re.split(file_block_pattern, content, flags=re.DOTALL)

        # parts结构: [前缀, file1_path, file1_code_search, file2_path, file2_code_search, ...]
        for i in range(1, len(parts), 2):
            if i + 1 >= len(parts):
                break

            file_path = parts[i].strip()
            remaining_content = parts[i + 1]

            # 查找代码块的结束位置
            # 需要找到匹配的结束```，并且不能是代码块开始的```
            code_lines = []
            lines = remaining_content.split('\n')
            in_code = True
            bracket_count = 0  # 跟踪未闭合的括号/大括号

            for line in lines:
                stripped = line.strip()

                # 检查是否是代码块结束
                if stripped == '```' and in_code:
                    # 检查是否有未闭合的括号
                    if bracket_count == 0:
                        break
                    # 如果有未闭合的括号，继续收集

                # 计算括号
                bracket_count += line.count('{') + line.count('(')
                bracket_count -= line.count('}') + line.count(')')

                if in_code:
                    code_lines.append(line)

            file_content = '\n'.join(code_lines).strip()

            # 检查是否被截断
            if file_content and not file_content.endswith('}'):
                # 检查JSX组件是否有未闭合的标签
                open_tags = file_content.count('<') + file_content.count('{')
                close_tags = file_content.count('>') + file_content.count('}')
                if open_tags > close_tags:
                    # 文件被截断，记录但不保存
                    self.parse_errors.append({
                        'file': file_path,
                        'error': 'File truncated - unclosed tags/braces'
                    })
                    continue

            if file_content and self._save_file(file_path, file_content):
                files.append((file_path, file_content))

        return files

    def _parse_single_backtick(self, content: str) -> List[Tuple[str, str]]:
        """解析单反引号格式: [FILE: path] `lang\ncode\n`"""
        files = []
        parts = content.split('[FILE:')

        for part in parts[1:]:
            lines = part.split('\n')
            if not lines:
                continue

            # 提取文件路径 - 只取第一个 ` 或 ] 之前的内容
            first_line = lines[0].strip()

            # 查找分隔符（` 或 ]）
            for delimiter in ['`', ']']:
                if delimiter in first_line:
                    parts_path = first_line.split(delimiter)[0].strip()
                    if parts_path:
                        file_path = parts_path
                        break
            else:
                # 没有分隔符，使用清理后的整行
                file_path = re.sub(r'[`\]]', '', first_line).strip()

            # 额外清理：移除路径末尾的非文件名字符（如语言标识符）
            # 通过检查是否有已知的文件扩展名来判断
            if file_path:
                # 如果路径末尾有额外单词，移除它
                path_parts = file_path.split()
                if len(path_parts) > 1:
                    # 取第一部分作为真正的文件路径
                    file_path = path_parts[0]

            if not file_path:
                continue

            # 提取代码
            code_lines = []
            in_code = False

            for line in lines[1:]:
                if line.strip() == '`' and in_code:
                    break
                elif line.strip() == '`' and not in_code:
                    in_code = True
                    continue
                elif in_code or (line.strip() and not line.startswith('`')):
                    code_lines.append(line)

            if code_lines:
                file_content = '\n'.join(code_lines).strip()
                if self._save_file(file_path, file_content):
                    files.append((file_path, file_content))

        return files

    def _parse_xml_style(self, content: str) -> List[Tuple[str, str]]:
        """解析XML风格: <file path="path">code</file>"""
        files = []
        pattern = r'<file\s+path=["\']([^"\']+)["\']>\s*(.*?)\s*</file>'
        matches = re.findall(pattern, content, re.DOTALL)

        for file_path, file_content in matches:
            if self._save_file(file_path, file_content):
                files.append((file_path, file_content))

        return files

    def _parse_indented_code(self, content: str) -> List[Tuple[str, str]]:
        """解析缩进代码块（备用方案）"""
        files = []

        # 查找可能的文件名模式
        # 例如: === backend/src/server.js ===
        pattern = r'[=]{3,}\s*(\S+)\s*[=]{3,}\s*\n(.*?)(?=\n[=]{3,}|\Z)'
        matches = re.findall(pattern, content, re.DOTALL)

        for file_path, file_content in matches:
            if self._save_file(file_path, file_content):
                files.append((file_path, file_content))

        return files

    def _save_file(self, file_path: str, content: str) -> bool:
        """保存单个文件"""
        try:
            # 清理路径
            file_path = file_path.strip().lstrip('/')
            file_path = file_path.replace('\\', '/')

            full_path = os.path.join(self.workspace_path, file_path)
            full_path = full_path.replace('/', os.sep)

            # 创建目录
            os.makedirs(os.path.dirname(full_path), exist_ok=True)

            # 写入文件
            with open(full_path, 'w', encoding='utf-8') as f:
                f.write(content.strip())

            logger.info(f"✓ 已保存: {file_path}")
            return True

        except Exception as e:
            logger.error(f"✗ 保存失败 {file_path}: {e}")
            self.parse_errors.append({
                'file': file_path,
                'error': str(e)
            })
            return False

    def get_statistics(self) -> Dict[str, Any]:
        """获取解析统计信息"""
        backend_count = 0
        frontend_count = 0
        css_count = 0
        js_count = 0

        for file_path, _ in self.saved_files:
            path_lower = file_path.lower()

            # 统计CSS文件
            if file_path.endswith('.css'):
                css_count += 1

            # 统计JS文件
            if file_path.endswith('.js') or file_path.endswith('.jsx'):
                js_count += 1

            # 统计后端文件 - 包含backend或server，且不包含frontend/client
            if ('backend' in path_lower or 'server' in path_lower or 'api' in path_lower or \
                'models' in path_lower or 'config' in path_lower) and \
               'frontend' not in path_lower and 'client' not in path_lower:
                backend_count += 1

            # 统计前端文件 - 包含frontend、client、components、hooks、utils等
            if ('frontend' in path_lower or 'client' in path_lower or 'components' in path_lower or \
                'hooks' in path_lower or ('public' in path_lower and 'index.html' in path_lower)):
                frontend_count += 1

        return {
            'total': len(self.saved_files),
            'backend': backend_count,
            'frontend': frontend_count,
            'css': css_count,
            'javascript': js_count,
            'errors': len(self.parse_errors)
        }


# ========================================
# P1-5: 增强的错误处理
# ========================================

class AgentErrorHandler:
    """Agent错误处理器"""

    def __init__(self):
        self.errors = []
        self.warnings = []

    def handle_agent_error(self, agent_name: str, error: Exception,
                          state: Dict = None, retry: int = 0) -> Dict[str, Any]:
        """处理Agent错误"""
        error_info = {
            'agent': agent_name,
            'error_type': type(error).__name__,
            'message': str(error),
            'retry': retry,
            'timestamp': datetime.now().isoformat(),
            'state_keys': list(state.keys()) if state else []
        }

        self.errors.append(error_info)
        logger.error(f"Agent {agent_name} 错误: {error}")

        # 返回错误处理策略
        return self._get_recovery_strategy(agent_name, error, state)

    def _get_recovery_strategy(self, agent_name: str, error: Exception,
                              state: Dict = None) -> Dict[str, Any]:
        """获取恢复策略"""
        strategies = {
            'CodingAgent': {
                'action': 'retry_with_fallback',
                'fallback': 'use_mock_data',
                'max_retries': 3
            },
            'TestingAgent': {
                'action': 'skip_if_environment_issue',
                'continue': True
            },
            'default': {
                'action': 'log_and_continue',
                'continue': True
            }
        }

        # 检查是否是可恢复的错误
        if 'Connection' in str(error) or 'timeout' in str(error).lower():
            return {'action': 'retry', 'max_retries': 3}

        if 'FileNotFound' in str(error) or 'Path' in str(error):
            return {'action': 'create_path', 'continue': True}

        return strategies.get(agent_name, strategies['default'])

    def add_warning(self, agent_name: str, message: str):
        """添加警告"""
        warning = {
            'agent': agent_name,
            'message': message,
            'timestamp': datetime.now().isoformat()
        }
        self.warnings.append(warning)
        logger.warning(f"Agent {agent_name} 警告: {message}")

    def get_report(self) -> Dict[str, Any]:
        """获取错误报告"""
        return {
            'total_errors': len(self.errors),
            'total_warnings': len(self.warnings),
            'errors_by_agent': self._count_by_agent(self.errors),
            'warnings_by_agent': self._count_by_agent(self.warnings),
            'errors': self.errors[-10:],  # 最近10个
            'warnings': self.warnings[-10:]
        }

    def _count_by_agent(self, items: List[Dict]) -> Dict[str, int]:
        """按Agent统计"""
        counts = {}
        for item in items:
            agent = item.get('agent', 'unknown')
            counts[agent] = counts.get(agent, 0) + 1
        return counts


# ========================================
# P1-4: 断点续传支持
# ========================================

class WorkflowStateManager:
    """工作流状态管理器 - 支持断点续传"""

    def __init__(self, state_file: str = ".workflow_state.json"):
        self.state_file = state_file
        self.current_state = None

    def save_state(self, state: Dict, stage: str):
        """保存当前状态"""
        import json
        from langchain_core.messages import BaseMessage

        def make_serializable(obj):
            """递归转换对象为可序列化格式"""
            if isinstance(obj, BaseMessage):
                return {
                    'type': obj.__class__.__name__,
                    'content': getattr(obj, 'content', str(obj))
                }
            elif isinstance(obj, dict):
                return {k: make_serializable(v) for k, v in obj.items()}
            elif isinstance(obj, (list, tuple)):
                return [make_serializable(item) for item in obj]
            elif hasattr(obj, '__dict__'):
                # 处理带有 __dict__ 的自定义对象
                return make_serializable(obj.__dict__)
            else:
                # 尝试直接序列化，失败则转为字符串
                try:
                    json.dumps(obj)
                    return obj
                except (TypeError, ValueError):
                    return str(obj)

        # 创建可序列化的状态副本
        serializable_state = {}
        for key, value in state.items():
            try:
                serializable_state[key] = make_serializable(value)
            except Exception as e:
                logger.warning(f"Failed to serialize {key}: {e}")
                serializable_state[key] = str(value)

        state_data = {
            'stage': stage,
            'state': serializable_state,
            'timestamp': datetime.now().isoformat()
        }

        try:
            import json
            with open(self.state_file, 'w', encoding='utf-8') as f:
                json.dump(state_data, f, indent=2, ensure_ascii=False)
            logger.info(f"状态已保存: 阶段 {stage}")
        except Exception as e:
            logger.error(f"保存状态失败: {e}")

    def load_state(self) -> Optional[Dict]:
        """加载已保存的状态"""
        if not os.path.exists(self.state_file):
            return None

        try:
            import json
            with open(self.state_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            self.current_state = data
            logger.info(f"状态已加载: 阶段 {data.get('stage')}")
            return data
        except Exception as e:
            logger.error(f"加载状态失败: {e}")
            return None

    def clear_state(self):
        """清除保存的状态"""
        if os.path.exists(self.state_file):
            os.remove(self.state_file)
            logger.info("状态已清除")

    def get_resume_stage(self) -> Optional[str]:
        """获取恢复的阶段"""
        if self.current_state:
            return self.current_state.get('stage')
        return None

    def get_saved_state_data(self) -> Optional[Dict]:
        """获取保存的状态数据"""
        if self.current_state:
            return self.current_state.get('state')
        return None


# ========================================
# 便捷函数
# ========================================

def check_environment() -> Dict[str, Any]:
    """检查环境（便捷函数）"""
    checker = EnvironmentChecker()
    results = checker.check_all()
    checker.print_report()
    return results


def parse_and_save_code(content: str, workspace: str = "mock-monopoly") -> Tuple[List[str], List[Dict]]:
    """解析并保存代码（便捷函数）"""
    parser = EnhancedCodeParser(workspace)
    files, errors = parser.parse_and_save(content)
    return files, errors


def save_workflow_state(state: Dict, stage: str, state_file: str = ".workflow_state.json"):
    """保存工作流状态（便捷函数）"""
    manager = WorkflowStateManager(state_file)
    manager.save_state(state, stage)


def load_workflow_state(state_file: str = ".workflow_state.json") -> Optional[Dict]:
    """加载工作流状态（便捷函数）"""
    manager = WorkflowStateManager(state_file)
    return manager.load_state()
