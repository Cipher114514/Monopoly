import React from 'react';
import api from '../api/client';

const PropertyCard = ({ property, onBuy, onBuild }) => {
  const { id, name, position, price, base_rent, color_group, house_count, owner_id, is_mortgaged } = property;

  const handleBuy = () => {
    if (onBuy) {
      onBuy(property);
    }
  };

  const handleBuild = () => {
    if (onBuild) {
      onBuild(property);
    }
  };

  const getRentDisplay = () => {
    if (house_count === 0) {
      return `基础租金: $${base_rent}`;
    } else {
      return `租金: $${base_rent * Math.pow(2, house_count)}`;
    }
  };

  return (
    <div className={`property-card ${color_group} ${is_mortgaged ? 'mortgaged' : ''}`}>
      <div className="property-header">
        <h3>{name}</h3>
        <span className="property-position">{position}</span>
      </div>
      
      <div className="property-details">
        <div className="property-price">
          <strong>价格:</strong> ${price}
        </div>
        <div className="property-rent">
          {getRentDisplay()}
        </div>
        <div className="property-houses">
          房屋: {house_count}/4
        </div>
      </div>

      <div className="property-footer">
        {owner_id ? (
          <div className="property-owner">
            拥有者: {owner_id}
          </div>
        ) : (
          <div className="property-actions">
            <button 
              className="buy-button"
              onClick={handleBuy}
            >
              购买 (${price})
            </button>
          </div>
        )}
        
        {owner_id && house_count < 4 && (
          <button 
            className="build-button"
            onClick={handleBuild}
          >
            建造房屋 (${price * 0.5})
          </button>
        )}
      </div>
    </div>
  );
};

export default PropertyCard;