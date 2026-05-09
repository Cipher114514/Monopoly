import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import styled from 'styled-components';

const HeaderContainer = styled.header`
  background-color: #2c3e50;
  color: white;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const Logo = styled.h1`
  font-size: 1.5rem;
  margin: 0;
  color: #f39c12;
`;

const Nav = styled.nav`
  display: flex;
  gap: 1rem;
`;

const NavLink = styled(Link)`
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: background-color 0.3s;
  
  &:hover {
    background-color: #34495e;
  }
  
  &.active {
    background-color: #f39c12;
    color: #2c3e50;
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const Username = styled.span`
  font-weight: bold;
`;

const LogoutButton = styled.button`
  background-color: #e74c3c;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
  
  &:hover {
    background-color: #c0392b;
  }
`;

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <HeaderContainer>
      <Logo>Monopoly Online</Logo>
      <Nav>
        <NavLink to="/lobby" className={({ isActive }) => isActive ? 'active' : ''}>
          Lobby
        </NavLink>
      </Nav>
      <UserInfo>
        <Username>Welcome, {user?.username}</Username>
        <LogoutButton onClick={handleLogout}>Logout</LogoutButton>
      </UserInfo>
    </HeaderContainer>
  );
};

export default Header;
```

```