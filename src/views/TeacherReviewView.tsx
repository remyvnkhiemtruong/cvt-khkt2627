import React, { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '../app/store/useAuthStore';
import { useNotificationStore } from '../app/store/useNotificationStore';
import { usePortfolio } from '../contexts/PortfolioContext';
import { POETIC_AXES } from '../data/seedData';
import type { PoeticAxisId, RubricMatrix } from '../types';
import { Button } from '../components/ui';
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
    {loading && <div className="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-800" />}
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
  }, [currentPortfolio?.id, assignment?.id, selectedVersion, selectedSnapshot?.id, evaluatorRole, activeRubric.id, activeRubric.criteria, rubricSubmissions]);

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
      const finalResponse = decision === 'approved'
        ? pendingAiProposal.response
        : decision === 'revised'
          ? editedAiText.trim()
          : '';
      const response = await fetch('/api/academic/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'teacher_review_ai', reviewId: pendingAiProposal.id, decision, finalResponse, axisId: activeAxisId, teacherNote: decision === 'revised' ? 'Giáo viên chỉnh sửa đề xuất AI' : decision === 'rejected' ? 'Giáo viên không sử dụng đề xuất AI' : 'Giáo viên duyệt đề xuất AI' })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || data.code || 'Không thể xử lý đề xuất AI');
      await refreshAcademicData();
      addToast({ type: 'success', title: decision === 'rejected' ? 'Đã bỏ qua đề xuất AI' : 'Đã duyệt phản hồi', message: decision === 'rejected' ? 'Hồ sơ đang chờ nhận xét riêng của giáo viên.' : 'Phản hồi chính thức đã được lưu với vai trò giáo viên.' });
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
    <div className="min-h-[calc(100vh-3.5rem)] bg-white">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white px-4 py-2.5"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><Button size="sm" variant="ghost" onClick={() => onNavigate('teacher-dashboard')} leftIcon={<ArrowLeftIcon className="h-4 w-4" />}>Quay lại</Button><div className="text-sm"><strong className="text-slate-900">{currentPortfolio.studentName}</strong><span className="text-slate-500"> · {currentPortfolio.className || '—'} · {assignment.title}</span></div></div><div className="flex items-center gap-2"><Button size="sm" variant="outline" disabled={currentIndex === 0} onClick={() => changeStudent(-1)} leftIcon={<ChevronLeftIcon className="h-4 w-4" />}>Trước</Button><span className="text-sm text-slate-500">{currentIndex + 1}/{queue.length}</span><Button size="sm" variant="outline" disabled={currentIndex >= queue.length - 1} onClick={() => changeStudent(1)}>Sau <ChevronRightIcon className="ml-1 h-4 w-4" /></Button></div></div></header>

      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)_340px]">
        <aside className="space-y-3 border-b border-slate-200 bg-slate-50/50 p-3 lg:border-b-0 lg:border-r"><label className="block text-sm font-medium text-slate-600">Phiên bản chấm</label><select value={selectedVersion} onChange={event => setSelectedVersion(event.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-slate-500">{currentPortfolio.versions.map(version => <option key={version.id} value={version.versionNumber}>{version.versionNumber} · {version.stage === 'prediction' ? 'Dự đoán' : version.stage === 'initial' ? 'Bản đầu' : 'Bản chỉnh sửa'}</option>)}</select><div className="border-t border-slate-200 pt-3"><div className="mb-1 text-sm font-medium text-slate-600">Học sinh</div><div className="max-h-[60vh] divide-y divide-slate-100 overflow-y-auto">{queue.map((item, index) => <button key={item.id} type="button" onClick={() => setCurrentIndex(index)} className={`w-full px-2 py-2 text-left text-sm ${index === currentIndex ? 'bg-white font-medium text-slate-900' : 'text-slate-600 hover:bg-slate-100'}`}><div>{item.studentName}</div><div className="text-sm text-slate-400">{item.versions[item.versions.length - 1]?.versionNumber}</div></button>)}</div></div></aside>

        <main className="space-y-5 p-4 sm:p-6"><div className="flex gap-1 overflow-x-auto border-b border-slate-200">{POETIC_AXES.map(axis => <button key={axis.id} type="button" onClick={() => setActiveAxisId(axis.id)} className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm ${activeAxisId === axis.id ? 'border-slate-900 font-medium text-slate-900' : 'border-transparent text-slate-500'}`}>{axis.shortName}</button>)}</div>
          {pendingAiProposal && evaluatorRole === 'teacher' && <section className="space-y-3 rounded-md border border-slate-300 bg-slate-50 p-3"><div className="flex items-center justify-between"><h3 className="text-sm font-semibold text-slate-800">Đề xuất AI</h3><span className="text-sm text-slate-500">Chờ duyệt</span></div>{isEditingAiProposal ? <textarea rows={4} value={editedAiText} onChange={event => setEditedAiText(event.target.value)} className="w-full rounded-md border border-slate-300 bg-white p-2 text-sm" /> : <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{pendingAiProposal.response}</p>}<div className="flex flex-wrap gap-2"><Button size="sm" variant="primary" isLoading={isSubmittingAiReview} onClick={() => handleTeacherAiDecision(isEditingAiProposal ? 'revised' : 'approved')}>{isEditingAiProposal ? 'Sửa và gửi' : 'Duyệt và gửi'}</Button>{!isEditingAiProposal && <Button size="sm" variant="outline" onClick={() => setIsEditingAiProposal(true)}>Chỉnh sửa</Button>}{isEditingAiProposal && <Button size="sm" variant="ghost" onClick={() => { setEditedAiText(pendingAiProposal.response || ''); setIsEditingAiProposal(false); }}>Hủy sửa</Button>}<Button size="sm" variant="ghost" isLoading={isSubmittingAiReview} onClick={() => handleTeacherAiDecision('rejected')}>Không dùng AI</Button></div></section>}
          <section className="space-y-3"><div className="flex items-baseline justify-between border-b border-slate-100 pb-2"><h2 className="text-base font-medium text-slate-900">{POETIC_AXES.find(axis => axis.id === activeAxisId)?.title}</h2><span className="text-sm text-slate-500">{selectedSnapshot.versionNumber}</span></div><div onMouseUp={captureSelection} className="min-h-56 select-text whitespace-pre-wrap text-sm leading-7 text-slate-800">{activeResponse?.analysisText?.trim() || <span className="italic text-slate-400">Không có nội dung ở trục này.</span>}</div>{activeResponse?.evidenceQuotes?.length ? <div className="space-y-1 border-t border-slate-100 pt-3"><div className="text-sm font-medium text-slate-600">Dẫn chứng</div>{activeResponse.evidenceQuotes.map(item => <blockquote key={item.id} className="border-l-2 border-slate-300 pl-3 text-sm italic text-slate-600">{item.text}</blockquote>)}</div> : null}</section>
          {currentFeedbacks.length > 0 && <section className="space-y-2 border-t border-slate-200 pt-4"><h3 className="text-sm font-medium text-slate-600">Phản hồi đã lưu cho phiên bản này</h3><div className="divide-y divide-slate-100 rounded-md border border-slate-200">{currentFeedbacks.map(item => <div key={item.id} className="space-y-1 p-3 text-sm"><div className="font-medium text-slate-700">{item.authorName}</div>{item.selectedSnippet && <div className="border-l-2 border-slate-300 pl-2 italic text-slate-500">“{item.selectedSnippet}”</div>}<p className="text-slate-800">{item.comment}</p></div>)}</div></section>}
        </main>

        <aside className="space-y-6 border-t border-slate-200 bg-slate-50/40 p-4 lg:border-l lg:border-t-0"><section className="space-y-2"><h2 className="text-sm font-semibold text-slate-800">Nhận xét trực tiếp</h2>{selectedText && <div className="rounded border-l-2 border-slate-400 bg-white p-2 text-sm italic text-slate-600">“{selectedText}”</div>}<textarea rows={4} value={feedbackText} onChange={event => setFeedbackText(event.target.value)} placeholder="Nhập nhận xét cụ thể..." className="w-full rounded-md border border-slate-300 bg-white p-2 text-sm" /><Button className="w-full" size="sm" variant="primary" isLoading={isSubmittingFeedback} onClick={createFeedback}>Gửi nhận xét</Button></section>
          <section className="space-y-3 border-t border-slate-200 pt-4"><div className="flex items-center justify-between"><h2 className="text-sm font-semibold text-slate-800">{activeRubric.title || 'Rubric'}</h2><span className="text-sm text-slate-600">{totalScore}/{maxScore}</span></div>{!activeRubric.criteria.length ? <p className="text-sm text-slate-500">Nhiệm vụ chưa có rubric hợp lệ.</p> : <div className="space-y-2">{activeRubric.criteria.map(criterion => <div key={criterion.id} className="flex items-center justify-between gap-2 border-b border-slate-100 py-1"><span className="max-w-[160px] truncate text-sm text-slate-700">{criterion.title}</span><div className="flex gap-1">{criterion.levels.map(level => <button key={level.level} type="button" onClick={() => setRubricScores(previous => ({ ...previous, [criterion.id]: level.level }))} className={`h-7 w-7 rounded text-sm ${rubricScores[criterion.id] === level.level ? 'bg-slate-900 text-white' : 'border border-slate-300 bg-white text-slate-600'}`}>{level.level}</button>)}</div></div>)}</div>}<textarea rows={3} value={overallFeedback} onChange={event => setOverallFeedback(event.target.value)} placeholder="Nhận xét tổng thể..." className="w-full rounded-md border border-slate-300 bg-white p-2 text-sm" /><Button className="w-full" size="sm" variant="outline" disabled={!activeRubric.criteria.length} isLoading={isSubmittingRubric} onClick={saveRubric}>Lưu điểm rubric</Button></section>{literatureText && <div className="border-t border-slate-200 pt-3 text-sm text-slate-500">Ngữ liệu: {literatureText.title} · {literatureText.author}</div>}</aside>
      </div>
    </div>
  );
};
