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
      container: "bg-sky-50/70 border-sky-200 text-sky-900",
      icon: <InformationCircleIcon className="w-5 h-5 text-sky-600 shrink-0" />,
      titleColor: "text-sky-950 font-bold"
    },
    success: {
      container: "bg-emerald-50/70 border-emerald-200 text-emerald-900",
      icon: <CheckCircleIcon className="w-5 h-5 text-emerald-600 shrink-0" />,
      titleColor: "text-emerald-950 font-bold"
    },
    warning: {
      container: "bg-amber-50/70 border-amber-200 text-amber-900",
      icon: <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 shrink-0" />,
      titleColor: "text-amber-950 font-bold"
    },
    error: {
      container: "bg-rose-50/70 border-rose-200 text-rose-900",
      icon: <XCircleIcon className="w-5 h-5 text-rose-600 shrink-0" />,
      titleColor: "text-rose-950 font-bold"
    }
  };

  const current = styles[type];

  return (
    <aside
      role="alert"
      className={cn("p-3.5 rounded-xl border flex items-start gap-3 text-xs leading-relaxed", current.container, className)}
    >
      {current.icon}
      <div className="flex-1 space-y-0.5">
        {title && <h3 className={cn("text-xs", current.titleColor)}>{title}</h3>}
        <div>{children}</div>
      </div>
    </aside>
  );
};
