import React from 'react';

const Card = ({ children, className = '', padding = 'p-4', hover = false, onClick }) => {
  return (
    <div 
      className={`glass-card rounded-[24px] ${hover ? 'cursor-pointer hover:scale-[1.02] hover:border-[var(--color-primary)]/35' : ''} ${padding} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default Card;
