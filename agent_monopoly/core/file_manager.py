"""
文件管理器 - 统一管理Agent输出的文件读写

所有Agent的大块输出（PRD、架构、设计等）都保存为独立文件
State中只保存文件路径和元数据引用
"""

import os
import json
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, Optional


class WorkspaceManager:
    """
    工作区管理器

    管理Agent输出的所有文件，包括：
    - PRD文档 (prd.md)
    - 任务列表 (tasks.md)
    - 架构文档 (architecture.md)
    - 设计文档 (design.md)
    - 代码文件 (backend/, frontend/)
    - 测试报告 (tests/)
    - QA报告 (qa.md)
    - 技术文档 (docs/)
    """

    def __init__(self, workspace_root: str = "workspace"):
        """
        初始化工作区管理器

        Args:
            workspace_root: 工作区根目录路径
        """
        self.workspace_root = Path(workspace_root)
        self._ensure_workspace()

    def _ensure_workspace(self):
        """确保工作区目录结构存在"""
        directories = [
            self.workspace_root,
            self.workspace_root / "backend",
            self.workspace_root / "frontend",
            self.workspace_root / "docs",
            self.workspace_root / "tests",
        ]
        for directory in directories:
            directory.mkdir(parents=True, exist_ok=True)

    def get_path(self, artifact_type: str) -> Path:
        """
        获取指定类型文件的路径

        Args:
            artifact_type: 文件类型 (prd, tasks, architecture, design, qa, etc.)

        Returns:
            文件完整路径
        """
        paths = {
            "prd": self.workspace_root / "prd.md",
            "tasks": self.workspace_root / "tasks.md",
            "architecture": self.workspace_root / "architecture.md",
            "design": self.workspace_root / "design.md",
            "qa": self.workspace_root / "qa_report.md",
            "state": self.workspace_root / ".." / "state.json",
        }
        return paths.get(artifact_type, self.workspace_root / f"{artifact_type}.md")

    def write_markdown(self, artifact_type: str, content: str) -> str:
        """
        写入Markdown文件

        Args:
            artifact_type: 文件类型
            content: 文件内容

        Returns:
            文件的相对路径 (用于存储在State中)
        """
        file_path = self.get_path(artifact_type)

        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)

        # 返回相对于workspace的路径
        return f"{artifact_type}.md"

    def read_markdown(self, artifact_type: str) -> Optional[str]:
        """
        读取Markdown文件

        Args:
            artifact_type: 文件类型

        Returns:
            文件内容，如果文件不存在返回None
        """
        file_path = self.get_path(artifact_type)

        if not file_path.exists():
            return None

        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()

    def write_code(self, component: str, file_type: str, filename: str, content: str) -> str:
        """
        写入代码文件

        Args:
            component: 组件名 (backend 或 frontend)
            file_type: 文件类型 (src, models, routes, components, etc.)
            filename: 文件名
            content: 文件内容

        Returns:
            文件的相对路径
        """
        component_dir = self.workspace_root / component
        if file_type:
            component_dir = component_dir / file_type

        component_dir.mkdir(parents=True, exist_ok=True)

        file_path = component_dir / filename

        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)

        # 返回相对于workspace的路径
        relative_path = file_path.relative_to(self.workspace_root)
        return str(relative_path)

    def write_json(self, artifact_type: str, data: dict) -> str:
        """
        写入JSON文件

        Args:
            artifact_type: 文件类型
            data: 要写入的数据

        Returns:
            文件的相对路径
        """
        file_path = self.get_path(artifact_type).with_suffix('.json')

        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        return f"{artifact_type}.json"

    def read_json(self, artifact_type: str) -> Optional[dict]:
        """
        读取JSON文件

        Args:
            artifact_type: 文件类型

        Returns:
            解析后的数据，如果文件不存在返回None
        """
        file_path = self.get_path(artifact_type).with_suffix('.json')

        if not file_path.exists():
            return None

        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)


def create_file_reference(artifact_type: str, filename: str,
                         metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    创建文件引用对象（用于存储在State中）

    Args:
        artifact_type: 文件类型
        filename: 文件名（相对路径）
        metadata: 额外的元数据

    Returns:
        文件引用字典
    """
    ref = {
        "file_path": filename,
        "artifact_type": artifact_type,
        "updated_at": datetime.now().isoformat(),
    }

    if metadata:
        ref.update(metadata)

    return ref


def load_content_from_reference(workspace: WorkspaceManager,
                                ref: Dict[str, Any]) -> Optional[str]:
    """
    从文件引用加载内容

    Args:
        workspace: 工作区管理器
        ref: 文件引用对象

    Returns:
        文件内容，如果读取失败返回None
    """
    if not ref or "file_path" not in ref:
        return None

    # 从file_path中获取artifact_type
    file_path = ref.get("file_path", "")
    artifact_type = file_path.split('.')[0] if '.' in file_path else None

    if artifact_type and file_path.endswith('.md'):
        return workspace.read_markdown(artifact_type)
    elif file_path.endswith('.json'):
        # JSON文件需要特殊处理
        data = workspace.read_json(artifact_type)
        return json.dumps(data, ensure_ascii=False, indent=2) if data else None

    return None
