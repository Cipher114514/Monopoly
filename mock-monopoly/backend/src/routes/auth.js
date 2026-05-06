const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
router.post('/register', (req, res) => {
  res.json({ message: '注册成功', token: 'mock-token' });
});
router.post('/login', (req, res) => {
  res.json({ message: '登录成功', token: 'mock-token' });
});
module.exports = router;