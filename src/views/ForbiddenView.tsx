import React from 'react';
import { Button } from '../components/ui';
import { ShieldExclamationIcon, HomeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '../app/store/useAuthStore';

interface ForbiddenViewProps {
  onNavigate: (view: string) => void;
  requiredRole?: string;
}

export const ForbiddenView: React.FC<ForbiddenViewProps> = ({ onNavigate, requiredRole }) => {
  const { currentUser } = useAuthStore();

  return (
    <div className="max-w-lg mx-auto py-16 px-4 text-center space-y-6 animate-fade-in">
      <div className="w-16 h-16 bg-rose-50 border border-rose-200 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
        <ShieldExclamationIcon className="w-9 h-9" />
      </div>

      <div className="space-y-2">
        <span className="text-caption font-bold text-rose-600 uppercase tracking-wider bg-rose-100/70 px-2.5 py-1 rounded-md">
          Mã lỗi 403 • Quyền truy cập bị từ chối
        </span>
        <h1 className="text-h2 font-bold text-slate-900">
          Không Đủ Quyền Hạn Truy Cập
        </h1>
        <p className="text-small text-slate-600 leading-relaxed">
          Tài khoản hiện tại <strong>{currentUser.name}</strong> với vai trò <strong className="uppercase">[{currentUser.role}]</strong> không được cấp quyền truy cập vào phân hệ này {requiredRole ? `(Yêu cầu vai trò: ${requiredRole})` : ''}.
        </p>
      </div>

      <div className="pt-2 flex items-center justify-center gap-3">
        <Button
          variant="outline"
          onClick={() => onNavigate('dashboard')}
          leftIcon={<ArrowLeftIcon className="w-4 h-4" />}
        >
          Quay lại Bàn làm việc
        </Button>
        <Button
          variant="primary"
          onClick={() => onNavigate('dashboard')}
          leftIcon={<HomeIcon className="w-4 h-4" />}
        >
          Trang chủ
        </Button>
      </div>
    </div>
  );
};
