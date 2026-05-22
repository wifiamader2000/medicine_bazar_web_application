import React from 'react';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false, 
  className = '', 
  type = 'button',
  loading = false,
  disabled = false,
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-[16px] min-h-[44px] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer';
  
  const variants = {
    primary: 'cta-gradient text-white hover:brightness-105 active:brightness-95 shadow-md shadow-emerald-500/10 hover:shadow-lg hover:shadow-emerald-500/25 focus:ring-[var(--color-primary)]',
    secondary: 'bg-white/80 backdrop-blur-md border-2 border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 focus:ring-[var(--color-primary)]',
    outline: 'border-2 border-[var(--color-teal)] text-[var(--color-teal)] hover:bg-[var(--color-teal)]/5 focus:ring-[var(--color-teal)]',
    ghost: 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 focus:ring-slate-500',
    danger: 'bg-[var(--color-alert)] text-white hover:bg-red-700 shadow-sm hover:shadow-md focus:ring-red-500'
  };
  
  const sizes = {
    sm: 'px-4 py-1.5 text-sm min-h-[38px] rounded-[12px]',
    md: 'px-6 py-2.5 text-base',
    lg: 'px-8 py-3.5 text-lg rounded-[18px]'
  };

  const classes = `
    ${baseClasses}
    ${variants[variant]}
    ${sizes[size]}
    ${fullWidth ? 'w-full' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <button type={type} className={classes} disabled={disabled || loading} {...props}>
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-5 w-5 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading...
        </span>
      ) : children}
    </button>
  );
};

export default Button;

