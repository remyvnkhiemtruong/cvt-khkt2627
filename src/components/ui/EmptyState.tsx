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
      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-center">
        {icon}
      </div>
      <div className="max-w-sm space-y-1">
        <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
        {description && <p className="text-xs text-slate-500 leading-relaxed">{description}</p>}
      </div>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
};
