import React from 'react';
import { Button } from '../components/ui';
import { QuestionMarkCircleIcon, HomeIcon } from '@heroicons/react/24/outline';

interface NotFoundViewProps {
  onNavigate: (view: string) => void;
}

export const NotFoundView: React.FC<NotFoundViewProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-lg mx-auto py-16 px-4 text-center space-y-6 animate-fade-in">
      <div className="w-16 h-16 bg-slate-100 border border-slate-200 text-slate-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
        <QuestionMarkCircleIcon className="w-9 h-9" />
      </div>

      <div className="space-y-2">
        <span className="text-caption font-bold text-slate-500 uppercase tracking-wider bg-slate-200/70 px-2.5 py-1 rounded-md">
          Mã lỗi 404 • Không tìm thấy trang
        </span>
        <h1 className="text-h2 font-bold text-slate-900">
          Địa Chỉ Yêu Cầu Không Tồn Tại
        </h1>
        <p className="text-small text-slate-500 leading-relaxed">
          Đường dẫn bạn vừa truy cập không tồn tại hoặc đã được chuyển sang phân hệ khác trong hệ thống Học tốt Ngữ Văn.
        </p>
      </div>

      <div className="pt-2 flex items-center justify-center">
        <Button
          variant="primary"
          onClick={() => onNavigate('dashboard')}
          leftIcon={<HomeIcon className="w-4 h-4" />}
        >
          Trở về Trang chủ
        </Button>
      </div>
    </div>
  );
};
