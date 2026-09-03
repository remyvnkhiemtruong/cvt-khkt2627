import React from 'react';
import { cn } from '../../utils/cn';

export interface ChartContainerProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  height?: string | number;
  className?: string;
}

export const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  subtitle,
  action,
  children,
  height = 320,
  className
}) => {
  return (
    <article className={cn("bg-white rounded-lg border border-slate-200 p-5 space-y-4", className)}>
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </header>
      <div style={{ minHeight: typeof height === 'number' ? `${height}px` : height }} className="relative w-full">
        {children}
      </div>
    </article>
  );
};
