import React, { useState } from 'react';
import { useAuthStore } from '../../app/store/useAuthStore';
import { usePortfolioStore } from '../../app/store/usePortfolioStore';
import { useNotificationStore } from '../../app/store/useNotificationStore';
import { Avatar } from '../ui/Avatar';
import { Dropdown } from '../ui/Dropdown';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import {
  BookOpenIcon,
  BellIcon,
  MagnifyingGlassIcon,
  QuestionMarkCircleIcon,
  ArrowRightOnRectangleIcon,
  CheckCircleIcon,
  UserCircleIcon,
  Bars3Icon
} from '@heroicons/react/24/outline';

interface AppHeaderProps {
  onNavigate: (view: string, params?: any) => void;
  currentView: string;
  onOpenCommandPalette: () => void;
  onOpenMobileDrawer?: () => void;
  onLogout?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  onNavigate,
  currentView,
  onOpenCommandPalette,
  onOpenMobileDrawer,
  onLogout
}) => {
  const { currentUser, switchUser, allUsers } = useAuthStore();
  const { autosaveStatus, lastSavedTime } = usePortfolioStore();
  const { addToast } = useNotificationStore();

  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const getViewTitle = () => {
    switch (currentView) {
      case 'dashboard':
      case 'student-dashboard':
        return 'Bàn học cá nhân';
      case 'editor':
        return 'Không gian soạn thảo hồ sơ';
      case 'version-diff':
        return 'So sánh Visual Diff';
      case 'student-analytics':
        return 'Báo cáo Tiến bộ Năng lực';
      case 'teacher-dashboard':
        return 'Bàn làm việc Giáo viên';
      case 'teacher-review':
        return 'Chấm bài & Neo nhận xét';
      case 'assignment-builder':
        return 'Tạo nhiệm vụ & Rubric';
      case 'class-analytics':
        return 'Thống kê sư phạm toàn lớp';
      case 'researcher-view':
        return 'Không gian Giám khảo & Nghiên cứu';
      case 'admin-view':
        return 'Quản trị hệ thống & Audit';
      case 'ui-kit':
        return 'Design System & UI Kit';
      default:
        return 'Hồ Sơ Đọc Số';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs h-14">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-full">
        <div className="flex items-center justify-between h-full gap-2">
          {/* Left: Mobile hamburger + Platform Logo + Breadcrumb */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Drawer Trigger */}
            <button
              type="button"
              onClick={onOpenMobileDrawer}
              className="md:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none"
              aria-label="Mở menu"
            >
              <Bars3Icon className="w-5 h-5" />
            </button>

            {/* Logo */}
            <div
              className="flex items-center gap-2 cursor-pointer select-none shrink-0"
              onClick={() => onNavigate('dashboard')}
            >
              <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-xs">
                <BookOpenIcon className="w-4 h-4" />
              </div>
              <span className="font-bold text-slate-900 tracking-tight text-sm hidden sm:inline">
                Hồ Sơ Đọc Số
              </span>
            </div>

            {/* Separator */}
            <span className="text-slate-300 hidden sm:inline">/</span>

            {/* Breadcrumb View Title */}
            <span className="text-xs font-semibold text-slate-700 truncate max-w-[140px] sm:max-w-xs">
              {getViewTitle()}
            </span>
          </div>

          {/* Right: Search / Command Palette + Sync Indicator + Notifications + Help + User Menu */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Command Palette Button (Ctrl+K) */}
            <button
              type="button"
              onClick={onOpenCommandPalette}
              className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-500 transition-colors"
              title="Tìm kiếm & Phím tắt nhanh (Ctrl+K)"
            >
              <MagnifyingGlassIcon className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden md:inline">Tìm nhanh...</span>
              <kbd className="hidden md:inline text-[10px] bg-white border border-slate-200 rounded px-1 text-slate-400 font-mono">
                Ctrl K
              </kbd>
            </button>

            {/* Sync / Autosave Indicator */}
            {currentUser.role === 'student' && (
              <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 text-[11px] text-slate-600 border border-slate-200">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    autosaveStatus === 'saving'
                      ? 'bg-amber-500 animate-ping'
                      : autosaveStatus === 'dirty'
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                />
                <span>
                  {autosaveStatus === 'saving'
                    ? 'Đang lưu...'
                    : autosaveStatus === 'dirty'
                    ? 'Có thay đổi chưa lưu'
                    : `Đã đồng bộ (${lastSavedTime})`}
                </span>
              </div>
            )}

            {/* Notification Bell */}
            <button
              type="button"
              onClick={() => {
                addToast({
                  type: 'info',
                  title: 'Thông báo',
                  message: 'Không có thông báo khẩn cấp mới.'
                });
              }}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
              title="Thông báo"
            >
              <BellIcon className="w-4 h-4" />
            </button>

            {/* Help / Guide Trigger */}
            <button
              type="button"
              onClick={() => setIsHelpModalOpen(true)}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
              title="Trợ giúp & Hướng dẫn sử dụng"
            >
              <QuestionMarkCircleIcon className="w-4 h-4" />
            </button>

            {/* User Dropdown Menu */}
            <Dropdown
              trigger={
                <div className="flex items-center gap-2 pl-1 cursor-pointer">
                  <Avatar name={currentUser.name} size="sm" />
                </div>
              }
              items={[
                {
                  key: 'profile',
                  label: 'Thông tin cá nhân',
                  icon: <UserCircleIcon className="w-4 h-4" />,
                  onClick: () => setIsProfileModalOpen(true)
                },
                ...allUsers.map(u => ({
                  key: `switch-${u.id}`,
                  label: `Chuyển: [${u.role.toUpperCase()}] ${u.name}`,
                  onClick: () => {
                    switchUser(u.id);
                    if (u.role === 'student') onNavigate('dashboard');
                    else if (u.role === 'teacher') onNavigate('teacher-dashboard');
                    else if (u.role === 'peer') onNavigate('teacher-review', { studentId: 'user-std-1', assignmentId: 'assign-vo-nhat', isPeerMode: true });
                    else if (u.role === 'researcher') onNavigate('researcher-view');
                    else if (u.role === 'admin') onNavigate('admin-view');
                  }
                })),
                {
                  key: 'logout',
                  label: 'Đăng xuất',
                  icon: <ArrowRightOnRectangleIcon className="w-4 h-4" />,
                  danger: true,
                  onClick: onLogout
                }
              ]}
            />
          </div>
        </div>
      </div>

      {/* Help Modal */}
      <Modal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
        title="Hướng Dẫn Sử Dụng & Phím Tắt"
        description="Quy trình 6 bước đọc hiểu thi pháp và các thao tác nhanh"
        footer={<Button variant="primary" onClick={() => setIsHelpModalOpen(false)}>Đã hiểu</Button>}
      >
        <div className="space-y-4 text-xs text-slate-700">
          <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-200 space-y-1.5">
            <span className="font-bold text-indigo-950 block">Quy trình sư phạm 6 bước:</span>
            <p className="text-slate-700 leading-relaxed">
              1. Nhận nhiệm vụ ➔ 2. Soạn thảo theo 6 trục ➔ 3. Đóng băng snapshot v1.0 ➔ 4. Nhận phản hồi neo ➔ 5. Chỉnh sửa đóng băng v2.0 ➔ 6. So sánh Visual Diff & Nhận gợi ý tiếp theo.
            </p>
          </div>

          <div className="space-y-2">
            <span className="font-bold text-slate-900 block">Phím tắt nhanh:</span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 rounded bg-slate-50 border border-slate-200">
                <kbd className="font-mono font-bold">Ctrl + K</kbd>: Mở Command Palette
              </div>
              <div className="p-2 rounded bg-slate-50 border border-slate-200">
                <kbd className="font-mono font-bold">ESC</kbd>: Đóng modal / popover
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Profile Modal */}
      <Modal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        title="Hồ Sơ Người Dùng"
        footer={<Button variant="primary" onClick={() => setIsProfileModalOpen(false)}>Đóng</Button>}
      >
        <div className="space-y-3 text-xs">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <Avatar name={currentUser.name} size="lg" />
            <div>
              <div className="font-bold text-sm text-slate-900">{currentUser.name}</div>
              <div className="text-slate-500">Mã định danh: {currentUser.id}</div>
              <div className="text-slate-500">Vai trò: <strong className="uppercase text-indigo-700">[{currentUser.role}]</strong></div>
            </div>
          </div>
          <div className="space-y-1 text-slate-600">
            <div><strong>Lớp / Đơn vị:</strong> {currentUser.className || 'Tổ Ngữ văn THPT'}</div>
            <div><strong>Email liên hệ:</strong> {currentUser.email || 'hocsinh@thpt.edu.vn'}</div>
            <div><strong>Trạng thái tài khoản:</strong> <span className="text-emerald-600 font-semibold inline-flex items-center gap-1"><CheckCircleIcon className="w-3.5 h-3.5" /> Hoạt động</span></div>
          </div>
        </div>
      </Modal>
    </header>
  );
};
