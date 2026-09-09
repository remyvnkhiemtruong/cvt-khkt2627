import React from 'react';
import { Button } from '../components/ui';
import {
  ArrowRightIcon,
  ArrowTopRightOnSquareIcon,
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  MapPinIcon,
  PencilSquareIcon,
  PhoneIcon
} from '@heroicons/react/24/outline';

interface LandingViewProps {
  onNavigate: (view: string, extraParams?: any) => void;
}

const learningSteps = [
  ['01', 'Dự đoán trước khi đọc', 'V0 ghi lại dự đoán, căn cứ và mức tự tin. Đây là dấu mốc tư duy ban đầu, không phải bài kiểm tra đoán đúng cốt truyện.'],
  ['02', 'Viết bản đầu', 'V1 được triển khai theo các trục thi pháp: tình huống, nhân vật, điểm nhìn, không – thời gian, ngôn ngữ và lập luận.'],
  ['03', 'Nhận phản hồi', 'Tài khoản AI nhập thủ công response từ ChatGPT và gửi cho học sinh ngay. Giáo viên vẫn xem toàn bộ lịch sử và có thể bổ sung nhận xét riêng.'],
  ['04', 'Chỉnh sửa có dấu vết', 'V2 và các lần sửa sau được lưu thành phiên bản mới. Bản cũ không bị ghi đè, nên có thể đối chiếu điều gì đã thay đổi và vì sao.'],
  ['05', 'Tự phản tư và đánh giá', 'Sau bản chỉnh sửa, học sinh hoàn thành REF1. Rubric chính thức do giáo viên chấm và hệ thống tính theo đúng rubric của nhiệm vụ.']
] as const;

const axes = [
  'Tình huống – Cốt truyện',
  'Nhân vật – Chi tiết nghệ thuật',
  'Người kể chuyện – Điểm nhìn',
  'Không gian – Thời gian nghệ thuật',
  'Ngôn ngữ – Giọng điệu – Biểu tượng',
  'Tổng hợp – Lập luận'
];

const schoolFacts = [
  ['Từ năm 1960', 'Trường THPT Vị Thanh có lịch sử hình thành hơn sáu thập niên.'],
  ['STEM Robotics', 'Nhà trường đã được đầu tư phòng học STEM Robotics với thiết bị thực hành, lập trình và mô hình IoT.'],
  ['Năm học 2026–2027', 'Hoạt động kỹ năng sống đầu năm có sự tham gia của Ban Giám hiệu, giáo viên và hơn 1.000 học sinh.']
] as const;

