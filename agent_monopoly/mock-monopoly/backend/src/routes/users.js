const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { db } = require('../db/connection');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const rateLimiter = require('../middleware/rateLimiter');

const router = express.Router();

// 用户注册
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
    const existingUser = await User.findByUsername(username);
    if (existingUser) {
      return res.status(409).json({
        code: 409,
        message: '用户名已存在',
        errors: ['该用户名已被使用']
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

    // 返回用户信息（不包含密码）
    const user = await User.findById(userId);
    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
      code: 201,
      message: '用户注册成功',
      data: {
        ...userWithoutPassword,
        created_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      errors: ['注册过程中发生错误']
    });
  }
});

// 用户登录
router.post('/login', rateLimiter.loginLimiter, [
  body('username')
    .notEmpty()
    .withMessage('用户名不能为空'),
  body('password')
    .notEmpty()
    .withMessage('密码不能为空')
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

    // 返回令牌和用户信息（不包含密码）
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      code: 200,
      message: '登录成功',
      data: {
        token,
        user: userWithoutPassword
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      errors: ['登录过程中发生错误']
    });
  }
});

// 获取用户信息
router.get('/profile', authMiddleware, async (req, res) => {
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

    // 不返回密码
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      code: 200,
      message: '获取用户信息成功',
      data: {
        ...userWithoutPassword,
        created_at: user.created_at,
        updated_at: user.updated_at
      }
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      errors: ['获取用户信息过程中发生错误']
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
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在',
        errors: ['找不到指定的用户']
      });
    }

    // 如果要修改密码，需要验证当前密码
    if (new_password) {
      if (!current_password) {
        return res.status(400).json({
          code: 400,
          message: '验证错误',
          errors: ['修改密码需要提供当前密码']
        });
      }

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

    // 更新用户信息
    await User.update(userId, {
      email: user.email,
      password: user.password
    });

    // 获取更新后的用户信息
    const updatedUser = await User.findById(userId);
    const { password: _, ...userWithoutPassword } = updatedUser;

    res.json({
      code: 200,
      message: '用户信息更新成功',
      data: {
        ...userWithoutPassword,
        updated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('更新用户信息错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      errors: ['更新用户信息过程中发生错误']
    });
  }
});

module.exports = router;
```