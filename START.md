# 🚀 Agent系统 - 立即开始

## 🎯 使用智谱AI

✅ **优点：**
- 国内访问速度快
- 价格便宜（约0.5元/次）
- 中文支持优秀
- 不需要翻墙

---

## ⚡ 5分钟快速开始

### Step 1: 获取API密钥

1. 访问 https://open.bigmodel.cn/
2. 注册/登录
3. 进入"API密钥"管理
4. 创建API Key
5. 复制密钥（就是那串数字和字母）

### Step 2: 安装依赖

```bash
# 进入目录
cd agent-demo-langgraph

# 创建虚拟环境（推荐）
python -m venv venv

# 激活虚拟环境
venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt
```

### Step 3: 配置密钥

```bash
# 创建配置文件
copy .env.example .env

# 编辑配置
notepad .env

# 填入你的API密钥
ZHIPUAI_API_KEY=你的智谱密钥
```

### Step 4: 运行

```bash
python demo_zhipu.py
```

---

## 💡 智谱AI特点

| 特性 | 评价 |
|-----|------|
| **速度** | ⭐⭐⭐⭐ 快 |
| **质量** | ⭐⭐⭐ 好 |
| **成本** | ⭐⭐⭐⭐ 便宜 |
| **中文** | ⭐⭐⭐⭐⭐ 优秀 |
| **代码** | ⭐⭐⭐ 好 |
| **网络** | 国内直连 |

---

## 💰 成本

### 智谱AI
- 运行一次: ~¥0.5
- 开发测试(100次): ~¥50
- 优势: 新用户有免费额度

---

## 📂 文件说明

```
agent-demo-langgraph/
│
├── 🐍 demo_zhipu.py        ← 智谱AI版本
├── 📋 START.md             ← 本文件
├── 📖 ARCHITECTURE.md      ← 架构详解
├── 📘 README.md            ← 完整文档
├── 📋 requirements.txt     ← 依赖列表
├── 🔧 .env.example        ← 配置模板
└── 🚀 setup.bat           ← 安装脚本
```

---

## 🐛 常见问题

### Q1: 我的智谱API key在哪里？
```
1. 登录 https://open.bigmodel.cn/
2. 点击右上角"API Key"
3. 查看或创建新的API Key
4. 复制那串数字和字母
```

### Q2: 运行时报错未找到API密钥？
```
确保：
1. 已创建 .env 文件
2. .env 文件中 ZHIPUAI_API_KEY 已填写
3. .env 文件和 demo_zhipu.py 在同一目录
```

### Q3: 网络连接失败？
```
智谱AI是国内服务：
- 确保网络连接正常
- 不需要代理或翻墙
- 检查防火墙设置
```

---

## 🎉 立即开始

```bash
# 1. 获取智谱API key
# 2. 配置.env文件
# 3. 运行
python demo_zhipu.py
```

**3分钟后看到Agent协作！** 🚀
