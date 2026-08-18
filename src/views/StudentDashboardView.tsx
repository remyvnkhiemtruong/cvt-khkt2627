import React, { useState } from 'react';
import { useAuthStore } from '../app/store/useAuthStore';
import { usePortfolioStore } from '../app/store/usePortfolioStore';
import { mockDb } from '../services/mockApi/mockDb';
import { POETIC_AXES } from '../data/seedData';
import {
  StatCard,
  Button,
  Badge,
  Card,
  Progress,
  Skeleton,
  ErrorState,
  EmptyState
} from '../components/ui';
import {
  BookOpenIcon,
  ClockIcon,
  ArrowRightIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  SparklesIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface StudentDashboardViewProps {
  onNavigate: (view: string, extraParams?: any) => void;
}

export const StudentDashboardView: React.FC<StudentDashboardViewProps> = ({ onNavigate }) => {
  const { currentUser } = useAuthStore();
  const { portfolios, autosaveStatus, lastSavedTime } = usePortfolioStore();

  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const assignments = mockDb.getAssignments();
  const literatureTexts = mockDb.getLiteratureTexts();
  const rubricSubmissions = mockDb.getRubricSubmissions();
  const allFeedbacks = mockDb.getFeedbacks();

  // Filter student-specific items
  const myFeedbacks = allFeedbacks.filter(f => f.studentId === currentUser.id);
  const unresolvedFeedbacks = myFeedbacks.filter(f => !f.resolved);

  // Active assignment
  const activeAssignment = assignments[0];
  const activeText = literatureTexts.find(t => t.id === activeAssignment?.textId);
  const activePort = portfolios[`port-${currentUser.id}-${activeAssignment?.id}`];
  const activeVersion = activePort?.currentActiveVersion || 'v1.0 (nháp)';
  const versionCount = activePort?.versions.length || 0;

  // Student rubrics
  const myRubrics = rubricSubmissions.filter(s => s.studentId === currentUser.id);
  const v1Sub = myRubrics.find(s => s.versionNumber === 'v1.0' && s.evaluatorRole === 'teacher') || myRubrics[0];
  const v2Sub = myRubrics.find(s => s.versionNumber === 'v2.0' && s.evaluatorRole === 'teacher') || myRubrics[myRubrics.length - 1];

  // Dynamic greeting based on local time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  const getAxisScore = (sub: any, critKey: string) => {
    return sub?.criterionScores?.[critKey]?.score || 2.0;
  };

  const axisScores = [
    { id: 'crit-plot', name: 'Tình huống – cốt truyện', s1: getAxisScore(v1Sub, 'crit-plot'), s2: getAxisScore(v2Sub, 'crit-plot') },
    { id: 'crit-char', name: 'Nhân vật – chi tiết', s1: getAxisScore(v1Sub, 'crit-char'), s2: getAxisScore(v2Sub, 'crit-char') },
    { id: 'crit-pov', name: 'Điểm nhìn – trần thuật', s1: getAxisScore(v1Sub, 'crit-pov'), s2: getAxisScore(v2Sub, 'crit-pov') },
    { id: 'crit-spacetime', name: 'Không gian – thời gian', s1: getAxisScore(v1Sub, 'crit-spacetime'), s2: getAxisScore(v2Sub, 'crit-spacetime') },
    { id: 'crit-lang', name: 'Ngôn ngữ – giọng điệu', s1: getAxisScore(v1Sub, 'crit-lang'), s2: getAxisScore(v2Sub, 'crit-lang') },
    { id: 'crit-synthesis', name: 'Hình thức – lập luận', s1: getAxisScore(v1Sub, 'crit-synthesis'), s2: getAxisScore(v2Sub, 'crit-synthesis') },
  ];

  // Lowest axis insight calculation
  const lowestAxis = [...axisScores].sort((a, b) => a.s2 - b.s2)[0];

  if (hasError) {
    return (
      <div className="py-12">
        <ErrorState
          title="Không thể tải bảng điều khiển học sinh"
          message="Vui lòng kiểm tra lại kết nối hoặc thử tải lại trang."
          onRetry={() => {
            setIsLoading(true);
            setHasError(false);
            setTimeout(() => setIsLoading(false), 500);
          }}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
        <Skeleton className="h-56 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* 1. WELCOME / RESUME BLOCK */}
      <section
        aria-labelledby="welcome-heading"
        className="bg-slate-900 text-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-card border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-5"
      >
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300 text-caption font-semibold border border-slate-700">
            <SparklesIcon className="w-3.5 h-3.5 text-amber-400" />
            Lớp {currentUser.className || '11A1 Chuyên Văn'}
          </div>
          <h1 id="welcome-heading" className="text-h2 font-bold tracking-tight text-white">
            {getGreeting()}, {currentUser.name.split(' ').pop()}
          </h1>
          <p className="text-small text-slate-300">
            Bạn có <strong className="text-white font-semibold">{assignments.length} nhiệm vụ</strong> cần hoàn thành và <strong className="text-amber-300 font-semibold">{unresolvedFeedbacks.length} phản hồi</strong> mới cần tiếp thu.
          </p>
        </div>

        {/* 1-Click Fast Action Button */}
        <div className="shrink-0">
          <Button
            variant="primary"
            size="lg"
            onClick={() => onNavigate('editor', { assignmentId: activeAssignment?.id || 'assign-vo-nhat' })}
            leftIcon={<DocumentTextIcon className="w-5 h-5 text-slate-900" />}
            rightIcon={<ArrowRightIcon className="w-4 h-4 text-slate-900" />}
            className="bg-white hover:bg-slate-100 text-slate-900 font-bold shadow-sm w-full sm:w-auto"
          >
            Tiếp tục bài đang làm
          </Button>
        </div>
      </section>

      {/* 2. QUICK STATS (MAX 4 CARDS) */}
      <section aria-label="Thống kê nhanh" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Nhiệm vụ đang làm"
          value="1 bài"
          subValue={activeAssignment?.title.slice(0, 22) + '...'}
          icon={<BookOpenIcon className="w-5 h-5" />}
        />

        <StatCard
          label="Phản hồi mới"
          value={`${unresolvedFeedbacks.length} góp ý`}
          subValue={unresolvedFeedbacks.length > 0 ? "Cần tiếp thu vào v2.0" : "Đã tiếp thu toàn bộ"}
          icon={<ChatBubbleLeftRightIcon className="w-5 h-5" />}
          trend={unresolvedFeedbacks.length > 0 ? { value: "Ưu tiên xử lý", isPositive: false } : { value: "Đã hoàn tất", isPositive: true }}
        />

        <StatCard
          label="Bài cần chỉnh sửa"
          value="1 phiên bản"
          subValue="Đang nâng cấp lên v2.0"
          icon={<ArrowPathIcon className="w-5 h-5" />}
        />

        <StatCard
          label="Tiến độ tuần"
          value="75%"
          subValue="3/4 mốc nhiệm vụ"
          trend={{ value: "+25% tuần này", isPositive: true }}
          icon={<CheckCircleIcon className="w-5 h-5" />}
        />
      </section>

      {/* 3. HERO CARD: CONTINUE LEARNING (ACTION-ORIENTED) */}
      <section aria-labelledby="continue-learning-heading">
        <Card padding="lg" className="border-indigo-200 bg-gradient-to-br from-indigo-50/40 via-white to-slate-50 relative overflow-hidden shadow-card">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="purple">Hồ sơ đọc trọng tâm</Badge>
                <span className="text-caption text-slate-500 font-medium">
                  Tác phẩm: <strong className="text-slate-800">{activeText?.title}</strong> ({activeText?.author})
                </span>
              </div>

              <div>
                <h2 id="continue-learning-heading" className="text-h3 font-bold text-slate-900 tracking-tight">
                  {activeAssignment?.title}
                </h2>
                <p className="text-small text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                  Trọng tâm phân tích: <strong className="text-indigo-950">Người kể chuyện – điểm nhìn</strong> & <strong className="text-indigo-950">Không gian – thời gian</strong>.
                </p>
              </div>

              {/* Version & Save Status Indicator */}
              <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
                <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                  <span className="text-slate-400 font-normal">Phiên bản hiện tại:</span>
                  <Badge variant="blue">{activeVersion}</Badge>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <span className={`w-2 h-2 rounded-full ${autosaveStatus === 'dirty' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                  <span>
                    {autosaveStatus === 'dirty' ? 'Có thay đổi chưa lưu' : `✓ Đã lưu ${lastSavedTime || 'vừa xong'}`}
                  </span>
                </div>

                <div className="text-xs text-slate-500 flex items-center gap-1">
                  <ClockIcon className="w-3.5 h-3.5 text-slate-400" />
                  Hạn nộp: {activeAssignment?.deadline}
                </div>
              </div>

              {/* Progress bar */}
              <div className="pt-2 max-w-md">
                <Progress
                  value={versionCount >= 2 ? 100 : versionCount === 1 ? 65 : 30}
                  max={100}
                  label="Mức độ hoàn thiện hồ sơ:"
                  showValueLabel
                  variant="indigo"
                  size="sm"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row lg:flex-col items-stretch lg:items-end gap-2.5 shrink-0">
              <Button
                variant="primary"
                size="md"
                onClick={() => onNavigate('editor', { assignmentId: activeAssignment?.id })}
                rightIcon={<ArrowRightIcon className="w-4 h-4" />}
                className="bg-indigo-900 hover:bg-indigo-850 text-white font-bold"
              >
                Tiếp tục hồ sơ đọc
              </Button>

              {versionCount >= 2 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigate('version-diff', { assignmentId: activeAssignment?.id })}
                >
                  So sánh Diff (v1 ➔ v2)
                </Button>
              )}
            </div>
          </div>
        </Card>
      </section>

      {/* 4 & 5. GRID: UPCOMING DEADLINES & NEW FEEDBACK ITEMS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 4. UPCOMING / DEADLINES */}
        <section aria-labelledby="upcoming-heading" className="space-y-3">
          <header className="flex items-center justify-between">
            <h2 id="upcoming-heading" className="text-h4 font-bold text-slate-900 flex items-center gap-2">
              <ClockIcon className="w-4 h-4 text-slate-700" />
              Nhiệm Vụ & Hạn Nộp Sắp Tới
            </h2>
            <span className="text-caption text-slate-500 font-medium">
              {assignments.length} nhiệm vụ
            </span>
          </header>

          <div className="space-y-3">
            {assignments.map(item => {
              const textObj = literatureTexts.find(t => t.id === item.textId);
              const isCurrent = item.id === activeAssignment?.id;

              return (
                <Card
                  key={item.id}
                  padding="sm"
                  className={`hover:border-slate-300 transition-all ${isCurrent ? 'border-indigo-300 bg-indigo-50/20' : ''}`}
                >
                  <div className="p-3 flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={item.difficulty === 'Nâng cao' ? 'purple' : 'blue'} size="sm">
                          {item.difficulty}
                        </Badge>
                        <span className="text-caption text-amber-700 font-semibold flex items-center gap-1">
                          <ExclamationTriangleIcon className="w-3.5 h-3.5" /> Hạn nộp: {item.deadline}
                        </span>
                      </div>
                      <h3 className="text-xs font-bold text-slate-900">{item.title}</h3>
                      <p className="text-caption text-slate-500">Tác phẩm: {textObj?.title} ({textObj?.author})</p>
                    </div>

                    <Button
                      size="sm"
                      variant={isCurrent ? 'academic' : 'outline'}
                      onClick={() => onNavigate('editor', { assignmentId: item.id })}
                      className="shrink-0 text-xs"
                    >
                      {isCurrent ? 'Làm bài' : 'Xem đề'}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        {/* 5. PHẢN HỒI MỚI (NEW FEEDBACKS) */}
        <section aria-labelledby="feedbacks-heading" className="space-y-3">
          <header className="flex items-center justify-between">
            <h2 id="feedbacks-heading" className="text-h4 font-bold text-slate-900 flex items-center gap-2">
              <ChatBubbleLeftRightIcon className="w-4 h-4 text-slate-700" />
              Phản Hồi Mới Cần Tiếp Thu
            </h2>
            <span className="text-caption text-slate-500 font-medium">
              {myFeedbacks.length} góp ý
            </span>
          </header>

          {myFeedbacks.length === 0 ? (
            <EmptyState
              title="Chưa có phản hồi mới"
              description="Sau khi nộp bản sơ thảo v1.0, giáo viên và bạn học sẽ gửi phản hồi neo ngữ cảnh vào bài viết."
            />
          ) : (
            <div className="space-y-3">
              {myFeedbacks.slice(0, 3).map(fb => {
                const axisObj = POETIC_AXES.find(a => a.id === fb.axisId);
                const isTeacher = fb.authorRole === 'teacher';

                return (
                  <Card
                    key={fb.id}
                    padding="sm"
                    className={`transition-all ${fb.resolved ? 'opacity-70 bg-slate-50' : 'border-amber-200 bg-amber-50/30'}`}
                  >
                    <div className="p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant={isTeacher ? 'emerald' : 'amber'} size="sm">
                            {isTeacher ? 'Giáo viên' : 'Bạn học'}
                          </Badge>
                          <span className="text-xs font-bold text-slate-900">{fb.authorName}</span>
                          <span className="text-caption text-slate-500">• Phiên bản {fb.versionNumber}</span>
                        </div>
                        <span className="text-caption font-semibold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {axisObj?.shortName}
                        </span>
                      </div>

                      {/* Excerpt */}
                      {fb.selectedSnippet && (
                        <div className="text-caption bg-white p-2 rounded border-l-2 border-amber-400 text-slate-700 italic line-clamp-1">
                          "{fb.selectedSnippet}"
                        </div>
                      )}

                      <p className="text-caption text-slate-800 line-clamp-2">
                        {fb.comment}
                      </p>

                      <div className="pt-1 flex items-center justify-between text-caption">
                        <span className={fb.resolved ? "text-emerald-700 font-semibold flex items-center gap-1" : "text-amber-700 font-semibold"}>
                          {fb.resolved ? "✓ Đã tiếp thu ở bản mới" : "• Chưa xử lý"}
                        </span>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onNavigate('editor', { assignmentId: fb.assignmentId })}
                          className="text-indigo-700 hover:text-indigo-900 p-0 text-caption font-bold"
                        >
                          Xem chi tiết phản hồi ➔
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* 6. PROGRESS BY POETICS AXIS (BAR CHART & PEDAGOGICAL INSIGHT) */}
      <section aria-labelledby="progress-axis-heading">
        <Card padding="lg" className="space-y-6">
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-caption font-bold mb-1 border border-emerald-200">
                <CheckCircleIcon className="w-3.5 h-3.5" />
                Tiến Bộ Năng Lực 6 Trục Thi Pháp (v1.0 ➔ v2.0)
              </div>
              <h2 id="progress-axis-heading" className="text-h3 font-bold text-slate-900">
                Mức Độ Thành Thạo Theo Từng Trục Đọc Hiểu
              </h2>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => onNavigate('student-analytics')}
              rightIcon={<ArrowRightIcon className="w-3.5 h-3.5" />}
            >
              Mở báo cáo chi tiết
            </Button>
          </header>

          {/* Clean Academic Bar Comparison */}
          <div className="space-y-4">
            {axisScores.map(axis => {
              const diff = axis.s2 - axis.s1;
              const p1 = (axis.s1 / 4.0) * 100;
              const p2 = (axis.s2 / 4.0) * 100;

              return (
                <div key={axis.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{axis.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400">v1.0: {axis.s1}/4</span>
                      <span className="font-bold text-slate-900">v2.0: {axis.s2}/4.0 đ</span>
                      {diff > 0 ? (
                        <span className="text-emerald-700 font-bold text-caption bg-emerald-50 px-1.5 py-0.5 rounded">
                          ▲ +{diff.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-caption">Chưa đổi</span>
                      )}
                    </div>
                  </div>

                  {/* Dual Bar Progress */}
                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex relative">
                    {/* v1 bar */}
                    <div
                      style={{ width: `${p1}%` }}
                      className="h-full bg-slate-300 rounded-l-full"
                      title={`Bản v1.0: ${axis.s1}/4`}
                    />
                    {/* growth bar */}
                    {diff > 0 && (
                      <div
                        style={{ width: `${p2 - p1}%` }}
                        className="h-full bg-indigo-600 rounded-r-full"
                        title={`Tiến bộ: +${diff.toFixed(1)}`}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Required Pedagogical Insight Box */}
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 flex items-start gap-3">
            <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1 flex-1">
              <span className="font-bold text-amber-900 block text-xs">
                Nhận định sư phạm tự động (Pedagogical Insight):
              </span>
              <p className="text-slate-700 leading-relaxed">
                Trục cần chú ý: <strong>{lowestAxis.name}</strong>. Điểm số hiện tại đạt <strong>{lowestAxis.s2}/4.0 đ</strong>. Cần tăng cường nhận diện sự dịch chuyển ngôi kể và trích xuất lời nửa trực tiếp của nhân vật ở nhiệm vụ tiếp theo.
              </p>
            </div>
            <Button
              size="sm"
              variant="academic"
              onClick={() => onNavigate('editor', { assignmentId: 'assign-chi-pheo' })}
              className="shrink-0 text-caption font-bold"
            >
              Luyện tập trục này
            </Button>
          </div>
        </Card>
      </section>
    </div>
  );
};
