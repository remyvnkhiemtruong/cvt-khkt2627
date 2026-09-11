import React from 'react';
import { Button } from '../components/ui';
import { ArrowRightIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

interface LandingViewProps {
  onNavigate: (view: string, extraParams?: any) => void;
}

const workflow = [
  ['V0', 'Dự đoán trước khi đọc', 'Ghi dự đoán, căn cứ và mức tự tin. V0 không được dùng như bài kiểm tra đúng – sai.'],
  ['V1', 'Bản trả lời đầu', 'Trả lời câu hỏi theo các trục đọc và nộp thành một phiên bản riêng.'],
  ['FB', 'Nhận phản hồi', 'Học sinh đọc góp ý đã gắn với đúng bài và đúng phiên bản.'],
  ['V2', 'Chỉnh sửa', 'Sửa bài, nêu nội dung đã thay đổi và lí do thay đổi. V1 vẫn được giữ lại để so sánh.'],
  ['REF1', 'Tự phản tư', 'Ghi lại điều mình hiểu khác đi sau khi đọc phản hồi và chỉnh sửa.'],
  ['R', 'Rubric giáo viên', 'Giáo viên đánh giá chính thức theo rubric của nhiệm vụ.']
] as const;

const axes = [
  'Tình huống – Cốt truyện',
  'Nhân vật – Chi tiết nghệ thuật',
  'Người kể chuyện – Điểm nhìn',
  'Không gian – Thời gian nghệ thuật',
  'Ngôn ngữ – Giọng điệu – Biểu tượng',
  'Tổng hợp – Lập luận'
] as const;

const roles = [
  ['Học sinh', 'Làm bài, lưu phiên bản, đọc phản hồi, chỉnh sửa và tự phản tư.'],
  ['Tài khoản AI', 'Người vận hành dán response từ ChatGPT vào đúng bài và gửi góp ý cho học sinh. Không có API AI trả phí.'],
  ['Giáo viên', 'Theo dõi tiến trình, bổ sung phản hồi và thực hiện Rubric chính thức.']
] as const;

export const LandingView: React.FC<LandingViewProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-[100dvh] bg-white text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-8">
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

          <nav className="hidden items-center gap-5 lg:flex" aria-label="Điều hướng trang chủ">
            <a href="#quy-trinh" className="text-sm text-slate-600 hover:text-slate-950">Quy trình</a>
            <a href="#truc-doc" className="text-sm text-slate-600 hover:text-slate-950">Trục đọc</a>
            <a href="#phan-hoi" className="text-sm text-slate-600 hover:text-slate-950">Phản hồi</a>
            <a href="#lien-he" className="text-sm text-slate-600 hover:text-slate-950">Liên hệ</a>
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <Button variant="primary" size="sm" onClick={() => onNavigate('login')}>Đăng nhập</Button>
          </div>
        </div>
      </header>

      <main>
        <section className="border-b border-slate-200 bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
            <div className="max-w-3xl">
              <p className="text-sm font-medium text-slate-600">Trường THPT Vị Thanh · Năm học 2026–2027</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                Hồ sơ đọc số Ngữ văn
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-700 sm:text-lg">
                Dùng để lưu bài đọc theo từng phiên bản, nhận phản hồi và theo dõi phần học sinh đã sửa sau mỗi lần nộp.
              </p>
              <p className="mt-4 text-sm leading-6 text-slate-600">
                V0 → V1 → phản hồi → V2 → REF1 → Rubric giáo viên
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button
                  variant="primary"
                  size="lg"
                  rightIcon={<ArrowRightIcon className="h-4 w-4" />}
                  onClick={() => onNavigate('login')}
                >
                  Đăng nhập
                </Button>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-500">
                Tài khoản được nhà trường hoặc quản trị viên cấp; hệ thống không hỗ trợ đăng ký công khai.
              </p>
            </div>
          </div>
        </section>

        <section id="quy-trinh" className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-14">
            <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Quy trình làm bài</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Mỗi lần nộp được lưu riêng. Bản cũ không bị thay thế khi học sinh sửa tiếp.
                </p>
              </div>

              <ol className="divide-y divide-slate-200 border-y border-slate-200">
                {workflow.map(([code, title, description]) => (
                  <li key={code} className="grid gap-2 py-5 sm:grid-cols-[64px_190px_minmax(0,1fr)] sm:gap-5">
                    <span className="font-mono text-sm font-semibold text-slate-500">{code}</span>
                    <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
                    <p className="text-sm leading-6 text-slate-600">{description}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section id="truc-doc" className="border-b border-slate-200 bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-14">
            <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Các trục đọc</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Nhiệm vụ có thể dùng toàn bộ hoặc một phần trong sáu trục dưới đây.
                </p>
              </div>
              <ol className="grid gap-x-8 sm:grid-cols-2">
                {axes.map((axis, index) => (
                  <li key={axis} className="grid grid-cols-[32px_minmax(0,1fr)] gap-3 border-t border-slate-200 py-4">
                    <span className="font-mono text-xs text-slate-500">{String(index + 1).padStart(2, '0')}</span>
                    <span className="text-sm font-medium leading-6 text-slate-800">{axis}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section id="phan-hoi" className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-14">
            <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Phản hồi và đánh giá</h2>
              </div>
              <dl className="divide-y divide-slate-200 border-y border-slate-200">
                {roles.map(([term, description]) => (
                  <div key={term} className="grid gap-1 py-4 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-6">
                    <dt className="text-sm font-semibold text-slate-900">{term}</dt>
                    <dd className="text-sm leading-6 text-slate-600">{description}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        <section id="lien-he" className="bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-14">
            <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Liên hệ</h2>
                <p className="mt-3 text-sm text-slate-600">Trường THPT Vị Thanh</p>
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

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span>Học tốt Ngữ Văn · Trường THPT Vị Thanh</span>
          <span>Năm học 2026–2027</span>
        </div>
      </footer>
    </div>
  );
};
