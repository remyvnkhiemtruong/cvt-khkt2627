import React from 'react';
import { cn } from '../../utils/cn';

export interface ProgressProps {
  value: number; // 0 to 100
  max?: number;
  label?: string;
  showValueLabel?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'indigo';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  label,
  showValueLabel = false,
  variant = 'default',
  size = 'md',
  className
}) => {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  const variants = {
    default: "bg-slate-900",
    indigo: "bg-indigo-600",
    success: "bg-emerald-600",
    warning: "bg-amber-500",
  };

  const sizes = {
    sm: "h-1.5",
    md: "h-2",
    lg: "h-3",
  };

  return (
    <div className={cn("w-full space-y-1", className)}>
      {(label || showValueLabel) && (
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
          {label && <span>{label}</span>}
          {showValueLabel && <span className="text-slate-500">{percentage}%</span>}
        </div>
      )}
      <div className={cn("w-full bg-slate-100 rounded-full overflow-hidden", sizes[size])}>
        <div
          className={cn("h-full transition-all duration-300 rounded-full", variants[variant])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
