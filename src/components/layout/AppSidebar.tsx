import React from 'react';
import { useAuthStore } from '../../app/store/useAuthStore';
import {
  HomeIcon,
  DocumentTextIcon,
  ArrowsRightLeftIcon,
  ChartBarIcon,
  ClipboardDocumentCheckIcon,
  PlusCircleIcon,
  AcademicCapIcon,
  ShieldCheckIcon,
  BookOpenIcon,
  SparklesIcon,
  SwatchIcon,
  UsersIcon,
  UserGroupIcon,
  ServerStackIcon,
  Cog6ToothIcon,
  BellIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FolderIcon
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

export const AppSidebar: React.FC<AppSidebarProps> = ({
  currentView,
  onNavigate,
  isCollapsed = false,
  onToggleCollapse,
  className
}) => {
  const { currentUser } = useAuthStore();

  const getNavItems = () => {
    switch (currentUser.role) {
      case 'student':
        return [
          { id: 'dashboard', label: 'Tổng quan', icon: HomeIcon },
          { id: 'assignment-list', label: 'Nhiệm vụ đọc hiểu', icon: BookOpenIcon },
          { id: 'portfolio-list', label: 'Hồ sơ đọc số', icon: FolderIcon },
          { id: 'editor', label: 'Bài đang viết', icon: DocumentTextIcon, params: { assignmentId: 'assign-vo-nhat' } },
          { id: 'student-analytics', label: 'Tiến bộ', icon: ChartBarIcon },
          { id: 'teacher-review', label: 'Phản biện bạn học', icon: SparklesIcon, params: { studentId: 'user-std-2', assignmentId: 'assign-vo-nhat', isPeerMode: true } },
          { id: 'notifications', label: 'Thông báo', icon: BellIcon }
        ];

      case 'teacher':
        return [
          { id: 'teacher-dashboard', label: 'Tổng quan', icon: HomeIcon },
          { id: 'class-analytics', label: 'Lớp học', icon: UserGroupIcon },
          { id: 'editor', label: 'Văn bản', icon: BookOpenIcon, params: { assignmentId: 'assign-vo-nhat' } },
          { id: 'assignment-list', label: 'Nhiệm vụ', icon: PlusCircleIcon },
          { id: 'portfolio-list', label: 'Hồ sơ học sinh', icon: FolderIcon },
          { id: 'teacher-review', label: 'Chấm bài & Neo nhận xét', icon: ClipboardDocumentCheckIcon, params: { studentId: 'user-std-1', assignmentId: 'assign-vo-nhat' } },
          { id: 'class-analytics', label: 'Phân tích toàn lớp', icon: ChartBarIcon },
        ];

      case 'admin':
        return [
          { id: 'admin-view', label: 'Tổng quan', icon: HomeIcon },
          { id: 'users', label: 'Người dùng', icon: UsersIcon },
          { id: 'classes', label: 'Lớp', icon: UserGroupIcon },
          { id: 'rbac', label: 'Phân quyền', icon: ShieldCheckIcon },
          { id: 'admin-view', label: 'Nhật ký (Audit)', icon: DocumentTextIcon },
          { id: 'backup', label: 'Sao lưu', icon: ServerStackIcon },
          { id: 'settings', label: 'Cấu hình', icon: Cog6ToothIcon }
        ];

      case 'researcher':
        return [
          { id: 'researcher-view', label: 'Tổng quan', icon: HomeIcon },
          { id: 'researcher-view', label: 'Dữ liệu ẩn danh', icon: AcademicCapIcon },
          { id: 'portfolio-list', label: 'Tất cả hồ sơ', icon: FolderIcon },
          { id: 'version-diff', label: 'Tiến trình', icon: ArrowsRightLeftIcon, params: { assignmentId: 'assign-vo-nhat' } },
          { id: 'researcher-view', label: 'Thống kê (Effect d)', icon: ChartBarIcon },
          { id: 'ui-kit', label: 'Minh chứng kỹ thuật', icon: SparklesIcon }
        ];

      case 'peer':
      default:
        return [
          { id: 'dashboard', label: 'Tổng quan', icon: HomeIcon },
          { id: 'portfolio-list', label: 'Hồ sơ đọc', icon: FolderIcon },
          { id: 'teacher-review', label: 'Đánh giá bạn học', icon: SparklesIcon, params: { studentId: 'user-std-1', assignmentId: 'assign-vo-nhat', isPeerMode: true } },
          { id: 'version-diff', label: 'So sánh Diff', icon: ArrowsRightLeftIcon, params: { assignmentId: 'assign-vo-nhat' } }
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <aside
      aria-label="Sidebar navigation"
      className={cn(
        "bg-white border-r border-slate-200 p-3 shrink-0 flex flex-col justify-between hidden md:flex transition-all duration-200 min-h-[calc(100vh-3.5rem)]",
        isCollapsed ? "w-16" : "w-64",
        className
      )}
    >
      <div className="space-y-4">
        {/* Role label & Collapse trigger */}
        <div className="flex items-center justify-between px-2 pt-1 pb-1 border-b border-slate-100">
          {!isCollapsed && (
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Phân hệ {currentUser.role.toUpperCase()}
            </span>
          )}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 mx-auto transition"
              title={isCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
            >
              {isCollapsed ? <ChevronRightIcon className="w-4 h-4" /> : <ChevronLeftIcon className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {navItems.map(item => {
            const isActive = currentView === item.id;
            const Icon = item.icon;

            const buttonContent = (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id, item.params)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-colors text-left",
                  isActive
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                  isCollapsed && "justify-center px-2"
                )}
              >
                <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-white" : "text-slate-400")} />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            );

            if (isCollapsed) {
              return (
                <Tooltip key={item.id} content={item.label} position="right">
                  {buttonContent}
                </Tooltip>
              );
            }

            return buttonContent;
          })}
        </nav>

        {/* Design System kit link */}
        <div className="pt-2 border-t border-slate-100">
          {isCollapsed ? (
            <Tooltip content="Design System & UI Kit" position="right">
              <button
                type="button"
                onClick={() => onNavigate('ui-kit')}
                className={cn(
                  "w-full flex items-center justify-center p-2 rounded-xl text-xs transition",
                  currentView === 'ui-kit' ? "bg-indigo-50 text-indigo-900 font-bold" : "text-indigo-700 hover:bg-indigo-50/50"
                )}
              >
                <SwatchIcon className="w-4 h-4 text-indigo-600" />
              </button>
            </Tooltip>
          ) : (
            <button
              type="button"
              onClick={() => onNavigate('ui-kit')}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition text-left",
                currentView === 'ui-kit'
                  ? "bg-indigo-50 text-indigo-900 font-bold border border-indigo-200"
                  : "text-indigo-700 hover:bg-indigo-50/50"
              )}
            >
              <SwatchIcon className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Design System Kit</span>
            </button>
          )}
        </div>
      </div>

      {/* 6 Poetic Axes Mini Widget when expanded */}
      {!isCollapsed && (
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px]">
            <BookOpenIcon className="w-3.5 h-3.5 text-slate-600" />
            <span>6 Trục Thi Pháp THPT</span>
          </div>
          <p className="text-[10px] text-slate-500 leading-normal">
            1. Tình huống • 2. Nhân vật • 3. Điểm nhìn • 4. Không-thời gian • 5. Ngôn ngữ & Biểu tượng • 6. Tính chỉnh thể
          </p>
        </div>
      )}
    </aside>
  );
};
