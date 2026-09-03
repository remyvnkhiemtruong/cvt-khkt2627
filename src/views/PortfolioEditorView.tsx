import React, { useMemo, useState } from 'react';
import { useAuthStore } from '../app/store/useAuthStore';
import { usePortfolioStore } from '../app/store/usePortfolioStore';
import { useNotificationStore } from '../app/store/useNotificationStore';
import { usePortfolio } from '../contexts/PortfolioContext';
import { POETIC_AXES } from '../data/seedData';
import type { EvidenceQuote, PoeticAxisId } from '../types';
import { Badge, Button } from '../components/ui';
import {
  ArrowLeftIcon,
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  DocumentDuplicateIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface PortfolioEditorViewProps {
  assignmentId: string;
  onNavigate: (view: string, extraParams?: any) => void;
}

const nextVersionNumber = (versions: { versionNumber: string }[]) => {
  if (versions.length === 0) return 'v1.0';
  const max = Math.max(...versions.map(item => Number.parseFloat(item.versionNumber.replace(/^v/i, '')) || 0));
  return `v${Math.floor(max) + 1}.0`;
};

const StatePanel: React.FC<{title:string;message:string;actionLabel?:string;onAction?:()=>void;loading?:boolean}> = ({title,message,actionLabel,onAction,loading}) => (
  <div className="mx-auto mt-10 max-w-xl rounded-lg border border-slate-200 bg-white p-8 text-center">
    {loading ? <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900"/> : <ExclamationTriangleIcon className="mx-auto mb-4 h-9 w-9 text-slate-400"/>}
    <h2 className="text-lg font-bold text-slate-900">{title}</h2>
    <p className="mt-2 text-sm leading-6 text-slate-500">{message}</p>
    {actionLabel && onAction && <Button className="mt-5" variant="primary" onClick={onAction}>{actionLabel}</Button>}
  </div>
);

export const PortfolioEditorView: React.FC<PortfolioEditorViewProps> = ({ assignmentId, onNavigate }) => {
  const currentUser = useAuthStore(state => state.currentUser);
  const { assignments, literatureTexts, feedbacks, portfolios, isLoading, dataError, refreshAcademicData } = usePortfolio();
  const { updateDraft, manualSaveDraft, createSnapshot, autosaveStatus, lastSavedTime } = usePortfolioStore();
  const { addToast } = useNotificationStore();
  const [activeAxisId, setActiveAxisId] = useState<PoeticAxisId>('plot_situation');
  const [versionNote, setVersionNote] = useState('');
  const [isCreatingVersion, setIsCreatingVersion] = useState(false);
  const [fontSizeLevel, setFontSizeLevel] = useState<'sm' | 'base' | 'lg' | 'xl'>('base');

  const editorFontSizeClass = {
    sm: 'text-sm leading-6',
    base: 'text-[15px] sm:text-base leading-7',
    lg: 'text-base sm:text-lg leading-8',
    xl: 'text-lg sm:text-xl leading-9',
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
  const wordCount = useMemo(() => {
    if (!portfolio) return 0;
    return Object.values(portfolio.currentDraft || {}).reduce((sum, response) => {
      const words = String(response?.analysisText || '').trim().split(/\s+/).filter(Boolean).length;
      return sum + words;
    }, 0);
  }, [portfolio]);

  if (isLoading && !assignment) {
    return <StatePanel loading title="Đang tải bài học" message="Học tốt Ngữ Văn đang đồng bộ nhiệm vụ và hồ sơ của bạn từ máy chủ." />;
  }
  if (dataError && !assignment) {
    return <StatePanel title="Không thể tải dữ liệu" message={dataError} actionLabel="Thử lại" onAction={() => void refreshAcademicData()} />;
  }
  if (!currentUser.id) {
    return <StatePanel title="Phiên đăng nhập không hợp lệ" message="Không xác định được tài khoản đang sử dụng. Vui lòng đăng nhập lại." actionLabel="Quay lại" onAction={() => onNavigate('dashboard')} />;
  }
  if (!assignment) {
    return <StatePanel title="Không tìm thấy nhiệm vụ" message="Nhiệm vụ này không tồn tại, đã bị đóng hoặc bạn chưa được phân công." actionLabel="Xem nhiệm vụ" onAction={() => onNavigate('assignment-list')} />;
  }
  if (!portfolio) {
    return <StatePanel title="Chưa có hồ sơ cho nhiệm vụ này" message="Tài khoản của bạn chưa có hồ sơ học tập gắn với nhiệm vụ. Nếu vừa được thêm vào lớp, hãy tải lại dữ liệu." actionLabel="Tải lại dữ liệu" onAction={() => void refreshAcademicData()} />;
  }

  const evidenceText = (currentAxis?.evidenceQuotes || []).map(item => item.text).join('\n');
  const nextVersion = nextVersionNumber(portfolio.versions || []);
  const currentAxisMeta = POETIC_AXES.find(axis => axis.id === activeAxisId) || POETIC_AXES[0];

  const updateAnalysis = (text: string) => {
    updateDraft(currentUser.id, assignment.id, activeAxisId, text, currentAxis?.evidenceQuotes || []);
  };
  const updateEvidence = (text: string) => {
    const quotes: EvidenceQuote[] = text.split('\n').map(line => line.trim()).filter(Boolean).map((line, index) => ({ id:`${activeAxisId}-${index + 1}`, text:line }));
    updateDraft(currentUser.id, assignment.id, activeAxisId, currentAxis?.analysisText || '', quotes);
  };
  const saveNow = async () => {
    try {
      await manualSaveDraft(currentUser.id, assignment.id);
      addToast({type:'success',title:'Đã lưu',message:'Bản nháp đã được lưu vào máy chủ.'});
    } catch {
      addToast({type:'error',title:'Chưa lưu được',message:'Không thể lưu bản nháp. Kiểm tra kết nối và thử lại.'});
    }
  };
  const freezeVersion = async () => {
    setIsCreatingVersion(true);
    try {
      await manualSaveDraft(currentUser.id, assignment.id);
      const ok = await createSnapshot(currentUser.id, assignment.id, nextVersion, versionNote.trim() || (nextVersion === 'v1.0' ? 'Nộp bản đầu tiên để nhận phản hồi.' : `Đóng băng ${nextVersion}.`), currentUser.name);
      if (!ok) throw new Error('CREATE_VERSION_FAILED');
      setVersionNote('');
      await refreshAcademicData();
      addToast({type:'success',title:nextVersion === 'v1.0' ? 'Đã nộp V1' : `Đã tạo ${nextVersion}`,message:nextVersion === 'v1.0' ? 'Bài đã được đưa vào hàng đợi phản hồi AI.' : 'Phiên bản đã được lưu thành công.'});
    } catch {
      addToast({type:'error',title:'Không thể tạo phiên bản',message:'Vui lòng lưu lại bản nháp và thử lại.'});
    } finally { setIsCreatingVersion(false); }
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white px-3 py-3 sm:px-5">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Button size="sm" variant="ghost" onClick={() => onNavigate('assignment-list')} leftIcon={<ArrowLeftIcon className="h-4 w-4"/>}>Quay lại</Button>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2"><strong className="truncate text-sm text-slate-900">{assignment.title}</strong><Badge variant="blue" size="sm">{portfolio.currentActiveVersion || 'v1.0 (nháp)'}</Badge></div>
              <div className="mt-0.5 text-xs text-slate-500">{literatureText ? `${literatureText.title} — ${literatureText.author}` : 'Ngữ liệu chưa khả dụng'}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ClockIcon className="h-4 w-4"/><span>{autosaveStatus === 'saving' ? 'Đang lưu…' : autosaveStatus === 'dirty' ? 'Có thay đổi chưa lưu' : `Đã lưu${lastSavedTime ? ` lúc ${lastSavedTime}` : ''}`}</span>
            <Button size="sm" variant="outline" onClick={saveNow}>Lưu ngay</Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-4 p-3 sm:p-5 lg:grid-cols-[220px_minmax(0,1fr)_300px]">
        <aside className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="mb-2 text-xs font-semibold text-slate-500">6 trục thi pháp</div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 lg:flex-col lg:overflow-x-visible lg:pb-0">
            {POETIC_AXES.map(axis => {
              const response=portfolio.currentDraft?.[axis.id];
              const done=Boolean(response?.analysisText?.trim());
              return (
                <button
                  key={axis.id}
                  onClick={()=>setActiveAxisId(axis.id)}
                  className={`shrink-0 rounded-md px-2.5 py-2 text-left text-xs transition-colors lg:w-full ${
                    activeAxisId===axis.id
                      ? 'bg-slate-100 text-slate-900 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 lg:bg-transparent'
                  }`}
                >
                  <div className="whitespace-nowrap lg:whitespace-normal">{axis.shortName}</div>
                  <div className={`mt-0.5 text-[11px] hidden sm:block ${activeAxisId===axis.id?'text-slate-600':'text-slate-400'}`}>
                    {done?'Đã có nội dung':'Chưa viết'}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <main className="space-y-4">
          {dataError && <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">Dữ liệu đang hiển thị có thể chưa phải bản mới nhất: {dataError}</div>}
          <section className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div><div className="text-xs font-medium text-indigo-700">{currentAxisMeta.title}</div><h1 className="mt-1 text-lg font-semibold text-slate-900">Viết phân tích</h1><p className="mt-1 text-xs leading-5 text-slate-500">{currentAxisMeta.description}</p></div>
              <div className="rounded-md bg-slate-50 px-2.5 py-1.5 text-xs text-slate-500">Tổng bài: <strong className="text-slate-800">{wordCount} từ</strong></div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="block text-xs font-semibold text-slate-700">Phân tích của bạn</label>
              <div className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 p-0.5 text-xs">
                <span className="px-1.5 text-xs text-slate-400">Cỡ chữ:</span>
                {(['sm', 'base', 'lg', 'xl'] as const).map(level => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setFontSizeLevel(level)}
                    className={`rounded px-2 py-0.5 text-xs font-medium transition ${
                      fontSizeLevel === level ? 'bg-white text-indigo-700 font-semibold' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {level === 'sm' ? 'Nhỏ' : level === 'base' ? 'Vừa' : level === 'lg' ? 'Lớn' : 'Rất lớn'}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              value={currentAxis?.analysisText || ''}
              onChange={e=>updateAnalysis(e.target.value)}
              rows={16}
              placeholder="Viết luận điểm, phân tích nghệ thuật, lí giải tác dụng và liên hệ với chủ đề tác phẩm…"
              className={`mt-2 w-full resize-y rounded-md border border-slate-300 bg-white p-3 font-sans text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 ${editorFontSizeClass}`}
            />
            <label className="mt-4 block text-xs font-semibold text-slate-700">Dẫn chứng — mỗi dòng một dẫn chứng</label>
            <textarea
              value={evidenceText}
              onChange={e=>updateEvidence(e.target.value)}
              rows={4}
              placeholder="Nhập các câu văn hoặc chi tiết nghệ thuật dùng làm dẫn chứng…"
              className="mt-1.5 w-full resize-y rounded-md border border-slate-300 bg-slate-50 p-2.5 font-sans text-xs leading-5 text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
            <div className="flex items-center gap-2"><DocumentDuplicateIcon className="h-4 w-4 text-slate-600"/><h2 className="text-sm font-semibold text-slate-900">Lịch sử và lưu phiên bản</h2></div>
            <p className="mt-1 text-xs leading-5 text-slate-500">Mỗi lần nộp sẽ lưu lại một phiên bản hoàn chỉnh để bạn và giáo viên theo dõi tiến trình chỉnh sửa.</p>
            <textarea value={versionNote} onChange={e=>setVersionNote(e.target.value)} rows={2} placeholder="Ghi chú những thay đổi chính của phiên bản này…" className="mt-3 w-full rounded-md border border-slate-300 p-2.5 text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"/>
            <div className="mt-3 flex flex-wrap gap-2"><Button variant="primary" isLoading={isCreatingVersion} onClick={freezeVersion}>{nextVersion === 'v1.0' ? 'Nộp V1 (gửi phản hồi)' : `Lưu phiên bản ${nextVersion}`}</Button>{portfolio.versions.length >= 2 && <Button variant="outline" onClick={()=>onNavigate('version-diff',{assignmentId:assignment.id})}>So sánh phiên bản</Button>}</div>
            {portfolio.versions.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{portfolio.versions.map(version=><button key={version.id} onClick={()=>portfolio.versions.length>=2&&onNavigate('version-diff',{assignmentId:assignment.id,v1Number:portfolio.versions[0].versionNumber,v2Number:version.versionNumber})} className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-left text-xs hover:bg-slate-100"><strong>{version.versionNumber}</strong><span className="ml-2 text-slate-400">{new Date(version.createdAt).toLocaleString('vi-VN')}</span></button>)}</div>}
          </section>
        </main>

        <aside className="space-y-4">
          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2"><BookOpenIcon className="h-4 w-4 text-slate-600"/><h2 className="text-xs font-semibold text-slate-900">Nhiệm vụ</h2></div>
            <p className="mt-2 text-xs leading-5 text-slate-600">{assignment.prompt || 'Chưa có yêu cầu chi tiết.'}</p>
            {assignment.guidingSteps?.length > 0 && <ol className="mt-2.5 list-decimal space-y-1 pl-4 text-xs leading-5 text-slate-500">{assignment.guidingSteps.map((step,index)=><li key={`${index}-${step}`}>{step}</li>)}</ol>}
          </section>
          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2"><ChatBubbleLeftRightIcon className="h-4 w-4 text-slate-600"/><h2 className="text-xs font-semibold text-slate-900">Phản hồi trục này</h2></div>
            {axisFeedbacks.length===0 ? <p className="mt-2 text-xs text-slate-500">Chưa có phản hồi cho trục này.</p> : <div className="mt-2.5 space-y-2.5">{axisFeedbacks.map(item=><div key={item.id} className="rounded-md border border-slate-200 bg-slate-50 p-2.5 text-xs"><div className="font-medium text-slate-800">{item.authorName} • {item.authorRole.toUpperCase()}</div>{item.selectedSnippet&&<div className="mt-1.5 border-l-2 border-indigo-300 pl-2 italic text-slate-500">{item.selectedSnippet}</div>}<p className="mt-1.5 leading-5 text-slate-700">{item.comment}</p><div className={`mt-1.5 font-medium ${item.resolved?'text-emerald-700':'text-amber-700'}`}>{item.resolved?'Đã xử lý':'Cần xem lại'}</div></div>)}</div>}
          </section>
        </aside>
      </div>
    </div>
  );
};
