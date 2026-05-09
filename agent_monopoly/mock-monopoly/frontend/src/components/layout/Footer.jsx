import React from 'react';
import styled from 'styled-components';

const FooterContainer = styled.footer`
  background-color: #34495e;
  color: white;
  text-align: center;
  padding: 1rem;
  margin-top: auto;
`;

const Footer = () => {
  return (
    <FooterContainer>
      <p>© 2023 在线大富翁游戏 - 保留所有权利</p>
    </FooterContainer>
  );
};

export default Footer;
```

```