import React from 'react';
import { Button } from '../components/ui';
import { BookOpenIcon, SparklesIcon, ChartBarIcon, UsersIcon } from '@heroicons/react/24/outline';

interface LandingViewProps {
  onNavigate: (view: string) => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-slate-50 font-sans text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-100 bg-white shadow-sm">
              <img src="/Logo.png" alt="Logo THPT Vị Thanh" className="h-full w-full object-cover" />
            </div>
            <span className="text-lg font-bold text-primary-900">Học Tốt Ngữ Văn</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => onNavigate('login')}>Đăng nhập</Button>
            <Button variant="primary" onClick={() => onNavigate('login')}>Bắt đầu ngay</Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden bg-white py-16 sm:py-24 lg:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
                Nền tảng hỗ trợ học <span className="text-primary-600">Ngữ Văn</span>
              </h1>
              <p className="mx-auto mt-3 max-w-md text-base text-slate-500 sm:text-lg md:mt-5 md:max-w-3xl md:text-xl">
                Trường THPT Vị Thanh đồng hành cùng bạn trong hành trình rèn luyện kỹ năng phân tích, cảm thụ văn học với công nghệ AI và hệ thống phản hồi toàn diện.
              </p>
              <div className="mx-auto mt-5 max-w-md sm:flex sm:justify-center md:mt-8">
                <div className="rounded-md shadow">
                  <Button variant="primary" size="lg" className="w-full sm:w-auto" onClick={() => onNavigate('login')}>
                    Tham gia học tập
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-slate-50 py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-base font-semibold uppercase tracking-wide text-primary-600">Tính năng nổi bật</h2>
              <p className="mt-2 text-3xl font-extrabold leading-8 tracking-tight text-slate-900 sm:text-4xl">
                Phương pháp học tập mới mẻ
              </p>
            </div>
            <div className="mt-16">
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
                {[
                  {
                    name: 'Phân tích đa chiều',
                    description: 'Hệ thống hỗ trợ phân tích thi pháp, không gian, thời gian và điểm nhìn chi tiết.',
                    icon: BookOpenIcon,
                  },
                  {
                    name: 'Chấm chữa tự động (AI)',
                    description: 'Đánh giá rubric đa tiêu chí, đưa ra góp ý chỉnh sửa cho từng đoạn văn.',
                    icon: SparklesIcon,
                  },
                  {
                    name: 'Theo dõi tiến bộ',
                    description: 'Ghi nhận lịch sử phiên bản, chấm điểm chi tiết qua từng tuần học.',
                    icon: ChartBarIcon,
                  },
                  {
                    name: 'Tương tác phản biện',
                    description: 'Giao lưu học thuật, đánh giá chéo giữa các học sinh (Peer Review).',
                    icon: UsersIcon,
                  },
                ].map((feature) => (
                  <div key={feature.name} className="pt-6">
                    <div className="flow-root rounded-lg bg-white px-6 pb-8 shadow-sm h-full border border-slate-100">
                      <div className="-mt-6">
                        <div>
                          <span className="inline-flex items-center justify-center rounded-md bg-primary-600 p-3 shadow-lg">
                            <feature.icon className="h-6 w-6 text-white" aria-hidden="true" />
                          </span>
                        </div>
                        <h3 className="mt-8 text-lg font-medium tracking-tight text-slate-900">{feature.name}</h3>
                        <p className="mt-5 text-base text-slate-500">{feature.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:flex md:items-center md:justify-between lg:px-8">
          <div className="flex justify-center space-x-6 md:order-2">
            <span className="text-sm text-slate-500 hover:text-primary-600 cursor-pointer">Về chúng tôi</span>
            <span className="text-sm text-slate-500 hover:text-primary-600 cursor-pointer">Hướng dẫn sử dụng</span>
            <span className="text-sm text-slate-500 hover:text-primary-600 cursor-pointer">Điều khoản</span>
            <span className="text-sm text-slate-500 hover:text-primary-600 cursor-pointer">Bảo mật</span>
          </div>
          <div className="mt-8 md:order-1 md:mt-0">
            <p className="text-center text-sm text-slate-500">
              &copy; {new Date().getFullYear()} Trường THPT Vị Thanh. Thiết kế cho Hệ thống Học tốt Ngữ Văn.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

