import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import apiClient from '../utils/apiClient';
import styled from 'styled-components';

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  background-color: #f5f5f5;
`;

const FormContainer = styled.div`
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
`;

const Title = styled.h2`
  text-align: center;
  margin-bottom: 1.5rem;
  color: #2c3e50;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: #3498db;
  }
`;

const Button = styled.button`
  background-color: #3498db;
  color: white;
  border: none;
  padding: 0.75rem;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #2980b9;
  }
`;

const RegisterLink = styled.div`
  text-align: center;
  margin-top: 1rem;

  a {
    color: #3498db;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    try {
      const response = await apiClient.post('/auth/login', data);
      login(response.data);
      toast.success('登录成功');
      navigate('/lobby');
    } catch (error) {
      toast.error(error.response?.data?.message || '登录失败');
    }
  };

  return (
    <Container>
      <FormContainer>
        <Title>登录</Title>
        <Form onSubmit={handleSubmit(onSubmit)}>
          <Input
            type="text"
            placeholder="用户名"
            {...register('username', { required: '请输入用户名' })}
          />
          {errors.username && <p style={{ color: 'red' }}>{errors.username.message}</p>}
          
          <Input
            type="password"
            placeholder="密码"
            {...register('password', { required: '请输入密码' })}
          />
          {errors.password && <p style={{ color: 'red' }}>{errors.password.message}</p>}
          
          <Button type="submit">登录</Button>
        </Form>
        <RegisterLink>
          还没有账号? <a href="/register">注册</a>
        </RegisterLink>
      </FormContainer>
    </Container>
  );
};

export default LoginPage;
```

```