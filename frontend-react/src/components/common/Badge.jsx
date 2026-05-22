import React from 'react';

const Badge = ({ children, variant = 'primary', className = '' }) => {
  const variants = {
    primary: 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20',
    secondary: 'bg-[var(--color-teal)]/10 text-[var(--color-teal)] border border-[var(--color-teal)]/20',
    alert: 'bg-[var(--color-alert)]/10 text-[var(--color-alert)] border border-[var(--color-alert)]/20',
    danger: 'bg-[var(--color-alert)]/10 text-[var(--color-alert)] border border-[var(--color-alert)]/20',
    offer: 'offer-gradient text-white shadow-sm',
    gray: 'bg-slate-100 text-slate-600 border border-slate-200'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
