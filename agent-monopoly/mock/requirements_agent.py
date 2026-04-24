"""
Requirements Agent Mock 数据

根据《在线大富翁软件需求规格说明书》的17个功能需求生成的任务列表
"""

MOCK_TASKS = [
    {
        "id": "TASK-001",
        "name": "项目初始化和技术栈搭建",
        "priority": "P0",
        "status": "pending",
        "assignee": "全组",
        "estimate_hours": 4,
        "description": "初始化项目，配置开发环境，确定技术栈",
        "acceptance_criteria": [
            "创建前后端项目结构",
            "配置开发环境",
            "搭建基础框架",
            "确定开发规范"
        ],
        "dependencies": [],
        "rice_score": 25.0,
        "functional_requirements": ["FR-001"]
    },
    {
        "id": "TASK-002",
        "name": "数据库设计",
        "priority": "P0",
        "status": "pending",
        "assignee": "后端开发",
        "estimate_hours": 6,
        "description": "设计数据库Schema，支持17个功能需求",
        "acceptance_criteria": [
            "用户表（users）",
            "房间表（rooms）",
            "游戏表（games）",
            "玩家表（players）",
            "地产表（properties）",
            "游戏记录表（game_records）",
            "卡牌表（chance_fate_cards）"
        ],
        "dependencies": [],
        "rice_score": 24.0,
        "functional_requirements": ["FR-001", "FR-002", "FR-017"]
    },
    {
        "id": "TASK-003",
        "name": "用户认证系统（FR-001）",
        "priority": "P0",
        "status": "pending",
        "assignee": "后端开发",
        "estimate_hours": 10,
        "description": "实现用户注册、登录功能，包含输入验证",
        "acceptance_criteria": [
            "用户可以注册",
            "用户可以登录",
            "密码bcrypt加密",
            "JWT Token管理",
            "输入验证（用户名、邮箱、密码格式）"
        ],
        "dependencies": ["TASK-002"],
        "rice_score": 26.0,
        "functional_requirements": ["FR-001"]
    },
    {
        "id": "TASK-004",
        "name": "房间管理系统（FR-002, FR-003, FR-004）",
        "priority": "P0",
        "status": "pending",
        "assignee": "后端开发",
        "estimate_hours": 14,
        "description": "实现房间创建、加入、列表、开始游戏功能",
        "acceptance_criteria": [
            "创建房间（设置名称、人数、地图、资金）",
            "房间列表展示",
            "通过ID或邀请码加入",
            "房主开始游戏（至少2人）",
            "初始化游戏数据"
        ],
        "dependencies": ["TASK-003"],
        "rice_score": 28.0,
        "functional_requirements": ["FR-002", "FR-003", "FR-004"]
    },
    {
        "id": "TASK-005",
        "name": "WebSocket实时通信",
        "priority": "P0",
        "status": "pending",
        "assignee": "后端开发",
        "estimate_hours": 12,
        "description": "实现WebSocket连接和消息广播",
        "acceptance_criteria": [
            "WebSocket连接建立",
            "房间消息广播",
            "连接管理和断线重连",
            "消息队列处理"
        ],
        "dependencies": ["TASK-004"],
        "rice_score": 30.0,
        "functional_requirements": ["All FRs"]
    },
    {
        "id": "TASK-006",
        "name": "游戏核心逻辑 - 移动和地块（FR-005, FR-006, FR-007）",
        "priority": "P0",
        "status": "pending",
        "assignee": "后端开发",
        "estimate_hours": 20,
        "description": "实现掷骰子移动、购买地产、支付过路费",
        "acceptance_criteria": [
            "掷骰子（1-6点）",
            "棋子移动",
            "路过起点发钱，停在起点不发钱",
            "空白地产购买",
            "支付过路费（抵押期间不收）",
            "特殊地块按拥有数量计算"
        ],
        "dependencies": ["TASK-005"],
        "rice_score": 32.0,
        "functional_requirements": ["FR-005", "FR-006", "FR-007"]
    },
    {
        "id": "TASK-007",
        "name": "游戏核心逻辑 - 建设和卡牌（FR-008, FR-009）",
        "priority": "P0",
        "status": "pending",
        "assignee": "后端开发",
        "estimate_hours": 16,
        "description": "实现建设房屋、机会/命运卡功能",
        "acceptance_criteria": [
            "只能在停着的普通地产盖房",
            "特殊地块不能盖房",
            "升级顺序：空地→房子→2房子→旅馆",
            "有建筑的土地不能抵押",
            "按队列拿卡（队首）",
            "执行后移至队尾（循环）"
        ],
        "dependencies": ["TASK-006"],
        "rice_score": 28.0,
        "functional_requirements": ["FR-008", "FR-009"]
    },
    {
        "id": "TASK-008",
        "name": "游戏核心逻辑 - 回合和状态（FR-010, FR-013, FR-014）",
        "priority": "P0",
        "status": "pending",
        "assignee": "后端开发",
        "estimate_hours": 18,
        "description": "实现回合管理、破产处理、游戏结束判定",
        "acceptance_criteria": [
            "按顺序轮流",
            "处理暂停/坐牢/破产状态",
            "回合超时60秒",
            "破产处理（先变卖资产，仍不够才破产）",
            "房子半价卖回，土地半价抵押",
            "破产后所有地产回归空白",
            "剩余1人时游戏结束"
        ],
        "dependencies": ["TASK-007"],
        "rice_score": 30.0,
        "functional_requirements": ["FR-010", "FR-013", "FR-014"]
    },
    {
        "id": "TASK-009",
        "name": "高级功能 - 赎回、聊天、表情（FR-011, FR-012, FR-015）",
        "priority": "P1",
        "status": "pending",
        "assignee": "后端开发",
        "estimate_hours": 12,
        "description": "实现地产赎回、聊天、表情功能",
        "acceptance_criteria": [
            "支付抵押金额赎回",
            "恢复收过路费",
            "实时聊天",
            "表情互动",
            "消息和表情广播"
        ],
        "dependencies": ["TASK-008"],
        "rice_score": 22.0,
        "functional_requirements": ["FR-011", "FR-012", "FR-015"]
    },
    {
        "id": "TASK-010",
        "name": "AI玩家和历史记录（FR-016, FR-017）",
        "priority": "P1",
        "status": "pending",
        "assignee": "后端开发",
        "estimate_hours": 14,
        "description": "实现AI玩家、历史记录、回放功能",
        "acceptance_criteria": [
            "AI自动掷骰子",
            "AI简单策略（购买、盖房）",
            "模拟思考时间（1-3秒）",
            "游戏记录存储",
            "回放数据记录",
            "回放界面"
        ],
        "dependencies": ["TASK-009"],
        "rice_score": 20.0,
        "functional_requirements": ["FR-016", "FR-017"]
    },
    {
        "id": "TASK-011",
        "name": "前端登录和房间界面（FR-001, FR-002, FR-003）",
        "priority": "P0",
        "status": "pending",
        "assignee": "前端开发",
        "estimate_hours": 12,
        "description": "实现登录、注册、房间列表、创建房间界面",
        "acceptance_criteria": [
            "登录/注册表单",
            "输入验证提示",
            "房间列表展示",
            "创建房间表单",
            "房间配置参数",
            "实时更新房间状态"
        ],
        "dependencies": ["TASK-003"],
        "rice_score": 24.0,
        "functional_requirements": ["FR-001", "FR-002", "FR-003"]
    },
    {
        "id": "TASK-012",
        "name": "前端游戏界面（FR-005, FR-010）",
        "priority": "P0",
        "status": "pending",
        "assignee": "前端开发",
        "estimate_hours": 20,
        "description": "实现游戏主界面（棋盘、玩家信息、操作按钮）",
        "acceptance_criteria": [
            "游戏棋盘展示",
            "玩家棋子和位置",
            "玩家信息面板",
            "操作按钮（掷骰子、结束回合）",
            "实时状态更新",
            "回合倒计时",
            "移动动画"
        ],
        "dependencies": ["TASK-011"],
        "rice_score": 28.0,
        "functional_requirements": ["FR-005", "FR-010"]
    },
    {
        "id": "TASK-013",
        "name": "前端交互功能（FR-006, FR-008, FR-015）",
        "priority": "P0",
        "status": "pending",
        "assignee": "前端开发",
        "estimate_hours": 12,
        "description": "实现购买地产、盖房、赎回界面",
        "acceptance_criteria": [
            "购买确认对话框",
            "盖房选项和确认",
            "赎回地产列表",
            "资金验证提示",
            "操作结果展示"
        ],
        "dependencies": ["TASK-012"],
        "rice_score": 22.0,
        "functional_requirements": ["FR-006", "FR-008", "FR-015"]
    },
    {
        "id": "TASK-014",
        "name": "前端社交和AI界面（FR-011, FR-012, FR-016, FR-017）",
        "priority": "P1",
        "status": "pending",
        "assignee": "前端开发",
        "estimate_hours": 10,
        "description": "实现聊天、表情、历史记录界面",
        "acceptance_criteria": [
            "聊天输入和消息列表",
            "表情面板",
            "表情动画",
            "历史记录列表",
            "回放界面和控制"
        ],
        "dependencies": ["TASK-013"],
        "rice_score": 18.0,
        "functional_requirements": ["FR-011", "FR-012", "FR-016", "FR-017"]
    },
    {
        "id": "TASK-015",
        "name": "前后端集成和测试",
        "priority": "P0",
        "status": "pending",
        "assignee": "全组",
        "estimate_hours": 10,
        "description": "集成前后端，进行端到端测试，覆盖17个功能需求",
        "acceptance_criteria": [
            "完整流程可运行",
            "17个功能需求基本实现",
            "修复主要Bug",
            "基础功能测试通过",
            "准备演示"
        ],
        "dependencies": ["TASK-010", "TASK-014"],
        "rice_score": 26.0,
        "functional_requirements": ["All FRs"]
    },
    {
        "id": "TASK-016",
        "name": "文档和答辩准备",
        "priority": "P1",
        "status": "pending",
        "assignee": "全组",
        "estimate_hours": 8,
        "description": "编写项目文档，准备答辩材料",
        "acceptance_criteria": [
            "README文档",
            "API文档",
            "架构说明",
            "答辩PPT",
            "演示视频（可选）"
        ],
        "dependencies": ["TASK-015"],
        "rice_score": 18.0,
        "functional_requirements": []
    }
]

# 任务统计
TOTAL_TASKS = len(MOCK_TASKS)
TOTAL_HOURS = sum(task['estimate_hours'] for task in MOCK_TASKS)
P0_TASKS = [t for t in MOCK_TASKS if t['priority'] == 'P0']
P1_TASKS = [t for t in MOCK_TASKS if t['priority'] == 'P1']
