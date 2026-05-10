const jwt = require('jsonwebtoken');
const { db } = require('../db/connection');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '24h';

/**
 * 生成JWT令牌
 * @param {Object} user - 用户对象
 * @returns {string} JWT令牌
 */
const generateToken = (user) => {
  return jwt.sign({
    userId: user.id,
    username: user.username
  }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
};

/**
 * 用户注册
 * POST /api/users/register
 */
const register = async (req, res) => {
  try {
    const { username, password, email } = req.body;

    // 参数验证
    if (!username || !password) {
      return res.status(400).json({
        code: 400,
        message: '用户名和密码不能为空'
      });
    }

    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({
        code: 400,
        message: '用户名长度必须在3-20个字符之间'
      });
    }

    if (password.length < 6 || password.length > 20) {
      return res.status(400).json({
        code: 400,
        message: '密码长度必须在6-20个字符之间'
      });
    }

    // 检查用户名是否已存在
    const existingUser = User.findByUsername(username);
    if (existingUser) {
      return res.status(409).json({
        code: 409,
        message: '用户名已存在'
      });
    }

    // 创建用户
    const user = await User.create({
      username,
      password,
      email
    });

    // 生成令牌
    const token = generateToken(user);

    res.status(201).json({
      code: 201,
      message: '用户注册成功',
      data: {
        userId: user.id,
        username: user.username,
        email: user.email,
        token
      }
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

/**
 * 用户登录
 * POST /api/users/login
 */
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 参数验证
    if (!username || !password) {
      return res.status(400).json({
        code: 400,
        message: '用户名和密码不能为空'
      });
    }

    // 查找用户
    const user = User.findByUsername(username);
    if (!user) {
      return res.status(401).json({
        code: 401,
        message: '用户名或密码错误'
      });
    }

    // 验证密码
    const isValidPassword = await User.validatePassword(user, password);
    if (!isValidPassword) {
      return res.status(401).json({
        code: 401,
        message: '用户名或密码错误'
      });
    }

    // 生成令牌
    const token = generateToken(user);

    res.json({
      code: 200,
      message: '登录成功',
      data: {
        userId: user.id,
        username: user.username,
        email: user.email,
        token
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

/**
 * 获取当前用户信息
 * GET /api/users/me
 */
const getMe = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = User.findById(userId);
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在'
      });
    }

    res.json({
      code: 200,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

module.exports = {
  register,
  login,
  getMe
};