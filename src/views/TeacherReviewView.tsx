import React, { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '../app/store/useAuthStore';
import { useNotificationStore } from '../app/store/useNotificationStore';
import { usePortfolio } from '../contexts/PortfolioContext';
import { POETIC_AXES } from '../data/seedData';
import type { PoeticAxisId, RubricMatrix } from '../types';
import { Badge, Button } from '../components/ui';
import { ArrowLeftIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface TeacherReviewViewProps {
  studentId?: string;
  assignmentId?: string;
  isPeerMode?: boolean;
  onNavigate: (view: string, extraParams?: unknown) => void;
}

const StatePanel: React.FC<{
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  loading?: boolean;
}> = ({ title, message, actionLabel, onAction, loading }) => (
  <div className="mx-auto mt-16 max-w-md space-y-3 p-6 text-center">
    {loading && <div className="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-primary-700" />}
    <h2 className="text-base font-semibold text-slate-900">{title}</h2>
    <p className="text-sm leading-relaxed text-slate-500">{message}</p>
    {actionLabel && onAction && <div className="pt-2"><Button variant="primary" onClick={onAction}>{actionLabel}</Button></div>}
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
    rubrics,
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
    const all = Object.values(portfolios).filter(item => item.versions.length > 0);
    const scoped = assignmentId ? all.filter(item => item.assignmentId === assignmentId) : all;
    return [...scoped].sort((a, b) => a.studentName.localeCompare(b.studentName, 'vi'));
  }, [portfolios, assignmentId]);

  const requestedStudentMissing = Boolean(studentId && queue.length > 0 && !queue.some(item => item.studentId === studentId));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeAxisId, setActiveAxisId] = useState<PoeticAxisId>('plot_situation');
  const [selectedVersion, setSelectedVersion] = useState('');
  const [selectedText, setSelectedText] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [overallFeedback, setOverallFeedback] = useState('');
  const [rubricScores, setRubricScores] = useState<Record<string, number>>({});
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [isSubmittingRubric, setIsSubmittingRubric] = useState(false);
  const [isEditingAiProposal, setIsEditingAiProposal] = useState(false);
  const [editedAiText, setEditedAiText] = useState('');
  const [isSubmittingAiReview, setIsSubmittingAiReview] = useState(false);

  useEffect(() => {
    if (!queue.length) {
      setCurrentIndex(0);
      return;
    }
    if (studentId) {
      const requested = queue.findIndex(item => item.studentId === studentId);
      if (requested >= 0) setCurrentIndex(requested);
      return;
    }
    if (currentIndex >= queue.length) setCurrentIndex(0);
  }, [queue, studentId, currentIndex]);

  const currentPortfolio = requestedStudentMissing ? undefined : queue[currentIndex];
  const assignment = currentPortfolio ? assignments.find(item => item.id === currentPortfolio.assignmentId) : undefined;
  const literatureText = assignment ? literatureTexts.find(item => item.id === assignment.textId) : undefined;
  const activeRubric: RubricMatrix = assignment ? (rubrics[assignment.rubricId] || rubric) : rubric;

  const latestVersionNumber = currentPortfolio?.versions[currentPortfolio.versions.length - 1]?.versionNumber || '';
  useEffect(() => {
    setSelectedVersion(latestVersionNumber);
  }, [currentPortfolio?.id, latestVersionNumber]);

  const evaluatorRole = currentUser.role === 'peer' || isPeerMode ? 'peer' : 'teacher';
  const selectedSnapshot = currentPortfolio?.versions.find(item => item.versionNumber === selectedVersion);
  const integrityError = Boolean(currentPortfolio && selectedVersion && !selectedSnapshot);
  const activeResponse = selectedSnapshot?.responses?.[activeAxisId];

  useEffect(() => {
    const reset = Object.fromEntries((activeRubric.criteria || []).map(criterion => [criterion.id, 0]));
    if (!currentPortfolio || !assignment || !selectedVersion || !selectedSnapshot) {
      setRubricScores(reset);
      setOverallFeedback('');
      return;
    }
    const existing = rubricSubmissions.find(item =>
      item.studentId === currentPortfolio.studentId &&
      item.assignmentId === assignment.id &&
      item.versionNumber === selectedVersion &&
      item.evaluatorRole === evaluatorRole
    );
    if (existing) {
      const loaded: Record<string, number> = {};
      for (const [criterionId, value] of Object.entries(existing.criterionScores || {})) {
        loaded[criterionId] = Number(value.level || value.score || 0);
      }
      setRubricScores(loaded);
      setOverallFeedback(existing.overallFeedback || '');
    } else {
      setRubricScores(reset);
      setOverallFeedback('');
    }
  }, [currentPortfolio, assignment, selectedVersion, selectedSnapshot, evaluatorRole, activeRubric.id, activeRubric.criteria, rubricSubmissions]);

  const currentFeedbacks = useMemo(() => {
    if (!currentPortfolio || !assignment || !selectedVersion) return [];
    return feedbacks.filter(item =>
      item.studentId === currentPortfolio.studentId &&
      item.assignmentId === assignment.id &&
      item.axisId === activeAxisId &&
      item.versionNumber === selectedVersion
    );
  }, [feedbacks, currentPortfolio, assignment, activeAxisId, selectedVersion]);

  const pendingAiProposal = useMemo(() => {
    if (!currentPortfolio || !selectedVersion || evaluatorRole !== 'teacher') return null;
    return aiReviews.find(item =>
      item.student_id === currentPortfolio.studentId &&
      item.version_number === selectedVersion &&
      item.status === 'completed' &&
      item.teacher_review_status === 'pending'
    ) || null;
  }, [aiReviews, currentPortfolio, selectedVersion, evaluatorRole]);

  useEffect(() => {
    setEditedAiText(pendingAiProposal?.response || '');
    setIsEditingAiProposal(false);
  }, [pendingAiProposal?.id, pendingAiProposal?.response]);

  const totalScore = activeRubric.criteria.reduce((sum, criterion) => {
    const selectedLevel = rubricScores[criterion.id] || 0;
    const level = criterion.levels.find(item => item.level === selectedLevel);
    return sum + Number(level?.score || 0) * Number(criterion.weight || 1);
  }, 0);
  const maxScore = activeRubric.criteria.reduce((sum, criterion) => {
    const max = criterion.levels.reduce((current, level) => Math.max(current, Number(level.score || 0)), 0);
    return sum + max * Number(criterion.weight || 1);
  }, 0);

  if (isLoading && queue.length === 0) return <StatePanel loading title="Đang mở bài chấm" message="Đang tải các phiên bản đã nộp..." />;
  if (dataError && queue.length === 0) return <StatePanel title="Không thể tải dữ liệu" message={dataError} actionLabel="Thử lại" onAction={() => void refreshAcademicData()} />;
  if (assignmentId && queue.length === 0) return <StatePanel title="Chưa có bài đã nộp" message="Nhiệm vụ này chưa có phiên bản nào thuộc phạm vi bạn được phép chấm." actionLabel="Về bàn giáo viên" onAction={() => onNavigate('teacher-dashboard')} />;
  if (requestedStudentMissing) return <StatePanel title="Không tìm thấy bài của học sinh" message="Học sinh được yêu cầu không có bài thuộc phạm vi bạn được phép chấm." actionLabel="Về bàn giáo viên" onAction={() => onNavigate('teacher-dashboard')} />;
  if (!queue.length) return <StatePanel title="Chưa có bài để chấm" message="Khi học sinh nộp phiên bản, bài sẽ xuất hiện tại đây." actionLabel="Về bàn giáo viên" onAction={() => onNavigate('teacher-dashboard')} />;
  if (!currentPortfolio || !assignment) return <StatePanel title="Dữ liệu chưa hoàn chỉnh" message="Hồ sơ không còn liên kết với nhiệm vụ hợp lệ." actionLabel="Tải lại" onAction={() => void refreshAcademicData()} />;
  if (!selectedSnapshot || integrityError) return <StatePanel title="Không tìm thấy phiên bản đã nộp" message="Không thể chấm bằng bản nháp thay thế. Hãy tải lại dữ liệu hoặc chọn một phiên bản hợp lệ." actionLabel="Tải lại" onAction={() => void refreshAcademicData()} />;

  const createFeedback = async () => {
    const comment = feedbackText.trim();
    if (!comment) {
      addToast({ type: 'warning', title: 'Chưa có nội dung phản hồi', message: 'Hãy nhập nhận xét trước khi gửi.' });
      return;
    }
    setIsSubmittingFeedback(true);
    try {
      await addAnchoredFeedback({
        assignmentId: assignment.id,
        studentId: currentPortfolio.studentId,
        versionId: selectedSnapshot.id,
        versionNumber: selectedSnapshot.versionNumber,
        axisId: activeAxisId,
        selectedSnippet: selectedText,
        comment,
        authorId: currentUser.id,
        authorName: currentUser.name,
        authorRole: evaluatorRole
      });
      setFeedbackText('');
      setSelectedText('');
      addToast({ type: 'success', title: 'Đã lưu phản hồi', message: 'Nhận xét đã được lưu cho đúng phiên bản.' });
    } catch (error: unknown) {
      addToast({ type: 'error', title: 'Lỗi gửi phản hồi', message: error instanceof Error ? error.message : 'Không thể lưu nhận xét.' });
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const saveRubric = async () => {
    if (!activeRubric.criteria.length) return;
    if (activeRubric.criteria.some(criterion => (rubricScores[criterion.id] || 0) < 1)) {
      addToast({ type: 'warning', title: 'Rubric chưa hoàn tất', message: 'Hãy chọn mức cho tất cả tiêu chí.' });
      return;
    }
    setIsSubmittingRubric(true);
    try {
      const criterionScores = Object.fromEntries(activeRubric.criteria.map(criterion => {
        const level = rubricScores[criterion.id] || 0;
        return [criterion.id, { level, score: level, note: '' }];
      }));
      const result = await submitRubric({
        assignmentId: assignment.id,
        studentId: currentPortfolio.studentId,
        versionId: selectedSnapshot.id,
        versionNumber: selectedSnapshot.versionNumber,
        evaluatorId: currentUser.id,
        evaluatorName: currentUser.name,
        evaluatorRole,
        criterionScores,
        overallFeedback: overallFeedback.trim(),
        totalScore,
        maxScore
      });
      const canonicalTotal = result.totalScore ?? totalScore;
      const canonicalMax = result.maxScore ?? maxScore;
      addToast({ type: 'success', title: 'Đã lưu điểm rubric', message: `Điểm ${canonicalTotal}/${canonicalMax} đã được máy chủ xác nhận.` });
    } catch (error: unknown) {
      addToast({ type: 'error', title: 'Lỗi lưu rubric', message: error instanceof Error ? error.message : 'Không thể lưu kết quả rubric.' });
    } finally {
      setIsSubmittingRubric(false);
    }
  };

  const handleTeacherAiDecision = async (decision: 'approved' | 'revised' | 'rejected') => {
    if (!pendingAiProposal) return;
    setIsSubmittingAiReview(true);
    try {
      const finalResponse = decision === 'revised' ? editedAiText.trim() : '';
      const response = await fetch('/api/academic/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'teacher_review_ai', reviewId: pendingAiProposal.id, decision, finalResponse, axisId: activeAxisId, teacherNote: decision === 'revised' ? 'Giáo viên chỉnh sửa đề xuất AI' : decision === 'rejected' ? 'Giáo viên không sử dụng đề xuất AI' : 'Giáo viên duyệt đề xuất AI' })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || data.code || 'Không thể xử lý đề xuất AI');
      await refreshAcademicData();
      addToast({ type: 'success', title: decision === 'revised' ? 'Đã lưu bổ sung của giáo viên' : 'Đã cập nhật trạng thái góp ý AI', message: decision === 'revised' ? 'Học sinh sẽ thấy phần phản hồi bổ sung của giáo viên cùng góp ý AI ban đầu.' : 'Góp ý AI vẫn được giữ trong lịch sử phiên bản; bạn có thể nhận xét trực tiếp khi cần.' });
    } catch (error: unknown) {
      addToast({ type: 'error', title: 'Không thể xử lý đề xuất AI', message: error instanceof Error ? error.message : 'Vui lòng thử lại.' });
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
    <div className="min-h-[calc(100vh-4rem)] bg-white">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-3 py-2.5 backdrop-blur sm:px-4">
        <div className="mx-auto flex max-w-[100rem] flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Button size="sm" variant="ghost" onClick={() => onNavigate('teacher-dashboard')} leftIcon={<ArrowLeftIcon className="h-4 w-4" />}>Quay lại</Button>
            <div className="min-w-0">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <strong className="truncate text-sm text-slate-950">{currentPortfolio.studentName}</strong>
                <Badge size="sm" variant="outline">{currentPortfolio.className || '—'}</Badge>
                <Badge size="sm" variant="primary">{selectedSnapshot.versionNumber}</Badge>
              </div>
              <div className="mt-0.5 truncate text-xs text-slate-500">{assignment.title}{literatureText ? ` · ${literatureText.title}` : ''}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" disabled={currentIndex === 0} onClick={() => changeStudent(-1)} leftIcon={<ChevronLeftIcon className="h-4 w-4" />}>Trước</Button>
            <span className="min-w-12 text-center text-xs font-semibold text-slate-500">{currentIndex + 1}/{queue.length}</span>
            <Button size="sm" variant="outline" disabled={currentIndex >= queue.length - 1} onClick={() => changeStudent(1)} rightIcon={<ChevronRightIcon className="h-4 w-4" />}>Sau</Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-[100rem] grid-cols-1 lg:grid-cols-[230px_minmax(0,1fr)_360px]">
        <aside className="space-y-4 border-b border-slate-200 bg-slate-50/65 p-3 lg:border-b-0 lg:border-r lg:p-4">
          <label className="block space-y-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
            <span>Phiên bản chấm</span>
            <select value={selectedVersion} onChange={event => setSelectedVersion(event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium normal-case tracking-normal text-slate-800 outline-none focus:border-primary-600 focus:ring-3 focus:ring-primary-600/10">
              {currentPortfolio.versions.map(version => <option key={version.id} value={version.versionNumber}>{version.versionNumber} · {version.stage === 'prediction' ? 'Dự đoán' : version.stage === 'initial' ? 'Bản đầu' : 'Bản chỉnh sửa'}</option>)}
            </select>
          </label>
          <div className="border-t border-slate-200 pt-3">
            <div className="mb-2 flex items-center justify-between px-1"><span className="text-xs font-bold uppercase tracking-wide text-slate-500">Học sinh</span><Badge size="sm" variant="outline">{queue.length}</Badge></div>
            <div className="max-h-[62vh] space-y-1 overflow-y-auto">
              {queue.map((item, index) => {
                const active = index === currentIndex;
                return <button key={item.id} type="button" onClick={() => setCurrentIndex(index)} aria-current={active ? 'true' : undefined} className={`w-full rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${active ? 'border-primary-200 bg-primary-50 font-semibold text-primary-950' : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-white hover:text-slate-900'}`}><div className="truncate">{item.studentName}</div><div className={`mt-0.5 text-xs ${active ? 'text-primary-700' : 'text-slate-400'}`}>{item.className || '—'} · {item.versions[item.versions.length - 1]?.versionNumber}</div></button>;
              })}
            </div>
          </div>
        </aside>

        <main className="min-w-0 space-y-5 p-4 sm:p-6 lg:p-7">
          <div className="flex gap-1 overflow-x-auto border-b border-slate-200" role="tablist" aria-label="Trục thi pháp">
            {POETIC_AXES.map(axis => <button key={axis.id} type="button" role="tab" aria-selected={activeAxisId === axis.id} onClick={() => setActiveAxisId(axis.id)} className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium ${activeAxisId === axis.id ? 'border-primary-700 text-primary-900' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>{axis.shortName}</button>)}
          </div>

          {pendingAiProposal && evaluatorRole === 'teacher' && <section className="space-y-3 rounded-xl border border-sky-200 bg-sky-50/65 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2"><div><div className="text-xs font-bold uppercase tracking-wide text-sky-700">Lịch sử AI</div><h3 className="mt-1 text-sm font-bold text-slate-900">Góp ý AI đã gửi học sinh</h3></div><Badge variant="blue">Chờ giáo viên xem</Badge></div>
            {isEditingAiProposal ? <textarea rows={5} value={editedAiText} onChange={event => setEditedAiText(event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm leading-6 outline-none focus:border-primary-600 focus:ring-3 focus:ring-primary-600/10" /> : <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">{pendingAiProposal.response}</p>}
            <p className="text-xs leading-5 text-slate-500">Học sinh đã thấy góp ý này. Giáo viên có thể lưu một phần bổ sung riêng mà không ghi đè lịch sử AI.</p>
            <div className="flex flex-wrap gap-2"><Button size="sm" variant="primary" isLoading={isSubmittingAiReview} onClick={() => handleTeacherAiDecision(isEditingAiProposal ? 'revised' : 'approved')}>{isEditingAiProposal ? 'Gửi bổ sung của giáo viên' : 'Đã xem góp ý AI'}</Button>{!isEditingAiProposal && <Button size="sm" variant="outline" onClick={() => setIsEditingAiProposal(true)}>Chỉnh sửa và bổ sung</Button>}{isEditingAiProposal && <Button size="sm" variant="ghost" onClick={() => { setEditedAiText(pendingAiProposal.response || ''); setIsEditingAiProposal(false); }}>Hủy sửa</Button>}<Button size="sm" variant="ghost" isLoading={isSubmittingAiReview} onClick={() => handleTeacherAiDecision('rejected')}>Đánh dấu không sử dụng</Button></div>
          </section>}

          <section className="v3-readable space-y-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-200 pb-3"><div><div className="v3-kicker">Phiên bản bất biến</div><h2 className="mt-1 text-lg font-bold tracking-tight text-slate-950">{POETIC_AXES.find(axis => axis.id === activeAxisId)?.title}</h2></div><Badge variant="outline">{selectedSnapshot.versionNumber}</Badge></div>
            <div onMouseUp={captureSelection} className="min-h-64 select-text whitespace-pre-wrap rounded-xl border border-slate-200 bg-white p-4 text-[15px] leading-8 text-slate-800 sm:p-5">{activeResponse?.analysisText?.trim() || <span className="italic text-slate-400">Không có nội dung ở trục này.</span>}</div>
            {activeResponse?.evidenceQuotes?.length ? <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/55 p-4"><div className="text-xs font-bold uppercase tracking-wide text-slate-500">Dẫn chứng</div>{activeResponse.evidenceQuotes.map(item => <blockquote key={item.id} className="border-l-2 border-primary-300 pl-3 text-sm italic leading-6 text-slate-600">{item.text}</blockquote>)}</div> : null}
          </section>

          {currentFeedbacks.length > 0 && <section className="v3-readable space-y-3 border-t border-slate-200 pt-5"><div className="flex items-center justify-between"><h3 className="text-sm font-bold text-slate-800">Phản hồi đã lưu</h3><Badge size="sm" variant="outline">{currentFeedbacks.length}</Badge></div><div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">{currentFeedbacks.map(item => <div key={item.id} className="space-y-1.5 p-3.5 text-sm"><div className="font-semibold text-slate-700">{item.authorName}</div>{item.selectedSnippet && <div className="border-l-2 border-slate-300 pl-2 italic text-slate-500">“{item.selectedSnippet}”</div>}<p className="leading-6 text-slate-800">{item.comment}</p></div>)}</div></section>}
        </main>

        <aside className="space-y-5 border-t border-slate-200 bg-slate-50/55 p-4 lg:border-l lg:border-t-0 lg:p-5">
          <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
            <div><h2 className="text-sm font-bold text-slate-900">Nhận xét trực tiếp</h2><p className="mt-0.5 text-xs leading-5 text-slate-500">Bôi đen một đoạn trong bài để gắn nhận xét vào đúng dẫn chứng.</p></div>
            {selectedText && <div className="rounded-lg border-l-2 border-primary-400 bg-primary-50 p-2.5 text-xs italic leading-5 text-slate-700">“{selectedText}”</div>}
            <textarea rows={5} value={feedbackText} onChange={event => setFeedbackText(event.target.value)} placeholder="Nhập nhận xét cụ thể..." className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm leading-6 outline-none focus:border-primary-600 focus:ring-3 focus:ring-primary-600/10" />
            <Button className="w-full" size="sm" variant="primary" isLoading={isSubmittingFeedback} onClick={createFeedback}>Gửi nhận xét</Button>
          </section>

          <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3"><div><h2 className="text-sm font-bold text-slate-900">{activeRubric.title || 'Rubric'}</h2><p className="mt-0.5 text-xs text-slate-500">Chọn đủ mức trước khi lưu.</p></div><div className="rounded-lg bg-slate-900 px-2.5 py-1.5 text-sm font-bold text-white">{totalScore}/{maxScore}</div></div>
            {!activeRubric.criteria.length ? <p className="text-sm text-slate-500">Nhiệm vụ chưa có rubric hợp lệ.</p> : <div className="space-y-1">{activeRubric.criteria.map(criterion => <div key={criterion.id} className="space-y-2 border-b border-slate-100 py-2.5 last:border-0"><span className="block text-xs font-semibold leading-5 text-slate-700">{criterion.title}</span><div className="flex flex-wrap gap-1.5">{criterion.levels.map(level => <button key={level.level} type="button" title={`${criterion.title}: mức ${level.level}`} onClick={() => setRubricScores(previous => ({ ...previous, [criterion.id]: level.level }))} className={`flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 text-xs font-bold ${rubricScores[criterion.id] === level.level ? 'border-primary-700 bg-primary-700 text-white' : 'border-slate-300 bg-white text-slate-600 hover:border-primary-300 hover:bg-primary-50'}`}>{level.level}</button>)}</div></div>)}</div>}
            <textarea rows={4} value={overallFeedback} onChange={event => setOverallFeedback(event.target.value)} placeholder="Nhận xét tổng thể..." className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm leading-6 outline-none focus:border-primary-600 focus:ring-3 focus:ring-primary-600/10" />
            <Button className="w-full" size="sm" variant="outline" disabled={!activeRubric.criteria.length} isLoading={isSubmittingRubric} onClick={saveRubric}>Lưu điểm rubric</Button>
          </section>

          {literatureText && <div className="border-t border-slate-200 pt-3 text-xs leading-5 text-slate-500">Ngữ liệu: <strong className="font-semibold text-slate-700">{literatureText.title}</strong> · {literatureText.author}</div>}
        </aside>
      </div>
    </div>
  );
};