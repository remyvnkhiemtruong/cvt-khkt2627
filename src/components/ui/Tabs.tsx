import React from 'react';
import { cn } from '../../utils/cn';

export interface TabItem {
  id: string;
  label: React.ReactNode;
  count?: number;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  variant?: 'pills' | 'underline' | 'segmented';
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  items,
  activeId,
  onChange,
  variant = 'segmented',
  className
}) => {
  if (variant === 'segmented') {
    return (
      <div className={cn("inline-flex p-1 bg-slate-100/90 rounded-xl border border-slate-200 gap-1", className)}>
        {items.map(tab => {
          const isActive = activeId === tab.id;
          return (
            <button
              key={tab.id}
              disabled={tab.disabled}
              onClick={() => onChange(tab.id)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all select-none disabled:opacity-40 disabled:cursor-not-allowed",
                isActive
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
              )}
            >
              {tab.icon && <span className="w-3.5 h-3.5">{tab.icon}</span>}
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={cn(
                    "ml-1 text-[10px] px-1.5 py-0.2 rounded-full font-bold",
                    isActive ? "bg-slate-100 text-slate-800" : "bg-slate-200 text-slate-600"
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Underline variant
  return (
    <nav className={cn("flex space-x-6 border-b border-slate-200", className)}>
      {items.map(tab => {
        const isActive = activeId === tab.id;
        return (
          <button
            key={tab.id}
            disabled={tab.disabled}
            onClick={() => onChange(tab.id)}
            className={cn(
              "py-3 text-xs font-semibold border-b-2 -mb-px flex items-center gap-2 transition-colors select-none",
              isActive
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
            )}
          >
            {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
};
