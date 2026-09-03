import React from 'react';
import { useAuthStore } from '../../app/store/useAuthStore';
import {
  AcademicCapIcon,
  BookOpenIcon,
  ChartBarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardDocumentCheckIcon,
  FolderIcon,
  HomeIcon,
  PlusCircleIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { cn } from '../../utils/cn';
import { Tooltip } from '../ui/Tooltip';

interface AppSidebarProps {
  currentView: string;
  onNavigate: (view: string, params?: any) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}

type NavItem = { id: string; label: string; icon: React.ElementType; params?: any };

const ROLE_NAMES: Record<string, string> = {
  student: 'Học sinh',
  teacher: 'Giáo viên',
  admin: 'Quản trị viên',
  researcher: 'Nghiên cứu',
  ai: 'Trợ lý AI',
  peer: 'Phản biện',
};

export const AppSidebar: React.FC<AppSidebarProps> = ({
  currentView,
  onNavigate,
  isCollapsed = false,
  onToggleCollapse,
  className
}) => {
  const user = useAuthStore(s => s.currentUser);

  const items: NavItem[] =
    user.role === 'student'
      ? [
          { id: 'dashboard', label: 'Bàn học', icon: HomeIcon },
          { id: 'assignment-list', label: 'Nhiệm vụ', icon: BookOpenIcon },
          { id: 'portfolio-list', label: 'Hồ sơ học tập', icon: FolderIcon }
        ]
      : user.role === 'teacher'
      ? [
          { id: 'teacher-dashboard', label: 'Tổng quan', icon: HomeIcon },
          { id: 'portfolio-list', label: 'Hồ sơ học sinh', icon: FolderIcon },
          { id: 'teacher-review', label: 'Chấm bài', icon: ClipboardDocumentCheckIcon },
          { id: 'ai-workspace', label: 'Đề xuất AI', icon: SparklesIcon },
          { id: 'class-analytics', label: 'Phân tích lớp', icon: UserGroupIcon },
          { id: 'assignment-builder', label: 'Tạo nhiệm vụ', icon: PlusCircleIcon },
          { id: 'rubric-management', label: 'Rubric', icon: AcademicCapIcon },
          { id: 'literature-texts', label: 'Ngữ liệu', icon: BookOpenIcon }
        ]
      : user.role === 'admin'
      ? [
          { id: 'admin-view', label: 'Quản trị', icon: ShieldCheckIcon },
          { id: 'teacher-dashboard', label: 'Giảng dạy', icon: HomeIcon },
          { id: 'ai-workspace', label: 'Hàng đợi AI', icon: SparklesIcon },
          { id: 'class-analytics', label: 'Phân tích lớp', icon: ChartBarIcon },
          { id: 'researcher-view', label: 'Nghiên cứu', icon: AcademicCapIcon }
        ]
      : user.role === 'researcher'
      ? [
          { id: 'researcher-view', label: 'Nghiên cứu', icon: AcademicCapIcon },
          { id: 'portfolio-list', label: 'Hồ sơ', icon: FolderIcon },
          { id: 'class-analytics', label: 'Phân tích lớp', icon: ChartBarIcon }
        ]
      : user.role === 'ai'
      ? [
          { id: 'ai-workspace', label: 'Hàng đợi AI', icon: SparklesIcon }
        ]
      : [
          { id: 'portfolio-list', label: 'Hồ sơ phản biện', icon: FolderIcon },
          { id: 'teacher-review', label: 'Đánh giá bạn học', icon: ClipboardDocumentCheckIcon }
        ];

  return (
    <aside
      className={cn(
        'hidden min-h-[calc(100vh-3.5rem)] shrink-0 flex-col justify-between border-r border-slate-200 bg-white p-3 transition-all md:flex',
        isCollapsed ? 'w-16' : 'w-56',
        className
      )}
    >
      <div>
        <div className="mb-2.5 flex items-center justify-between border-b border-slate-100 px-2 pb-2">
          {!isCollapsed && (
            <span className="text-xs font-medium text-slate-500">{ROLE_NAMES[user.role] || user.role}</span>
          )}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="mx-auto rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label={isCollapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'}
            >
              {isCollapsed ? <ChevronRightIcon className="h-4 w-4" /> : <ChevronLeftIcon className="h-4 w-4" />}
            </button>
          )}
        </div>
        <nav className="space-y-0.5">
          {items.map(item => {
            const active = currentView === item.id;
            const Icon = item.icon;
            const button = (
              <button
                type="button"
                onClick={() => onNavigate(item.id, item.params)}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm font-normal transition-colors',
                  active
                    ? 'bg-slate-100 text-slate-900 font-medium'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                  isCollapsed && 'justify-center px-2'
                )}
              >
                <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-slate-900' : 'text-slate-400')} />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
            return isCollapsed ? (
              <Tooltip key={item.id} content={item.label} position="right">
                {button}
              </Tooltip>
            ) : (
              <React.Fragment key={item.id}>{button}</React.Fragment>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};
