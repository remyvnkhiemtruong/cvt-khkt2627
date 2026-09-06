import React from 'react';
import { Button } from '../components/ui';
import {
  ArrowPathIcon,
  ArrowRightIcon,
  BookOpenIcon,
  CheckBadgeIcon,
  SparklesIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

interface LandingViewProps {
  onNavigate: (view: string, extraParams?: any) => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-slate-50 font-sans text-slate-900 selection:bg-primary-100 selection:text-primary-900">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm">
              <img src="/Logo.png" alt="Logo THPT Vị Thanh" className="h-full w-full object-cover" />
            </div>
            <div>
              <span className="block text-base font-bold tracking-tight text-primary-950 sm:text-lg">
                Học Tốt Ngữ Văn
              </span>
              <span className="hidden text-xs text-slate-500 sm:block">Trường THPT Vị Thanh</span>
            </div>
          </div>
          <nav className="hidden items-center gap-6 md:flex">
            <a href="#tinh-nang" className="text-sm font-medium text-slate-600 transition-colors hover:text-primary-700">
              Tính năng nổi bật
            </a>
            <a href="#lien-he" className="text-sm font-medium text-slate-600 transition-colors hover:text-primary-700">
              Liên hệ
            </a>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="ghost" size="sm" onClick={() => onNavigate('login', { mode: 'login' })}>
              Đăng nhập
            </Button>
            <Button variant="primary" size="sm" onClick={() => onNavigate('login', { mode: 'register' })}>
              Đăng ký tài khoản
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-white border-b border-slate-200 py-16 sm:py-24 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-3.5 py-1 text-xs font-semibold text-primary-800">
                <CheckBadgeIcon className="h-4 w-4 text-primary-600" />
                Dành riêng cho Thầy & Trò Trường THPT Vị Thanh
              </div>

              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl leading-tight">
                Nâng cao năng lực viết & cảm thụ <span className="text-primary-600">Ngữ Văn THPT</span>
              </h1>

              <p className="text-base text-slate-600 sm:text-lg leading-relaxed">
                Không gian học tập chuyên sâu theo định hướng Chương trình GDPT 2018. Rèn luyện kỹ năng phân tích thi pháp, viết bài theo chu trình phiên bản, nhận phản hồi gợi mở từ Giáo viên và Trợ lý AI.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full sm:w-auto px-6 py-3 font-semibold"
                  onClick={() => onNavigate('login', { mode: 'login' })}
                  rightIcon={<ArrowRightIcon className="h-4 w-4" />}
                >
                  Bắt đầu làm bài viết
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto px-6 py-3 font-semibold"
                  onClick={() => onNavigate('login', { mode: 'register' })}
                >
                  Tạo tài khoản mới
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="tinh-nang" className="bg-slate-50 py-16 sm:py-20 border-b border-slate-200">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center space-y-2 max-w-2xl mx-auto">
              <h2 className="text-xs font-bold uppercase tracking-wider text-primary-700">Tính Năng Nổi Bật</h2>
              <p className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Giải pháp toàn diện cho lớp học Ngữ văn số
              </p>
              <p className="text-sm text-slate-600">
                Tích hợp sư phạm hiện đại giúp học sinh tự chủ tư duy và giáo viên chấm chữa cá nhân hóa.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  name: 'Phân tích thi pháp đa tầng',
                  desc: 'Hệ thống hỗ trợ mổ xẻ dẫn chứng theo không gian, thời gian, điểm nhìn và ngôn ngữ nghệ thuật.',
                  icon: BookOpenIcon,
                },
                {
                  name: 'Phản hồi gợi mở (AI + Thầy)',
                  desc: 'AI tổng hợp đề xuất phản hồi neo theo đoạn văn, giáo viên duyệt và chuẩn hóa trước khi gửi học sinh.',
                  icon: SparklesIcon,
                },
                {
                  name: 'So sánh phiên bản (Visual Diff)',
                  desc: 'Công cụ trực quan hóa đoạn văn được bổ sung, chỉnh sửa hoặc tinh gọn giữa V1 và V2.',
                  icon: ArrowPathIcon,
                },
                {
                  name: 'Phản biện bạn học tích cực',
                  desc: 'Học sinh đóng vai trò phản biện chéo bài viết của nhau qua bộ tiêu chuẩn Rubric khách quan.',
                  icon: UserGroupIcon,
                },
              ].map((feat) => (
                <div
                  key={feat.name}
                  className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-primary-300 hover:shadow"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-md bg-primary-600 text-white shadow">
                    <feat.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-slate-900">{feat.name}</h3>
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed">{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-primary-900 py-14 text-white">
          <div className="mx-auto max-w-5xl px-4 text-center space-y-5">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Sẵn sàng trải nghiệm phương pháp học Ngữ văn đột phá?
            </h2>
            <p className="text-sm text-primary-200 max-w-2xl mx-auto leading-relaxed">
              Dành cho giáo viên và học sinh Trường THPT Vị Thanh. Đăng nhập ngay bằng tài khoản nhà trường cấp để bắt đầu nhiệm vụ.
            </p>
            <div className="pt-2">
              <Button
                variant="primary"
                size="lg"
                className="bg-white text-primary-950 hover:bg-slate-100 focus:ring-white font-bold"
                onClick={() => onNavigate('login', { mode: 'login' })}
              >
                Đăng nhập hệ thống
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer id="lien-he" className="bg-slate-900 text-slate-400 py-12 text-xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3 md:col-span-2">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-700 bg-white">
                  <img src="/Logo.png" alt="Logo THPT Vị Thanh" className="h-full w-full object-cover" />
                </div>
                <span className="text-base font-bold text-white">Trường THPT Vị Thanh</span>
              </div>
              <p className="text-slate-400 max-w-md leading-relaxed">
                Hệ thống hỗ trợ học tập, rèn luyện kỹ năng phân tích và phản hồi môn Ngữ văn cấp Trung học phổ thông. Đề tài Nghiên cứu Khoa học Kỹ thuật 2026–2027.
              </p>
              <div className="text-slate-400">
                Địa chỉ: Thành phố Vị Thanh, Tỉnh Hậu Giang.
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-semibold text-white">Chức năng chính</div>
              <ul className="space-y-1.5">
                <li><span className="hover:text-white transition-colors cursor-pointer" onClick={() => onNavigate('login', { mode: 'login' })}>Bàn học sinh</span></li>
                <li><span className="hover:text-white transition-colors cursor-pointer" onClick={() => onNavigate('login', { mode: 'login' })}>Bàn làm việc Giáo viên</span></li>
                <li><a href="#tinh-nang" className="hover:text-white transition-colors">Tính năng nổi bật</a></li>
              </ul>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-semibold text-white">Quy định & Hỗ trợ</div>
              <ul className="space-y-1.5">
                <li><span className="hover:text-white transition-colors cursor-pointer" onClick={() => onNavigate('login', { mode: 'login' })}>Hướng dẫn sử dụng</span></li>
                <li><span className="hover:text-white transition-colors cursor-pointer" onClick={() => onNavigate('login', { mode: 'login' })}>Chính sách bảo mật</span></li>
                <li><span className="hover:text-white transition-colors cursor-pointer" onClick={() => onNavigate('login', { mode: 'login' })}>Điều khoản học tập</span></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500">
            <div>
              &copy; {new Date().getFullYear()} Trường THPT Vị Thanh. Bảo lưu mọi quyền.
            </div>
            <div>
              Nền tảng Học tốt Ngữ Văn — Phiên bản 3.0 Production
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

