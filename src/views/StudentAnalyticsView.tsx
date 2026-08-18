import React, { useState, useMemo } from 'react';
import { mockDb } from '../services/mockApi/mockDb';
import { POETIC_AXES } from '../data/seedData';
import type { PoeticAxisId } from '../types';
import {
  Button,
  Badge,
  Card,
  StatCard,
  EmptyState,
  Modal
} from '../components/ui';
import {
  ChartBarIcon,
  CheckCircleIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  ArrowTrendingUpIcon,
  TableCellsIcon,
  LightBulbIcon,
  DocumentDuplicateIcon,
  ChatBubbleLeftRightIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

interface StudentAnalyticsViewProps {
  studentId?: string;
  assignmentId?: string;
  onNavigate: (view: string, extraParams?: any) => void;
}

export const StudentAnalyticsView: React.FC<StudentAnalyticsViewProps> = ({
  studentId = 'user-std-1',
  onNavigate
}) => {
  const allFeedbacks = mockDb.getFeedbacks();

  // Filter student data
  const studentFeedbacks = allFeedbacks.filter(f => f.studentId === studentId);
  const resolvedFeedbacks = studentFeedbacks.filter(f => f.resolved);

  // Active axis toggle for Line Chart
  const [selectedAxisId, setSelectedAxisId] = useState<PoeticAxisId>('narrator_pov');
  const [showTableAlternative, setShowTableAlternative] = useState(false);
  const [isRecommendationReasonOpen, setIsRecommendationReasonOpen] = useState(false);

  // Time Series Progression Data across assignments
  const progressionData = useMemo(() => {
    return [
      {
        assignmentId: 'assign-hai-dua-tre',
        title: 'Hai đứa trẻ (Thạch Lam)',
        date: '02/09/2026',
        scores: {
          plot_situation: 2.5,
          character_detail: 2.8,
          narrator_pov: 2.0,
          space_time: 3.0,
          language_tone_symbol: 2.5,
          form_argument: 2.5
        },
        assessor: 'Cô Nguyễn Thị Mai',
        version: 'v2.0'
      },
      {
        assignmentId: 'assign-chi-pheo',
        title: 'Chí Phèo (Nam Cao)',
        date: '10/09/2026',
        scores: {
          plot_situation: 3.0,
          character_detail: 3.0,
          narrator_pov: 2.2,
          space_time: 3.0,
          language_tone_symbol: 2.8,
          form_argument: 2.8
        },
        assessor: 'Cô Nguyễn Thị Mai',
        version: 'v2.0'
      },
      {
        assignmentId: 'assign-vo-nhat',
        title: 'Vợ nhặt (Kim Lân)',
        date: '18/09/2026',
        scores: {
          plot_situation: 3.5,
          character_detail: 3.2,
          narrator_pov: 2.5,
          space_time: 3.2,
          language_tone_symbol: 3.0,
          form_argument: 3.0
        },
        assessor: 'Cô Nguyễn Thị Mai',
        version: 'v2.0'
      }
    ];
  }, []);

  // 6 Criteria Breakdown Averages
  const criteriaBreakdown = useMemo(() => {
    return [
      { id: 'plot_situation' as const, name: 'Tình huống – cốt truyện', currentScore: 3.5, maxScore: 4.0, trend: '+1.0 trong 3 bài' },
      { id: 'character_detail' as const, name: 'Nhân vật – chi tiết', currentScore: 3.2, maxScore: 4.0, trend: '+0.4 trong 3 bài' },
      { id: 'narrator_pov' as const, name: 'Điểm nhìn – trần thuật', currentScore: 2.4, maxScore: 4.0, trend: '+0.5 (Cần chú ý)', isWarning: true },
      { id: 'space_time' as const, name: 'Không gian – thời gian', currentScore: 3.1, maxScore: 4.0, trend: '+0.2 trong 3 bài' },
      { id: 'language_tone_symbol' as const, name: 'Ngôn ngữ – giọng điệu – biểu tượng', currentScore: 2.8, maxScore: 4.0, trend: '+0.5 trong 3 bài' },
      { id: 'form_argument' as const, name: 'Hình thức – nội dung và lập luận', currentScore: 3.0, maxScore: 4.0, trend: '+0.5 trong 3 bài' },
    ];
  }, []);

  // Summary Metrics
  const averageScore = (criteriaBreakdown.reduce((acc, curr) => acc + curr.currentScore, 0) / criteriaBreakdown.length).toFixed(1);

  if (progressionData.length === 0) {
    return (
      <div className="py-12">
        <EmptyState
          title="Chưa đủ dữ liệu để phân tích."
          description="Hoàn thành thêm nhiệm vụ để hệ thống hiển thị xu hướng và phân tích tiến bộ năng lực."
          action={
            <Button variant="primary" onClick={() => onNavigate('student-dashboard')}>
              Xem nhiệm vụ đang mở
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <header className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
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
            <span className="text-xs font-semibold text-slate-700">Tiến Bộ Của Tôi</span>
          </div>

          <h1 className="text-h2 font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <ChartBarIcon className="w-6 h-6 text-indigo-700" />
            Báo Cáo Tiến Bộ Năng Lực Đọc Hiểu Thi Pháp
          </h1>
          <p className="text-small text-slate-500 mt-1">
            Minh chứng dữ liệu có khả năng truy nguyên qua ma trận Rubric và chuỗi các phiên bản
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="academic"
            onClick={() => onNavigate('editor', { assignmentId: 'assign-chi-pheo' })}
            rightIcon={<ArrowRightIcon className="w-4 h-4" />}
          >
            Luyện tập theo gợi ý
          </Button>
        </div>
      </header>

      {/* A. SUMMARY STATS (4-5 METRICS, NO BLACK-BOX AI SCORE) */}
      <section aria-label="Chỉ số tổng hợp tiến bộ" className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <StatCard
          label="Điểm TB hiện tại"
          value={`${averageScore} / 4.0`}
          subValue="Thang điểm Rubric 4 mức"
          trend={{ value: "+0.6 đ tháng này", isPositive: true }}
          icon={<SparklesIcon className="w-5 h-5" />}
        />

        <StatCard
          label="Mức độ tăng trưởng"
          value="+28%"
          subValue="So với bài đầu kỳ"
          trend={{ value: "Tiến bộ liên tục", isPositive: true }}
          icon={<ArrowTrendingUpIcon className="w-5 h-5" />}
        />

        <StatCard
          label="Phiên bản đã tạo"
          value="6 mốc"
          subValue="Trung bình 2.0 ver/bài"
          icon={<DocumentDuplicateIcon className="w-5 h-5" />}
        />

        <StatCard
          label="Phản hồi đã xử lý"
          value={`${resolvedFeedbacks.length}/${studentFeedbacks.length || 8}`}
          subValue="Tỷ lệ tiếp thu 100%"
          trend={{ value: "Đã xử lý trọn vẹn", isPositive: true }}
          icon={<ChatBubbleLeftRightIcon className="w-5 h-5" />}
        />

        <StatCard
          label="Nhiệm vụ hoàn thành"
          value="3/4 bài"
          subValue="Đúng kế hoạch học tập"
          icon={<CheckCircleIcon className="w-5 h-5" />}
        />
      </section>

      {/* B. PROGRESS CHART OVER TIME & ASSIGNMENTS */}
      <section aria-labelledby="progress-chart-heading">
        <Card padding="lg" className="border-slate-200 bg-white shadow-card space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">
                Đường Xu Hướng Tiến Bộ Theo Thời Gian
              </span>
              <h2 id="progress-chart-heading" className="text-base font-bold text-slate-900">
                Sự Thay Đổi Điểm Số Rubric Qua Các Nhiệm Vụ Đọc
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowTableAlternative(!showTableAlternative)}
                leftIcon={<TableCellsIcon className="w-4 h-4" />}
                className="text-xs"
              >
                {showTableAlternative ? 'Hiện biểu đồ trực quan' : 'Xem bảng số liệu chi tiết'}
              </Button>
            </div>
          </div>

          {/* Poetic Axis Toggle Selector */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-700 block">
              Chọn trục thi pháp để theo dõi đường tiến bộ:
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {POETIC_AXES.map(axis => (
                <button
                  key={axis.id}
                  onClick={() => setSelectedAxisId(axis.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition border ${
                    selectedAxisId === axis.id
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {axis.shortName}
                </button>
              ))}
            </div>
          </div>

          {/* Visual Progression Representation */}
          {!showTableAlternative ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                {progressionData.map((item, idx) => {
                  const score = item.scores[selectedAxisId];
                  const percentage = (score / 4.0) * 100;

                  return (
                    <div
                      key={item.assignmentId}
                      className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-indigo-300 hover:shadow-card transition-all space-y-3"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-400">Mốc 0{idx + 1}</span>
                        <Badge variant="blue" size="sm">{item.date}</Badge>
                      </div>

                      <div>
                        <h3 className="font-bold text-xs text-slate-900 truncate">{item.title}</h3>
                        <span className="text-[11px] text-slate-500">Giáo viên chấm: {item.assessor}</span>
                      </div>

                      {/* Score Indicator */}
                      <div className="space-y-1 pt-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-700">Điểm Rubric:</span>
                          <span className="font-bold text-indigo-900 text-sm">{score.toFixed(1)} / 4.0 đ</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${percentage}%` }}
                            className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                          />
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-caption">
                        <span className="text-slate-500">Phiên bản: {item.version}</span>
                        <button
                          onClick={() => onNavigate('editor', { assignmentId: item.assignmentId })}
                          className="text-indigo-700 hover:underline font-bold"
                        >
                          Xem hồ sơ ➔
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Progress Summary Text */}
              <p className="text-xs text-slate-500 text-center italic">
                * Dữ liệu được tính toán minh bạch từ kết quả chấm Rubric chính thức của giáo viên bộ môn qua từng phiên bản nộp.
              </p>
            </div>
          ) : (
            /* Accessible Table Alternative */
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border border-slate-200 rounded-xl overflow-hidden">
                <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Nhiệm vụ</th>
                    <th className="p-3">Ngày đánh giá</th>
                    <th className="p-3">Điểm trục đang chọn</th>
                    <th className="p-3">Người đánh giá</th>
                    <th className="p-3">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {progressionData.map(item => (
                    <tr key={item.assignmentId} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">{item.title}</td>
                      <td className="p-3 text-slate-600">{item.date}</td>
                      <td className="p-3 font-bold text-indigo-700">{item.scores[selectedAxisId].toFixed(1)} / 4.0 đ</td>
                      <td className="p-3 text-slate-600">{item.assessor}</td>
                      <td className="p-3">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onNavigate('editor', { assignmentId: item.assignmentId })}
                          className="text-indigo-700 font-bold text-caption p-0"
                        >
                          Xem hồ sơ
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </section>

      {/* C & D. CRITERION BREAKDOWN & NATURAL LANGUAGE PEDAGOGICAL INSIGHTS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* C. CRITERION BREAKDOWN (7 COLS) */}
        <section aria-labelledby="breakdown-heading" className="lg:col-span-7 space-y-4">
          <Card padding="lg" className="border-slate-200 bg-white shadow-card space-y-4">
            <div>
              <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">
                Phân Tích Chi Tiết 6 Trục
              </span>
              <h2 id="breakdown-heading" className="text-base font-bold text-slate-900">
                Mức Điểm Đạt Được Theo Từng Trục Thi Pháp
              </h2>
            </div>

            <div className="space-y-4">
              {criteriaBreakdown.map(item => {
                const percentage = (item.currentScore / item.maxScore) * 100;
                return (
                  <div key={item.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        {item.name}
                        {item.isWarning && (
                          <ExclamationTriangleIcon className="w-3.5 h-3.5 text-amber-600" />
                        )}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 font-normal">{item.trend}</span>
                        <span className="font-bold text-slate-900">{item.currentScore} / {item.maxScore} đ</span>
                      </div>
                    </div>

                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${percentage}%` }}
                        className={`h-full rounded-full transition-all duration-500 ${
                          item.currentScore >= 3.0
                            ? 'bg-emerald-600'
                            : item.currentScore >= 2.5
                            ? 'bg-indigo-600'
                            : 'bg-amber-500'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </section>

        {/* D. STRENGTHS & NEEDS IMPROVEMENT (5 COLS) */}
        <section aria-labelledby="insights-heading" className="lg:col-span-5 space-y-4">
          <Card padding="lg" className="border-slate-200 bg-white shadow-card space-y-4">
            <div>
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                Nhận Định Sư Phạm Tự Động
              </span>
              <h2 id="insights-heading" className="text-base font-bold text-slate-900">
                Điểm Mạnh & Trục Cần Cải Thiện
              </h2>
            </div>

            <div className="space-y-3 text-xs">
              {/* Strength Box */}
              <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-emerald-950">
                  <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
                  Điểm mạnh nổi bật:
                </div>
                <p className="text-slate-700 leading-relaxed">
                  <strong>Tình huống – cốt truyện</strong> tăng từ <strong>2.4 ➔ 3.5</strong> trong 3 nhiệm vụ gần nhất nhờ kỹ năng nhận diện chi tiết giàu kịch tính và trích xuất dẫn chứng đầy đủ.
                </p>
              </div>

              {/* Needs Improvement Box */}
              <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-200 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-amber-950">
                  <ExclamationTriangleIcon className="w-4 h-4 text-amber-600" />
                  Trục cần chú ý rèn luyện:
                </div>
                <p className="text-slate-700 leading-relaxed">
                  <strong>Điểm nhìn – trần thuật</strong> đạt mức <strong>2.4/4.0</strong> ở 2 nhiệm vụ gần nhất do chưa phân biệt rõ ràng giữa lời người kể chuyện ngôi thứ ba và lời nửa trực tiếp của nhân vật.
                </p>
              </div>
            </div>
          </Card>
        </section>
      </div>

      {/* E. RECOMMENDATION CARD (EXPLAINABLE SCAFFOLDING) */}
      <section aria-labelledby="recommendation-heading">
        <Card padding="lg" className="border-indigo-300 bg-gradient-to-br from-indigo-50/60 via-white to-indigo-50/30 shadow-card space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 flex-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-900 text-caption font-bold border border-indigo-200">
                <LightBulbIcon className="w-3.5 h-3.5 text-indigo-700" />
                Gợi Ý Hành Động Dành Cho Bạn
              </div>

              <h2 id="recommendation-heading" className="text-h3 font-bold text-slate-900">
                Rèn Luyện Kỹ Năng Nhận Diện Sự Dịch Chuyển Điểm Nhìn
              </h2>

              <p className="text-xs text-slate-700 leading-relaxed">
                Trục <strong>Người kể chuyện – điểm nhìn</strong> đạt dưới 2.5/4.0 ở hai bài viết gần đây. Hãy hoàn thành bài tập rèn luyện: <em>“Xác định chủ thể quan sát trong ba đoạn trích của truyện ngắn Chí Phèo và giải thích sự dịch chuyển điểm nhìn từ người kể chuyện sang dòng tâm trạng nhân vật.”</em>
              </p>

              <div className="text-caption text-slate-500 pt-1">
                Lý do đề xuất: <strong>Dựa trên kết quả Rubric tiêu chí Điểm nhìn (2.4/4) từ cô Nguyễn Thị Mai.</strong>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col items-stretch lg:items-end gap-2.5 shrink-0">
              <Button
                variant="primary"
                size="md"
                onClick={() => onNavigate('editor', { assignmentId: 'assign-chi-pheo' })}
                rightIcon={<ArrowRightIcon className="w-4 h-4" />}
                className="bg-indigo-900 hover:bg-indigo-850 text-white font-bold"
              >
                Bắt đầu bài tập luyện tập
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsRecommendationReasonOpen(true)}
              >
                Xem dữ liệu căn cứ
              </Button>
            </div>
          </div>
        </Card>
      </section>

      {/* F. VERSION BEHAVIOR ANALYTICS */}
      <section aria-labelledby="behavior-heading">
        <Card padding="lg" className="border-slate-200 bg-white shadow-card space-y-4">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Phân Tích Hành Vi Lưu Trữ & Sửa Đổi
            </span>
            <h2 id="behavior-heading" className="text-base font-bold text-slate-900">
              Hành Trình Tiếp Thu Phản Hồi Qua Các Phiên Bản
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="font-bold text-slate-900 block">Số phiên bản trung bình</span>
              <div className="text-lg font-bold text-indigo-700">2.0 phiên bản / bài</div>
              <p className="text-slate-500 text-caption">Tương ứng quy trình 2 mốc sơ thảo và hoàn thiện.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="font-bold text-slate-900 block">Tỷ lệ phản hồi đã xử lý</span>
              <div className="text-lg font-bold text-emerald-700">100% (8/8 góp ý)</div>
              <p className="text-slate-500 text-caption">Mọi nhận xét từ giáo viên đều được tiếp thu vào bản v2.0.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="font-bold text-slate-900 block">Loại chỉnh sửa phổ biến nhất</span>
              <div className="text-lg font-bold text-slate-900">Bổ sung dẫn chứng (45%)</div>
              <p className="text-slate-500 text-caption">Tiếp theo là Lí giải sâu hơn (30%) và Sửa diễn đạt (25%).</p>
            </div>
          </div>

          <p className="text-caption text-slate-400 text-center italic pt-2">
            * Lưu ý khoa học: Hệ thống không đánh đồng “nhiều version = giỏi hơn”, mà đo lường chất lượng nâng cấp cách hiểu qua các lần tiếp thu phản hồi.
          </p>
        </Card>
      </section>

      {/* Modal Traceable Data Explanation */}
      <Modal
        isOpen={isRecommendationReasonOpen}
        onClose={() => setIsRecommendationReasonOpen(false)}
        title="Minh Chứng Dữ Liệu Đề Xuất (Traceability)"
        description="Toàn bộ gợi ý rèn luyện đều xuất phát từ dữ liệu Rubric thực tế có thể truy nguyên nguồn gốc."
        footer={<Button variant="primary" onClick={() => setIsRecommendationReasonOpen(false)}>Đã hiểu</Button>}
      >
        <div className="space-y-3 text-xs text-slate-700">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-900 block">Dữ liệu nguồn (Evidence Log):</span>
            <ul className="list-disc pl-4 space-y-1 text-slate-600">
              <li>Nhiệm vụ <em>Hai đứa trẻ</em>: Tiêu chí Điểm nhìn đạt <strong>2.0/4.0 đ</strong> (Đánh giá ngày 02/09/2026).</li>
              <li>Nhiệm vụ <em>Chí Phèo</em>: Tiêu chí Điểm nhìn đạt <strong>2.2/4.0 đ</strong> (Đánh giá ngày 10/09/2026).</li>
              <li>Nhận xét của giáo viên: <em>“Cần phân biệt rõ lời nửa trực tiếp của nhân vật.”</em></li>
            </ul>
          </div>
          <p>
            Hệ thống kích hoạt quy tắc sư phạm: <code>IF axis_score &lt; 2.5 FOR 2 consecutive assignments ➔ RECOMMEND targeted exercise on point-of-view shift</code>.
          </p>
        </div>
      </Modal>
    </div>
  );
};
