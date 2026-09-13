import React from 'react';
import { BookOpenIcon, ChartBarIcon, FolderIcon, HomeIcon } from '@heroicons/react/24/outline';
import { cn } from '../../utils/cn';

interface StudentBottomNavProps {
  currentView: string;
  onNavigate: (view: string, params?: any) => void;
}

export const StudentBottomNav: React.FC<StudentBottomNavProps> = ({ currentView, onNavigate }) => {
  const items = [
    { id: 'dashboard', label: 'Bàn học', icon: HomeIcon },
    { id: 'assignment-list', label: 'Nhiệm vụ', icon: BookOpenIcon },
    { id: 'portfolio-list', label: 'Hồ sơ', icon: FolderIcon },
    { id: 'student-analytics', label: 'Tiến bộ', icon: ChartBarIcon }
  ];

  return (
    <nav aria-label="Thanh điều hướng di động" className="safe-bottom fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-slate-200 bg-white/95 px-2 py-1 shadow-lg backdrop-blur md:hidden">
      {items.map((item) => {
        const isActive = currentView === item.id;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onNavigate(item.id)}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'flex min-h-[48px] min-w-[68px] flex-col items-center justify-center rounded-lg px-2 py-1 text-xs font-semibold transition-colors',
              isActive ? 'bg-primary-50 text-primary-800' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            )}
          >
            <Icon className={cn('mb-0.5 h-5 w-5', isActive ? 'stroke-[2.2] text-primary-700' : 'text-slate-400')} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
