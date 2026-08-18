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
  XMarkIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { cn } from '../../utils/cn';
import { Avatar } from '../ui/Avatar';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: string;
  onNavigate: (view: string, params?: any) => void;
  onLogout?: () => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  currentView,
  onNavigate,
  onLogout
}) => {
  const { currentUser } = useAuthStore();

  if (!isOpen) return null;

  const getNavItems = () => {
    switch (currentUser.role) {
      case 'student':
        return [
          { id: 'dashboard', label: 'Bàn học cá nhân', icon: HomeIcon },
          { id: 'student-dashboard', label: 'Nhiệm vụ đọc hiểu', icon: BookOpenIcon },
          { id: 'editor', label: 'Hồ sơ đọc đang viết', icon: DocumentTextIcon, params: { assignmentId: 'assign-vo-nhat' } },
          { id: 'version-diff', label: 'So sánh Visual Diff', icon: ArrowsRightLeftIcon, params: { assignmentId: 'assign-vo-nhat' } },
          { id: 'student-analytics', label: 'Báo cáo tiến bộ năng lực', icon: ChartBarIcon },
        ];
      case 'teacher':
        return [
          { id: 'teacher-dashboard', label: 'Bàn làm việc Giáo viên', icon: HomeIcon },
          { id: 'teacher-review', label: 'Chấm bài & Neo nhận xét', icon: ClipboardDocumentCheckIcon, params: { studentId: 'user-std-1', assignmentId: 'assign-vo-nhat' } },
          { id: 'assignment-builder', label: 'Tạo nhiệm vụ & Rubric', icon: PlusCircleIcon },
          { id: 'class-analytics', label: 'Thống kê toàn lớp', icon: ChartBarIcon },
        ];
      case 'admin':
        return [
          { id: 'admin-view', label: 'Quản trị hệ thống & Audit', icon: ShieldCheckIcon },
        ];
      case 'researcher':
        return [
          { id: 'researcher-view', label: 'Dữ liệu Nghiên cứu & Giám khảo', icon: AcademicCapIcon },
        ];
      default:
        return [
          { id: 'dashboard', label: 'Tổng quan', icon: HomeIcon },
          { id: 'teacher-review', label: 'Đánh giá bạn học', icon: SparklesIcon, params: { studentId: 'user-std-1', assignmentId: 'assign-vo-nhat', isPeerMode: true } },
        ];
    }
  };

  const navItems = getNavItems();

  const handleItemClick = (id: string, params?: any) => {
    onNavigate(id, params);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden md:hidden animate-fade-in">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={onClose} />

      <div className="fixed inset-y-0 left-0 max-w-full flex">
        <div className="w-72 bg-white shadow-modal flex flex-col justify-between p-4">
          {/* Header */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Avatar name={currentUser.name} size="md" />
                <div className="min-w-0">
                  <div className="font-bold text-xs text-slate-900 truncate">{currentUser.name}</div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">[{currentUser.role}]</span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation List */}
            <nav className="space-y-1">
              {navItems.map(item => {
                const isActive = currentView === item.id;
                const Icon = item.icon;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item.id, item.params)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition text-left",
                      isActive ? "bg-slate-900 text-white shadow-xs" : "text-slate-700 hover:bg-slate-100"
                    )}
                  >
                    <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-white" : "text-slate-400")} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}

              <button
                onClick={() => handleItemClick('ui-kit')}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition text-left mt-2",
                  currentView === 'ui-kit' ? "bg-indigo-50 text-indigo-950 font-bold" : "text-indigo-700 hover:bg-indigo-50/50"
                )}
              >
                <SwatchIcon className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Design System Kit</span>
              </button>
            </nav>
          </div>

          {/* Footer Logout */}
          <div className="pt-4 border-t border-slate-100">
            {onLogout && (
              <button
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition text-left"
              >
                <ArrowRightOnRectangleIcon className="w-4 h-4" />
                <span>Đăng xuất tài khoản</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
