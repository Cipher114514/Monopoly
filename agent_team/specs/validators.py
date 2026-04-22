"""
规范验证器
定义PRD和代码的输出规范，并提供验证功能
"""

from pydantic import BaseModel, Field


class PRDSpec(BaseModel):
    """PRD 输出规范"""
    product_name: str = Field(description="产品名称")
    features: list[str] = Field(description="功能列表")
    target_users: str = Field(description="目标用户")
    success_criteria: list[str] = Field(description="验收标准")

    def to_markdown(self) -> str:
        """转换为 Markdown 格式"""
        return f"""# 产品需求文档

## 产品名称
{self.product_name}

## 核心功能
{chr(10).join([f'{i+1}. {f}' for i, f in enumerate(self.features)])}

## 目标用户
{self.target_users}

## 验收标准
{chr(10).join([f'- {c}' for c in self.success_criteria])}
"""


class CodeSpec(BaseModel):
    """代码输出规范"""
    language: str = Field(description="编程语言")
    code: str = Field(description="代码内容")
    filename: str = Field(description="建议的文件名")
    dependencies: list[str] = Field(description="依赖列表")

    def validate(self) -> bool:
        """验证代码规范"""
        if self.language != "python":
            return False
        if "def main(" not in self.code:
            return False
        return True

    def to_markdown(self) -> str:
        """转换为 Markdown 格式"""
        return f"""# 代码实现

## 语言
{self.language}

## 文件名
{self.filename}

## 依赖
{', '.join(self.dependencies) if self.dependencies else '无'}

## 代码
```{self.language}
{self.code}
```
"""


class SpecValidator:
    """规范验证器"""

    @staticmethod
    def validate_prd(state: dict) -> tuple[bool, str]:
        """验证 PRD 规范"""
        if "prd" not in state:
            return False, "缺少 PRD"

        prd = state["prd"]
        if not prd.get("product_name"):
            return False, "PRD 缺少产品名称"

        if not prd.get("features") or len(prd["features"]) == 0:
            return False, "PRD 缺少功能列表"

        return True, "PRD 验证通过"

    @staticmethod
    def validate_code(state: dict) -> tuple[bool, str]:
        """验证代码规范"""
        if "code" not in state:
            return False, "缺少代码"

        code_spec = state["code"]
        if not code_spec.get("language"):
            return False, "代码缺少语言标识"

        if not code_spec.get("code"):
            return False, "代码内容为空"

        return True, "代码验证通过"
