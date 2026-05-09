export const formatCurrency = (amount) => {
  return `$${amount.toLocaleString()}`;
};

export const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const formatDate = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString();
};

export const generateRoomCode = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

export const calculatePropertyRent = (property, houseCount = 0) => {
  // This is a simplified version - in a real game, you'd have more complex calculations
  const baseRent = property.rent;
  const houseMultiplier = 1 + (houseCount * 0.5); // Each house increases rent by 50%
  return Math.floor(baseRent * houseMultiplier);
};

export const shuffleArray = (array) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};
```

```