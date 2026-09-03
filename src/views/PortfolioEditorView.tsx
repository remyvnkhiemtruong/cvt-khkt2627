import React, { useMemo, useState } from 'react';
import { useAuthStore } from '../app/store/useAuthStore';
import { usePortfolioStore } from '../app/store/usePortfolioStore';
import { useNotificationStore } from '../app/store/useNotificationStore';
import { usePortfolio } from '../contexts/PortfolioContext';
import { POETIC_AXES } from '../data/seedData';
import type { EvidenceQuote, PoeticAxisId } from '../types';
import { Button } from '../components/ui';
import { CreateVersionModal } from '../components/versioning/CreateVersionModal';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

interface PortfolioEditorViewProps {
  assignmentId: string;
  onNavigate: (view: string, extraParams?: any) => void;
}

const nextVersionNumber = (versions: { versionNumber: string }[]) => {
  if (versions.length === 0) return 'v1.0';
  const max = Math.max(...versions.map(item => Number.parseFloat(item.versionNumber.replace(/^v/i, '')) || 0));
  return `v${Math.floor(max) + 1}.0`;
};

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

export const PortfolioEditorView: React.FC<PortfolioEditorViewProps> = ({ assignmentId, onNavigate }) => {
  const currentUser = useAuthStore(state => state.currentUser);
  const { assignments, literatureTexts, feedbacks, portfolios, isLoading, dataError, refreshAcademicData } = usePortfolio();
  const { updateDraft, manualSaveDraft, createSnapshot, autosaveStatus, lastSavedTime } = usePortfolioStore();
  const { addToast } = useNotificationStore();
  const [activeAxisId, setActiveAxisId] = useState<PoeticAxisId>('plot_situation');
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isPredictionMode, setIsPredictionMode] = useState(false);
  const [fontSizeLevel, setFontSizeLevel] = useState<'sm' | 'base' | 'lg'>('base');

  const editorFontSizeClass = {
    sm: 'text-sm leading-6',
    base: 'text-[15px] leading-7',
    lg: 'text-base leading-8',
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

  if (isLoading && !assignment) {
    return <StatePanel loading title="Đang mở bài viết" message="Đang tải dữ liệu hồ sơ và bài làm từ máy chủ..." />;
  }
  if (dataError && !assignment) {
    return <StatePanel title="Không thể tải dữ liệu" message={dataError} actionLabel="Thử lại" onAction={() => void refreshAcademicData()} />;
  }
  if (!currentUser.id) {
    return <StatePanel title="Phiên đăng nhập hết hạn" message="Vui lòng đăng nhập lại để tiếp tục viết bài." actionLabel="Đăng nhập" onAction={() => onNavigate('dashboard')} />;
  }
  if (!assignment) {
    return <StatePanel title="Không tìm thấy nhiệm vụ" message="Nhiệm vụ này không tồn tại hoặc bạn chưa được phân công." actionLabel="Xem danh sách nhiệm vụ" onAction={() => onNavigate('assignment-list')} />;
  }
  if (!portfolio) {
    return <StatePanel title="Chưa có hồ sơ cho nhiệm vụ này" message="Hồ sơ học tập của bạn đang được tạo. Hãy tải lại dữ liệu." actionLabel="Tải lại dữ liệu" onAction={() => void refreshAcademicData()} />;
  }

  const evidenceText = (currentAxis?.evidenceQuotes || []).map(item => item.text).join('\n');
  const versions = portfolio.versions || [];
  const isInitial = versions.length === 0;
  const nextVersion = isPredictionMode ? 'v0.0' : nextVersionNumber(versions);
  const currentAxisMeta = POETIC_AXES.find(axis => axis.id === activeAxisId) || POETIC_AXES[0];

  const updateAnalysis = (text: string) => {
    updateDraft(currentUser.id, assignment.id, activeAxisId, text, currentAxis?.evidenceQuotes || []);
  };
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
    const ok = await createSnapshot(
      currentUser.id,
      assignment.id,
      nextVersion,
      data.changeSummary,
      currentUser.name,
      {
        submissionKey: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : undefined,
        stage: data.stage,
        confidence: data.confidence,
        changeSource: data.changeSource,
        revisionReason: data.revisionReason,
        linkedFeedbackIds: data.linkedFeedbackIds
      }
    );
    if (!ok) throw new Error('CREATE_VERSION_FAILED');
    await refreshAcademicData();
    addToast({
      type: 'success',
      title: `Đã nộp phiên bản ${nextVersion}`,
      message: 'Bài viết đã được gửi vào hàng đợi phản hồi.'
    });
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-white flex flex-col">
      {/* Top Workspace Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white px-4 py-2.5">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Button size="sm" variant="ghost" onClick={() => onNavigate('assignment-list')} leftIcon={<ArrowLeftIcon className="h-4 w-4" />}>
              Quay lại
            </Button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-semibold text-slate-900">{assignment.title}</span>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs font-medium text-slate-600">{portfolio.currentActiveVersion || 'v1.0 (nháp)'}</span>
              </div>
              <div className="text-xs text-slate-500">
                {literatureText ? `${literatureText.title} — ${literatureText.author}` : 'Ngữ liệu'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>
              {autosaveStatus === 'saving'
                ? 'Đang lưu…'
                : autosaveStatus === 'dirty'
                ? 'Có thay đổi chưa lưu'
                : `Đã lưu ${lastSavedTime || 'gần đây'}`}
            </span>
            <Button size="sm" variant="outline" onClick={saveNow}>Lưu nháp</Button>
            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                setIsPredictionMode(false);
                setIsSubmitModalOpen(true);
              }}
            >
              {isInitial ? 'Nộp bài V1' : `Nộp bản ${nextVersion}`}
            </Button>
            {isInitial && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setIsPredictionMode(true);
                  setIsSubmitModalOpen(true);
                }}
              >
                Nộp V0 (dự đoán)
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* 3-Column Desk Layout */}
      <div className="mx-auto flex-1 w-full max-w-7xl grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)_320px]">
        {/* Left Rail: Poetic Axes Navigation */}
        <aside className="border-b lg:border-b-0 lg:border-r border-slate-200 bg-slate-50/50 p-3">
          <div className="mb-2 px-2 text-xs font-medium text-slate-500">Trục phân tích</div>
          <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-x-visible">
            {POETIC_AXES.map(axis => {
              const response = portfolio.currentDraft?.[axis.id];
              const done = Boolean(response?.analysisText?.trim());
              const active = activeAxisId === axis.id;

              return (
                <button
                  key={axis.id}
                  onClick={() => setActiveAxisId(axis.id)}
                  className={`shrink-0 rounded-md px-2.5 py-2 text-left text-sm transition-colors lg:w-full flex items-center justify-between ${
                    active
                      ? 'bg-white text-slate-900 font-medium shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="truncate">{axis.shortName}</span>
                  <span className={`text-xs ml-1.5 shrink-0 ${done ? 'text-slate-500' : 'text-slate-400'}`}>
                    {done ? '●' : '○'}
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Center: Document Editor */}
        <main className="p-4 sm:p-6 space-y-6">
          {dataError && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-900">
              Dữ liệu hiển thị có thể chưa mới nhất: {dataError}
            </div>
          )}

          <div>
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-200 pb-3">
              <div>
                <h1 className="text-lg font-semibold text-slate-900">{currentAxisMeta.title}</h1>
                <p className="text-xs text-slate-500 mt-0.5">{currentAxisMeta.description}</p>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span>{wordCount} từ toàn bài</span>
                <div className="flex items-center gap-1">
                  <span>Cỡ chữ:</span>
                  {(['sm', 'base', 'lg'] as const).map(lvl => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setFontSizeLevel(lvl)}
                      className={`px-1.5 py-0.5 rounded text-xs ${
                        fontSizeLevel === lvl ? 'bg-slate-200 font-semibold text-slate-900' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {lvl === 'sm' ? 'Nhỏ' : lvl === 'base' ? 'Vừa' : 'Lớn'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Nội dung phân tích
                </label>
                <textarea
                  value={currentAxis?.analysisText || ''}
                  onChange={e => updateAnalysis(e.target.value)}
                  rows={14}
                  placeholder="Viết luận điểm, phân tích chi tiết nghệ thuật, lí giải ý nghĩa..."
                  className={`w-full resize-y rounded-md border border-slate-300 bg-white p-3 font-sans text-slate-900 outline-none focus:border-slate-500 ${editorFontSizeClass}`}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Dẫn chứng trích dẫn (mỗi dòng một dẫn chứng)
                </label>
                <textarea
                  value={evidenceText}
                  onChange={e => updateEvidence(e.target.value)}
                  rows={3}
                  placeholder="Nhập các câu văn hoặc chi tiết nghệ thuật trích từ tác phẩm..."
                  className="w-full resize-y rounded-md border border-slate-300 bg-slate-50/50 p-2.5 text-xs text-slate-800 outline-none focus:border-slate-500"
                />
              </div>
            </div>
          </div>

          {/* Version History Table / List */}
          {versions.length > 0 && (
            <section className="pt-4 border-t border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold text-slate-700">Các phiên bản đã nộp</h2>
                {versions.length >= 2 && (
                  <button
                    type="button"
                    onClick={() => onNavigate('version-diff', { assignmentId: assignment.id })}
                    className="text-xs text-slate-600 underline underline-offset-2 hover:text-slate-900"
                  >
                    So sánh các phiên bản
                  </button>
                )}
              </div>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-md bg-white">
                {versions.map(ver => (
                  <div key={ver.id} className="p-2.5 flex items-center justify-between text-xs text-slate-600">
                    <div>
                      <span className="font-semibold text-slate-900">{ver.versionNumber}</span>
                      <span className="ml-2 text-slate-500">
                        {new Date(ver.createdAt).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {ver.revisionReason && (
                        <span className="ml-2 text-slate-600 italic">· {ver.revisionReason}</span>
                      )}
                    </div>
                    {versions.length >= 2 && (
                      <button
                        type="button"
                        onClick={() => onNavigate('version-diff', {
                          assignmentId: assignment.id,
                          v1Number: versions[0].versionNumber,
                          v2Number: ver.versionNumber
                        })}
                        className="text-slate-500 hover:text-slate-900"
                      >
                        So sánh
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>

        {/* Right Inspector: Assignment prompt & Feedback */}
        <aside className="border-t lg:border-t-0 lg:border-l border-slate-200 bg-slate-50/40 p-4 space-y-5">
          <section className="space-y-2">
            <h2 className="text-xs font-semibold text-slate-800">Yêu cầu nhiệm vụ</h2>
            <p className="text-xs text-slate-600 leading-relaxed bg-white p-3 rounded-md border border-slate-200">
              {assignment.prompt || 'Chưa có yêu cầu chi tiết.'}
            </p>
            {assignment.guidingSteps && assignment.guidingSteps.length > 0 && (
              <ol className="list-decimal pl-4 space-y-1 text-xs text-slate-500 leading-relaxed">
                {assignment.guidingSteps.map((step, idx) => (
                  <li key={`${idx}-${step}`}>{step}</li>
                ))}
              </ol>
            )}
          </section>

          <section className="space-y-2 pt-3 border-t border-slate-200">
            <h2 className="text-xs font-semibold text-slate-800">Phản hồi theo trục này</h2>
            {axisFeedbacks.length === 0 ? (
              <p className="text-xs text-slate-500 py-2">Chưa có phản hồi cho trục này.</p>
            ) : (
              <div className="space-y-2">
                {axisFeedbacks.map(item => (
                  <div key={item.id} className="p-3 bg-white rounded-md border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-700 font-medium">
                      <span>{item.authorName || (item.authorRole === 'teacher' ? 'Giáo viên' : 'Bạn học')}</span>
                      <span className={item.resolved ? 'text-emerald-700' : 'text-amber-700'}>
                        {item.resolved ? 'Đã xử lý' : 'Cần xem lại'}
                      </span>
                    </div>
                    {item.selectedSnippet && (
                      <div className="border-l-2 border-slate-300 pl-2 italic text-slate-500">
                        {item.selectedSnippet}
                      </div>
                    )}
                    <p className="text-slate-700 leading-relaxed">{item.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </aside>
      </div>

      {isSubmitModalOpen && (
        <CreateVersionModal
          isOpen={isSubmitModalOpen}
          onClose={() => setIsSubmitModalOpen(false)}
          nextVersionNumber={nextVersion}
          isInitial={isInitial && !isPredictionMode}
          isPrediction={isPredictionMode}
          feedbacks={allStudentFeedbacks}
          onConfirm={handleConfirmSubmit}
        />
      )}
    </div>
  );
};
