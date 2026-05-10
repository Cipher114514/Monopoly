import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../api/client';
import '../App.css';

const HomePage = () => {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // 如果用户已登录，跳转到游戏大厅
    if (user) {
      navigate('/lobby');
    }
  }, [user, navigate]);

  const handleLogin = () => {
    navigate('/login');
  };

  const handleRegister = () => {
    navigate('/register');
  };

  if (loading) {
    return (
      <div className="home-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (user) {
    return null; // 已登录，会被重定向
  }

  return (
    <div className="home-container">
      <div className="home-content">
        <h1 className="home-title">在线大富翁</h1>
        <p className="home-subtitle">与朋友一起享受经典大富翁游戏</p>
        
        <div className="home-actions">
          <button 
            className="btn btn-primary" 
            onClick={handleLogin}
          >
            登录
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={handleRegister}
          >
            注册
          </button>
        </div>
        
        <div className="home-features">
          <div className="feature">
            <h3>实时对战</h3>
            <p>与朋友实时在线对战</p>
          </div>
          <div className="feature">
            <h3>经典规则</h3>
            <p>完整的大富翁游戏规则</p>
          </div>
          <div className="feature">
            <h3>多人游戏</h3>
            <p>支持2-6人同时游戏</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;