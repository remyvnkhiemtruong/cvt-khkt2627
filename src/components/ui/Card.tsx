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
    default: "bg-white rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.025)]",
    subtle: "bg-slate-50/80 rounded-xl border border-slate-200",
    elevated: "bg-white rounded-xl border border-slate-200 shadow-[0_8px_24px_rgba(15,23,42,0.055)]",
    bordered: "bg-white rounded-xl border border-slate-300",
  };

  const paddings = {
    none: "",
    sm: "p-3 sm:p-4",
    md: "p-4 sm:p-5 lg:p-6",
    lg: "p-5 sm:p-6 lg:p-7",
  };

  return (
    <div
      className={cn(
        variants[variant],
        "min-w-0 overflow-hidden transition-[border-color,box-shadow,transform] duration-200 ease-out",
        className
      )}
      {...props}
    >
      {header && (
        <div className="flex min-w-0 items-center justify-between gap-3 border-b border-slate-200 px-4 py-3.5 sm:px-5">
          {header}
        </div>
      )}
      <div className={paddings[padding]}>
        {children}
      </div>
      {footer && (
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500 sm:px-5">
          {footer}
        </div>
      )}
    </div>
  );
};
