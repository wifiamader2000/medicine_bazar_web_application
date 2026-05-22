import React, { forwardRef } from 'react';

const Input = forwardRef(({ 
  label, 
  error, 
  icon: Icon,
  className = '', 
  ...props 
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative rounded-xl">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-slate-400" />
          </div>
        )}
        <input
          ref={ref}
          className={`
            w-full rounded-xl border px-4 py-2.5 text-slate-900 bg-white placeholder-slate-400
            transition-all duration-200 shadow-sm
            focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)]/20 focus:border-[var(--color-teal)]
            ${Icon ? 'pl-11' : ''}
            ${error ? 'border-[var(--color-alert)] focus:ring-[var(--color-alert)]/20 focus:border-[var(--color-alert)]' : 'border-slate-200'}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1 text-sm text-[var(--color-alert)] font-medium">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;

