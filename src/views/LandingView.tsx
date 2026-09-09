import React from 'react';
import { Button } from '../components/ui';
import { ArrowRightIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

interface LandingViewProps {
  onNavigate: (view: string, extraParams?: any) => void;
}

const learningSteps = [
  ['01', 'V0 · Dự đoán trước khi đọc', 'Ghi dự đoán, căn cứ và mức tự tin trước khi đọc. V0 không được chấm như một bài kiểm tra kiến thức.'],
  ['02', 'V1 · Bản trả lời đầu', 'Trả lời theo các trục thi pháp và lưu thành phiên bản bất biến. Bản đã nộp không bị ghi đè khi sửa tiếp.'],
  ['03', 'Phản hồi', 'Phản hồi AI được nhập thủ công từ response ChatGPT và gửi trực tiếp cho học sinh. Giáo viên có thể bổ sung nhận xét riêng.'],
  ['04', 'V2 · Chỉnh sửa', 'Học sinh sửa bài dựa trên phản hồi, nêu điều đã thay đổi và lí do. Hệ thống giữ V1 để đối chiếu.'],
  ['05', 'REF1 · Tự phản tư', 'Học sinh chỉ ra điều mình đã hiểu khác đi sau khi chỉnh sửa và phản hồi.'],
  ['06', 'Rubric giáo viên', 'Giáo viên chấm rubric chính thức của đúng nhiệm vụ và đúng phiên bản. AI không quyết định điểm.']
] as const;

const axes = [
  ['01', 'Tình huống – Cốt truyện'],
  ['02', 'Nhân vật – Chi tiết nghệ thuật'],
  ['03', 'Người kể chuyện – Điểm nhìn'],
  ['04', 'Không gian – Thời gian nghệ thuật'],
  ['05', 'Ngôn ngữ – Giọng điệu – Biểu tượng'],
  ['06', 'Tổng hợp – Lập luận']
] as const;

const systemFacts = [
  ['Phiên bản', 'V0, V1, V2 và các lần sửa được lưu tách biệt.'],
  ['Phản hồi', 'AI và giáo viên phản hồi theo đúng bài, đúng học sinh và đúng phiên bản.'],
  ['Đánh giá', 'Rubric chính thức do giáo viên thực hiện; máy chủ tính điểm theo rubric của nhiệm vụ.'],
  ['Dữ liệu', 'Học sinh chỉ thấy dữ liệu của mình; giáo viên chỉ làm việc trong lớp được phân công.']
] as const;

export const LandingView: React.FC<LandingViewProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-[100dvh] bg-white text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => onNavigate('landing')}
            className="flex min-w-0 items-center gap-3 text-left"
            aria-label="Trang chủ Học tốt Ngữ Văn"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white">
              <img src="/Logo.png" alt="Logo Trường THPT Vị Thanh" className="h-full w-full object-cover" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-slate-950 sm:text-base">Học tốt Ngữ Văn</span>
              <span className="block truncate text-xs text-slate-500">Trường THPT Vị Thanh</span>
            </span>
          </button>

          <nav className="hidden items-center gap-6 lg:flex" aria-label="Điều hướng trang chủ">
            <a href="#quy-trinh" className="text-sm text-slate-600 hover:text-slate-950">Quy trình</a>
            <a href="#truc-doc" className="text-sm text-slate-600 hover:text-slate-950">Trục đọc</a>
            <a href="#lien-he" className="text-sm text-slate-600 hover:text-slate-950">Liên hệ</a>
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => onNavigate('login', { mode: 'login' })}>Đăng nhập</Button>
            <Button variant="primary" size="sm" onClick={() => onNavigate('login', { mode: 'register' })}>Đăng ký</Button>
          </div>
        </div>
      </header>

      <main>
        <section className="border-b border-slate-200 bg-slate-50/60">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-18 lg:px-8 lg:py-20">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary-800">Trường THPT Vị Thanh · Năm học 2026–2027</p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                Hồ sơ đọc số Ngữ văn
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                Hệ thống lưu quá trình đọc, viết, nhận phản hồi và chỉnh sửa theo phiên bản. Giáo viên xem được sự thay đổi giữa các bản thay vì chỉ xem bài nộp cuối.
              </p>
              <p className="mt-4 font-mono text-sm leading-6 text-slate-500">
                V0 → V1 → phản hồi → V2 → REF1 → Rubric giáo viên
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button
                  variant="primary"
                  size="lg"
                  rightIcon={<ArrowRightIcon className="h-4 w-4" />}
                  onClick={() => onNavigate('login', { mode: 'login' })}
                >
                  Đăng nhập
                </Button>
                <Button variant="outline" size="lg" onClick={() => onNavigate('login', { mode: 'register' })}>
                  Tạo tài khoản
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-14">
            <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Hệ thống đang làm gì</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">Bốn việc có thể kiểm tra được</h2>
              </div>
              <dl className="divide-y divide-slate-200 border-y border-slate-200">
                {systemFacts.map(([term, description]) => (
                  <div key={term} className="grid gap-1 py-4 sm:grid-cols-[140px_minmax(0,1fr)] sm:gap-6">
                    <dt className="text-sm font-semibold text-slate-900">{term}</dt>
                    <dd className="text-sm leading-6 text-slate-600">{description}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        <section id="quy-trinh" className="border-b border-slate-200 bg-slate-50/60">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-14">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Quy trình học</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">Mỗi bước tạo ra một dấu vết học tập cụ thể</h2>
            </div>

            <ol className="mt-8 divide-y divide-slate-200 border-y border-slate-200">
              {learningSteps.map(([number, title, description]) => (
                <li key={number} className="grid gap-2 py-5 md:grid-cols-[52px_230px_minmax(0,1fr)] md:gap-5">
                  <span className="font-mono text-sm text-slate-400">{number}</span>
                  <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
                  <p className="text-sm leading-6 text-slate-600">{description}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="truc-doc" className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-14">
            <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Trục thi pháp</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">Sáu trục dùng trong nhiệm vụ</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">Giáo viên có thể giao toàn bộ hoặc chọn trục phù hợp với từng bài.</p>
              </div>
              <div className="grid gap-x-8 sm:grid-cols-2">
                {axes.map(([number, axis]) => (
                  <div key={axis} className="grid grid-cols-[34px_minmax(0,1fr)] gap-2 border-t border-slate-200 py-4">
                    <span className="font-mono text-xs text-slate-400">{number}</span>
                    <span className="text-sm font-medium text-slate-800">{axis}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-slate-200 bg-slate-950 text-white">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-14">
            <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Phản hồi AI</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight">Thủ công, có người vận hành</h2>
              </div>
              <div className="max-w-3xl space-y-3 text-sm leading-7 text-slate-300">
                <p>
                  Hệ thống không gọi API AI trả phí. Người vận hành mở đúng bài và phiên bản, sao chép response từ ChatGPT vào tài khoản AI rồi gửi cho học sinh.
                </p>
                <p>
                  Phản hồi AI chỉ là góp ý để học sinh sửa bài. Giáo viên có thể phản hồi riêng và là người thực hiện Rubric chính thức.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="lien-he" className="bg-white">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-14">
            <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Liên hệ</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">Trường THPT Vị Thanh</h2>
              </div>
              <div className="divide-y divide-slate-200 border-y border-slate-200 text-sm">
                <div className="grid gap-1 py-4 sm:grid-cols-[120px_minmax(0,1fr)] sm:gap-6">
                  <div className="font-semibold text-slate-900">Địa chỉ</div>
                  <div className="leading-6 text-slate-600">Số 559, đường Trần Hưng Đạo, khu vực 9, phường Vị Thanh, TP. Cần Thơ</div>
                </div>
                <div className="grid gap-1 py-4 sm:grid-cols-[120px_minmax(0,1fr)] sm:gap-6">
                  <div className="font-semibold text-slate-900">Điện thoại</div>
                  <div className="leading-6 text-slate-600">0965 163 188</div>
                </div>
                <div className="grid gap-1 py-4 sm:grid-cols-[120px_minmax(0,1fr)] sm:gap-6">
                  <div className="font-semibold text-slate-900">Website</div>
                  <a
                    className="inline-flex items-center gap-2 text-primary-800 hover:underline"
                    href="https://thptvithanh.cantho.edu.vn/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    thptvithanh.cantho.edu.vn
                    <ArrowTopRightOnSquareIcon className="h-4 w-4 shrink-0" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span>Học tốt Ngữ Văn · Trường THPT Vị Thanh</span>
          <span>Năm học 2026–2027</span>
        </div>
      </footer>
    </div>
  );
};