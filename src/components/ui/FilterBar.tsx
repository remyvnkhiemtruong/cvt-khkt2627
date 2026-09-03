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
    <div className={cn("p-2.5 bg-white rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-2.5", className)}>
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
              className="w-full bg-slate-50 border border-slate-200 rounded-md text-xs py-1.5 pl-9 pr-3 text-slate-900 focus:outline-none focus:border-slate-400 focus:bg-white transition"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <XMarkIcon className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {filters}

        {activeFilterCount > 0 && onResetFilters && (
          <button
            onClick={onResetFilters}
            className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1 px-2 py-1 rounded-md hover:bg-rose-50 transition"
          >
            <XMarkIcon className="w-3 h-3" /> Xóa bộ lọc ({activeFilterCount})
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
