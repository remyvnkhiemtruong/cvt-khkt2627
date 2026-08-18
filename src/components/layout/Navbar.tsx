import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { usePortfolio } from '../../contexts/PortfolioContext';
import { 
  BookOpen, 
  Users, 
  ShieldCheck, 
  Compass, 
  RotateCcw,
  Bell,
  Sparkles,
  GraduationCap
} from 'lucide-react';
import type { UserRole } from '../../types';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string, extraParams?: any) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate }) => {
  const { currentUser, switchUser, allUsers } = useAuth();
  const { autosaveStatus, lastSavedTime, feedbacks, resetAllData } = usePortfolio();

  const unresolvedFeedbacksCount = feedbacks.filter(f => !f.resolved && f.studentId === currentUser.id).length;

  const roleLabels: Record<UserRole, { label: string; color: string; icon: any }> = {
    student: { label: 'Học sinh', color: 'bg-sky-100 text-sky-800 border-sky-300', icon: GraduationCap },
    teacher: { label: 'Giáo viên', color: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: Users },
    peer: { label: 'Bạn học phản biện', color: 'bg-amber-100 text-amber-800 border-amber-300', icon: Compass },
    researcher: { label: 'Giám khảo / Nghiên cứu', color: 'bg-purple-100 text-purple-800 border-purple-300', icon: Sparkles },
    admin: { label: 'Quản trị viên', color: 'bg-slate-200 text-slate-800 border-slate-400', icon: ShieldCheck }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Main Title */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('student-dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-700 flex items-center justify-center text-white shadow-md">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 tracking-tight text-lg">Hồ Sơ Đọc Số THPT</span>
                <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  Trục Thi Pháp
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Lưu phiên bản • So sánh Diff • Đánh giá Rubric • Phát triển năng lực
              </p>
            </div>
          </div>

          {/* Navigation Links based on role */}
          <nav className="hidden md:flex items-center space-x-1">
            {currentUser.role === 'student' && (
              <>
                <button
                  onClick={() => onNavigate('student-dashboard')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    currentView === 'student-dashboard' ? 'bg-sky-50 text-sky-700 font-semibold' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Nhiệm vụ của tôi
                </button>
                <button
                  onClick={() => onNavigate('editor', { assignmentId: 'assign-vo-nhat' })}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    currentView === 'editor' ? 'bg-sky-50 text-sky-700 font-semibold' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Hồ sơ đang viết
                </button>
                <button
                  onClick={() => onNavigate('version-diff', { assignmentId: 'assign-vo-nhat' })}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    currentView === 'version-diff' ? 'bg-sky-50 text-sky-700 font-semibold' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  So sánh Diff (v1/v2)
                </button>
                <button
                  onClick={() => onNavigate('student-analytics')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    currentView === 'student-analytics' ? 'bg-sky-50 text-sky-700 font-semibold' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Tiến bộ & Gợi ý
                </button>
              </>
            )}

            {currentUser.role === 'teacher' && (
              <>
                <button
                  onClick={() => onNavigate('teacher-dashboard')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    currentView === 'teacher-dashboard' ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Bàn làm việc Giáo viên
                </button>
                <button
                  onClick={() => onNavigate('teacher-review', { studentId: 'user-std-1', assignmentId: 'assign-vo-nhat' })}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    currentView === 'teacher-review' ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Chấm bài & Neo nhận xét
                </button>
                <button
                  onClick={() => onNavigate('assignment-builder')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    currentView === 'assignment-builder' ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Tạo nhiệm vụ & Rubric
                </button>
                <button
                  onClick={() => onNavigate('class-analytics')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    currentView === 'class-analytics' ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Thống kê toàn lớp
                </button>
              </>
            )}

            {currentUser.role === 'peer' && (
              <button
                onClick={() => onNavigate('teacher-review', { studentId: 'user-std-1', assignmentId: 'assign-vo-nhat', isPeerMode: true })}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-amber-50 text-amber-800 hover:bg-amber-100"
              >
                Nhận xét bạn học (Nguyễn Văn An)
              </button>
            )}

            {currentUser.role === 'researcher' && (
              <button
                onClick={() => onNavigate('researcher-view')}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-purple-50 text-purple-800 hover:bg-purple-100"
              >
                Dữ liệu Ẩn danh & Báo cáo Giám khảo
              </button>
            )}

            {currentUser.role === 'admin' && (
              <button
                onClick={() => onNavigate('admin-view')}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-800 hover:bg-slate-200"
              >
                Quản trị & Nhật ký (Audit Logs)
              </button>
            )}
          </nav>

          {/* Right Area: Save Status + Role Switcher Selector */}
          <div className="flex items-center gap-3">
            {/* Autosave Pill for Student */}
            {currentUser.role === 'student' && (
              <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-xs text-slate-600 border border-slate-200">
                <span className={`w-2 h-2 rounded-full ${
                  autosaveStatus === 'saving' ? 'bg-amber-400 animate-ping' :
                  autosaveStatus === 'dirty' ? 'bg-amber-500' : 'bg-emerald-500'
                }`} />
                <span>
                  {autosaveStatus === 'saving' ? 'Đang lưu nháp...' :
                   autosaveStatus === 'dirty' ? 'Có thay đổi chưa lưu' :
                   `Tự động lưu (${lastSavedTime})`}
                </span>
              </div>
            )}

            {/* Notification indicator */}
            {currentUser.role === 'student' && unresolvedFeedbacksCount > 0 && (
              <button
                onClick={() => onNavigate('editor', { assignmentId: 'assign-vo-nhat' })}
                title="Có phản hồi mới từ giáo viên/bạn học"
                className="relative p-1.5 text-slate-500 hover:text-sky-600 hover:bg-slate-100 rounded-lg"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-0 right-0 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
                  {unresolvedFeedbacksCount}
                </span>
              </button>
            )}

            {/* Role / User Selector Dropdown */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <label htmlFor="user-select" className="text-xs text-slate-500 hidden sm:inline font-medium">
                Mô phỏng vai trò:
              </label>
              <select
                id="user-select"
                value={currentUser.id}
                onChange={(e) => {
                  switchUser(e.target.value);
                  const u = allUsers.find(user => user.id === e.target.value);
                  if (u?.role === 'student') onNavigate('student-dashboard');
                  else if (u?.role === 'teacher') onNavigate('teacher-dashboard');
                  else if (u?.role === 'peer') onNavigate('teacher-review', { studentId: 'user-std-1', assignmentId: 'assign-vo-nhat', isPeerMode: true });
                  else if (u?.role === 'researcher') onNavigate('researcher-view');
                  else if (u?.role === 'admin') onNavigate('admin-view');
                }}
                className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-2.5 text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-none cursor-pointer hover:bg-white transition-colors"
              >
                {allUsers.map(u => (
                  <option key={u.id} value={u.id}>
                    [{roleLabels[u.role].label}] {u.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Reset Seed Data Button */}
            <button
              onClick={() => {
                if (window.confirm('Khôi phục toàn bộ dữ liệu mẫu ban đầu?')) {
                  resetAllData();
                  alert('Đã khôi phục dữ liệu mẫu thành công.');
                }
              }}
              title="Khôi phục dữ liệu mẫu ban đầu"
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
