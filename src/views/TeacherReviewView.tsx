import React, { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '../app/store/useAuthStore';
import { useNotificationStore } from '../app/store/useNotificationStore';
import { usePortfolio } from '../contexts/PortfolioContext';
import { POETIC_AXES } from '../data/seedData';
import type { PoeticAxisId } from '../types';
import { Button } from '../components/ui';
import {
  ArrowLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

interface TeacherReviewViewProps {
  studentId?: string;
  assignmentId?: string;
  isPeerMode?: boolean;
  onNavigate: (view: string, extraParams?: any) => void;
}

const StatePanel: React.FC<{
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  loading?: boolean;
}> = ({ title, message, actionLabel, onAction, loading }) => (
  <div className="mx-auto mt-16 max-w-md p-6 text-center space-y-3">
    {loading && (
      <div className="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-800" />
    )}
    <h2 className="text-base font-semibold text-slate-900">{title}</h2>
    <p className="text-sm text-slate-500 leading-relaxed">{message}</p>
    {actionLabel && onAction && (
      <div className="pt-2">
        <Button variant="primary" onClick={onAction}>{actionLabel}</Button>
      </div>
    )}
  </div>
);

export const TeacherReviewView: React.FC<TeacherReviewViewProps> = ({
  studentId,
  assignmentId,
  isPeerMode = false,
  onNavigate
}) => {
  const currentUser = useAuthStore(state => state.currentUser);
  const {
    assignments,
    literatureTexts,
    portfolios,
    feedbacks,
    rubric,
    rubricSubmissions,
    aiReviews,
    isLoading,
    dataError,
    addAnchoredFeedback,
    submitRubric,
    refreshAcademicData
  } = usePortfolio();
  const { addToast } = useNotificationStore();

  const queue = useMemo(() => {
    const all = Object.values(portfolios);
    const scoped = assignmentId ? all.filter(item => item.assignmentId === assignmentId) : all;
    return (scoped.length ? scoped : all).sort((a, b) => a.studentName.localeCompare(b.studentName, 'vi'));
  }, [portfolios, assignmentId]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeAxisId, setActiveAxisId] = useState<PoeticAxisId>('plot_situation');
  const [selectedVersion, setSelectedVersion] = useState('');
  const [selectedText, setSelectedText] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [overallFeedback, setOverallFeedback] = useState('');
  const [rubricScores, setRubricScores] = useState<Record<string, number>>({});
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [isSubmittingRubric, setIsSubmittingRubric] = useState(false);

  // AI Proposal handling state
  const [isEditingAiProposal, setIsEditingAiProposal] = useState(false);
  const [editedAiText, setEditedAiText] = useState('');
  const [isSubmittingAiReview, setIsSubmittingAiReview] = useState(false);

  useEffect(() => {
    if (queue.length === 0) {
      setCurrentIndex(0);
      return;
    }
    const requested = studentId ? queue.findIndex(item => item.studentId === studentId) : -1;
    if (requested >= 0) setCurrentIndex(requested);
    else if (currentIndex >= queue.length) setCurrentIndex(0);
  }, [queue, studentId, currentIndex]);

  const currentPortfolio = queue[currentIndex];
  const assignment = currentPortfolio ? assignments.find(item => item.id === currentPortfolio.assignmentId) : undefined;
  const literatureText = assignment ? literatureTexts.find(item => item.id === assignment.textId) : undefined;

  const latestVersionNumber = currentPortfolio?.versions[currentPortfolio.versions.length - 1]?.versionNumber || '';
  useEffect(() => {
    setSelectedVersion(latestVersionNumber);
  }, [currentPortfolio?.id, latestVersionNumber]);

  const evaluatorRole = currentUser.role === 'peer' || isPeerMode ? 'peer' : 'teacher';

  // RESET RUBRIC SCORES on portfolio/student/version change (Prevents rubric score leakage - TC18, TC19)
  useEffect(() => {
    if (!currentPortfolio || !assignment || !selectedVersion) {
      setRubricScores({});
      setOverallFeedback('');
      return;
    }
    const existing = rubricSubmissions.find(s =>
      s.studentId === currentPortfolio.studentId &&
      s.assignmentId === assignment.id &&
      s.versionNumber === selectedVersion &&
      s.evaluatorRole === evaluatorRole
    );
    if (existing && existing.criterionScores) {
      const loaded: Record<string, number> = {};
      for (const [k, v] of Object.entries(existing.criterionScores)) {
        loaded[k] = Number(v.score || v.level || 0);
      }
      setRubricScores(loaded);
      setOverallFeedback(existing.overallFeedback || '');
    } else {
      const reset: Record<string, number> = {};
      for (const c of rubric.criteria || []) {
        reset[c.id] = 0;
      }
      setRubricScores(reset);
      setOverallFeedback('');
    }
  }, [currentPortfolio, assignment, selectedVersion, evaluatorRole, rubric, rubricSubmissions]);

  const selectedSnapshot = currentPortfolio?.versions.find(item => item.versionNumber === selectedVersion);
  const responses = selectedSnapshot?.responses || currentPortfolio?.currentDraft;
  const activeResponse = responses?.[activeAxisId];

  // Feedback filtered strictly by version to prevent cross-version ambiguity
  const currentFeedbacks = useMemo(() => {
    if (!currentPortfolio || !assignment) return [];
    return feedbacks.filter(item =>
      item.studentId === currentPortfolio.studentId &&
      item.assignmentId === assignment.id &&
      item.axisId === activeAxisId &&
      (!selectedVersion || !item.versionNumber || item.versionNumber === selectedVersion)
    );
  }, [feedbacks, currentPortfolio, assignment, activeAxisId, selectedVersion]);

  // Find AI Review Proposal for current version
  const pendingAiProposal = useMemo(() => {
    if (!currentPortfolio || !selectedVersion) return null;
    return (aiReviews || []).find(r =>
      r.student_id === currentPortfolio.studentId &&
      r.version_number === selectedVersion &&
      r.status === 'completed' &&
      r.teacher_review_status === 'pending'
    );
  }, [aiReviews, currentPortfolio, selectedVersion]);

  useEffect(() => {
    if (pendingAiProposal) {
      setEditedAiText(pendingAiProposal.response || '');
      setIsEditingAiProposal(false);
    }
  }, [pendingAiProposal]);

  const totalScore = (rubric.criteria || []).reduce(
    (sum, criterion) => sum + (rubricScores[criterion.id] || 0) * Number(criterion.weight || 1),
    0
  );
  const maxScore = (rubric.criteria || []).reduce(
    (sum, criterion) => sum + 4 * Number(criterion.weight || 1),
    0
  );

  if (isLoading && queue.length === 0) {
    return <StatePanel loading title="Đang mở bài chấm" message="Đang tải danh sách bài làm..." />;
  }
  if (dataError && queue.length === 0) {
    return <StatePanel title="Không thể tải dữ liệu" message={dataError} actionLabel="Thử lại" onAction={() => void refreshAcademicData()} />;
  }
  if (queue.length === 0) {
    return <StatePanel title="Chưa có bài để chấm" message="Chưa tìm thấy bài nộp nào phù hợp." actionLabel="Về bàn giáo viên" onAction={() => onNavigate('teacher-dashboard')} />;
  }
  if (!currentPortfolio || !assignment) {
    return <StatePanel title="Dữ liệu chưa hoàn chỉnh" message="Hồ sơ không còn liên kết với nhiệm vụ hợp lệ." actionLabel="Tải lại" onAction={() => void refreshAcademicData()} />;
  }

  const createFeedback = async () => {
    const comment = feedbackText.trim();
    if (!comment) {
      addToast({ type: 'warning', title: 'Chưa có nội dung phản hồi', message: 'Hãy nhập nhận xét trước khi gửi.' });
      return;
    }
    if (!selectedVersion) {
      addToast({ type: 'warning', title: 'Học sinh chưa nộp phiên bản', message: 'Chỉ phản hồi sau khi học sinh đã nộp bài.' });
      return;
    }
    setIsSubmittingFeedback(true);
    try {
      await addAnchoredFeedback({
        assignmentId: assignment.id,
        studentId: currentPortfolio.studentId,
        versionNumber: selectedVersion,
        axisId: activeAxisId,
        selectedSnippet: selectedText,
        comment,
        authorId: currentUser.id,
        authorName: currentUser.name,
        authorRole: evaluatorRole
      });
      setFeedbackText('');
      setSelectedText('');
      addToast({ type: 'success', title: 'Đã lưu phản hồi', message: 'Nhận xét đã được gửi cho học sinh.' });
    } catch {
      addToast({ type: 'error', title: 'Lỗi gửi phản hồi', message: 'Không thể lưu nhận xét. Vui lòng thử lại.' });
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const saveRubric = async () => {
    if (!selectedVersion) {
      addToast({ type: 'warning', title: 'Chưa có phiên bản để chấm', message: 'Học sinh cần nộp ít nhất v1.0.' });
      return;
    }
    if ((rubric.criteria || []).some(criterion => (rubricScores[criterion.id] || 0) < 1)) {
      addToast({ type: 'warning', title: 'Rubric chưa hoàn tất', message: 'Hãy chọn mức điểm cho tất cả tiêu chí.' });
      return;
    }
    setIsSubmittingRubric(true);
    try {
      const criterionScores = Object.fromEntries(
        (rubric.criteria || []).map(criterion => {
          const level = rubricScores[criterion.id] || 0;
          return [criterion.id, { level, score: level, note: '' }];
        })
      );
      await submitRubric({
        assignmentId: assignment.id,
        studentId: currentPortfolio.studentId,
        versionNumber: selectedVersion,
        evaluatorId: currentUser.id,
        evaluatorName: currentUser.name,
        evaluatorRole,
        criterionScores,
        overallFeedback: overallFeedback.trim(),
        totalScore,
        maxScore
      });
      addToast({ type: 'success', title: 'Đã lưu điểm rubric', message: `Điểm ${totalScore}/${maxScore} đã được lưu thành công.` });
    } catch {
      addToast({ type: 'error', title: 'Lỗi lưu rubric', message: 'Không thể lưu kết quả rubric.' });
    } finally {
      setIsSubmittingRubric(false);
    }
  };

  const handleTeacherAiDecision = async (decision: 'approved' | 'revised' | 'rejected') => {
    if (!pendingAiProposal) return;
    setIsSubmittingAiReview(true);
    try {
      const finalResponse = decision === 'rejected' ? '' : (decision === 'revised' ? editedAiText.trim() : pendingAiProposal.response);
      const res = await fetch('/api/academic/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'teacher_review_ai',
          reviewId: pendingAiProposal.id,
          decision,
          finalResponse,
          axisId: activeAxisId,
          teacherNote: decision === 'revised' ? 'Giáo viên chỉnh sửa từ đề xuất AI' : (decision === 'rejected' ? 'Giáo viên từ chối đề xuất AI' : 'Giáo viên duyệt nguyên văn đề xuất AI')
        })
      });
      if (!res.ok) throw new Error('TEACHER_REVIEW_AI_FAILED');
      await refreshAcademicData();
      addToast({
        type: 'success',
        title: decision === 'rejected' ? 'Đã bỏ qua đề xuất AI' : 'Đã duyệt phản hồi',
        message: decision === 'rejected' ? 'Bạn có thể tự viết nhận xét bên dưới.' : 'Nhận xét đã trở thành phản hồi chính thức của giáo viên.'
      });
    } catch {
      addToast({ type: 'error', title: 'Không thể xử lý đề xuất AI', message: 'Vui lòng thử lại.' });
    } finally {
      setIsSubmittingAiReview(false);
    }
  };

  const captureSelection = () => {
    const text = window.getSelection()?.toString().trim() || '';
    if (text.length >= 5) setSelectedText(text.slice(0, 1000));
  };

  const changeStudent = (offset: number) => {
    const next = currentIndex + offset;
    if (next >= 0 && next < queue.length) setCurrentIndex(next);
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-white flex flex-col">
      {/* Workspace Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white px-4 py-2.5">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button size="sm" variant="ghost" onClick={() => onNavigate('teacher-dashboard')} leftIcon={<ArrowLeftIcon className="h-4 w-4" />}>
              Quay lại
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-900">{currentPortfolio.studentName}</span>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs text-slate-600">Lớp {currentPortfolio.className || '—'}</span>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs text-slate-600">
                  {assignment.title}{literatureText ? ` (${literatureText.title})` : ''}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" disabled={currentIndex === 0} onClick={() => changeStudent(-1)} leftIcon={<ChevronLeftIcon className="h-4 w-4" />}>
              Trước
            </Button>
            <span className="text-xs text-slate-500 px-1">
              {currentIndex + 1}/{queue.length}
            </span>
            <Button size="sm" variant="outline" disabled={currentIndex >= queue.length - 1} onClick={() => changeStudent(1)}>
              Sau <ChevronRightIcon className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* 3-Column Desk Layout */}
      <div className="mx-auto flex-1 w-full max-w-7xl grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)_340px]">
        {/* Left: Student Queue */}
        <aside className="border-b lg:border-b-0 lg:border-r border-slate-200 bg-slate-50/50 p-3 space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Phiên bản chấm</label>
            <select
              value={selectedVersion}
              onChange={e => setSelectedVersion(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-slate-500"
            >
              <option value="">Bản nháp</option>
              {currentPortfolio.versions.map(version => (
                <option key={version.id} value={version.versionNumber}>
                  {version.versionNumber} ({version.stage === 'prediction' ? 'Dự đoán' : version.stage === 'initial' ? 'Bản đầu' : 'Sửa đổi'})
                </option>
              ))}
            </select>
          </div>

          <div className="border-t border-slate-200 pt-3">
            <div className="text-xs font-medium text-slate-500 mb-1.5 px-1">Danh sách học sinh</div>
            <div className="max-h-[60vh] space-y-0.5 overflow-y-auto">
              {queue.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-full rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
                    index === currentIndex
                      ? 'bg-white text-slate-900 font-medium border border-slate-200 shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="truncate">{item.studentName}</div>
                  <div className="text-xs text-slate-500 truncate">
                    {item.className || '—'} · {item.versions.length ? item.versions[item.versions.length - 1].versionNumber : 'Chưa nộp'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Center: Submission Content */}
        <main className="p-4 sm:p-6 space-y-5">
          {/* Axis Navigation Tabs */}
          <div className="border-b border-slate-200 flex gap-1 overflow-x-auto pb-px">
            {POETIC_AXES.map(axis => (
              <button
                key={axis.id}
                onClick={() => setActiveAxisId(axis.id)}
                className={`py-2 px-3 text-sm border-b-2 -mb-px whitespace-nowrap transition-colors ${
                  activeAxisId === axis.id
                    ? 'border-slate-900 text-slate-900 font-medium'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {axis.shortName}
              </button>
            ))}
          </div>

          {/* AI Proposal Review (Quiet section, NO Sparkles, NO giant tinted box) */}
          {pendingAiProposal && evaluatorRole === 'teacher' && (
            <section className="border border-slate-300 rounded-md bg-slate-50/70 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h3 className="text-xs font-medium text-slate-800">Đề xuất phản hồi AI</h3>
                <span className="text-xs text-slate-500">Chờ giáo viên duyệt</span>
              </div>

              {isEditingAiProposal ? (
                <textarea
                  rows={3}
                  value={editedAiText}
                  onChange={e => setEditedAiText(e.target.value)}
                  className="w-full rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-800 outline-none focus:border-slate-500"
                />
              ) : (
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {pendingAiProposal.response}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button
                  size="sm"
                  variant="primary"
                  isLoading={isSubmittingAiReview}
                  onClick={() => handleTeacherAiDecision(isEditingAiProposal ? 'revised' : 'approved')}
                >
                  {isEditingAiProposal ? 'Lưu bản sửa & Gửi' : 'Duyệt'}
                </Button>

                {!isEditingAiProposal ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsEditingAiProposal(true)}
                  >
                    Sửa rồi gửi
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditedAiText(pendingAiProposal.response || '');
                      setIsEditingAiProposal(false);
                    }}
                  >
                    Hủy sửa
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="ghost"
                  className="text-slate-600 hover:text-rose-700"
                  isLoading={isSubmittingAiReview}
                  onClick={() => handleTeacherAiDecision('rejected')}
                >
                  Bỏ qua
                </Button>
              </div>
            </section>
          )}

          {/* Student Content */}
          <div className="space-y-3">
            <div className="flex items-baseline justify-between border-b border-slate-100 pb-2">
              <h2 className="text-base font-medium text-slate-900">
                {POETIC_AXES.find(axis => axis.id === activeAxisId)?.title}
              </h2>
              <span className="text-xs text-slate-500">
                {selectedVersion || 'Bản nháp'}
              </span>
            </div>

            <div
              onMouseUp={captureSelection}
              className="min-h-56 font-sans text-sm leading-7 text-slate-800 whitespace-pre-wrap select-text"
            >
              {activeResponse?.analysisText?.trim() || (
                <span className="italic text-slate-400">Học sinh chưa viết bài ở trục này.</span>
              )}
            </div>

            {activeResponse?.evidenceQuotes && activeResponse.evidenceQuotes.length > 0 && (
              <div className="pt-3 border-t border-slate-100 space-y-1">
                <div className="text-xs font-medium text-slate-600">Dẫn chứng:</div>
                {activeResponse.evidenceQuotes.map(item => (
                  <blockquote key={item.id} className="border-l-2 border-slate-300 pl-3 py-0.5 text-xs text-slate-600 italic">
                    {item.text}
                  </blockquote>
                ))}
              </div>
            )}
          </div>

          {/* Existing Feedbacks for this axis & version */}
          {currentFeedbacks.length > 0 && (
            <section className="pt-4 border-t border-slate-200 space-y-2">
              <h3 className="text-xs font-medium text-slate-600">
                Phản hồi đã gửi ở trục này ({currentFeedbacks.length}):
              </h3>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-md bg-slate-50/50">
                {currentFeedbacks.map(item => (
                  <div key={item.id} className="p-2.5 text-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-700">
                      <span className="font-medium">{item.authorName} ({item.authorRole === 'teacher' ? 'GV' : 'Bạn học'})</span>
                      <span className="text-slate-400">{item.versionNumber}</span>
                    </div>
                    {item.selectedSnippet && (
                      <div className="border-l-2 border-slate-300 pl-2 text-slate-500 italic">
                        “{item.selectedSnippet}”
                      </div>
                    )}
                    <p className="text-slate-800">{item.comment}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>

        {/* Right: Review Inspector (Feedback & Rubric) */}
        <aside className="border-t lg:border-t-0 lg:border-l border-slate-200 bg-slate-50/40 p-4 space-y-6">
          {/* Section: Direct Feedback */}
          <section className="space-y-2">
            <h2 className="text-xs font-semibold text-slate-800">Nhận xét trực tiếp</h2>
            {selectedText && (
              <div className="border-l-2 border-slate-400 bg-white p-2 text-xs italic text-slate-600 rounded">
                “{selectedText}”
              </div>
            )}
            <textarea
              rows={3}
              value={feedbackText}
              onChange={e => setFeedbackText(e.target.value)}
              placeholder="Nhập nhận xét cụ thể cho học sinh..."
              className="w-full rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-800 outline-none focus:border-slate-500"
            />
            <Button
              className="w-full"
              variant="primary"
              size="sm"
              isLoading={isSubmittingFeedback}
              disabled={!selectedVersion}
              onClick={createFeedback}
            >
              Gửi nhận xét
            </Button>
          </section>

          {/* Section: Rubric Matrix */}
          <section className="space-y-3 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-slate-800">Đánh giá Rubric</h2>
              <span className="text-xs text-slate-600">
                Tổng: <strong>{totalScore}/{maxScore}</strong>
              </span>
            </div>

            {rubric.criteria.length === 0 ? (
              <p className="text-xs text-slate-500">Chưa có rubric.</p>
            ) : (
              <div className="space-y-2 text-xs">
                {rubric.criteria.map(criterion => (
                  <div key={criterion.id} className="flex items-center justify-between gap-2 py-1 border-b border-slate-100">
                    <span className="truncate text-slate-700 max-w-[150px]">{criterion.title}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      {[1, 2, 3, 4].map(lvl => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setRubricScores(prev => ({ ...prev, [criterion.id]: lvl }))}
                          className={`w-6 h-6 rounded text-xs transition ${
                            rubricScores[criterion.id] === lvl
                              ? 'bg-slate-900 text-white font-semibold'
                              : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <textarea
              rows={2}
              value={overallFeedback}
              onChange={e => setOverallFeedback(e.target.value)}
              placeholder="Nhận xét tổng thể..."
              className="w-full rounded-md border border-slate-300 bg-white p-2 text-xs text-slate-800 outline-none focus:border-slate-500"
            />

            <Button
              className="w-full"
              variant="outline"
              size="sm"
              isLoading={isSubmittingRubric}
              disabled={!selectedVersion || rubric.criteria.length === 0}
              onClick={saveRubric}
            >
              Lưu điểm Rubric
            </Button>
          </section>
        </aside>
      </div>
    </div>
  );
};
