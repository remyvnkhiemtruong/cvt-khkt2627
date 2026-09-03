import React from 'react';
import { cn } from '../../utils/cn';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className
}) => {
  return (
    <div className={cn("py-12 px-4 text-center flex flex-col items-center justify-center space-y-2", className)}>
      {icon && <div className="mb-2 text-slate-400">{icon}</div>}
      <div className="max-w-md space-y-1">
        <h4 className="text-sm font-medium text-slate-800">{title}</h4>
        {description && <p className="text-xs text-slate-500 leading-relaxed">{description}</p>}
      </div>
      {action && <div className="pt-3">{action}</div>}
    </div>
  );
};
