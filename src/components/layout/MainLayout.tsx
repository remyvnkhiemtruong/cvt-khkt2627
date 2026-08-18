import React, { useState, useEffect } from 'react';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './AppSidebar';
import { MobileDrawer } from './MobileDrawer';
import { StudentBottomNav } from './StudentBottomNav';
import { CommandPalette } from './CommandPalette';
import { useAuthStore } from '../../app/store/useAuthStore';
import { Modal, Button, Badge } from '../ui';
import {
  ExclamationTriangleIcon,
  ArrowPathIcon,
  ArrowsRightLeftIcon
} from '@heroicons/react/24/outline';

interface MainLayoutProps {
  currentView: string;
  onNavigate: (view: string, params?: any) => void;
  onLogout?: () => void;
  children: React.ReactNode;
}

type SyncState = 'online' | 'offline' | 'syncing' | 'conflict';

export const MainLayout: React.FC<MainLayoutProps> = ({
  currentView,
  onNavigate,
  onLogout,
  children
}) => {
  const { currentUser } = useAuthStore();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // PWA / Offline Sync State Machine
  const [syncState, setSyncState] = useState<SyncState>('online');
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);

  // Listen to browser online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setSyncState('syncing');
      setTimeout(() => {
        setSyncState('online');
      }, 1500);
    };

    const handleOffline = () => {
      setSyncState('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* WCAG Skip to Main Content Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-indigo-900 focus:text-white focus:font-bold focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-white"
      >
        Chuyển thẳng đến nội dung chính (Skip to content)
      </a>

      {/* Network / Offline Sync Status Banner (PWA / Offline Resilience) */}
      {syncState === 'offline' && (
        <div
          role="status"
          aria-live="polite"
          className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-bold flex items-center justify-between shadow-xs sticky top-0 z-40"
        >
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
            <ExclamationTriangleIcon className="w-4 h-4 text-slate-950 shrink-0" />
            <span>Ngoại tuyến — các thay đổi đang được lưu an toàn trên thiết bị và sẽ đồng bộ khi có mạng.</span>
          </div>
          <Badge variant="slate" size="sm">Chế độ Offline</Badge>
        </div>
      )}

      {syncState === 'syncing' && (
        <div
          role="status"
          aria-live="polite"
          className="bg-indigo-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-between shadow-xs sticky top-0 z-40 animate-pulse"
        >
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
            <ArrowPathIcon className="w-4 h-4 text-white animate-spin shrink-0" />
            <span>Đang đồng bộ 3 thay đổi từ thiết bị lên máy chủ nghiên cứu…</span>
          </div>
        </div>
      )}

      {/* Compact Topbar */}
      <AppHeader
        currentView={currentView}
        onNavigate={onNavigate}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenMobileDrawer={() => setIsMobileDrawerOpen(true)}
        onLogout={onLogout}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto pb-20 md:pb-0">
        {/* Desktop Sidebar */}
        <AppSidebar
          currentView={currentView}
          onNavigate={onNavigate}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        {/* Central Content Area with Semantic ID */}
        <main
          id="main-content"
          tabIndex={-1}
          className={`flex-1 overflow-y-auto min-w-0 focus:outline-none ${
            currentView === 'editor' || currentView === 'teacher-review'
              ? 'p-0'
              : 'p-3 sm:p-5 lg:p-8'
          }`}
        >
          {children}
        </main>
      </div>

      {/* Mobile Slide-over Drawer */}
      <MobileDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        currentView={currentView}
        onNavigate={onNavigate}
        onLogout={onLogout}
      />

      {/* Student Mobile Bottom Nav (5 Primary Touch Targets) */}
      {currentUser.role === 'student' && (
        <StudentBottomNav
          currentView={currentView}
          onNavigate={onNavigate}
        />
      )}

      {/* Global Command Palette Modal (Ctrl+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={onNavigate}
      />

      {/* Conflict Resolution Modal (No silent overwrites) */}
      <Modal
        isOpen={isConflictModalOpen}
        onClose={() => setIsConflictModalOpen(false)}
        title="Xung Đột Đồng Bộ Phiên Bản (Sync Conflict)"
        description="Phát hiện sự khác biệt giữa bản lưu trên thiết bị của bạn và bản lưu mới nhất trên máy chủ."
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsConflictModalOpen(false)}>
              Giữ bản trên máy chủ
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setIsConflictModalOpen(false);
                setSyncState('online');
              }}
              className="bg-indigo-900 text-white font-bold"
            >
              Ghi đè bằng bản trên thiết bị
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-xs text-slate-700">
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 font-bold block text-[11px]">Bản trên thiết bị</span>
              <strong className="text-slate-900">14:32 (Hôm nay)</strong>
              <p className="text-caption text-slate-500 mt-1">Đã viết thêm đoạn lí giải điểm nhìn</p>
            </div>
            <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200">
              <span className="text-indigo-700 font-bold block text-[11px]">Bản trên máy chủ</span>
              <strong className="text-indigo-950">14:15 (Hôm nay)</strong>
              <p className="text-caption text-indigo-700 mt-1">Bản sơ thảo gốc v1.0</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('version-diff')}
            leftIcon={<ArrowsRightLeftIcon className="w-4 h-4" />}
            className="w-full text-xs"
          >
            Mở Visual Diff đối chiếu chi tiết hai bản
          </Button>
        </div>
      </Modal>

      {/* Academic Workspace Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            <strong>Hồ Sơ Đọc Số THPT</strong> • Nền tảng phát triển năng lực đọc hiểu truyện ngắn hiện đại theo trục thi pháp
          </span>
          <span className="text-slate-400 text-[11px] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            Trạng thái máy chủ: <strong>Đã đồng bộ an toàn</strong>
          </span>
        </div>
      </footer>
    </div>
  );
};
