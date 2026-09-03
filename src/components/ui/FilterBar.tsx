import React from 'react';
import { cn } from '../../utils/cn';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

export interface FilterBarProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchPlaceholder?: string;
  filters?: React.ReactNode;
  actions?: React.ReactNode;
  activeFilterCount?: number;
  onResetFilters?: () => void;
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery = '',
  onSearchChange,
  searchPlaceholder = 'Tìm kiếm...',
  filters,
  actions,
  activeFilterCount = 0,
  onResetFilters,
  className
}) => {
  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3", className)}>
      <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[240px]">
        {onSearchChange && (
          <div className="relative w-full max-w-xs">
            <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              data-lpignore="true"
              data-1p-ignore="true"
              data-form-type="other"
              className="w-full bg-white border border-slate-300 rounded-md text-sm py-1.5 pl-9 pr-8 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-500 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                aria-label="Xóa tìm kiếm"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {filters}

        {activeFilterCount > 0 && onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="text-xs text-slate-500 hover:text-slate-800 transition px-2 py-1 underline underline-offset-2"
          >
            Xóa bộ lọc ({activeFilterCount})
          </button>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
};
