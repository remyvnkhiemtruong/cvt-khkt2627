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
    accent: "bg-indigo-950 text-white border-indigo-900",
    success: "bg-emerald-950 text-white border-emerald-900",
  };

  return (
    <div className={cn("p-5 rounded-2xl border shadow-card flex items-start justify-between gap-4", variants[variant], className)}>
      <div className="space-y-1">
        <span className={cn("text-xs font-medium block", variant === 'default' ? "text-slate-500" : "text-slate-300")}>
          {label}
        </span>
        <div className="text-2xl font-bold tracking-tight">
          {value}
        </div>
        {subValue && (
          <p className={cn("text-[11px]", variant === 'default' ? "text-slate-500" : "text-slate-400")}>
            {subValue}
          </p>
        )}
        {trend && (
          <div className="flex items-center gap-1 text-[11px] font-semibold mt-1">
            <span className={trend.isPositive ? "text-emerald-600" : "text-rose-600"}>
              {trend.isPositive ? "▲" : "▼"} {trend.value}
            </span>
          </div>
        )}
      </div>

      {icon && (
        <div className={cn(
          "p-2.5 rounded-xl border flex items-center justify-center shrink-0",
          variant === 'default' ? "bg-slate-50 border-slate-200 text-slate-700" : "bg-white/10 border-white/20 text-white"
        )}>
          {icon}
        </div>
      )}
    </div>
  );
};
