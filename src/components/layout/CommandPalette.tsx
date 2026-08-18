import React, { useState, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  BookOpenIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  HomeIcon,
  DocumentTextIcon,
  SparklesIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../../app/store/useAuthStore';
import { mockDb } from '../../services/mockApi/mockDb';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string, params?: any) => void;
}

interface CommandItem {
  id: string;
  category: string;
  title: string;
  subtitle?: string;
  icon: any;
  action: () => void;
  roles?: string[];
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate
}) => {
  const { currentUser } = useAuthStore();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const texts = mockDb.getLiteratureTexts();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Build command list based on user role
  const commands: CommandItem[] = [
    {
      id: 'cmd-home',
      category: 'Điều Hướng Nhanh',
      title: 'Đi đến Bàn làm việc Tổng quan',
      subtitle: 'Trang chủ dashboard chính',
      icon: HomeIcon,
      action: () => onNavigate(currentUser.role === 'teacher' ? 'teacher-dashboard' : currentUser.role === 'admin' ? 'admin-view' : currentUser.role === 'researcher' ? 'researcher-view' : 'dashboard')
    },
    {
      id: 'cmd-editor',
      category: 'Nhiệm Vụ Đọc Hiểu',
      title: 'Tiếp tục soạn thảo hồ sơ [Vợ nhặt - Kim Lân]',
      subtitle: 'Mở không gian soạn thảo 6 trục thi pháp',
      icon: DocumentTextIcon,
      action: () => onNavigate('editor', { assignmentId: 'assign-vo-nhat' }),
      roles: ['student', 'teacher', 'peer']
    },
    {
      id: 'cmd-diff',
      category: 'Phiên Bản & Sai Khác',
      title: 'Mở trình so sánh Visual Diff (v1.0 ➔ v2.0)',
      subtitle: 'Xem các thay đổi từ ngữ có ký hiệu (+ / −)',
      icon: ClockIcon,
      action: () => onNavigate('version-diff', { assignmentId: 'assign-vo-nhat' }),
      roles: ['student', 'teacher', 'researcher']
    },
    {
      id: 'cmd-feedback',
      category: 'Phản Hồi Sư Phạm',
      title: 'Xem các phản hồi neo ngữ cảnh chưa xử lý',
      subtitle: 'Các góp ý từ Giáo viên và Bạn học cần tiếp thu',
      icon: ChatBubbleLeftRightIcon,
      action: () => onNavigate('editor', { assignmentId: 'assign-vo-nhat' }),
      roles: ['student']
    },
    {
      id: 'cmd-analytics',
      category: 'Năng Lực & Phân Tích',
      title: 'Xem Biểu đồ Radar Năng lực 6 Trục Thi pháp',
      subtitle: 'Báo cáo tiến bộ và đề xuất nhiệm vụ tiếp theo',
      icon: ChartBarIcon,
      action: () => onNavigate(currentUser.role === 'teacher' ? 'class-analytics' : 'student-analytics'),
      roles: ['student', 'teacher', 'researcher']
    },
    {
      id: 'cmd-ui-kit',
      category: 'Hệ Thống',
      title: 'Mở Thư Viện Chuẩn Hóa Design System & UI Kit',
      subtitle: 'Xem trước toàn bộ token màu sắc, typography và components',
      icon: SparklesIcon,
      action: () => onNavigate('ui-kit')
    }
  ];

  // Add texts
  texts.forEach(t => {
    commands.push({
      id: `text-${t.id}`,
      category: 'Kho Tác Phẩm Văn Học',
      title: `Đọc văn bản: ${t.title} (${t.author})`,
      subtitle: `Năm sáng tác: ${t.year} • Thể loại: ${t.genre}`,
      icon: BookOpenIcon,
      action: () => onNavigate('editor', { assignmentId: 'assign-vo-nhat' })
    });
  });

  // Filter commands by role and query
  const filteredCommands = commands.filter(c => {
    if (c.roles && !c.roles.includes(currentUser.role)) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return c.title.toLowerCase().includes(q) || c.category.toLowerCase().includes(q) || (c.subtitle && c.subtitle.toLowerCase().includes(q));
  });

  const handleSelect = (cmd: CommandItem) => {
    cmd.action();
    onClose();
    setQuery('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-xl bg-white rounded-2xl border border-slate-200 shadow-modal overflow-hidden flex flex-col">
        {/* Search input header */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-slate-100">
          <MagnifyingGlassIcon className="w-5 h-5 text-slate-400 shrink-0 mr-3" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Tìm kiếm tác phẩm, nhiệm vụ, thao tác nhanh... (hoặc gõ để lọc)"
            className="w-full text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none bg-transparent"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 ml-2"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Command list */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filteredCommands.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Không tìm thấy kết quả phù hợp với từ khóa "{query}".
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const Icon = cmd.icon;
              const isSelected = idx === selectedIndex;

              return (
                <div
                  key={cmd.id}
                  onClick={() => handleSelect(cmd)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs cursor-pointer transition-colors ${
                    isSelected ? 'bg-indigo-50 text-indigo-950 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <div className="truncate">{cmd.title}</div>
                      {cmd.subtitle && <p className="text-[11px] text-slate-400 font-normal truncate">{cmd.subtitle}</p>}
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider shrink-0 ml-2">
                    {cmd.category}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span>Dùng <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] text-slate-600 font-mono">↑</kbd> <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] text-slate-600 font-mono">↓</kbd> để chọn</span>
            <span><kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] text-slate-600 font-mono">Enter</kbd> mở lệnh</span>
          </div>
          <span><kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] text-slate-600 font-mono">ESC</kbd> đóng</span>
        </div>
      </div>
    </div>
  );
};
