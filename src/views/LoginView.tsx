import React, { useState } from 'react';
import {
  Button,
  Input,
  Checkbox,
  Alert,
  Modal
} from '../components/ui';
import { useAuthStore } from '../app/store/useAuthStore';
import { MOCK_USERS } from '../data/seedData';
import {
  BookOpenIcon,
  LockClosedIcon,
  UserIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

interface LoginViewProps {
  onLoginSuccess: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const { switchUser } = useAuthStore();

  const [username, setUsername] = useState('user-std-1');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'wrong_credentials' | 'locked_account' | 'session_expired' | 'network_error' | null>(null);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setErrorType(null);

    setTimeout(() => {
      setIsLoading(false);

      // Validation simulation
      const found = MOCK_USERS.find(
        u => (u.id.toLowerCase() === username.trim().toLowerCase() || u.email?.toLowerCase() === username.trim().toLowerCase())
      );

      if (username === 'locked_user') {
        setErrorType('locked_account');
        setErrorMessage('Tài khoản này đang bị tạm khóa do nhập sai mật khẩu quá 5 lần. Vui lòng liên hệ Quản trị viên để mở khóa.');
        return;
      }

      if (username === 'network_fail') {
        setErrorType('network_error');
        setErrorMessage('Không thể kết nối đến máy chủ xác thực. Vui lòng kiểm tra lại đường truyền Internet.');
        return;
      }

      if (!found || (password !== 'password123' && password !== '123456')) {
        setErrorType('wrong_credentials');
        // Exact required error copy
        setErrorMessage('Mã người dùng hoặc mật khẩu chưa chính xác.');
        return;
      }

      // Success
      switchUser(found.id);
      onLoginSuccess();
    }, 600);
  };

  const handleQuickLogin = (userId: string) => {
    const user = MOCK_USERS.find(u => u.id === userId);
    if (user) {
      setUsername(user.id);
      setPassword('password123');
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        switchUser(user.id);
        onLoginSuccess();
      }, 400);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        {/* Academic Logo */}
        <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center mx-auto shadow-card">
          <BookOpenIcon className="w-7 h-7" />
        </div>
        <h1 className="text-h2 font-bold text-slate-900 tracking-tight">
          Hồ Sơ Đọc Số THPT
        </h1>
        <p className="text-small text-slate-500 max-w-sm mx-auto">
          Nền tảng nghiên cứu & phát triển năng lực đọc hiểu truyện ngắn hiện đại qua trục thi pháp
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-card border border-slate-200 rounded-3xl sm:px-10 space-y-6">
          {/* Error Banner */}
          {errorMessage && (
            <Alert type="error" title={errorType === 'locked_account' ? 'Tài khoản bị khóa' : errorType === 'network_error' ? 'Lỗi kết nối' : 'Đăng nhập không thành công'}>
              {errorMessage}
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Mã người dùng hoặc Email"
              type="text"
              required
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Nhập mã học sinh / GV hoặc email..."
              leftIcon={<UserIcon className="w-4 h-4 text-slate-400" />}
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mật khẩu
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3 pointer-events-none text-slate-400">
                  <LockClosedIcon className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu..."
                  className="w-full bg-white border border-slate-300 rounded-lg text-xs py-2 pl-9 pr-9 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-800 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                  title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-4 h-4" />
                  ) : (
                    <EyeIcon className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <Checkbox
                id="remember-me"
                label="Ghi nhớ đăng nhập"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
              />

              <button
                type="button"
                onClick={() => setIsForgotModalOpen(true)}
                className="font-medium text-indigo-700 hover:text-indigo-900 hover:underline"
              >
                Quên mật khẩu?
              </button>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                rightIcon={<ArrowRightIcon className="w-4 h-4" />}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5"
              >
                Đăng nhập vào Không gian học tập
              </Button>
            </div>
          </form>

          {/* Quick Demo Role Logins */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block text-center">
              Đăng nhập thử nghiệm nhanh theo vai trò:
            </span>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin('user-std-1')}
                className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-colors"
              >
                <div className="font-bold text-slate-900">[Học sinh] An</div>
                <span className="text-[10px] text-slate-500">Lớp 11A1 Văn</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('user-tch-1')}
                className="p-2 rounded-xl bg-emerald-50/60 hover:bg-emerald-100/70 border border-emerald-200 text-left transition-colors"
              >
                <div className="font-bold text-emerald-950">[Giáo viên] Mai</div>
                <span className="text-[10px] text-emerald-700">Tổ Ngữ văn</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('user-std-2')}
                className="p-2 rounded-xl bg-amber-50/60 hover:bg-amber-100/70 border border-amber-200 text-left transition-colors"
              >
                <div className="font-bold text-amber-950">[Bạn học] Bình</div>
                <span className="text-[10px] text-amber-700">Phản biện đồng đẳng</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('user-res-1')}
                className="p-2 rounded-xl bg-purple-50/60 hover:bg-purple-100/70 border border-purple-200 text-left transition-colors"
              >
                <div className="font-bold text-purple-950">[Giám khảo] Đức</div>
                <span className="text-[10px] text-purple-700">Hội đồng nghiên cứu</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-caption text-slate-400 mt-6">
          Hệ thống Hồ Sơ Đọc Số THPT • Phiên bản 2.0 Academic Workspace
        </p>
      </div>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={isForgotModalOpen}
        onClose={() => {
          setIsForgotModalOpen(false);
          setForgotSent(false);
        }}
        title="Khôi Phục Mật Khẩu Truy Cập"
        description="Nhập mã học sinh hoặc email đã đăng ký để nhận liên kết cấp lại mật khẩu."
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setIsForgotModalOpen(false);
                setForgotSent(false);
              }}
            >
              Đóng
            </Button>
            {!forgotSent && (
              <Button
                variant="primary"
                onClick={() => {
                  if (forgotEmail.trim()) {
                    setForgotSent(true);
                  }
                }}
              >
                Gửi yêu cầu khôi phục
              </Button>
            )}
          </>
        }
      >
        {forgotSent ? (
          <Alert type="success" title="Đã gửi hướng dẫn">
            Hệ thống đã gửi liên kết đặt lại mật khẩu về email của bạn. Vui lòng kiểm tra hộp thư đến hoặc mục thư rác.
          </Alert>
        ) : (
          <div className="space-y-4">
            <Input
              label="Địa chỉ Email hoặc Mã định danh"
              placeholder="Ví dụ: nguyevan.an@thpt.edu.vn"
              value={forgotEmail}
              onChange={e => setForgotEmail(e.target.value)}
              required
            />
            <p className="text-caption text-slate-500">
              Nếu bạn không nhớ email liên kết, vui lòng liên hệ trực tiếp với giáo viên phụ trách hoặc quản trị viên nhà trường.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
};
