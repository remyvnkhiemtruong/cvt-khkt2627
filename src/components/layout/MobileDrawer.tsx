import React from 'react';
import { useAuthStore } from '../../app/store/useAuthStore';
import {
  AcademicCapIcon,
  ArrowRightOnRectangleIcon,
  ArrowsRightLeftIcon,
  BookOpenIcon,
  ChartBarIcon,
  ClipboardDocumentCheckIcon,
  DocumentTextIcon,
  HomeIcon,
  PlusCircleIcon,
  ShieldCheckIcon,
  SparklesIcon,
  SwatchIcon,
  XMarkIcon
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
  const currentUser = useAuthStore((state) => state.currentUser);

  if (!isOpen) return null;

  const getNavItems = () => {
    switch (currentUser.role) {
      case 'student':
        return [
          { id: 'dashboard', label: 'Bàn học cá nhân', icon: HomeIcon },
          { id: 'student-dashboard', label: 'Nhiệm vụ đọc hiểu', icon: BookOpenIcon },
          { id: 'editor', label: 'Hồ sơ đọc đang viết', icon: DocumentTextIcon, params: { assignmentId: 'assign-vo-nhat' } },
          { id: 'version-diff', label: 'So sánh Visual Diff', icon: ArrowsRightLeftIcon, params: { assignmentId: 'assign-vo-nhat' } },
          { id: 'student-analytics', label: 'Báo cáo tiến bộ năng lực', icon: ChartBarIcon }
        ];
      case 'teacher':
        return [
          { id: 'teacher-dashboard', label: 'Bàn làm việc Giáo viên', icon: HomeIcon },
          { id: 'teacher-review', label: 'Chấm bài & Neo nhận xét', icon: ClipboardDocumentCheckIcon, params: { studentId: 'user-std-1', assignmentId: 'assign-vo-nhat' } },
          { id: 'assignment-builder', label: 'Tạo nhiệm vụ & Rubric', icon: PlusCircleIcon },
          { id: 'class-analytics', label: 'Thống kê toàn lớp', icon: ChartBarIcon }
        ];
      case 'admin':
        return [{ id: 'admin-view', label: 'Quản trị hệ thống & Audit', icon: ShieldCheckIcon }];
      case 'researcher':
        return [{ id: 'researcher-view', label: 'Dữ liệu Nghiên cứu & Giám khảo', icon: AcademicCapIcon }];
      case 'ai':
        return [{ id: 'ai-workspace', label: 'Kho câu trả lời AI', icon: SparklesIcon }];
      case 'peer':
      default:
        return [
          { id: 'dashboard', label: 'Tổng quan', icon: HomeIcon },
          { id: 'teacher-review', label: 'Đánh giá bạn học', icon: SparklesIcon, params: { studentId: 'user-std-1', assignmentId: 'assign-vo-nhat', isPeerMode: true } }
        ];
    }
  };

  const handleItemClick = (id: string, params?: any) => {
    onNavigate(id, params);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden md:hidden animate-fade-in">
      <button type="button" aria-label="Đóng menu" className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={onClose} />
      <div className="fixed inset-y-0 left-0 flex max-w-full">
        <div className="flex w-[min(18rem,88vw)] flex-col justify-between bg-white p-4 shadow-modal">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex min-w-0 items-center gap-2">
                <Avatar name={currentUser.name || 'Người dùng'} size="md" />
                <div className="min-w-0">
                  <div className="truncate text-xs font-bold text-slate-900">{currentUser.name}</div>
                  <span className="text-[10px] font-semibold uppercase text-slate-500">{currentUser.role}</span>
                </div>
              </div>
              <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600" aria-label="Đóng menu">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <nav className="space-y-1">
              {getNavItems().map((item) => {
                const isActive = currentView === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={`${item.id}-${item.label}`}
                    type="button"
                    onClick={() => handleItemClick(item.id, item.params)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-semibold transition',
                      isActive ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'
                    )}
                  >
                    <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-white' : 'text-slate-400')} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => handleItemClick('ui-kit')}
                className={cn(
                  'mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-semibold transition',
                  currentView === 'ui-kit' ? 'bg-indigo-50 font-bold text-indigo-950' : 'text-indigo-700 hover:bg-indigo-50/50'
                )}
              >
                <SwatchIcon className="h-4 w-4 shrink-0 text-indigo-600" />
                <span>Design System Kit</span>
              </button>
            </nav>
          </div>

          <div className="border-t border-slate-100 pt-4">
            {onLogout && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4" />
                <span>Đăng xuất tài khoản</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
