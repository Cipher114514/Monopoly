"""
Mock 数据模块

本模块包含各Agent的Mock数据，严格贴合《在线大富翁软件需求规格说明书》。
每个Agent对应一个独立的Mock数据文件。
"""

from .initial_state import INITIAL_STATE
from .pm_agent import MOCK_PRD
from .requirements_agent import MOCK_TASKS
from .architecture_agent import MOCK_ARCHITECTURE
from .design_agent import MOCK_DESIGN
from .coding_agent import MOCK_CODE
from .code_review_agent import MOCK_REVIEW
from .testing_agent import MOCK_TEST_RESULTS
from .qa_agent import MOCK_QA_REPORT
from .documentation_agent import MOCK_DOCUMENTATION

__all__ = [
    'INITIAL_STATE',
    'MOCK_PRD',
    'MOCK_TASKS',
    'MOCK_ARCHITECTURE',
    'MOCK_DESIGN',
    'MOCK_CODE',
    'MOCK_REVIEW',
    'MOCK_TEST_RESULTS',
    'MOCK_QA_REPORT',
    'MOCK_DOCUMENTATION',
]
