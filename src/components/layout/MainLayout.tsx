import React, { useState } from 'react';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './AppSidebar';
import { MobileDrawer } from './MobileDrawer';
import { StudentBottomNav } from './StudentBottomNav';
import { CommandPalette } from './CommandPalette';
import { useAuthStore } from '../../app/store/useAuthStore';

interface MainLayoutProps {
  currentView: string;
  onNavigate: (view: string, params?: any) => void;
  onLogout?: () => void;
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ currentView, onNavigate, onLogout, children }) => {
  const currentUser = useAuthStore((state) => state.currentUser);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans text-slate-900" data-app-name="Học tốt Ngữ Văn">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-indigo-900 focus:px-4 focus:py-2 focus:font-medium focus:text-white focus:outline-none focus:ring-2 focus:ring-white">Chuyển thẳng đến nội dung chính</a>
      <AppHeader currentView={currentView} onNavigate={onNavigate} onOpenCommandPalette={() => setIsCommandPaletteOpen(true)} onOpenMobileDrawer={() => setIsMobileDrawerOpen(true)} onLogout={onLogout}/>
      <div className="mx-auto flex w-full max-w-7xl flex-1 pb-20 md:pb-0">
        <AppSidebar currentView={currentView} onNavigate={onNavigate} isCollapsed={isSidebarCollapsed} onToggleCollapse={() => setIsSidebarCollapsed((value) => !value)}/>
        <main id="main-content" tabIndex={-1} className={`min-w-0 flex-1 overflow-y-auto focus:outline-none ${currentView === 'editor' || currentView === 'teacher-review' ? 'p-0' : 'p-3 sm:p-5 lg:p-8'}`}>{children}</main>
      </div>
      <MobileDrawer isOpen={isMobileDrawerOpen} onClose={() => setIsMobileDrawerOpen(false)} currentView={currentView} onNavigate={onNavigate} onLogout={onLogout}/>
      {currentUser.role === 'student' && <StudentBottomNav currentView={currentView} onNavigate={onNavigate} />}
      <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)} onNavigate={onNavigate}/>
    </div>
  );
};
