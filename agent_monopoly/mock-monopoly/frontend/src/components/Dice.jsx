import React, { useState, useEffect } from 'react';

const Dice = ({ value, rolling }) => {
  const [displayValue, setDisplayValue] = useState(1);
  const [isRolling, setIsRolling] = useState(false);

  useEffect(() => {
    if (rolling) {
      setIsRolling(true);
      let rollCount = 0;
      const maxRolls = 10;
      const rollInterval = setInterval(() => {
        setDisplayValue(Math.floor(Math.random() * 6) + 1);
        rollCount++;
        
        if (rollCount >= maxRolls) {
          clearInterval(rollInterval);
          setIsRolling(false);
        }
      }, 100);
    } else if (value !== null) {
      setDisplayValue(value);
    }
  }, [rolling, value]);

  const getDiceFace = (value) => {
    const faces = {
      1: ['⚀'],
      2: ['⚁'],
      3: ['⚂'],
      4: ['⚃'],
      5: ['⚄'],
      6: ['⚅']
    };
    return faces[value] || ['⚀'];
  };

  return (
    <div className={`dice ${isRolling ? 'rolling' : ''}`}>
      <div className="dice-face">
        {getDiceFace(displayValue)}
      </div>
    </div>
  );
};

export default Dice;