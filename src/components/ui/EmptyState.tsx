import React from 'react';
import { cn } from '../../utils/cn';
import { InboxIcon } from '@heroicons/react/24/outline';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = <InboxIcon className="w-10 h-10 text-slate-300" />,
  title,
  description,
  action,
  className
}) => {
  return (
    <div className={cn("p-8 text-center flex flex-col items-center justify-center space-y-3", className)}>
      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center">
        {icon}
      </div>
      <div className="max-w-xs space-y-1">
        <h4 className="text-xs font-bold text-slate-800">{title}</h4>
        {description && <p className="text-[11px] text-slate-500 leading-relaxed">{description}</p>}
      </div>
      {action && <div className="pt-1">{action}</div>}
    </div>
  );
};
