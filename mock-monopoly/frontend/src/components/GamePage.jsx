import React, { useState } from 'react';
function GamePage({ user }) {
  const [position, setPosition] = useState(0);
  const [dice, setDice] = useState([1, 1]);
  const rollDice = () => {
    setDice([Math.floor(Math.random()*6)+1, Math.floor(Math.random()*6)+1]);
  };
  return (
    <div className="game-page">
      <h1>大富翁游戏</h1>
      <div>位置: {position}</div>
      <div>骰子: {dice.join(', ')}</div>
      <button onClick={rollDice}>掷骰子</button>
    </div>
  );
}
export default GamePage;