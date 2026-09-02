import React from 'react';
import { useAuthStore } from '../../app/store/useAuthStore';
import {
  AcademicCapIcon,
  ArrowsRightLeftIcon,
  BookOpenIcon,
  ChartBarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardDocumentCheckIcon,
  DocumentTextIcon,
  FolderIcon,
  HomeIcon,
  PlusCircleIcon,
  ShieldCheckIcon,
  SparklesIcon,
  SwatchIcon
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

type NavItem = {
  id: string;
  label: string;
  icon: React.ElementType;
  params?: Record<string, unknown>;
};

export const AppSidebar: React.FC<AppSidebarProps> = ({
  currentView,
  onNavigate,
  isCollapsed = false,
  onToggleCollapse,
  className
}) => {
  const currentUser = useAuthStore((state) => state.currentUser);

  const getNavItems = (): NavItem[] => {
    switch (currentUser.role) {
      case 'student':
        return [
          { id: 'dashboard', label: 'Tổng quan', icon: HomeIcon },
          { id: 'assignment-list', label: 'Nhiệm vụ đọc hiểu', icon: BookOpenIcon },
          { id: 'portfolio-list', label: 'Hồ sơ đọc số', icon: FolderIcon },
          { id: 'editor', label: 'Bài đang viết', icon: DocumentTextIcon, params: { assignmentId: 'assign-vo-nhat' } },
          { id: 'version-diff', label: 'So sánh phiên bản', icon: ArrowsRightLeftIcon, params: { assignmentId: 'assign-vo-nhat' } },
          { id: 'student-analytics', label: 'Tiến bộ', icon: ChartBarIcon }
        ];
      case 'teacher':
        return [
          { id: 'teacher-dashboard', label: 'Tổng quan', icon: HomeIcon },
          { id: 'teacher-review', label: 'Chấm bài & Neo nhận xét', icon: ClipboardDocumentCheckIcon, params: { studentId: 'user-std-1', assignmentId: 'assign-vo-nhat' } },
          { id: 'assignment-builder', label: 'Tạo nhiệm vụ', icon: PlusCircleIcon },
          { id: 'rubric-management', label: 'Quản lý Rubric', icon: SparklesIcon },
          { id: 'literature-texts', label: 'Kho tác phẩm', icon: BookOpenIcon },
          { id: 'portfolio-list', label: 'Hồ sơ học sinh', icon: FolderIcon },
          { id: 'class-analytics', label: 'Phân tích toàn lớp', icon: ChartBarIcon }
        ];
      case 'peer':
        return [
          { id: 'portfolio-list', label: 'Hồ sơ đọc', icon: FolderIcon },
          { id: 'teacher-review', label: 'Đánh giá bạn học', icon: ClipboardDocumentCheckIcon, params: { studentId: 'user-std-1', assignmentId: 'assign-vo-nhat', isPeerMode: true } },
          { id: 'version-diff', label: 'So sánh Diff', icon: ArrowsRightLeftIcon, params: { assignmentId: 'assign-vo-nhat' } }
        ];
      case 'researcher':
        return [
          { id: 'researcher-view', label: 'Tổng quan nghiên cứu', icon: AcademicCapIcon },
          { id: 'portfolio-list', label: 'Tất cả hồ sơ', icon: FolderIcon },
          { id: 'version-diff', label: 'Tiến trình phiên bản', icon: ArrowsRightLeftIcon, params: { assignmentId: 'assign-vo-nhat' } },
          { id: 'rubric-management', label: 'Rubric nghiên cứu', icon: SparklesIcon },
          { id: 'class-analytics', label: 'Thống kê', icon: ChartBarIcon },
          { id: 'literature-texts', label: 'Kho tác phẩm', icon: BookOpenIcon }
        ];
      case 'admin':
        return [
          { id: 'admin-view', label: 'Quản trị & Audit', icon: ShieldCheckIcon },
          { id: 'teacher-dashboard', label: 'Không gian giáo viên', icon: HomeIcon },
          { id: 'teacher-review', label: 'Chấm bài', icon: ClipboardDocumentCheckIcon, params: { studentId: 'user-std-1', assignmentId: 'assign-vo-nhat' } },
          { id: 'assignment-builder', label: 'Tạo nhiệm vụ', icon: PlusCircleIcon },
          { id: 'rubric-management', label: 'Quản lý Rubric', icon: SparklesIcon },
          { id: 'literature-texts', label: 'Kho tác phẩm', icon: BookOpenIcon },
          { id: 'class-analytics', label: 'Thống kê', icon: ChartBarIcon },
          { id: 'researcher-view', label: 'Không gian nghiên cứu', icon: AcademicCapIcon }
        ];
      case 'ai':
        return [{ id: 'ai-workspace', label: 'Kho câu trả lời AI', icon: SparklesIcon }];
      default:
        return [];
    }
  };

  const navItems: NavItem[] = [
    ...getNavItems(),
    { id: 'ui-kit', label: 'Design System Kit', icon: SwatchIcon }
  ];

  return (
    <aside
      aria-label="Sidebar navigation"
      className={cn(
        'hidden min-h-[calc(100vh-3.5rem)] shrink-0 flex-col justify-between border-r border-slate-200 bg-white p-3 transition-all duration-200 md:flex',
        isCollapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 px-2 pb-1 pt-1">
          {!isCollapsed && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Phân hệ {currentUser.role}</span>
          )}
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="mx-auto rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              title={isCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
            >
              {isCollapsed ? <ChevronRightIcon className="h-4 w-4" /> : <ChevronLeftIcon className="h-4 w-4" />}
            </button>
          )}
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            const Icon = item.icon;
            const button = (
              <button
                key={`${item.id}-${item.label}`}
                type="button"
                onClick={() => onNavigate(item.id, item.params)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-xs font-semibold transition-colors',
                  isActive ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                  isCollapsed && 'justify-center px-2'
                )}
              >
                <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-white' : 'text-slate-400')} />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            );

            return isCollapsed ? (
              <Tooltip key={`${item.id}-${item.label}`} content={item.label} position="right">{button}</Tooltip>
            ) : button;
          })}
        </nav>
      </div>

      {!isCollapsed && currentUser.role !== 'ai' && (
        <div className="space-y-1.5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-800">
            <BookOpenIcon className="h-3.5 w-3.5 text-slate-600" />
            <span>6 Trục Thi Pháp THPT</span>
          </div>
          <p className="text-[10px] leading-normal text-slate-500">
            1. Tình huống • 2. Nhân vật • 3. Điểm nhìn • 4. Không-thời gian • 5. Ngôn ngữ & Biểu tượng • 6. Tính chỉnh thể
          </p>
        </div>
      )}
    </aside>
  );
};
