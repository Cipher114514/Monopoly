const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../database');
const authMiddleware = require('../middleware/auth');
const rateLimiter = require('../middleware/rateLimiter');

const router = express.Router();

// 生成用户ID的辅助函数
const generateUserId = () => {
  return 'user_' + Math.random().toString(36).substr(2, 9);
};

// 注册新用户
router.post('/register', [
  body('username')
    .isLength({ min: 3, max: 20 })
    .withMessage('用户名长度必须在3-20个字符之间')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('用户名只能包含字母、数字和下划线'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('密码长度至少为6位'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('请输入有效的电子邮箱地址')
], async (req, res) => {
  // 验证输入
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      code: 400,
      message: '验证错误',
      errors: errors.array()
    });
  }

  const { username, password, email } = req.body;

  try {
    // 检查用户名是否已存在
    const existingUser = db.get('SELECT id FROM users WHERE username = ?', [username]);
    if (existingUser) {
      return res.status(409).json({
        code: 409,
        message: '用户名已存在',
        errors: ['该用户名已被其他用户使用']
      });
    }

    // 如果提供了邮箱，检查邮箱是否已存在
    if (email) {
      const existingEmail = db.get('SELECT id FROM users WHERE email = ?', [email]);
      if (existingEmail) {
        return res.status(409).json({
          code: 409,
          message: '邮箱已存在',
          errors: ['该邮箱已被其他用户使用']
        });
      }
    }

    // 加密密码
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 创建新用户
    const userId = generateUserId();
    const createdAt = Math.floor(Date.now() / 1000);
    
    db.run(
      `INSERT INTO users (id, username, password, email, created_at) 
       VALUES (?, ?, ?, ?, ?)`,
      [userId, username, hashedPassword, email, createdAt]
    );

    // 返回用户信息（不包含密码）
    const newUser = {
      id: userId,
      username,
      email: email || null,
      created_at: createdAt
    };

    res.status(201).json({
      code: 201,
      message: '用户注册成功',
      data: newUser
    });

  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      errors: ['注册过程中发生错误，请稍后重试']
    });
  }
});

// 用户登录
router.post('/login', rateLimiter.loginLimiter, [
  body('username').notEmpty().withMessage('用户名不能为空'),
  body('password').notEmpty().withMessage('密码不能为空')
], async (req, res) => {
  // 验证输入
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      code: 400,
      message: '验证错误',
      errors: errors.array()
    });
  }

  const { username, password } = req.body;

  try {
    // 查找用户
    const user = db.get('SELECT id, username, password, email FROM users WHERE username = ?', [username]);
    
    if (!user) {
      return res.status(401).json({
        code: 401,
        message: '认证失败',
        errors: ['用户名或密码错误']
      });
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        code: 401,
        message: '认证失败',
        errors: ['用户名或密码错误']
      });
    }

    // 生成JWT令牌
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // 返回令牌和用户信息
    res.status(200).json({
      code: 200,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        }
      }
    });

  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      errors: ['登录过程中发生错误，请稍后重试']
    });
  }
});

// 获取用户信息
router.get('/profile', authMiddleware, (req, res) => {
  try {
    const userId = req.user.userId;
    
    // 获取用户基本信息
    const user = db.get('SELECT id, username, email, created_at FROM users WHERE id = ?', [userId]);
    
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在',
        errors: ['找不到指定的用户']
      });
    }

    // 获取用户游戏统计
    const stats = db.get(
      `SELECT 
        COUNT(*) as games_played,
        SUM(CASE WHEN won = 1 THEN 1 ELSE 0 END) as games_won
       FROM game_participants 
       WHERE user_id = ?`,
      [userId]
    );

    res.status(200).json({
      code: 200,
      message: '用户信息获取成功',
      data: {
        ...user,
        games_played: stats.games_played || 0,
        games_won: stats.games_won || 0
      }
    });

  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      errors: ['获取用户信息时发生错误']
    });
  }
});

// 更新用户信息
router.put('/profile', authMiddleware, [
  body('email')
    .optional()
    .isEmail()
    .withMessage('请输入有效的电子邮箱地址'),
  body('current_password')
    .optional()
    .notEmpty()
    .withMessage('当前密码不能为空'),
  body('new_password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('新密码长度至少为6位')
], async (req, res) => {
  // 验证输入
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      code: 400,
      message: '验证错误',
      errors: errors.array()
    });
  }

  const userId = req.user.userId;
  const { email, current_password, new_password } = req.body;

  try {
    // 获取用户当前信息
    const user = db.get('SELECT id, username, password, email FROM users WHERE id = ?', [userId]);
    
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在',
        errors: ['找不到指定的用户']
      });
    }

    // 检查是否提供了当前密码（当要更改密码时）
    if (new_password && !current_password) {
      return res.status(400).json({
        code: 400,
        message: '验证错误',
        errors: ['更改密码需要提供当前密码']
      });
    }

    // 验证当前密码（如果提供了）
    if (current_password) {
      const isPasswordValid = await bcrypt.compare(current_password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          code: 401,
          message: '认证失败',
          errors: ['当前密码错误']
        });
      }
    }

    // 检查新邮箱是否已被其他用户使用
    if (email && email !== user.email) {
      const existingEmail = db.get('SELECT id FROM users WHERE email = ? AND id != ?', [email, userId]);
      if (existingEmail) {
        return res.status(409).json({
          code: 409,
          message: '邮箱已存在',
          errors: ['该邮箱已被其他用户使用']
        });
      }
    }

    // 准备更新数据
    const updates = {};
    const updateValues = [];
    
    if (email && email !== user.email) {
      updates.email = email;
      updateValues.push(email);
    }
    
    if (new_password) {
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(new_password, saltRounds);
      updates.password = hashedPassword;
      updateValues.push(hashedPassword);
    }

    // 如果有更新，执行数据库更新
    if (Object.keys(updates).length > 0) {
      const updateFields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
      const updatedAt = Math.floor(Date.now() / 1000);
      
      updateValues.push(userId);
      updateValues.push(updatedAt);
      
      db.run(
        `UPDATE users SET ${updateFields}, updated_at = ? WHERE id = ?`,
        updateValues
      );
    }

    // 获取更新后的用户信息
    const updatedUser = db.get('SELECT id, username, email, created_at, updated_at FROM users WHERE id = ?', [userId]);

    res.status(200).json({
      code: 200,
      message: '用户信息更新成功',
      data: updatedUser
    });

  } catch (error) {
    console.error('更新用户信息错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      errors: ['更新用户信息时发生错误']
    });
  }
});

module.exports = router;
```

```