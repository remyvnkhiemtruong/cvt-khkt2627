import React from 'react';
import { cn } from '../../utils/cn';

export interface PageHeaderProps {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  breadcrumbs?: React.ReactNode;
  eyebrow?: string;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  actions,
  breadcrumbs,
  eyebrow,
  className,
}) => {
  return (
    <div className={cn("mb-6 border-b border-slate-200 pb-5 sm:mb-7 sm:flex sm:items-end sm:justify-between sm:gap-6", className)}>
      <div className="min-w-0 space-y-1.5">
        {breadcrumbs && <div className="mb-1 text-xs text-slate-500">{breadcrumbs}</div>}
        {eyebrow && <div className="v3-kicker">{eyebrow}</div>}
        <h1 className="v3-page-title">{title}</h1>
        {description && <div className="v3-page-description max-w-3xl">{description}</div>}
      </div>
      {actions && <div className="mt-4 flex shrink-0 flex-wrap items-center gap-2 sm:mt-0">{actions}</div>}
    </div>
  );
};
