const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { db } = require('../db/connection');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const { body } = require('express-validator');

const router = express.Router();

// 验证规则
const registerValidation = [
  body('username')
    .isLength({ min: 3, max: 20 })
    .withMessage('用户名长度必须在3-20个字符之间')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('用户名只能包含字母、数字和下划线'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('密码长度至少为6个字符'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('请输入有效的电子邮箱地址')
];

const loginValidation = [
  body('username')
    .notEmpty()
    .withMessage('用户名不能为空'),
  body('password')
    .notEmpty()
    .withMessage('密码不能为空')
];

// 用户注册
router.post('/register', registerValidation, async (req, res) => {
  try {
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

    // 检查用户名是否已存在
    const existingUser = await User.findByUsername(username);
    if (existingUser) {
      return res.status(409).json({
        code: 409,
        message: '用户名已存在',
        errors: ['该用户名已被注册']
      });
    }

    // 如果提供了邮箱，检查邮箱是否已存在
    if (email) {
      const existingEmail = await User.findByEmail(email);
      if (existingEmail) {
        return res.status(409).json({
          code: 409,
          message: '邮箱已存在',
          errors: ['该邮箱已被注册']
        });
      }
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const userId = await User.create({
      username,
      password: hashedPassword,
      email
    });

    // 获取新创建的用户信息（不返回密码）
    const newUser = await User.findById(userId);

    res.status(201).json({
      code: 201,
      message: '用户注册成功',
      data: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        created_at: newUser.created_at
      }
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      errors: [error.message]
    });
  }
});

// 用户登录
router.post('/login', loginValidation, async (req, res) => {
  try {
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

    // 查找用户
    const user = await User.findByUsername(username);
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

    // 获取用户详细信息（不返回密码）
    const userProfile = await User.findById(user.id);

    res.json({
      code: 200,
      message: '登录成功',
      data: {
        token,
        user: {
          id: userProfile.id,
          username: userProfile.username,
          email: userProfile.email,
          created_at: userProfile.created_at
        }
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      errors: [error.message]
    });
  }
});

// 获取用户信息
router.get('/profile', require('../middleware/auth'), async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在',
        errors: ['找不到指定的用户']
      });
    }

    res.json({
      code: 200,
      message: '获取用户信息成功',
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        created_at: user.created_at,
        games_played: user.games_played || 0,
        games_won: user.games_won || 0
      }
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      errors: [error.message]
    });
  }
});

// 更新用户信息
router.put('/profile', require('../middleware/auth'), [
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
    .withMessage('新密码长度至少为6个字符')
], async (req, res) => {
  try {
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

    // 获取用户信息
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在',
        errors: ['找不到指定的用户']
      });
    }

    // 如果提供了新密码，需要验证当前密码
    if (new_password) {
      if (!current_password) {
        return res.status(400).json({
          code: 400,
          message: '验证错误',
          errors: ['修改密码需要提供当前密码']
        });
      }

      // 验证当前密码
      const isPasswordValid = await bcrypt.compare(current_password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          code: 401,
          message: '认证失败',
          errors: ['当前密码错误']
        });
      }

      // 加密新密码
      const hashedNewPassword = await bcrypt.hash(new_password, 10);
      user.password = hashedNewPassword;
    }

    // 更新邮箱
    if (email) {
      // 检查邮箱是否已被其他用户使用
      const existingEmail = await User.findByEmail(email);
      if (existingEmail && existingEmail.id !== userId) {
        return res.status(409).json({
          code: 409,
          message: '邮箱已存在',
          errors: ['该邮箱已被其他用户使用']
        });
      }
      user.email = email;
    }

    // 更新用户
    await User.update(userId, {
      email: user.email,
      password: user.password
    });

    // 获取更新后的用户信息
    const updatedUser = await User.findById(userId);

    res.json({
      code: 200,
      message: '用户信息更新成功',
      data: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        created_at: updatedUser.created_at,
        updated_at: updatedUser.updated_at
      }
    });
  } catch (error) {
    console.error('更新用户信息错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      errors: [error.message]
    });
  }
});

module.exports = router;
```

```