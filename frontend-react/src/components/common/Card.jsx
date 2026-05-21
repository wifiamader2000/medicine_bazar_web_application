import React from 'react';

const Card = ({ children, className = '', padding = 'p-4', hover = false, onClick }) => {
  return (
    <div 
      className={`bg-white rounded-lg border border-gray-200 shadow-sm ${hover ? 'hover:shadow-md transition-shadow cursor-pointer' : ''} ${padding} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default Card;
