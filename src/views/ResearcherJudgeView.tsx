import React, { useState, useMemo } from 'react';
import { POETIC_AXES } from '../data/seedData';
import {
  Button,
  Badge,
  Card,
  StatCard,
  Tabs,
  Modal,
  Pagination
} from '../components/ui';
import {
  SparklesIcon,
  PrinterIcon,
  ArrowRightIcon,
  EyeIcon,
  ShieldCheckIcon,
  ArrowLeftIcon,
  ArrowsRightLeftIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface ResearcherJudgeViewProps {
  onNavigate: (view: string, extraParams?: any) => void;
}

export const ResearcherJudgeView: React.FC<ResearcherJudgeViewProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'study' | 'pre_post' | 'anonymous_samples' | 'audit'>('study');
  const [selectedAnonymousSample, setSelectedAnonymousSample] = useState<any | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // 72 Anonymous Samples (Class TN 11A1 & Class DC 11A2)
  const anonymousSamples = useMemo(() => [
    {
      code: 'HS-ANON-001',
      group: 'Thực nghiệm (TN)',
      preScore: 2.1,
      postScore: 3.5,
      gain: '+1.4 đ',
      versionCount: 2,
      resolvedFeedbacks: 3,
      keyEvidenceQuote: '“Nhìn người đàn bà ngồi ở mép giường, Tràng chợt thấy thương thương...”',
      axisProgress: { plot_situation: 3.5, character_detail: 3.5, narrator_pov: 3.2, space_time: 3.5, language_tone_symbol: 3.0, form_argument: 3.5 }
    },
    {
      code: 'HS-ANON-002',
      group: 'Thực nghiệm (TN)',
      preScore: 2.3,
      postScore: 3.8,
      gain: '+1.5 đ',
      versionCount: 3,
      resolvedFeedbacks: 4,
      keyEvidenceQuote: '“Ánh sáng ngọn đèn con của chị Tí le lói giữa màn đêm phố huyện...”',
      axisProgress: { plot_situation: 4.0, character_detail: 3.8, narrator_pov: 3.8, space_time: 3.8, language_tone_symbol: 3.8, form_argument: 3.6 }
    },
    {
      code: 'HS-ANON-003',
      group: 'Thực nghiệm (TN)',
      preScore: 1.8,
      postScore: 2.8,
      gain: '+1.0 đ',
      versionCount: 2,
      resolvedFeedbacks: 3,
      keyEvidenceQuote: '“Hắn vừa đi vừa chửi. Bao giờ cũng thế, cứ rượu xong là hắn chửi.”',
      axisProgress: { plot_situation: 2.8, character_detail: 3.0, narrator_pov: 2.5, space_time: 2.8, language_tone_symbol: 2.5, form_argument: 2.8 }
    },
    {
      code: 'HS-ANON-004',
      group: 'Đối chứng (ĐC)',
      preScore: 2.0,
      postScore: 2.4,
      gain: '+0.4 đ',
      versionCount: 1,
      resolvedFeedbacks: 0,
      keyEvidenceQuote: '“Tràng là người nghèo lấy được vợ giữa nạn đói.”',
      axisProgress: { plot_situation: 2.5, character_detail: 2.4, narrator_pov: 2.0, space_time: 2.4, language_tone_symbol: 2.2, form_argument: 2.5 }
    },
    {
      code: 'HS-ANON-005',
      group: 'Thực nghiệm (TN)',
      preScore: 2.4,
      postScore: 3.6,
      gain: '+1.2 đ',
      versionCount: 2,
      resolvedFeedbacks: 2,
      keyEvidenceQuote: '“Bà cụ Tứ nghẹn ngào, nén tiếng thở dài trước mặt nàng dâu mới.”',
      axisProgress: { plot_situation: 3.8, character_detail: 3.8, narrator_pov: 3.5, space_time: 3.5, language_tone_symbol: 3.2, form_argument: 3.5 }
    },
    {
      code: 'HS-ANON-006',
      group: 'Đối chứng (ĐC)',
      preScore: 1.9,
      postScore: 2.3,
      gain: '+0.4 đ',
      versionCount: 1,
      resolvedFeedbacks: 0,
      keyEvidenceQuote: '“Hai đứa trẻ ngồi đợi đoàn tàu đêm đi qua.”',
      axisProgress: { plot_situation: 2.4, character_detail: 2.2, narrator_pov: 2.0, space_time: 2.5, language_tone_symbol: 2.2, form_argument: 2.4 }
    }
  ], []);

  const totalPages = Math.ceil(anonymousSamples.length / itemsPerPage);
  const paginatedSamples = anonymousSamples.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6 animate-fade-in pb-16 max-w-6xl mx-auto">
      {/* Header */}
      <header className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onNavigate('dashboard')}
              leftIcon={<ArrowLeftIcon className="w-4 h-4" />}
              className="text-slate-600 hover:text-slate-900 p-0 pr-2"
            >
              Dashboard
            </Button>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-semibold text-slate-700">Dữ Liệu Nghiên Cứu & Hội Đồng Giám Khảo</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-h2 font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <ShieldCheckIcon className="w-6 h-6 text-indigo-700" />
              Không Gian Đánh Giá Ẩn Danh (Blind Evaluation)
            </h1>
            <Badge variant="purple">Dành Cho Hội Đồng Khoa Học</Badge>
          </div>
          <p className="text-small text-slate-500 mt-1">
            Môi trường kiểm chứng minh chứng khoa học không chứa thông tin định danh cá nhân (PII Protection)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.print()}
            leftIcon={<PrinterIcon className="w-4 h-4" />}
          >
            In báo cáo đối chứng
          </Button>

          <Button
            size="sm"
            variant="academic"
            onClick={() => onNavigate('version-diff')}
            leftIcon={<ArrowsRightLeftIcon className="w-4 h-4" />}
          >
            Kiểm tra Visual Diff mẫu
          </Button>
        </div>
      </header>

      {/* Privacy & Scientific Integrity Notice Banner */}
      <div className="p-3.5 bg-amber-50/90 border border-amber-300 rounded-xl text-xs text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-xs">
        <span className="flex items-center gap-2">
          <ShieldCheckIcon className="w-5 h-5 text-amber-700 shrink-0" />
          <span>
            <strong>Lưu ý khoa học:</strong> Dữ liệu minh họa giao diện — không phải kết quả thực nghiệm. Toàn bộ mã học sinh <code>HS-ANON-xxx</code> và <code>HS-DEMO-xx</code> được sinh tự động nhằm mục đích trình diễn tính năng sư phạm.
          </span>
        </span>
        <Badge variant="amber" size="sm" className="shrink-0">Demo Sandbox</Badge>
      </div>

      {/* Summary Stat Cards */}
      <section aria-label="Chỉ số nghiên cứu khoa học" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Mẫu nghiên cứu ẩn danh"
          value="72 học sinh"
          subValue="36 Thực nghiệm • 36 Đối chứng"
          icon={<ShieldCheckIcon className="w-5 h-5" />}
        />

        <StatCard
          label="Kích thước hiệu ứng"
          value="d = 1.18"
          subValue="Cohen's d (Mức rất lớn)"
          trend={{ value: "Hiệu quả can thiệp cao", isPositive: true }}
          icon={<SparklesIcon className="w-5 h-5" />}
        />

        <StatCard
          label="Tổng số snapshot phiên bản"
          value="144 mốc"
          subValue="Trung bình 2.0 phiên bản/bài"
          icon={<EyeIcon className="w-5 h-5" />}
        />

        <StatCard
          label="Mức tăng trưởng trung bình"
          value="+32.4%"
          subValue="Sau chu kỳ can thiệp 4 tuần"
          trend={{ value: "p < 0.001 (Ý nghĩa thống kê)", isPositive: true }}
          icon={<CheckCircleIcon className="w-5 h-5" />}
        />
      </section>

      {/* Navigation Tabs */}
      <Tabs
        activeId={activeTab}
        onChange={(id) => setActiveTab(id as any)}
        items={[
          { id: 'study', label: 'Báo cáo tổng quan đề tài' },
          { id: 'pre_post', label: 'Đối chứng Thực nghiệm vs Đối chứng' },
          { id: 'anonymous_samples', label: 'Mẫu dữ liệu ẩn danh (Drill-Down)' },
          { id: 'audit', label: 'Minh chứng truy nguyên (Evidence Trail)' }
        ]}
      />

      {/* ========================================================================= */}
      {/* TAB 1: OVERVIEW STUDY REPORT */}
      {/* ========================================================================= */}
      {activeTab === 'study' && (
        <Card padding="lg" className="border-slate-200 bg-white shadow-card space-y-5">
          <div className="pb-3 border-b border-slate-100">
            <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">
              Đề Tài Nghiên Cứu Sư Phạm Ứng Dụng
            </span>
            <h2 className="text-base font-bold text-slate-900">
              Hệ thống hồ sơ đọc số có lưu phiên bản theo trục thi pháp nhằm phát triển năng lực đọc hiểu truyện ngắn hiện đại cho học sinh THPT
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="font-bold text-slate-900 block">Địa bàn thực nghiệm</span>
              <p className="text-slate-600">Trường THPT Chuyên • 2 lớp 11 (11A1 Thực nghiệm, 11A2 Đối chứng).</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="font-bold text-slate-900 block">Ngữ liệu can thiệp</span>
              <p className="text-slate-600">3 truyện ngắn hiện đại: <em>Vợ nhặt</em>, <em>Chí Phèo</em>, <em>Hai đứa trẻ</em>.</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="font-bold text-slate-900 block">Khung đánh giá</span>
              <p className="text-slate-600">Ma trận Rubric 6 Trục Thi Pháp THPT thang điểm 0–4 chuẩn Bộ GD&ĐT.</p>
            </div>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PRE-TEST VS POST-TEST COMPARISON */}
      {/* ========================================================================= */}
      {activeTab === 'pre_post' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card padding="lg" className="border-indigo-200 bg-indigo-50/20 shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-indigo-950">
                Nhóm Thực Nghiệm (Lớp 11A1 — 36 HS)
              </h2>
              <Badge variant="purple">Có can thiệp Hồ sơ lưu phiên bản</Badge>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">
              Học sinh được viết hồ sơ theo 6 trục thi pháp, đóng băng bản sơ thảo v1.0, tiếp thu phản hồi neo của giáo viên và tạo bản v2.0 có so sánh Visual Diff.
            </p>

            <div className="grid grid-cols-2 gap-3 text-center text-xs">
              <div className="p-3 bg-white rounded-xl border border-indigo-200">
                <span className="text-slate-400 block text-[11px]">Trước can thiệp (Pre-test)</span>
                <strong className="text-base text-slate-800">2.18 / 4.0 đ</strong>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-300">
                <span className="text-emerald-700 block text-[11px]">Sau can thiệp (Post-test)</span>
                <strong className="text-base text-emerald-900">3.46 / 4.0 đ (+58.7%)</strong>
              </div>
            </div>
          </Card>

          <Card padding="lg" className="border-slate-200 bg-white shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">
                Nhóm Đối Chứng (Lớp 11A2 — 36 HS)
              </h2>
              <Badge variant="slate">Dạy học truyền thống</Badge>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">
              Học sinh học tập theo phương pháp thuyết giảng truyền thống, làm bài nộp một lần và không có cơ chế lưu phiên bản hay đối chiếu Visual Diff.
            </p>

            <div className="grid grid-cols-2 gap-3 text-center text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[11px]">Trước can thiệp (Pre-test)</span>
                <strong className="text-base text-slate-800">2.15 / 4.0 đ</strong>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 block text-[11px]">Sau can thiệp (Post-test)</span>
                <strong className="text-base text-slate-800">2.42 / 4.0 đ (+12.5%)</strong>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ANONYMOUS SAMPLES & EVIDENCE DRILL-DOWN */}
      {/* ========================================================================= */}
      {activeTab === 'anonymous_samples' && (
        <Card padding="lg" className="border-slate-200 bg-white shadow-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Mẫu Dữ Liệu Học Sinh Ẩn Danh (Evidence Drill-Down)
              </h2>
              <p className="text-xs text-slate-500">
                Nhấp vào từng mẫu học sinh để kiểm chứng dữ liệu gốc: từ điểm số ➔ câu văn ➔ phản hồi neo.
              </p>
            </div>
            <Badge variant="blue">{anonymousSamples.length} mẫu tiêu biểu</Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-50 text-slate-800 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Mã ẩn danh</th>
                  <th className="p-3.5">Nhóm</th>
                  <th className="p-3.5">Điểm Pre-test</th>
                  <th className="p-3.5">Điểm Post-test</th>
                  <th className="p-3.5">Mức tăng</th>
                  <th className="p-3.5">Số phiên bản</th>
                  <th className="p-3.5">Phản hồi đã xử lý</th>
                  <th className="p-3.5 text-right">Chi tiết minh chứng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedSamples.map(sample => (
                  <tr key={sample.code} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 font-mono font-bold text-indigo-900">{sample.code}</td>
                    <td className="p-3.5">
                      <Badge variant={sample.group.includes('TN') ? 'purple' : 'slate'} size="sm">
                        {sample.group}
                      </Badge>
                    </td>
                    <td className="p-3.5 text-slate-600">{sample.preScore.toFixed(1)} đ</td>
                    <td className="p-3.5 font-bold text-slate-900">{sample.postScore.toFixed(1)} đ</td>
                    <td className="p-3.5 font-bold text-emerald-700">{sample.gain}</td>
                    <td className="p-3.5">{sample.versionCount} mốc</td>
                    <td className="p-3.5 font-semibold text-slate-700">{sample.resolvedFeedbacks} góp ý</td>
                    <td className="p-3.5 text-right">
                      <Button
                        size="sm"
                        variant="academic"
                        onClick={() => setSelectedAnonymousSample(sample)}
                        rightIcon={<ArrowRightIcon className="w-3 h-3" />}
                        className="text-[11px] font-bold"
                      >
                        Xem minh chứng gốc
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </Card>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: AUDIT TRAIL OF SCIENTIFIC EVIDENCE */}
      {/* ========================================================================= */}
      {activeTab === 'audit' && (
        <Card padding="lg" className="border-slate-200 bg-white shadow-card space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">
              Quy Trình Truy Nguyên Dữ Liệu Gốc Của Đề Tài (Data Traceability Chain)
            </h2>
            <p className="text-xs text-slate-500">Minh chứng đảm bảo kết luận nghiên cứu không bị ngụy tạo hay suy diễn chủ quan.</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs font-mono">
            <div className="text-slate-700">
              [BƯỚC 1] Dữ liệu tổng hợp (Chart & Chỉ số Cohen's d = 1.18)
            </div>
            <div className="text-indigo-800 pl-4">
              ➔ [BƯỚC 2] Truy xuất mã ẩn danh HS-ANON-001 (Nhóm Thực nghiệm)
            </div>
            <div className="text-indigo-800 pl-8">
              ➔ [BƯỚC 3] Đối chiếu snapshot v1.0 (2.1 đ) vs snapshot v2.0 (3.5 đ)
            </div>
            <div className="text-emerald-800 pl-12">
              ➔ [BƯỚC 4] Visual Diff: +126 từ, -32 từ, nhãn “Lí giải sâu hơn điểm nhìn nửa trực tiếp”
            </div>
            <div className="text-emerald-800 pl-16">
              ➔ [BƯỚC 5] Phản hồi neo của cô Mai: “Em đã phân biệt được lời người kể chuyện và tiếng nói nhân vật Tràng.”
            </div>
          </div>
        </Card>
      )}

      {/* Modal Anonymous Sample Evidence Drill-Down */}
      <Modal
        isOpen={!!selectedAnonymousSample}
        onClose={() => setSelectedAnonymousSample(null)}
        title={`Minh Chứng Dữ Liệu Gốc: ${selectedAnonymousSample?.code}`}
        description={`Nhóm: ${selectedAnonymousSample?.group} • Điểm Pre: ${selectedAnonymousSample?.preScore} đ ➔ Post: ${selectedAnonymousSample?.postScore} đ (${selectedAnonymousSample?.gain})`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setSelectedAnonymousSample(null)}>Đóng</Button>
            <Button
              variant="primary"
              onClick={() => {
                onNavigate('version-diff');
                setSelectedAnonymousSample(null);
              }}
              rightIcon={<ArrowsRightLeftIcon className="w-4 h-4" />}
              className="bg-indigo-900 text-white font-bold"
            >
              Mở Visual Diff toàn bài
            </Button>
          </>
        }
      >
        {selectedAnonymousSample && (
          <div className="space-y-4 text-xs text-slate-700">
            <div className="space-y-1">
              <span className="font-bold text-slate-900 block">Dẫn chứng câu văn học sinh đã sửa đổi và nâng cấp:</span>
              <div className="p-3.5 bg-indigo-50/70 rounded-xl border border-indigo-200 text-indigo-950 font-serif italic leading-relaxed">
                {selectedAnonymousSample.keyEvidenceQuote}
              </div>
            </div>

            <div className="space-y-1">
              <span className="font-bold text-slate-900 block">Phân bố điểm số Rubric 6 trục thi pháp:</span>
              <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                {POETIC_AXES.map(axis => (
                  <div key={axis.id} className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-400 block text-[10px] truncate">{axis.shortName}</span>
                    <strong className="text-slate-900">{selectedAnonymousSample.axisProgress[axis.id]?.toFixed(1) || '3.0'} đ</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
