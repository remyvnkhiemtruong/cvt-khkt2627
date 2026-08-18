import React from 'react';
import {
  HomeIcon,
  BookOpenIcon,
  DocumentTextIcon,
  ChartBarIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import { cn } from '../../utils/cn';

interface StudentBottomNavProps {
  currentView: string;
  onNavigate: (view: string, params?: any) => void;
}

export const StudentBottomNav: React.FC<StudentBottomNavProps> = ({
  currentView,
  onNavigate
}) => {
  const items = [
    { id: 'dashboard', label: 'Trang chủ', icon: HomeIcon },
    { id: 'student-dashboard', label: 'Nhiệm vụ', icon: BookOpenIcon },
    { id: 'editor', label: 'Hồ sơ', icon: DocumentTextIcon, params: { assignmentId: 'assign-vo-nhat' } },
    { id: 'student-analytics', label: 'Tiến bộ', icon: ChartBarIcon },
    { id: 'ui-kit', label: 'Cá nhân', icon: UserCircleIcon },
  ];

  return (
    <nav
      aria-label="Thanh điều hướng di động"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 px-2 py-1 flex items-center justify-around shadow-lg"
    >
      {items.map(item => {
        const isActive = currentView === item.id;
        const Icon = item.icon;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onNavigate(item.id, item.params)}
            className={cn(
              "flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-semibold transition min-w-[56px] min-h-[44px]",
              isActive ? "text-indigo-600 font-bold" : "text-slate-500 hover:text-slate-800"
            )}
          >
            <Icon className={cn("w-5 h-5 mb-0.5", isActive ? "text-indigo-600 stroke-[2.2]" : "text-slate-400")} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
