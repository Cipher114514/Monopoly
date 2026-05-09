export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePassword = (password) => {
  return password.length >= 6;
};

export const validateUsername = (username) => {
  return username.length >= 3 && username.length <= 20;
};

export const validateRoomName = (roomName) => {
  return roomName.length >= 3 && roomName.length <= 30;
};

export const validateMessage = (message) => {
  return message.length > 0 && message.length <= 200;
};
```

```