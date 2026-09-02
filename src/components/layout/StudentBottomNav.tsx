import React from 'react';
import {
  BookOpenIcon,
  ChartBarIcon,
  DocumentTextIcon,
  HomeIcon,
  SwatchIcon
} from '@heroicons/react/24/outline';
import { cn } from '../../utils/cn';

interface StudentBottomNavProps {
  currentView: string;
  onNavigate: (view: string, params?: any) => void;
}

export const StudentBottomNav: React.FC<StudentBottomNavProps> = ({ currentView, onNavigate }) => {
  const items = [
    { id: 'dashboard', label: 'Trang chủ', icon: HomeIcon },
    { id: 'student-dashboard', label: 'Nhiệm vụ', icon: BookOpenIcon },
    { id: 'editor', label: 'Hồ sơ', icon: DocumentTextIcon, params: { assignmentId: 'assign-vo-nhat' } },
    { id: 'student-analytics', label: 'Tiến bộ', icon: ChartBarIcon },
    { id: 'ui-kit', label: 'UI Kit', icon: SwatchIcon }
  ];

  return (
    <nav
      aria-label="Thanh điều hướng di động"
      className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-slate-200 bg-white px-2 py-1 shadow-lg md:hidden"
    >
      {items.map((item) => {
        const isActive = currentView === item.id;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onNavigate(item.id, item.params)}
            className={cn(
              'flex min-h-[44px] min-w-[56px] flex-col items-center justify-center rounded-lg px-2 py-1 text-[10px] font-semibold transition',
              isActive ? 'font-bold text-indigo-600' : 'text-slate-500 hover:text-slate-800'
            )}
          >
            <Icon className={cn('mb-0.5 h-5 w-5', isActive ? 'stroke-[2.2] text-indigo-600' : 'text-slate-400')} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
