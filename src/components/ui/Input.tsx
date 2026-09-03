import React from 'react';
import { cn } from '../../utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  label,
  helperText,
  error,
  leftIcon,
  rightIcon,
  className,
  id,
  disabled,
  autoComplete = "off",
  ...props
}, ref) => {
  const generatedId = React.useId();
  const inputId = id || generatedId;

  return (
    <div className="w-full space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-slate-700">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-3 pointer-events-none text-slate-400">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          autoComplete={autoComplete}
          className={cn(
            "w-full bg-white border border-slate-300 rounded-lg text-xs py-2 px-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent transition-all disabled:bg-slate-50 disabled:text-slate-400",
            leftIcon && "pl-9",
            rightIcon && "pr-9",
            error && "border-rose-500 focus:ring-rose-500",
            className
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 pointer-events-none text-slate-400">
            {rightIcon}
          </div>
        )}
      </div>
      {error ? (
        <p className="text-[11px] font-medium text-rose-600">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
});

Input.displayName = 'Input';
