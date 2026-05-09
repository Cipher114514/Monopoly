import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
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
  background-color: #2ecc71;
  color: white;
  border: none;
  padding: 0.75rem;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #27ae60;
  }
`;

const LoginLink = styled.div`
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

const RegisterPage = () => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm();

  const password = watch('password');

  const onSubmit = async (data) => {
    try {
      await apiClient.post('/auth/register', data);
      toast.success('注册成功，请登录');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || '注册失败');
    }
  };

  return (
    <Container>
      <FormContainer>
        <Title>注册</Title>
        <Form onSubmit={handleSubmit(onSubmit)}>
          <Input
            type="text"
            placeholder="用户名"
            {...register('username', { 
              required: '请输入用户名',
              minLength: { value: 3, message: '用户名至少3个字符' }
            })}
          />
          {errors.username && <p style={{ color: 'red' }}>{errors.username.message}</p>}
          
          <Input
            type="password"
            placeholder="密码"
            {...register('password', { 
              required: '请输入密码',
              minLength: { value: 6, message: '密码至少6个字符' }
            })}
          />
          {errors.password && <p style={{ color: 'red' }}>{errors.password.message}</p>}
          
          <Input
            type="password"
            placeholder="确认密码"
            {...register('confirmPassword', { 
              required: '请确认密码',
              validate: value => value === password || '两次密码输入不一致'
            })}
          />
          {errors.confirmPassword && <p style={{ color: 'red' }}>{errors.confirmPassword.message}</p>}
          
          <Button type="submit">注册</Button>
        </Form>
        <LoginLink>
          已有账号? <a href="/login">登录</a>
        </LoginLink>
      </FormContainer>
    </Container>
  );
};

export default RegisterPage;
```

```