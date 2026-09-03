import React from 'react';
import { cn } from '../../utils/cn';
import { 
  InformationCircleIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  XCircleIcon 
} from '@heroicons/react/24/outline';

export interface AlertProps {
  type?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  type = 'info',
  title,
  children,
  className
}) => {
  const styles = {
    info: {
      container: "bg-slate-50 border-slate-300 border-l-sky-600 text-slate-800",
      icon: <InformationCircleIcon className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />,
      titleColor: "text-slate-900 font-medium"
    },
    success: {
      container: "bg-emerald-50/50 border-emerald-200 border-l-emerald-600 text-emerald-950",
      icon: <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />,
      titleColor: "text-emerald-950 font-medium"
    },
    warning: {
      container: "bg-amber-50/60 border-amber-200 border-l-amber-600 text-amber-950",
      icon: <ExclamationTriangleIcon className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />,
      titleColor: "text-amber-950 font-medium"
    },
    error: {
      container: "bg-rose-50/60 border-rose-200 border-l-rose-600 text-rose-950",
      icon: <XCircleIcon className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />,
      titleColor: "text-rose-950 font-medium"
    }
  };

  const current = styles[type];

  return (
    <aside
      role="alert"
      className={cn("p-3 rounded-md border border-l-3 flex items-start gap-2.5 text-xs leading-relaxed", current.container, className)}
    >
      {current.icon}
      <div className="flex-1 space-y-0.5">
        {title && <h3 className={cn("text-xs font-medium", current.titleColor)}>{title}</h3>}
        <div className="text-slate-700">{children}</div>
      </div>
    </aside>
  );
};
