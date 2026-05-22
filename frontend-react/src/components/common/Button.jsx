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
  const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer';
  
  const variants = {
    primary: 'bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] text-white hover:from-[var(--color-primary-dark)] hover:to-[var(--color-secondary)] shadow-sm hover:shadow-md focus:ring-[var(--color-primary)]',
    secondary: 'bg-gradient-to-r from-[var(--color-teal)] to-[var(--color-trust)] text-white hover:from-teal-600 hover:to-blue-700 shadow-sm hover:shadow-md focus:ring-[var(--color-teal)]',
    outline: 'border-2 border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 focus:ring-[var(--color-primary)]',
    ghost: 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 focus:ring-slate-500',
    danger: 'bg-gradient-to-r from-red-500 to-rose-600 text-white hover:from-red-600 hover:to-rose-700 shadow-sm hover:shadow-md focus:ring-red-500'
  };
  
  const sizes = {
    sm: 'px-3.5 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-base',
    lg: 'px-7 py-3.5 text-lg'
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

