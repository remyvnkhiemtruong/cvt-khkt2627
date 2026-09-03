import React from 'react';
import { cn } from '../../utils/cn';

export interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  icon?: React.ReactNode;
  variant?: 'default' | 'accent' | 'success';
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subValue,
  trend,
  icon,
  variant = 'default',
  className
}) => {
  const variants = {
    default: "bg-white border-slate-200 text-slate-900",
    accent: "bg-slate-50 border-slate-200 text-slate-900",
    success: "bg-slate-50 border-slate-200 text-slate-900",
  };

  return (
    <div className={cn("p-4 rounded-lg border bg-white flex items-start justify-between gap-3", variants[variant], className)}>
      <div className="space-y-1 min-w-0">
        <span className="text-xs font-medium text-slate-500 block truncate">
          {label}
        </span>
        <div className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          {value}
        </div>
        {subValue && (
          <p className="text-xs text-slate-500 truncate">
            {subValue}
          </p>
        )}
        {trend && (
          <div className="flex items-center gap-1 text-xs font-medium mt-1">
            <span className={trend.isPositive ? "text-emerald-700" : "text-rose-700"}>
              {trend.isPositive ? "▲" : "▼"} {trend.value}
            </span>
          </div>
        )}
      </div>

      {icon && (
        <div className="p-2 rounded-md border border-slate-200 bg-slate-50 text-slate-600 flex items-center justify-center shrink-0">
          {icon}
        </div>
      )}
    </div>
  );
};
