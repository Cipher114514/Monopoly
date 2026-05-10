import React from 'react';
import './PropertyCard.css';

const PropertyCard = ({ property, onClick, canBuy, owner }) => {
  // 根据房产类型确定背景颜色
  const getBackgroundColor = () => {
    switch (property.color_group) {
      case 'purple': return '#8B4789';
      case 'light blue': return '#6495ED';
      case 'pink': return '#FF69B4';
      case 'orange': return '#FF8C00';
      case 'red': return '#DC143C';
      case 'yellow': return '#FFD700';
      case 'green': return '#228B22';
      case 'dark blue': return '#000080';
      default: return '#F0F0F0';
    }
  };

  // 计算房产价格（基础租金 + 房屋数 * 房屋租金）
  const calculateRent = () => {
    if (!owner) return property.price;
    return property.base_rent + (property.house_count * property.house_rent);
  };

  return (
    <div 
      className={`property-card ${canBuy ? 'can-buy' : ''}`}
      style={{ backgroundColor: getBackgroundColor() }}
      onClick={onClick}
    >
      <div className="property-header">
        <h3 className="property-name">{property.name}</h3>
        <div className="property-position">位置: {property.position}</div>
      </div>
      
      <div className="property-details">
        <div className="property-price">
          <span className="label">价格:</span>
          <span className="value">${property.price}</span>
        </div>
        
        {owner && (
          <div className="property-owner">
            <span className="label">所有者:</span>
            <span className="value owner-name">{owner.username}</span>
          </div>
        )}
        
        <div className="property-rent">
          <span className="label">租金:</span>
          <span className="value">${calculateRent()}</span>
        </div>
        
        {property.house_count > 0 && (
          <div className="property-houses">
            <span className="label">房屋:</span>
            <span className="value">{property.house_count}栋</span>
          </div>
        )}
      </div>
      
      {canBuy && (
        <div className="property-action">
          <button className="buy-button">购买</button>
        </div>
      )}
    </div>
  );
};

export default PropertyCard;