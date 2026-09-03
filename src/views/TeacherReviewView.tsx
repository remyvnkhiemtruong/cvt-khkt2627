import React, { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '../app/store/useAuthStore';
import { useNotificationStore } from '../app/store/useNotificationStore';
import { usePortfolio } from '../contexts/PortfolioContext';
import { POETIC_AXES } from '../data/seedData';
import type { PoeticAxisId } from '../types';
import { Avatar, Badge, Button } from '../components/ui';
import {
  AcademicCapIcon,
  ArrowLeftIcon,
  ChatBubbleLeftRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  CheckIcon,
  PencilSquareIcon,
  XMarkIcon
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
  <div className="mx-auto mt-10 max-w-xl rounded-lg border border-slate-200 bg-white p-8 text-center">
    {loading ? (
      <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
    ) : (
      <ExclamationTriangleIcon className="mx-auto mb-4 h-9 w-9 text-slate-400" />
    )}
    <h2 className="text-lg font-bold text-slate-900">{title}</h2>
    <p className="mt-2 text-sm leading-6 text-slate-500">{message}</p>
    {actionLabel && onAction && (
      <Button className="mt-5" variant="primary" onClick={onAction}>
        {actionLabel}
      </Button>
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

  // RESET RUBRIC SCORES on portfolio/student/version change (Prevents rubric score leakage)
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
    return aiReviews.find(r =>
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
    return <StatePanel loading title="Đang tải bài nộp" message="Hệ thống đang lấy danh sách hồ sơ nộp bài." />;
  }
  if (dataError && queue.length === 0) {
    return <StatePanel title="Không thể tải dữ liệu" message={dataError} actionLabel="Thử lại" onAction={() => void refreshAcademicData()} />;
  }
  if (queue.length === 0) {
    return <StatePanel title="Chưa có bài để chấm" message="Không tìm thấy hồ sơ học sinh phù hợp. Hãy kiểm tra lớp, nhiệm vụ hoặc trạng thái nộp bài." actionLabel="Về bàn giáo viên" onAction={() => onNavigate('teacher-dashboard')} />;
  }
  if (!currentPortfolio || !assignment) {
    return <StatePanel title="Dữ liệu bài nộp không đầy đủ" message="Hồ sơ không còn liên kết với nhiệm vụ hợp lệ. Hãy tải lại dữ liệu." actionLabel="Tải lại" onAction={() => void refreshAcademicData()} />;
  }

  const createFeedback = async () => {
    const comment = feedbackText.trim();
    if (!comment) {
      addToast({ type: 'warning', title: 'Chưa có nội dung phản hồi', message: 'Hãy nhập nhận xét trước khi gửi.' });
      return;
    }
    if (!selectedVersion) {
      addToast({ type: 'warning', title: 'Học sinh chưa nộp phiên bản', message: 'Chỉ phản hồi sau khi học sinh đã tạo bản nộp.' });
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
      addToast({ type: 'success', title: 'Đã gửi phản hồi', message: 'Nhận xét đã được lưu vào hồ sơ học sinh.' });
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
      addToast({ type: 'warning', title: 'Rubric chưa hoàn tất', message: 'Hãy chọn mức 1–4 cho tất cả tiêu chí.' });
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
      addToast({ type: 'success', title: 'Đã gửi đánh giá rubric', message: `Điểm ${totalScore}/${maxScore} đã được lưu thành công.` });
    } catch {
      addToast({ type: 'error', title: 'Lỗi lưu rubric', message: 'Không thể lưu kết quả rubric. Vui lòng thử lại.' });
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
        title: decision === 'rejected' ? 'Đã bỏ qua đề xuất AI' : 'Đã duyệt nhận xét',
        message: decision === 'rejected' ? 'Bạn có thể tự viết nhận xét bên dưới.' : 'Nhận xét đã trở thành phản hồi chính thức của giáo viên gửi học sinh.'
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
    <div className="min-h-[calc(100vh-3.5rem)] bg-slate-50">
      <header className="border-b border-slate-200 bg-white p-3 sm:px-5 sm:py-3">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 lg:flex-row lg:items-center">
          <div className="flex items-center gap-3">
            <Button size="sm" variant="ghost" onClick={() => onNavigate('teacher-dashboard')} leftIcon={<ArrowLeftIcon className="h-4 w-4" />}>
              Quay lại
            </Button>
            <div>
              <div className="text-xs font-medium text-indigo-700">{evaluatorRole === 'peer' ? 'Phản biện đồng đẳng' : 'Đánh giá của giáo viên'}</div>
              <h1 className="text-base font-semibold text-slate-900">{assignment.title}</h1>
              <p className="text-xs text-slate-500">{literatureText ? `${literatureText.title} — ${literatureText.author}` : 'Ngữ liệu chưa khả dụng'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" disabled={currentIndex === 0} onClick={() => changeStudent(-1)} leftIcon={<ChevronLeftIcon className="h-4 w-4" />}>
              Trước
            </Button>
            <span className="text-xs font-medium text-slate-600">
              {currentIndex + 1}/{queue.length}
            </span>
            <Button size="sm" variant="outline" disabled={currentIndex >= queue.length - 1} onClick={() => changeStudent(1)}>
              Sau <ChevronRightIcon className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-4 p-3 sm:p-5 xl:grid-cols-[240px_minmax(0,1fr)_340px]">
        <aside className="space-y-3">
          <section className="rounded-lg border border-slate-200 bg-white p-3.5">
            <div className="flex items-center gap-2.5">
              <Avatar name={currentPortfolio.studentName} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-semibold text-slate-900">{currentPortfolio.studentName}</div>
                <div className="text-xs text-slate-500">{currentPortfolio.className || 'Chưa gán lớp'}</div>
              </div>
            </div>
            <div className="mt-3">
              <label className="text-xs font-medium text-slate-600">Phiên bản đang xem</label>
              <select
                value={selectedVersion}
                onChange={e => setSelectedVersion(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-medium outline-none focus:border-indigo-500"
              >
                <option value="">Bản nháp hiện tại</option>
                {currentPortfolio.versions.map(version => (
                  <option key={version.id} value={version.versionNumber}>
                    {version.versionNumber} ({version.stage === 'prediction' ? 'Dự đoán' : version.stage === 'initial' ? 'Khởi đầu' : 'Chỉnh sửa'})
                  </option>
                ))}
              </select>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="mb-2 text-xs font-semibold text-slate-500">Học sinh trong danh sách</div>
            <div className="max-h-[55vh] space-y-1 overflow-y-auto">
              {queue.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-full rounded-md px-2.5 py-2 text-left text-xs transition-colors ${
                    index === currentIndex ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="truncate">{item.studentName}</div>
                  <div className={`mt-0.5 text-xs ${index === currentIndex ? 'text-slate-600' : 'text-slate-400'}`}>
                    {item.className || '—'} • {item.versions.length ? item.versions[item.versions.length - 1].versionNumber : 'Chưa nộp'}
                  </div>
                </button>
              ))}
            </div>
          </section>
        </aside>

        <main className="space-y-4">
          {dataError && <div className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-900">Dữ liệu có thể chưa mới nhất: {dataError}</div>}

          {/* AI PROPOSAL PANEL (When AI proposal is awaiting teacher review) */}
          {pendingAiProposal && evaluatorRole === 'teacher' && (
            <section className="rounded-lg border border-indigo-300 bg-indigo-50/50 p-4">
              <div className="flex items-center justify-between gap-2 border-b border-indigo-200 pb-2.5">
                <div className="flex items-center gap-2">
                  <SparklesIcon className="h-4 w-4 text-indigo-700" />
                  <span className="text-xs font-bold text-indigo-900">Đề xuất phản hồi từ AI (Chờ giáo viên duyệt)</span>
                </div>
                <Badge variant="indigo">Đề xuất AI</Badge>
              </div>

              <div className="mt-3">
                {isEditingAiProposal ? (
                  <textarea
                    rows={4}
                    value={editedAiText}
                    onChange={e => setEditedAiText(e.target.value)}
                    className="w-full rounded-md border border-indigo-300 bg-white p-2.5 text-xs text-slate-900 outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                ) : (
                  <p className="whitespace-pre-wrap text-xs leading-5 text-slate-800 bg-white rounded-md border border-indigo-100 p-3">
                    {pendingAiProposal.response}
                  </p>
                )}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  isLoading={isSubmittingAiReview}
                  onClick={() => handleTeacherAiDecision(isEditingAiProposal ? 'revised' : 'approved')}
                  leftIcon={<CheckIcon className="h-3.5 w-3.5" />}
                >
                  {isEditingAiProposal ? 'Lưu bản sửa & Gửi HS' : 'Duyệt nguyên văn'}
                </Button>

                {!isEditingAiProposal ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsEditingAiProposal(true)}
                    leftIcon={<PencilSquareIcon className="h-3.5 w-3.5" />}
                  >
                    Chỉnh sửa trước khi gửi
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
                    Hủy chỉnh sửa
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="ghost"
                  className="text-rose-700 hover:bg-rose-50"
                  isLoading={isSubmittingAiReview}
                  onClick={() => handleTeacherAiDecision('rejected')}
                  leftIcon={<XMarkIcon className="h-3.5 w-3.5" />}
                >
                  Không dùng AI
                </Button>
              </div>
            </section>
          )}

          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="mb-3 flex flex-wrap gap-1.5">
              {POETIC_AXES.map(axis => (
                <button
                  key={axis.id}
                  onClick={() => setActiveAxisId(axis.id)}
                  className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    activeAxisId === axis.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {axis.shortName}
                </button>
              ))}
            </div>
            <div className="border-t border-slate-100 pt-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-slate-900">{POETIC_AXES.find(axis => axis.id === activeAxisId)?.title}</h2>
                <Badge variant={selectedVersion ? 'blue' : 'slate'} size="sm">
                  {selectedVersion || 'Bản nháp'}
                </Badge>
              </div>
              <div
                onMouseUp={captureSelection}
                className="min-h-64 whitespace-pre-wrap rounded-md border border-slate-200 bg-slate-50/70 p-4 font-sans text-xs leading-6 text-slate-800"
              >
                {activeResponse?.analysisText?.trim() || <span className="italic text-slate-400">Học sinh chưa viết nội dung ở trục này.</span>}
              </div>
              {activeResponse?.evidenceQuotes && activeResponse.evidenceQuotes.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  <div className="text-xs font-semibold text-slate-700">Dẫn chứng</div>
                  {activeResponse.evidenceQuotes.map(item => (
                    <blockquote key={item.id} className="rounded border-l-2 border-indigo-300 bg-indigo-50/40 px-2.5 py-1.5 text-xs italic text-slate-600">
                      {item.text}
                    </blockquote>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2">
              <ChatBubbleLeftRightIcon className="h-4 w-4 text-slate-600" />
              <h2 className="text-xs font-semibold text-slate-900">
                Phản hồi đã có {selectedVersion ? `(Phiên bản ${selectedVersion})` : ''}
              </h2>
            </div>
            {currentFeedbacks.length === 0 ? (
              <p className="mt-2 text-xs text-slate-500">Chưa có phản hồi ở trục này cho phiên bản đang chọn.</p>
            ) : (
              <div className="mt-2.5 space-y-2">
                {currentFeedbacks.map(item => (
                  <div key={item.id} className="rounded-md border border-slate-200 bg-slate-50 p-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <strong className="text-slate-800">
                        {item.authorName} ({item.authorRole === 'teacher' ? 'Giáo viên' : (item.authorRole === 'peer' ? 'Bạn học' : 'AI')})
                      </strong>
                      <span className="text-slate-400">{item.versionNumber}</span>
                    </div>
                    {item.selectedSnippet && (
                      <div className="mt-1 border-l-2 border-indigo-300 pl-2 italic text-slate-500">{item.selectedSnippet}</div>
                    )}
                    <p className="mt-1 leading-5 text-slate-700">{item.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>

        <aside className="space-y-4">
          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="flex items-center gap-2 text-xs font-semibold text-slate-900">
              <ChatBubbleLeftRightIcon className="h-4 w-4 text-slate-600" />Gửi phản hồi trực tiếp
            </h2>
            {selectedText && (
              <div className="mt-2.5 rounded border-l-2 border-indigo-400 bg-indigo-50 px-2.5 py-1.5 text-xs italic text-slate-600">
                “{selectedText}”
              </div>
            )}
            <textarea
              rows={4}
              value={feedbackText}
              onChange={e => setFeedbackText(e.target.value)}
              placeholder="Nêu điểm mạnh, chỗ cần sửa và gợi ý cụ thể…"
              className="mt-2.5 w-full rounded-md border border-slate-300 p-2.5 text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            <Button
              className="mt-2 w-full"
              variant="primary"
              size="sm"
              isLoading={isSubmittingFeedback}
              disabled={!selectedVersion}
              onClick={createFeedback}
            >
              Gửi phản hồi
            </Button>
            {!selectedVersion && <p className="mt-1.5 text-[11px] text-amber-700">Học sinh chưa có phiên bản đã nộp.</p>}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="flex items-center gap-2 text-xs font-semibold text-slate-900">
              <AcademicCapIcon className="h-4 w-4 text-slate-600" />Đánh giá Rubric
            </h2>
            {rubric.criteria.length === 0 ? (
              <p className="mt-2 text-xs text-slate-500">Chưa có rubric hoạt động.</p>
            ) : (
              <div className="mt-2.5 space-y-2.5">
                {rubric.criteria.map(criterion => (
                  <div key={criterion.id}>
                    <div className="mb-1 text-xs font-medium text-slate-700">{criterion.title}</div>
                    <div className="grid grid-cols-4 gap-1">
                      {[1, 2, 3, 4].map(level => (
                        <button
                          key={level}
                          onClick={() => setRubricScores(prev => ({ ...prev, [criterion.id]: level }))}
                          className={`rounded-md border py-1 text-xs font-semibold ${
                            rubricScores[criterion.id] === level
                              ? 'border-emerald-700 bg-emerald-700 text-white'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {level}
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
              placeholder="Nhận xét tổng thể…"
              className="mt-2.5 w-full rounded-md border border-slate-300 p-2 text-xs outline-none focus:border-indigo-500"
            />
            <div className="mt-2.5 flex items-center justify-between text-xs">
              <span className="text-slate-500">Tổng điểm</span>
              <strong className="text-sm font-semibold text-slate-900">
                {totalScore}/{maxScore}
              </strong>
            </div>
            <Button
              className="mt-2 w-full"
              variant="academic"
              size="sm"
              isLoading={isSubmittingRubric}
              disabled={!selectedVersion || rubric.criteria.length === 0}
              onClick={saveRubric}
            >
              Gửi đánh giá rubric
            </Button>
          </section>
        </aside>
      </div>
    </div>
  );
};
