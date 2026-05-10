import { useState, useEffect } from 'react';
import api from '../api/client';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 从 localStorage 获取 token 并验证
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        api.setToken(token);
        const response = await api.getMe();
        if (response.success) {
          setUser(response.data);
        } else {
          localStorage.removeItem('token');
        }
      } catch (err) {
        setError(err.message);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // 登录函数
  const login = async (username, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.login(username, password);
      if (response.success) {
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        api.setToken(token);
        setUser(user);
        return { success: true, user };
      } else {
        setError(response.message);
        return { success: false, message: response.message };
      }
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  // 注册函数
  const register = async (username, email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.register(username, email, password);
      if (response.success) {
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        api.setToken(token);
        setUser(user);
        return { success: true, user };
      } else {
        setError(response.message);
        return { success: false, message: response.message };
      }
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  // 登出函数
  const logout = () => {
    localStorage.removeItem('token');
    api.setToken(null);
    setUser(null);
    setError(null);
  };

  return {
    user,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated: !!user
  };
}