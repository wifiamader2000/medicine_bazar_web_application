import React from 'react';

const Badge = ({ children, variant = 'primary', className = '' }) => {
  const variants = {
    primary: 'bg-[var(--color-primary)] text-white',
    secondary: 'bg-[var(--color-teal)] text-white',
    alert: 'bg-[var(--color-alert)] text-white',
    offer: 'bg-[var(--color-offer)] text-white',
    gray: 'bg-gray-100 text-gray-800 border border-gray-200'
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
