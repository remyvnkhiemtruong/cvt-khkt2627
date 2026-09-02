import React, { useState } from 'react';
import { useAuthStore } from '../../app/store/useAuthStore';
import { useNotificationStore } from '../../app/store/useNotificationStore';
import { Avatar } from '../ui/Avatar';
import { Dropdown } from '../ui/Dropdown';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import {
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  BellIcon,
  BookOpenIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  QuestionMarkCircleIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';

interface AppHeaderProps {
  onNavigate: (view: string, params?: any) => void;
  currentView: string;
  onOpenCommandPalette: () => void;
  onOpenMobileDrawer?: () => void;
  onLogout?: () => void;
}

const VIEW_TITLES: Record<string, string> = {
  dashboard: 'Bàn học cá nhân',
  'student-dashboard': 'Bàn học cá nhân',
  'assignment-list': 'Nhiệm vụ học tập',
  'portfolio-list': 'Hồ sơ của tôi',
  editor: 'Không gian soạn thảo hồ sơ',
  'version-diff': 'So sánh Visual Diff',
  'student-analytics': 'Báo cáo tiến bộ năng lực',
  'teacher-dashboard': 'Bàn làm việc Giáo viên',
  'teacher-review': 'Chấm bài & Neo nhận xét',
  'assignment-builder': 'Tạo nhiệm vụ & Rubric',
  'rubric-management': 'Quản lý Rubric',
  'literature-texts': 'Ngữ liệu văn học',
  'class-analytics': 'Thống kê sư phạm toàn lớp',
  'researcher-view': 'Không gian Giám khảo & Nghiên cứu',
  'admin-view': 'Quản trị hệ thống & Audit',
  'ai-workspace': 'Kho phản hồi AI',
  'ui-kit': 'Design System & UI Kit'
};

const getHomeView = (role: string) => {
  if (role === 'teacher') return 'teacher-dashboard';
  if (role === 'researcher') return 'researcher-view';
  if (role === 'admin') return 'admin-view';
  if (role === 'ai') return 'ai-workspace';
  return 'dashboard';
};

export const AppHeader: React.FC<AppHeaderProps> = ({
  onNavigate,
  currentView,
  onOpenCommandPalette,
  onOpenMobileDrawer,
  onLogout
}) => {
  const currentUser = useAuthStore((state) => state.currentUser);
  const { addToast } = useNotificationStore();
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 h-14 border-b border-slate-200 bg-white shadow-xs">
      <div className="mx-auto h-full max-w-7xl px-3 sm:px-6 lg:px-8">
        <div className="flex h-full items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={onOpenMobileDrawer}
              className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 focus:outline-none md:hidden"
              aria-label="Mở menu"
            >
              <Bars3Icon className="h-5 w-5" />
            </button>

            <button
              type="button"
              className="flex shrink-0 items-center gap-2 text-left"
              onClick={() => onNavigate(getHomeView(currentUser.role))}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xs">
                <BookOpenIcon className="h-4 w-4" />
              </span>
              <span className="hidden text-sm font-bold tracking-tight text-slate-900 sm:inline">Hồ Sơ Đọc Số</span>
            </button>

            <span className="hidden text-slate-300 sm:inline">/</span>
            <span className="max-w-[140px] truncate text-xs font-semibold text-slate-700 sm:max-w-xs">
              {VIEW_TITLES[currentView] || 'Hồ Sơ Đọc Số'}
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={onOpenCommandPalette}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-500 transition-colors hover:bg-slate-100"
              title="Tìm kiếm & phím tắt nhanh (Ctrl+K)"
            >
              <MagnifyingGlassIcon className="h-3.5 w-3.5 text-slate-400" />
              <span className="hidden md:inline">Tìm nhanh...</span>
              <kbd className="hidden rounded border border-slate-200 bg-white px-1 font-mono text-[10px] text-slate-400 md:inline">Ctrl K</kbd>
            </button>

            <button
              type="button"
              onClick={() => addToast({ type: 'info', title: 'Thông báo', message: 'Hiện chưa có thông báo mới.' })}
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              title="Thông báo"
            >
              <BellIcon className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => setIsHelpModalOpen(true)}
              className="hidden rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 sm:block"
              title="Trợ giúp & hướng dẫn sử dụng"
            >
              <QuestionMarkCircleIcon className="h-4 w-4" />
            </button>

            <Dropdown
              trigger={
                <div className="flex cursor-pointer items-center gap-2 pl-1">
                  <Avatar name={currentUser.name || 'Người dùng'} size="sm" />
                </div>
              }
              items={[
                {
                  key: 'profile',
                  label: 'Thông tin cá nhân',
                  icon: <UserCircleIcon className="h-4 w-4" />,
                  onClick: () => setIsProfileModalOpen(true)
                },
                {
                  key: 'logout',
                  label: 'Đăng xuất',
                  icon: <ArrowRightOnRectangleIcon className="h-4 w-4" />,
                  danger: true,
                  onClick: onLogout
                }
              ]}
            />
          </div>
        </div>
      </div>

      <Modal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
        title="Hướng Dẫn Sử Dụng & Phím Tắt"
        description="Quy trình 6 bước đọc hiểu thi pháp và các thao tác nhanh"
        footer={<Button variant="primary" onClick={() => setIsHelpModalOpen(false)}>Đã hiểu</Button>}
      >
        <div className="space-y-4 text-xs text-slate-700">
          <div className="space-y-1.5 rounded-xl border border-indigo-200 bg-indigo-50/60 p-3">
            <span className="block font-bold text-indigo-950">Quy trình sư phạm 6 bước:</span>
            <p className="leading-relaxed text-slate-700">
              1. Nhận nhiệm vụ ➔ 2. Soạn thảo theo 6 trục ➔ 3. Đóng băng snapshot v1.0 ➔ 4. Nhận phản hồi neo ➔ 5. Chỉnh sửa đóng băng v2.0 ➔ 6. So sánh Visual Diff & nhận gợi ý tiếp theo.
            </p>
          </div>
          <div className="space-y-2">
            <span className="block font-bold text-slate-900">Phím tắt nhanh:</span>
            <div className="grid grid-cols-1 gap-2 text-[11px] sm:grid-cols-2">
              <div className="rounded border border-slate-200 bg-slate-50 p-2"><kbd className="font-mono font-bold">Ctrl + K</kbd>: Mở tìm nhanh</div>
              <div className="rounded border border-slate-200 bg-slate-50 p-2"><kbd className="font-mono font-bold">ESC</kbd>: Đóng cửa sổ</div>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        title="Hồ Sơ Người Dùng"
        footer={<Button variant="primary" onClick={() => setIsProfileModalOpen(false)}>Đóng</Button>}
      >
        <div className="space-y-3 text-xs">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <Avatar name={currentUser.name || 'Người dùng'} size="lg" />
            <div className="min-w-0">
              <div className="truncate text-sm font-bold text-slate-900">{currentUser.name}</div>
              <div className="truncate text-slate-500">{currentUser.email}</div>
              <div className="text-slate-500">Vai trò: <strong className="uppercase text-indigo-700">{currentUser.role}</strong></div>
            </div>
          </div>
          <div className="space-y-1 text-slate-600">
            <div><strong>Mã định danh:</strong> {currentUser.id}</div>
            {currentUser.className && <div><strong>Lớp / Đơn vị:</strong> {currentUser.className}</div>}
            <div><strong>Trạng thái tài khoản:</strong> <span className="inline-flex items-center gap-1 font-semibold text-emerald-600"><CheckCircleIcon className="h-3.5 w-3.5" /> Hoạt động</span></div>
          </div>
        </div>
      </Modal>
    </header>
  );
};
