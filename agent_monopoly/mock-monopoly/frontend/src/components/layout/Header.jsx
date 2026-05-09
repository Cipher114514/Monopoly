import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
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
  color: #e74c3c;
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
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const DisconnectButton = styled.button`
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
  const socket = useSocket();
  const navigate = useNavigate();

  const handleDisconnect = () => {
    if (socket) {
      socket.disconnect();
    }
    logout();
    navigate('/');
  };

  return (
    <HeaderContainer>
      <Logo>大富翁游戏</Logo>
      <Nav>
        <NavLink to="/lobby">大厅</NavLink>
      </Nav>
      <UserInfo>
        {user && <span>欢迎, {user.username}</span>}
        {user && <DisconnectButton onClick={handleDisconnect}>退出</DisconnectButton>}
      </UserInfo>
    </HeaderContainer>
  );
};

export default Header;
```

```