import React from 'react';
import { useAuthStore } from '../../app/store/useAuthStore';
import {
  AcademicCapIcon,
  ArrowRightOnRectangleIcon,
  BookOpenIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentCheckIcon,
  FolderIcon,
  HomeIcon,
  PlusCircleIcon,
  ShieldCheckIcon,
  UserGroupIcon,
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

type Nav = { id: string; label: string; icon: React.ElementType; params?: any };

const ROLE_NAMES: Record<string, string> = {
  student: 'Học sinh',
  teacher: 'Giáo viên',
  admin: 'Quản trị viên',
  researcher: 'Nghiên cứu',
  ai: 'Nhập phản hồi AI',
  peer: 'Phản biện',
};

export const MobileDrawer: React.FC<MobileDrawerProps> = ({ isOpen, onClose, currentView, onNavigate, onLogout }) => {
  const user = useAuthStore(s => s.currentUser);
  if (!isOpen) return null;

  const items: Nav[] =
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
          { id: 'ai-workspace', label: 'Phản hồi AI', icon: ChatBubbleLeftRightIcon },
          { id: 'class-analytics', label: 'Phân tích lớp', icon: UserGroupIcon },
          { id: 'assignment-builder', label: 'Tạo nhiệm vụ', icon: PlusCircleIcon },
          { id: 'rubric-management', label: 'Rubric', icon: AcademicCapIcon },
          { id: 'literature-texts', label: 'Ngữ liệu', icon: BookOpenIcon }
        ]
      : user.role === 'admin'
      ? [
          { id: 'admin-view', label: 'Quản trị', icon: ShieldCheckIcon },
          { id: 'teacher-dashboard', label: 'Giảng dạy', icon: HomeIcon },
          { id: 'ai-workspace', label: 'Phản hồi AI', icon: ChatBubbleLeftRightIcon },
          { id: 'class-analytics', label: 'Phân tích lớp', icon: ChartBarIcon },
          { id: 'researcher-view', label: 'Nghiên cứu', icon: AcademicCapIcon }
        ]
      : user.role === 'ai'
      ? [{ id: 'ai-workspace', label: 'Nhập phản hồi', icon: ChatBubbleLeftRightIcon }]
      : user.role === 'researcher'
      ? [
          { id: 'researcher-view', label: 'Nghiên cứu', icon: AcademicCapIcon },
          { id: 'portfolio-list', label: 'Hồ sơ', icon: FolderIcon },
          { id: 'class-analytics', label: 'Phân tích lớp', icon: ChartBarIcon }
        ]
      : [
          { id: 'portfolio-list', label: 'Hồ sơ phản biện', icon: FolderIcon },
          { id: 'teacher-review', label: 'Đánh giá bạn học', icon: ClipboardDocumentCheckIcon }
        ];

  const go = (item: Nav) => {
    onNavigate(item.id, item.params);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden md:hidden" role="dialog" aria-modal="true" aria-label="Điều hướng chính">
      <button type="button" className="absolute inset-0 h-full w-full bg-slate-950/45 backdrop-blur-[1px]" onClick={onClose} aria-label="Đóng menu" />
      <div className="fixed inset-y-0 left-0 flex max-w-full">
        <div className="safe-top safe-bottom flex w-[min(88vw,22rem)] flex-col justify-between overflow-y-auto border-r border-slate-200 bg-white px-4 py-4 shadow-2xl">
          <div>
            <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar name={user.name} size="md" />
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-slate-900">{user.name}</div>
                  <div className="mt-0.5 text-xs text-slate-500">{ROLE_NAMES[user.role] || user.role}</div>
                </div>
              </div>
              <button onClick={onClose} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900" aria-label="Đóng menu">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <nav className="space-y-1">
              {items.map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={`${item.id}-${item.label}`}
                    onClick={() => go(item)}
                    className={cn(
                      'flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm',
                      currentView === item.id
                        ? 'bg-slate-900 font-semibold text-white shadow-sm'
                        : 'font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-950'
                    )}
                  >
                    <Icon className={cn('h-5 w-5 shrink-0', currentView === item.id ? 'text-white' : 'text-slate-500')} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
          {onLogout && (
            <button onClick={() => { onClose(); onLogout(); }} className="mt-6 flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50">
              <ArrowRightOnRectangleIcon className="h-5 w-5" />Đăng xuất
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
