import React from 'react';

const Card = ({ children, className = '', padding = 'p-4', hover = false, onClick }) => {
  return (
    <div 
      className={`glass-card rounded-xl ${hover ? 'cursor-pointer' : ''} ${padding} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default Card;
