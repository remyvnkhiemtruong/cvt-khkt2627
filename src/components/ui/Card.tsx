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
    default: "bg-white rounded-2xl border border-slate-200 shadow-card",
    subtle: "bg-slate-50/70 rounded-2xl border border-slate-200",
    elevated: "bg-white rounded-2xl border border-slate-200 shadow-elevated",
    bordered: "bg-white rounded-2xl border-2 border-slate-200",
  };

  const paddings = {
    none: "",
    sm: "p-3",
    md: "p-5",
    lg: "p-6 sm:p-8",
  };

  return (
    <div className={cn(variants[variant], "overflow-hidden transition-all", className)} {...props}>
      {header && (
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          {header}
        </div>
      )}
      <div className={paddings[padding]}>
        {children}
      </div>
      {footer && (
        <div className="px-5 py-3 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          {footer}
        </div>
      )}
    </div>
  );
};
