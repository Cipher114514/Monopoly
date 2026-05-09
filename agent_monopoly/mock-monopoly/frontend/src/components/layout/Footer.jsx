import React from 'react';
import styled from 'styled-components';

const FooterContainer = styled.footer`
  background-color: #2c3e50;
  color: white;
  text-align: center;
  padding: 1rem;
  margin-top: auto;
`;

const Footer = () => {
  return (
    <FooterContainer>
      <p>&copy; {new Date().getFullYear()} Monopoly Online. All rights reserved.</p>
    </FooterContainer>
  );
};

export default Footer;
```

```