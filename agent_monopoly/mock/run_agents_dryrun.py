"""Simple verifier that checks prompts and outputs are readable.

This avoids importing agent modules (which use relative imports) and instead
validates that the prompts and output artifacts exist and contain expected markers.
"""
from pathlib import Path
import json
import sys


def read_file(path: Path):
    try:
        return path.read_text(encoding='utf-8')
    except Exception as e:
        return None


def main():
    base = Path(__file__).resolve().parents[1]

    pm_prompt = read_file(base / 'prompts' / 'pm_prompt.md')
    req_prompt = read_file(base / 'prompts' / 'requirements_prompt.md')
    prd_example = read_file(base / 'outputs' / 'PRD_example.md')
    sprint_plan = read_file(base / 'outputs' / 'sprint1_plan.md')
    sprint_tasks = None
    try:
        sprint_tasks = json.loads(read_file(base / 'outputs' / 'sprint1_tasks.json') or 'null')
    except Exception:
        sprint_tasks = None

    ok = True
    print('\n=== Verifying prompts and outputs ===')
    if pm_prompt and len(pm_prompt) > 100:
        print('✅ pm_prompt.md loaded (len=%d)' % len(pm_prompt))
    else:
        print('❌ pm_prompt.md missing or too short')
        ok = False

    if req_prompt and len(req_prompt) > 50:
        print('✅ requirements_prompt.md loaded (len=%d)' % len(req_prompt))
    else:
        print('❌ requirements_prompt.md missing or too short')
        ok = False

    if prd_example and '# PRD' in prd_example:
        print('✅ PRD_example.md present')
    else:
        print('❌ PRD_example.md missing or malformed')
        ok = False

    if sprint_plan and 'Sprint #1' in sprint_plan:
        print('✅ sprint1_plan.md present')
    else:
        print('❌ sprint1_plan.md missing or malformed')
        ok = False

    if isinstance(sprint_tasks, list) and len(sprint_tasks) >= 1:
        print(f'✅ sprint1_tasks.json parsed ({len(sprint_tasks)} tasks)')
        for t in sprint_tasks:
            print('-', t.get('name'))
    else:
        print('❌ sprint1_tasks.json missing or malformed')
        ok = False

    # Check pm_agent.py and requirements_agent.py contain loader functions
    pm_agent_py = read_file(base / 'agents' / 'pm_agent.py')
    req_agent_py = read_file(base / 'agents' / 'requirements_agent.py')
    if pm_agent_py and '_load_pm_prompt' in pm_agent_py:
        print('✅ pm_agent.py contains prompt loader')
    else:
        print('❌ pm_agent.py missing loader')
        ok = False

    if req_agent_py and '_load_requirements_prompt' in req_agent_py:
        print('✅ requirements_agent.py contains prompt loader')
    else:
        print('❌ requirements_agent.py missing loader')
        ok = False

    print('\nVerification %s' % ('PASSED' if ok else 'FAILED'))
    return 0 if ok else 2


if __name__ == '__main__':
    sys.exit(main())