export const LandingView: React.FC<LandingViewProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-[100dvh] bg-white text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <button type="button" onClick={() => onNavigate('landing')} className="flex min-w-0 items-center gap-3 text-left">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white">
              <img src="/Logo.png" alt="Logo Trường THPT Vị Thanh" className="h-full w-full object-cover" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-slate-900 sm:text-base">Học tốt Ngữ Văn</span>
              <span className="block truncate text-xs text-slate-500">Trường THPT Vị Thanh</span>
            </span>
          </button>

          <nav className="hidden items-center gap-6 lg:flex" aria-label="Điều hướng trang chủ">
            <a href="#nha-truong" className="text-sm text-slate-600 hover:text-slate-900">Nhà trường</a>
            <a href="#cach-hoc" className="text-sm text-slate-600 hover:text-slate-900">Cách học</a>
            <a href="#lien-he" className="text-sm text-slate-600 hover:text-slate-900">Liên hệ</a>
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => onNavigate('login', { mode: 'login' })}>Đăng nhập</Button>
            <Button variant="primary" size="sm" onClick={() => onNavigate('login', { mode: 'register' })}>Tạo tài khoản</Button>
          </div>
        </div>
      </header>

      <main>
        <section className="border-b border-slate-200 bg-slate-50/60">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8 lg:py-24">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-800">Trường THPT Vị Thanh · Năm học 2026–2027</p>
              <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                Đọc kỹ hơn. Viết có căn cứ hơn.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                Học tốt Ngữ Văn là không gian học tập số phục vụ học sinh và giáo viên Trường THPT Vị Thanh. Mỗi bài viết được lưu theo phiên bản để nhìn thấy rõ quá trình dự đoán, đọc, nhận phản hồi, chỉnh sửa và tự phản tư.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button variant="primary" size="lg" rightIcon={<ArrowRightIcon className="h-4 w-4" />} onClick={() => onNavigate('login', { mode: 'login' })}>
                  Đăng nhập để học
                </Button>
                <Button variant="outline" size="lg" onClick={() => onNavigate('login', { mode: 'register' })}>
                  Tạo tài khoản học sinh
                </Button>
              </div>
            </div>

            <aside className="self-end border-l-2 border-primary-700 pl-5">
              <p className="text-sm font-semibold text-slate-900">Một bài viết không chỉ có bản cuối.</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Hệ thống giữ lại V0, V1, V2, phản hồi và REF1 để giáo viên có thể nhìn vào quá trình học, không chỉ nhìn vào một con điểm.
              </p>
            </aside>
          </div>
        </section>

        <section id="nha-truong" className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Về nhà trường</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Một nền nếp lâu dài, một cách học đang tiếp tục đổi mới.</h2>
                <p className="mt-4 text-sm leading-7 text-slate-600">
                  Trường THPT Vị Thanh được thành lập từ năm 1960. Qua nhiều giai đoạn phát triển, nhà trường hiện đặt tại số 559 đường Trần Hưng Đạo, khu vực 9, phường Vị Thanh, thành phố Cần Thơ. Bên cạnh nền tảng dạy học truyền thống, trường đã đầu tư cho STEM Robotics, thí nghiệm và hoạt động rèn kỹ năng để học sinh học bằng quan sát, thực hành và tự chịu trách nhiệm với quá trình của mình.
                </p>
              </div>

              <div className="divide-y divide-slate-200 border-y border-slate-200">
                {schoolFacts.map(([label, text]) => (
                  <div key={label} className="grid gap-2 py-4 sm:grid-cols-[150px_minmax(0,1fr)]">
                    <div className="text-sm font-semibold text-slate-900">{label}</div>
                    <div className="text-sm leading-6 text-slate-600">{text}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="cach-hoc" className="border-b border-slate-200 bg-slate-50/60">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Cách học trên hệ thống</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Từ dự đoán ban đầu đến bản viết đã được suy nghĩ lại.</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Quy trình được thiết kế để học sinh nhìn thấy chính mình thay đổi cách đọc và cách viết, thay vì chỉ nộp một bài rồi kết thúc.
              </p>
            </div>

            <ol className="mt-9 divide-y divide-slate-200 border-y border-slate-200">
              {learningSteps.map(([number, title, description]) => (
                <li key={number} className="grid gap-3 py-5 md:grid-cols-[56px_220px_minmax(0,1fr)] md:items-start">
                  <span className="font-mono text-sm text-slate-400">{number}</span>
                  <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
                  <p className="text-sm leading-6 text-slate-600">{description}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
            <div className="grid gap-10 lg:grid-cols-[340px_minmax(0,1fr)]">
              <div>
                <BookOpenIcon className="h-6 w-6 text-primary-700" />
                <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">Sáu trục để đọc một tác phẩm</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Các trục giúp học sinh đi từ chi tiết cụ thể đến lập luận tổng hợp. Giáo viên có thể giao toàn bộ hoặc chọn trục phù hợp với từng nhiệm vụ.
                </p>
              </div>
              <div className="grid gap-x-8 sm:grid-cols-2">
                {axes.map((axis, index) => (
                  <div key={axis} className="flex gap-3 border-t border-slate-200 py-4">
                    <span className="font-mono text-xs text-slate-400">0{index + 1}</span>
                    <span className="text-sm font-medium text-slate-800">{axis}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-slate-200 bg-slate-950 text-white">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <div>
                <ChatBubbleLeftRightIcon className="h-6 w-6 text-slate-300" />
                <h2 className="mt-4 text-2xl font-semibold tracking-tight">AI ở đây là một nguồn phản hồi, không phải người chấm điểm.</h2>
              </div>
              <div className="space-y-4 text-sm leading-7 text-slate-300">
                <p>
                  Nhà trường chưa dùng API AI trả phí. Tài khoản AI mở đúng bài và đúng phiên bản, người vận hành sao chép response từ ChatGPT rồi gửi vào hệ thống. Học sinh nhận phản hồi ngay để tiếp tục sửa bài.
                </p>
                <p>
                  Giáo viên vẫn xem được lịch sử, có thể bổ sung nhận xét riêng và là người duy nhất thực hiện đánh giá Rubric chính thức. Cách làm này giữ AI ở đúng vai trò hỗ trợ đọc lại bài viết.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="lien-he" className="bg-white">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_420px]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Liên hệ nhà trường</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">Trường THPT Vị Thanh</h2>
                <div className="mt-6 space-y-3 text-sm text-slate-600">
                  <p className="flex items-start gap-3"><MapPinIcon className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />Số 559, đường Trần Hưng Đạo, khu vực 9, phường Vị Thanh, TP. Cần Thơ</p>
                  <p className="flex items-center gap-3"><PhoneIcon className="h-5 w-5 shrink-0 text-slate-400" />0965 163 188</p>
                  <a className="flex items-center gap-3 text-primary-800 hover:underline" href="https://thptvithanh.cantho.edu.vn/" target="_blank" rel="noreferrer">
                    <ArrowTopRightOnSquareIcon className="h-5 w-5 shrink-0" />thptvithanh.cantho.edu.vn
                  </a>
                </div>
              </div>

              <div className="border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-start gap-3">
                  <PencilSquareIcon className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Dành cho học sinh và giáo viên của trường</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">Đăng nhập để xem nhiệm vụ đang được phân công, lịch sử phiên bản và phản hồi của từng bài viết.</p>
                  </div>
                </div>
                <div className="mt-5 flex gap-2 border-t border-slate-200 pt-4">
                  <Button variant="primary" size="sm" onClick={() => onNavigate('login', { mode: 'login' })}>Đăng nhập</Button>
                  <Button variant="outline" size="sm" onClick={() => onNavigate('login', { mode: 'register' })}>Tạo tài khoản</Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span>Học tốt Ngữ Văn · Trường THPT Vị Thanh</span>
          <span>Hồ sơ đọc số · Năm học 2026–2027</span>
        </div>
      </footer>
    </div>
  );
};
