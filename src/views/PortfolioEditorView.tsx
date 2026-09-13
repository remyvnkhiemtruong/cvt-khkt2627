import React, { useMemo, useState } from 'react';
import { useAuthStore } from '../app/store/useAuthStore';
import { usePortfolioStore } from '../app/store/usePortfolioStore';
import { useNotificationStore } from '../app/store/useNotificationStore';
import { usePortfolio } from '../contexts/PortfolioContext';
import { POETIC_AXES } from '../data/seedData';
import type { EvidenceQuote, PoeticAxisId } from '../types';
import { Badge, Button } from '../components/ui';
import { CreateVersionModal } from '../components/versioning/CreateVersionModal';
import { ArrowLeftIcon, CheckCircleIcon, CloudArrowUpIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

interface PortfolioEditorViewProps {
  assignmentId: string;
  onNavigate: (view: string, extraParams?: any) => void;
}

const nextSubmissionVersion = (versions: { stage?: string; versionNumber: string }[]) => {
  const submitted = versions.filter(item => item.stage !== 'prediction');
  return `V${submitted.length + 1}`;
};

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

const emptyReflection = {
  changedUnderstanding: '',
  mostUsefulFeedback: '',
  incompleteInV1: '',
  improvedInV2: '',
  transferToNextReading: ''
};

export const PortfolioEditorView: React.FC<PortfolioEditorViewProps> = ({ assignmentId, onNavigate }) => {
  const currentUser = useAuthStore(state => state.currentUser);
  const {
    assignments,
    literatureTexts,
    feedbacks,
    portfolios,
    reflections,
    saveReflection,
    isLoading,
    dataError,
    refreshAcademicData
  } = usePortfolio();
  const { updateDraft, manualSaveDraft, createSnapshot, autosaveStatus, lastSavedTime } = usePortfolioStore();
  const { addToast } = useNotificationStore();
  const [activeAxisId, setActiveAxisId] = useState<PoeticAxisId>('plot_situation');
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isPredictionMode, setIsPredictionMode] = useState(false);
  const [fontSizeLevel, setFontSizeLevel] = useState<'sm' | 'base' | 'lg'>('base');
  const [reflectionForm, setReflectionForm] = useState(emptyReflection);
  const [isSavingReflection, setIsSavingReflection] = useState(false);

  const editorFontSizeClass = {
    sm: 'text-sm leading-6',
    base: 'text-[15px] leading-7',
    lg: 'text-base leading-8'
  }[fontSizeLevel];

  const assignment = assignments.find(item => item.id === assignmentId);
  const portfolioKey = assignment && currentUser.id ? `port-${currentUser.id}-${assignment.id}` : '';
  const portfolio = portfolioKey ? portfolios[portfolioKey] : undefined;
  const literatureText = assignment ? literatureTexts.find(item => item.id === assignment.textId) : undefined;

  const currentAxis = portfolio?.currentDraft?.[activeAxisId];
  const axisFeedbacks = useMemo(
    () => assignment ? feedbacks.filter(item => item.assignmentId === assignment.id && item.studentId === currentUser.id && item.axisId === activeAxisId) : [],
    [assignment, feedbacks, currentUser.id, activeAxisId]
  );
  const allStudentFeedbacks = useMemo(
    () => assignment ? feedbacks.filter(item => item.assignmentId === assignment.id && item.studentId === currentUser.id) : [],
    [assignment, feedbacks, currentUser.id]
  );
  const wordCount = useMemo(() => {
    if (!portfolio) return 0;
    return Object.values(portfolio.currentDraft || {}).reduce((sum, response) => {
      const words = String(response?.analysisText || '').trim().split(/\s+/).filter(Boolean).length;
      return sum + words;
    }, 0);
  }, [portfolio]);

  if (isLoading && !assignment) return <StatePanel loading title="Đang mở bài viết" message="Đang tải dữ liệu hồ sơ và bài làm từ máy chủ..." />;
  if (dataError && !assignment) return <StatePanel title="Không thể tải dữ liệu" message={dataError} actionLabel="Thử lại" onAction={() => void refreshAcademicData()} />;
  if (!currentUser.id) return <StatePanel title="Phiên đăng nhập hết hạn" message="Vui lòng đăng nhập lại để tiếp tục viết bài." actionLabel="Đăng nhập" onAction={() => onNavigate('dashboard')} />;
  if (!assignment) return <StatePanel title="Không tìm thấy nhiệm vụ" message="Nhiệm vụ này không tồn tại hoặc bạn chưa được phân công." actionLabel="Xem danh sách nhiệm vụ" onAction={() => onNavigate('assignment-list')} />;
  if (!portfolio) return <StatePanel title="Chưa có hồ sơ cho nhiệm vụ này" message="Hồ sơ học tập của bạn đang được tạo. Hãy tải lại dữ liệu." actionLabel="Tải lại dữ liệu" onAction={() => void refreshAcademicData()} />;

  const evidenceText = (currentAxis?.evidenceQuotes || []).map(item => item.text).join('\n');
  const versions = portfolio.versions || [];
  const submittedVersions = versions.filter(item => item.stage !== 'prediction');
  const predictionVersion = versions.find(item => item.stage === 'prediction');
  const isInitial = submittedVersions.length === 0;
  const predictionAvailable = !predictionVersion && isInitial && assignment.workflowConfig?.predictionEnabled !== false;
  const nextVersion = isPredictionMode ? 'V0' : nextSubmissionVersion(versions);
  const latestRevision = [...versions].reverse().find(item => item.stage === 'revision');
  const latestReflection = latestRevision
    ? reflections.find(item => item.assignmentId === assignment.id && item.studentId === currentUser.id && item.versionId === latestRevision.id)
    : undefined;
  const currentAxisMeta = POETIC_AXES.find(axis => axis.id === activeAxisId) || POETIC_AXES[0];
  const completedAxes = POETIC_AXES.filter(axis => Boolean(portfolio.currentDraft?.[axis.id]?.analysisText?.trim())).length;

  const updateAnalysis = (text: string) => updateDraft(currentUser.id, assignment.id, activeAxisId, text, currentAxis?.evidenceQuotes || []);
  const updateEvidence = (text: string) => {
    const quotes: EvidenceQuote[] = text.split('\n').map(line => line.trim()).filter(Boolean).map((line, index) => ({ id: `${activeAxisId}-${index + 1}`, text: line }));
    updateDraft(currentUser.id, assignment.id, activeAxisId, currentAxis?.analysisText || '', quotes);
  };
  const saveNow = async () => {
    try {
      await manualSaveDraft(currentUser.id, assignment.id);
      addToast({ type: 'success', title: 'Đã lưu', message: 'Bản nháp đã được lưu thành công.' });
    } catch {
      addToast({ type: 'error', title: 'Chưa lưu được', message: 'Kiểm tra kết nối và thử lại.' });
    }
  };

  const handleConfirmSubmit = async (data: {
    changeSummary: string;
    revisionReason: string;
    linkedFeedbackIds: string[];
    changeSource: string;
    confidence: number;
    stage?: 'prediction' | 'initial' | 'revision';
  }) => {
    const ok = await createSnapshot(currentUser.id, assignment.id, nextVersion, data.changeSummary, currentUser.name, {
      submissionKey: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : undefined,
      stage: data.stage,
      confidence: data.confidence,
      changeSource: data.changeSource,
      revisionReason: data.revisionReason,
      linkedFeedbackIds: data.linkedFeedbackIds
    });
    if (!ok) throw new Error('CREATE_VERSION_FAILED');
    await refreshAcademicData();
    addToast({ type: 'success', title: `Đã nộp ${nextVersion}`, message: isPredictionMode ? 'V0 đã được khóa làm mốc dự đoán trước đọc.' : 'Bài viết đã được gửi vào hàng đợi phản hồi AI.' });
  };

  const submitReflection = async () => {
    if (!latestRevision) return;
    if (Object.values(reflectionForm).some(value => !value.trim())) {
      addToast({ type: 'warning', title: 'Chưa hoàn tất tự phản tư', message: 'Hãy trả lời đủ 5 câu trước khi gửi REF1.' });
      return;
    }
    setIsSavingReflection(true);
    try {
      await saveReflection(assignment.id, latestRevision.id, reflectionForm);
      setReflectionForm(emptyReflection);
      addToast({ type: 'success', title: 'Đã lưu REF1', message: 'Tự phản tư đã gắn với đúng phiên bản chỉnh sửa và sẵn sàng cho giáo viên chấm Rubric.' });
    } catch (error: unknown) {
      addToast({ type: 'error', title: 'Không thể lưu tự phản tư', message: error instanceof Error ? error.message : 'Vui lòng thử lại.' });
    } finally {
      setIsSavingReflection(false);
    }
  };

  const saveStatus = autosaveStatus === 'saving'
    ? { text: 'Đang lưu…', className: 'v3-save-busy', icon: <CloudArrowUpIcon className="h-4 w-4" /> }
    : autosaveStatus === 'dirty'
      ? { text: 'Có thay đổi chưa lưu', className: 'v3-save-dirty', icon: <ExclamationCircleIcon className="h-4 w-4" /> }
      : { text: `Đã lưu ${lastSavedTime || 'gần đây'}`, className: 'v3-save-ok', icon: <CheckCircleIcon className="h-4 w-4" /> };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col bg-white">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-3 py-2.5 backdrop-blur sm:px-4">
        <div className="mx-auto flex max-w-[100rem] flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <Button size="sm" variant="ghost" onClick={() => onNavigate('assignment-list')} leftIcon={<ArrowLeftIcon className="h-4 w-4" />}>Quay lại</Button>
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-2">
                <span className="truncate text-sm font-bold text-slate-900">{assignment.title}</span>
                <Badge size="sm" variant="outline">{portfolio.currentActiveVersion || 'Nháp'}</Badge>
              </div>
              <div className="mt-0.5 truncate text-xs text-slate-500">{literatureText ? `${literatureText.title} — ${literatureText.author}` : 'Ngữ liệu'} · {completedAxes}/{POETIC_AXES.length} trục đã có nội dung</div>
            </div>
          </div>
          <div className="flex flex-1 flex-wrap items-center justify-end gap-2 text-xs sm:flex-none">
            <span className={`inline-flex items-center gap-1.5 font-semibold ${saveStatus.className}`} aria-live="polite">{saveStatus.icon}{saveStatus.text}</span>
            <Button size="sm" variant="outline" onClick={saveNow}>Lưu nháp</Button>
            {predictionAvailable && <Button size="sm" variant="ghost" onClick={() => { setIsPredictionMode(true); setIsSubmitModalOpen(true); }}>Nộp V0</Button>}
            <Button size="sm" variant="primary" onClick={() => { setIsPredictionMode(false); setIsSubmitModalOpen(true); }}>{isInitial ? 'Nộp bài V1' : `Nộp ${nextSubmissionVersion(versions)}`}</Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-[100rem] flex-1 grid-cols-1 lg:grid-cols-[230px_minmax(0,1fr)_330px]">
        <aside className="border-b border-slate-200 bg-slate-50/65 p-3 lg:border-b-0 lg:border-r">
          <div className="mb-2 flex items-center justify-between px-2">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Trục phân tích</span>
            <span className="text-xs font-semibold text-primary-700">{completedAxes}/{POETIC_AXES.length}</span>
          </div>
          <nav className="flex gap-1.5 overflow-x-auto pb-1 lg:flex-col lg:overflow-x-visible lg:pb-0" aria-label="Trục phân tích">
            {POETIC_AXES.map(axis => {
              const response = portfolio.currentDraft?.[axis.id];
              const done = Boolean(response?.analysisText?.trim());
              const active = activeAxisId === axis.id;
              return (
                <button
                  key={axis.id}
                  type="button"
                  onClick={() => setActiveAxisId(axis.id)}
                  aria-current={active ? 'step' : undefined}
                  className={`flex shrink-0 items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors lg:w-full ${active ? 'border-primary-200 bg-primary-50 font-semibold text-primary-950' : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-white hover:text-slate-900'}`}
                >
                  <span className="truncate">{axis.shortName}</span>
                  <span className={`shrink-0 text-xs font-bold ${done ? 'text-emerald-700' : 'text-slate-300'}`} aria-label={done ? 'Đã có nội dung' : 'Chưa có nội dung'}>{done ? '✓' : '○'}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 space-y-6 p-4 sm:p-6 lg:p-7">
          {dataError && <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">Dữ liệu hiển thị có thể chưa mới nhất: {dataError}</div>}
          {predictionAvailable && <div className="rounded-lg border border-sky-200 bg-sky-50 p-3.5 text-sm leading-6 text-sky-900"><strong>Bước đầu tiên: V0 – Dự đoán trước đọc.</strong> Hoàn thành dự đoán, nêu căn cứ và mức tự tin trước khi nộp V1. V0 sẽ được khóa sau khi nộp.</div>}

          <section className="v3-editor-readable">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 pb-3">
              <div className="min-w-0">
                <div className="v3-kicker">Đang viết</div>
                <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-950">{currentAxisMeta.title}</h1>
                <p className="mt-1 text-xs leading-5 text-slate-500">{currentAxisMeta.description}</p>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="font-semibold text-slate-700">{wordCount} từ</span>
                <div className="flex items-center gap-1" aria-label="Cỡ chữ editor">
                  {(['sm', 'base', 'lg'] as const).map(lvl => <button key={lvl} type="button" onClick={() => setFontSizeLevel(lvl)} className={`rounded-md px-2 py-1 text-xs ${fontSizeLevel === lvl ? 'bg-slate-900 font-semibold text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}>{lvl === 'sm' ? 'Nhỏ' : lvl === 'base' ? 'Vừa' : 'Lớn'}</button>)}
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-5">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">Nội dung phân tích</label>
                <textarea
                  value={currentAxis?.analysisText || ''}
                  onChange={e => updateAnalysis(e.target.value)}
                  rows={16}
                  placeholder="Viết luận điểm, phân tích chi tiết nghệ thuật, lí giải ý nghĩa..."
                  className={`w-full resize-y rounded-xl border border-slate-300 bg-white p-4 font-sans text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.02)] outline-none focus:border-primary-600 focus:ring-3 focus:ring-primary-600/10 ${editorFontSizeClass}`}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">Dẫn chứng trích dẫn <span className="font-normal text-slate-400">· mỗi dòng một dẫn chứng</span></label>
                <textarea
                  value={evidenceText}
                  onChange={e => updateEvidence(e.target.value)}
                  rows={4}
                  placeholder="Nhập các câu văn hoặc chi tiết nghệ thuật trích từ tác phẩm..."
                  className="w-full resize-y rounded-xl border border-slate-300 bg-slate-50/50 p-3 text-sm leading-6 text-slate-800 outline-none focus:border-primary-600 focus:bg-white focus:ring-3 focus:ring-primary-600/10"
                />
              </div>
            </div>
          </section>

          {versions.length > 0 && <section className="v3-editor-readable space-y-3 border-t border-slate-200 pt-5">
            <div className="flex items-center justify-between gap-3">
              <div><h2 className="text-sm font-bold text-slate-800">Lịch sử phiên bản bất biến</h2><p className="mt-0.5 text-xs text-slate-500">Mỗi lần nộp tạo một mốc mới, không ghi đè bản cũ.</p></div>
              {versions.length >= 2 && <Button size="sm" variant="ghost" onClick={() => onNavigate('version-diff', { assignmentId: assignment.id })}>So sánh phiên bản</Button>}
            </div>
            <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
              {versions.map(ver => <div key={ver.id} className="flex flex-col gap-2 p-3 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><span className="font-bold text-slate-900">{ver.versionNumber}</span><span className="ml-2 text-slate-500">{new Date(ver.createdAt).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span><span className="ml-2 text-slate-400">· {ver.stage === 'prediction' ? 'Dự đoán' : ver.stage === 'initial' ? 'Bản đầu' : 'Bản chỉnh sửa'}</span>{ver.revisionReason && <span className="ml-2 italic text-slate-600">· {ver.revisionReason}</span>}</div>{versions.length >= 2 && <button type="button" onClick={() => onNavigate('version-diff', { assignmentId: assignment.id, v1Number: versions[0].versionNumber, v2Number: ver.versionNumber })} className="shrink-0 font-semibold text-primary-700 hover:text-primary-900">So sánh</button>}</div>)}
            </div>
          </section>}

          {latestRevision && <section className="v3-editor-readable space-y-3 rounded-xl border border-slate-200 bg-slate-50/55 p-4 sm:p-5">
            <div><div className="v3-kicker">Tự phản tư</div><h2 className="mt-1 text-base font-bold text-slate-900">REF1 – Sau {latestRevision.versionNumber}</h2><p className="mt-1 text-xs leading-5 text-slate-500">Lưu dấu vết em đã thay đổi cách đọc như thế nào trước khi giáo viên chấm Rubric chính thức.</p></div>
            {latestReflection ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs leading-5 text-emerald-900"><strong>Đã nộp REF1.</strong> Giáo viên có thể xem tự phản tư này và chấm Rubric chính thức cho {latestRevision.versionNumber}.</div> : <div className="space-y-3">
              {[
                ['changedUnderstanding', '1. Điều quan trọng nhất em đã thay đổi trong cách hiểu tác phẩm sau phản hồi là gì?'],
                ['mostUsefulFeedback', '2. Phản hồi nào khiến em thay đổi cách đọc nhiều nhất?'],
                ['incompleteInV1', '3. Ở V1, em đã hiểu chưa đầy đủ điều gì?'],
                ['improvedInV2', `4. Ở ${latestRevision.versionNumber}, em đã bổ sung hoặc thay đổi điều gì?`],
                ['transferToNextReading', '5. Nếu đọc một tác phẩm khác, em sẽ vận dụng cách đọc nào từ nhiệm vụ này?']
              ].map(([key, label]) => <div key={key}><label className="mb-1.5 block text-xs font-semibold text-slate-700">{label}</label><textarea rows={2} value={reflectionForm[key as keyof typeof reflectionForm]} onChange={e => setReflectionForm(previous => ({ ...previous, [key]: e.target.value }))} className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm outline-none focus:border-primary-600 focus:ring-3 focus:ring-primary-600/10" /></div>)}
              <Button size="sm" variant="primary" isLoading={isSavingReflection} onClick={submitReflection}>Nộp REF1 – Tự phản tư</Button>
            </div>}
          </section>}
        </main>

        <aside className="space-y-5 border-t border-slate-200 bg-slate-50/55 p-4 lg:border-l lg:border-t-0 lg:p-5">
          <section className="space-y-2">
            <div className="flex items-center justify-between gap-2"><h2 className="text-xs font-bold uppercase tracking-wide text-slate-600">Yêu cầu nhiệm vụ</h2><Badge size="sm" variant="outline">{assignment.difficulty}</Badge></div>
            <p className="rounded-xl border border-slate-200 bg-white p-3 text-xs leading-6 text-slate-700">{assignment.prompt || 'Chưa có yêu cầu chi tiết.'}</p>
            {assignment.guidingSteps && assignment.guidingSteps.length > 0 && <ol className="list-decimal space-y-1.5 pl-4 text-xs leading-5 text-slate-500">{assignment.guidingSteps.map((step, idx) => <li key={`${idx}-${step}`}>{step}</li>)}</ol>}
          </section>
          <section className="space-y-2 border-t border-slate-200 pt-4">
            <div className="flex items-center justify-between gap-2"><h2 className="text-xs font-bold uppercase tracking-wide text-slate-600">Phản hồi theo trục</h2>{axisFeedbacks.length > 0 && <Badge size="sm" variant="amber">{axisFeedbacks.length}</Badge>}</div>
            {axisFeedbacks.length === 0 ? <p className="py-3 text-xs text-slate-500">Chưa có phản hồi cho trục này.</p> : <div className="space-y-2">{axisFeedbacks.map(item => <div key={item.id} className="space-y-1.5 rounded-xl border border-slate-200 bg-white p-3 text-xs"><div className="flex items-center justify-between gap-2 font-semibold text-slate-700"><span className="truncate">{item.authorName || (item.authorRole === 'teacher' ? 'Giáo viên' : item.authorRole === 'ai' ? 'AI' : 'Bạn học')}</span><span className={item.resolved ? 'text-emerald-700' : 'text-amber-700'}>{item.resolved ? 'Đã xử lý' : 'Cần xem lại'}</span></div>{item.selectedSnippet && <div className="border-l-2 border-slate-300 pl-2 italic text-slate-500">{item.selectedSnippet}</div>}<p className="leading-5 text-slate-700">{item.comment}</p></div>)}</div>}
          </section>
        </aside>
      </div>

      {isSubmitModalOpen && <CreateVersionModal isOpen={isSubmitModalOpen} onClose={() => setIsSubmitModalOpen(false)} nextVersionNumber={nextVersion} isInitial={isInitial && !isPredictionMode} isPrediction={isPredictionMode} feedbacks={allStudentFeedbacks} onConfirm={handleConfirmSubmit} />}
    </div>
  );
};