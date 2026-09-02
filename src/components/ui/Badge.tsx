import React from 'react';
import { cn } from '../../utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'slate' | 'blue' | 'indigo' | 'emerald' | 'amber' | 'rose' | 'purple' | 'outline';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'slate', size = 'md', className, ...props }) => {
  const base = "inline-flex items-center font-medium rounded-md border tracking-tight";
  const variants = {
    slate: "bg-slate-100 text-slate-700 border-slate-200",
    blue: "bg-sky-50 text-sky-800 border-sky-200",
    indigo: "bg-indigo-50 text-indigo-800 border-indigo-200",
    emerald: "bg-emerald-50 text-emerald-800 border-emerald-200",
    amber: "bg-amber-50 text-amber-800 border-amber-200",
    rose: "bg-rose-50 text-rose-800 border-rose-200",
    purple: "bg-purple-50 text-purple-800 border-purple-200",
    outline: "bg-white text-slate-700 border-slate-300",
  };
  const sizes = { sm: "text-[10px] px-1.5 py-0.5 leading-tight", md: "text-xs px-2.5 py-0.5 leading-normal" };
  return <span className={cn(base, variants[variant], sizes[size], className)} {...props}>{children}</span>;
};
