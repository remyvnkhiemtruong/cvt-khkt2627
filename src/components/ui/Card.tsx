import React from 'react';
import { cn } from '../../utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  variant?: 'default' | 'subtle' | 'elevated' | 'bordered';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  header,
  footer,
  variant = 'default',
  padding = 'md',
  className,
  ...props
}) => {
  const variants = {
    default: "bg-white rounded-lg border border-slate-200",
    subtle: "bg-slate-50 rounded-lg border border-slate-200",
    elevated: "bg-white rounded-lg border border-slate-200 shadow-sm",
    bordered: "bg-white rounded-lg border border-slate-300",
  };

  const paddings = {
    none: "",
    sm: "p-3",
    md: "p-4 sm:p-5",
    lg: "p-5 sm:p-6",
  };

  return (
    <div className={cn(variants[variant], "overflow-hidden", className)} {...props}>
      {header && (
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
          {header}
        </div>
      )}
      <div className={paddings[padding]}>
        {children}
      </div>
      {footer && (
        <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          {footer}
        </div>
      )}
    </div>
  );
};
