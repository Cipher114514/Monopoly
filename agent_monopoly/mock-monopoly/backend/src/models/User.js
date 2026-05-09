const { getDatabase } = require('../db/connection');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const User = {
  // 创建用户
  create: async (userData) => {
    const db = getDatabase();
    const { email, username, password } = userData;
    
    // 检查用户是否已存在
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ? OR username = ?').get(email, username);
    if (existingUser) {
      throw new Error('用户已存在');
    }
    
    // 加密密码
    const passwordHash = await bcrypt.hash(password, 10);
    
    // 创建用户
    const userId = uuidv4();
    db.run(`
      INSERT INTO users (id, email, username, password_hash)
      VALUES (?, ?, ?, ?)
    `, [userId, email, username, passwordHash]);
    
    return { id: userId, email, username };
  },
  
  // 根据ID查找用户
  findById: (id) => {
    const db = getDatabase();
    const stmt = db.prepare('SELECT id, email, username, created_at, last_login, total_games_played, total_wins FROM users WHERE id = ?');
    return stmt.get(id);
  },
  
  // 根据邮箱查找用户
  findByEmail: (email) => {
    const db = getDatabase();
    const stmt = db.prepare('SELECT id, email, username, password_hash, created_at, last_login, total_games_played, total_wins FROM users WHERE email = ?');
    return stmt.get(email);
  },
  
  // 根据用户名查找用户
  findByUsername: (username) => {
    const db = getDatabase();
    const stmt = db.prepare('SELECT id, email, username, password_hash, created_at, last_login, total_games_played, total_wins FROM users WHERE username = ?');
    return stmt.get(username);
  },
  
  // 验证密码
  verifyPassword: async (user, password) => {
    return await bcrypt.compare(password, user.password_hash);
  },
  
  // 更新用户最后登录时间
  updateLastLogin: (userId) => {
    const db = getDatabase();
    db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [userId]);
  },
  
  // 更新用户游戏统计
  updateGameStats: (userId, won = false) => {
    const db = getDatabase();
    db.run(`
      UPDATE users 
      SET total_games_played = total_games_played + 1, 
          total_wins = total_wins + ?
      WHERE id = ?
    `, [won ? 1 : 0, userId]);
  }
};

module.exports = User;