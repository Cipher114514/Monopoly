const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { validateRegister, validateLogin } = require('../utils/validation');

const router = express.Router();

// JWT密钥
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// 生成JWT token
const generateToken = (user) => {
    return jwt.sign(
        { 
            userId: user.id, 
            username: user.username 
        },
        JWT_SECRET,
        { expiresIn: '24h' }
    );
};

// 注册路由
router.post('/register', async (req, res) => {
    try {
        // 验证输入
        const { error } = validateRegister(req.body);
        if (error) {
            return res.status(400).json({
                code: 400,
                message: error.details[0].message
            });
        }

        const { username, email, password } = req.body;

        // 检查用户名是否已存在
        const existingUser = User.findByUsername(username);
        if (existingUser) {
            return res.status(409).json({
                code: 409,
                message: '用户名已存在'
            });
        }

        // 检查邮箱是否已存在
        if (email) {
            const existingEmail = User.findByEmail(email);
            if (existingEmail) {
                return res.status(409).json({
                    code: 409,
                    message: '邮箱已被注册'
                });
            }
        }

        // 创建用户
        const newUser = User.create({
            username,
            email: email || null,
            password
        });

        // 生成token
        const token = generateToken(newUser);

        res.status(201).json({
            code: 201,
            message: '注册成功',
            data: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
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
});

// 登录路由
router.post('/login', async (req, res) => {
    try {
        // 验证输入
        const { error } = validateLogin(req.body);
        if (error) {
            return res.status(400).json({
                code: 400,
                message: error.details[0].message
            });
        }

        const { username, password } = req.body;

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

        // 生成token
        const token = generateToken(user);

        res.json({
            code: 200,
            message: '登录成功',
            data: {
                id: user.id,
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
});

// 获取当前用户信息
router.get('/me', (req, res) => {
    // 这里应该由认证中间件处理，直接获取用户信息
    // 实际使用时，这个路由应该放在有认证中间件保护的路径下
    res.json({
        code: 200,
        message: '获取用户信息成功',
        data: req.user
    });
});

module.exports = router;