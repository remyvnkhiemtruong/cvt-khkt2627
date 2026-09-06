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
              Tính năng
            </a>
            <a href="#quy-trinh" className="text-sm font-medium text-slate-600 transition-colors hover:text-primary-700">
              Quy trình 3 bước
            </a>
            <a href="#truc-thi-phap" className="text-sm font-medium text-slate-600 transition-colors hover:text-primary-700">
              6 Trục thi pháp
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
                  onClick={() => onNavigate('login')}
                  rightIcon={<ArrowRightIcon className="h-4 w-4" />}
                >
                  Bắt đầu làm bài viết
                </Button>
                <a
                  href="#quy-trinh"
                  className="inline-flex w-full sm:w-auto items-center justify-center rounded-md border border-slate-300 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
                >
                  Tìm hiểu quy trình
                </a>
              </div>

              {/* Trust Indicators */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-8 border-t border-slate-100 text-left">
                <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-3">
                  <div className="text-xs font-semibold text-primary-800">Ma trận Rubric 6 Trục</div>
                  <div className="text-caption text-slate-500">Đánh giá đa chiều, minh bạch</div>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-3">
                  <div className="text-xs font-semibold text-primary-800">3 Phiên bản V0 / V1 / V2</div>
                  <div className="text-caption text-slate-500">Ghi nhận tiến bộ qua từng lần sửa</div>
                </div>
                <div className="col-span-2 sm:col-span-1 rounded-lg border border-slate-100 bg-slate-50/70 p-3">
                  <div className="text-xs font-semibold text-primary-800">Bảo mật & Ẩn danh</div>
                  <div className="text-caption text-slate-500">Nghiên cứu khoa học chuẩn mực</div>
                </div>
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

        {/* 3-Step Pedagogical Cycle */}
        <section id="quy-trinh" className="bg-white py-16 sm:py-20 border-b border-slate-200">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center space-y-2 max-w-2xl mx-auto">
              <h2 className="text-xs font-bold uppercase tracking-wider text-primary-700">Quy Trình Sư Phạm</h2>
              <p className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Chu trình 3 phiên bản hoàn thiện bài viết
              </p>
              <p className="text-sm text-slate-600">
                Không chỉ chấm điểm cuối kỳ — Chúng tôi đồng hành cùng học sinh trong từng chặng đường cải thiện văn phong.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="relative rounded-lg border border-slate-200 bg-slate-50/80 p-6 space-y-3">
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                  1
                </div>
                <h3 className="text-base font-bold text-slate-900">Phiên bản V0 — Dự đoán</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Đọc trích đoạn ngữ liệu, ghi nhận cảm nhận ban đầu và dự đoán các trục thi pháp trọng tâm của tác phẩm.
                </p>
                <div className="pt-2 text-caption text-primary-700 font-medium">Khởi động tư duy cảm thụ</div>
              </div>

              <div className="relative rounded-lg border border-slate-200 bg-slate-50/80 p-6 space-y-3">
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white">
                  2
                </div>
                <h3 className="text-base font-bold text-slate-900">Phiên bản V1 — Bài viết hoàn chỉnh</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Viết bài văn phân tích hoàn chỉnh, triển khai các luận điểm theo tiêu chí. Hệ thống tự động lưu nháp an toàn.
                </p>
                <div className="pt-2 text-caption text-primary-700 font-medium">AI & Giáo viên đưa ra phản hồi neo</div>
              </div>

              <div className="relative rounded-lg border border-slate-200 bg-slate-50/80 p-6 space-y-3">
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-600 text-xs font-bold text-white">
                  3
                </div>
                <h3 className="text-base font-bold text-slate-900">Phiên bản V2 — Tinh chỉnh & Nâng cấp</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Học sinh tiếp thu nhận xét, chỉnh sửa lập luận, giải thích lý do sửa và nộp lại phiên bản hoàn thiện nhất.
                </p>
                <div className="pt-2 text-caption text-amber-700 font-medium">Đánh giá sự tiến bộ vượt bậc</div>
              </div>
            </div>
          </div>
        </section>

        {/* 6 Poetic Axes */}
        <section id="truc-thi-phap" className="bg-slate-50 py-16 sm:py-20 border-b border-slate-200">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center space-y-2 max-w-2xl mx-auto">
              <h2 className="text-xs font-bold uppercase tracking-wider text-primary-700">Khung Đánh Giá Chuẩn Mực</h2>
              <p className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                6 Trục Thi Pháp & Nghệ Thuật
              </p>
              <p className="text-sm text-slate-600">
                Ma trận Rubric bám sát đặc trưng thể loại theo yêu cầu của Bộ Giáo dục và Đào tạo.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { title: 'Không gian nghệ thuật', sub: 'Bối cảnh & Trường thẩm mỹ' },
                { title: 'Thời gian nghệ thuật', sub: 'Nhịp điệu & Trục tâm lý' },
                { title: 'Điểm nhìn trần thuật', sub: 'Ngôi kể & Cự ly quan sát' },
                { title: 'Nhân vật & Tâm lý', sub: 'Xung đột & Chiều sâu nội tâm' },
                { title: 'Ngôn từ & Biện pháp', sub: 'Hình ảnh, Nhịp điệu, Tu từ' },
                { title: 'Chủ đề & Tư tưởng', sub: 'Thông điệp nhân văn & Thời đại' },
              ].map((axis, i) => (
                <div key={axis.title} className="rounded-lg border border-slate-200 bg-white p-4 text-center space-y-1">
                  <div className="text-caption font-bold text-primary-600">Trục {i + 1}</div>
                  <div className="text-xs font-semibold text-slate-900">{axis.title}</div>
                  <div className="text-caption text-slate-500">{axis.sub}</div>
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
                onClick={() => onNavigate('login')}
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
                <li><a href="#tinh-nang" className="hover:text-white transition-colors">Bàn học sinh</a></li>
                <li><a href="#quy-trinh" className="hover:text-white transition-colors">Bàn làm việc Giáo viên</a></li>
                <li><a href="#truc-thi-phap" className="hover:text-white transition-colors">Ma trận Rubric</a></li>
                <li><a href="#tinh-nang" className="hover:text-white transition-colors">Hàng đợi phản hồi AI</a></li>
              </ul>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-semibold text-white">Quy định & Hỗ trợ</div>
              <ul className="space-y-1.5">
                <li><span className="hover:text-white transition-colors cursor-pointer" onClick={() => onNavigate('login')}>Hướng dẫn sử dụng</span></li>
                <li><span className="hover:text-white transition-colors cursor-pointer" onClick={() => onNavigate('login')}>Chính sách bảo mật</span></li>
                <li><span className="hover:text-white transition-colors cursor-pointer" onClick={() => onNavigate('login')}>Điều khoản học tập</span></li>
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

