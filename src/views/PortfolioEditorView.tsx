import React, { useState, useCallback, useMemo } from 'react';
import { useAuthStore } from '../app/store/useAuthStore';
import { usePortfolioStore } from '../app/store/usePortfolioStore';
import { useNotificationStore } from '../app/store/useNotificationStore';
import { mockDb } from '../services/mockApi/mockDb';
import { POETIC_AXES } from '../data/seedData';
import type { PoeticAxisId } from '../types';
import {
  Button,
  Badge,
  Modal
} from '../components/ui';
import {
  ArrowLeftIcon,
  BookOpenIcon,
  ClockIcon,
  SparklesIcon,
  DocumentDuplicateIcon,
  ChatBubbleLeftRightIcon,
  LightBulbIcon,
  PlusIcon,
  TrashIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  DocumentTextIcon,
  TableCellsIcon,
  ListBulletIcon,
  ExclamationTriangleIcon,
  DocumentArrowUpIcon
} from '@heroicons/react/24/outline';

interface PortfolioEditorViewProps {
  assignmentId: string;
  onNavigate: (view: string, extraParams?: any) => void;
}

type WorkspaceBlockType = 'text' | 'evidence' | 'table' | 'timeline' | 'diagram';

interface WorkspaceBlock {
  id: string;
  type: WorkspaceBlockType;
  title?: string;
  content: string;
  evidence?: string;
  contextNote?: string;
  tableData?: { col1: string; col2: string; col3?: string }[];
  timelineItems?: { phase: string; psychologicalState: string; evidence: string }[];
  diagramNodes?: { role: string; perspective: string; quote: string }[];
}

export const PortfolioEditorView: React.FC<PortfolioEditorViewProps> = ({
  assignmentId = 'assign-vo-nhat',
  onNavigate
}) => {
  const { currentUser } = useAuthStore();
  const {
    getPortfolio,
    updateDraft,
    manualSaveDraft,
    createSnapshot,
    autosaveStatus,
    lastSavedTime
  } = usePortfolioStore();
  const { addToast } = useNotificationStore();

  const assignments = mockDb.getAssignments();
  const literatureTexts = mockDb.getLiteratureTexts();
  const allFeedbacks = mockDb.getFeedbacks();

  const assignment = assignments.find(a => a.id === assignmentId) || assignments[0];
  const literatureText = literatureTexts.find(t => t.id === assignment?.textId);

  // Active Axis state
  const [activeAxisId, setActiveAxisId] = useState<PoeticAxisId>('narrator_pov'); // default: Người kể chuyện – điểm nhìn

  // Right Panel state
  const [rightPanelTab, setRightPanelTab] = useState<'feedback' | 'rubric' | 'hints'>('feedback');
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);

  // Modals
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isOriginalTextOpen, setIsOriginalTextOpen] = useState(false);
  const [versionChangelog, setVersionChangelog] = useState('');
  const [isCreatingVersion, setIsCreatingVersion] = useState(false);

  // Failure / Network status simulation
  const [isNetworkOffline, setIsNetworkOffline] = useState(false);

  // Fetch portfolio for current student and assignment
  const currentPortfolio = getPortfolio(currentUser.id, assignment.id, currentUser.name, currentUser.className);
  const currentDraftAxis = currentPortfolio.currentDraft?.[activeAxisId];

  // Structured Blocks state for active axis
  const [blocks, setBlocks] = useState<WorkspaceBlock[]>(() => {
    return [
      {
        id: 'block-1',
        type: 'text',
        title: '1. Luận điểm & Nhận diện hình thức trần thuật',
        content: currentDraftAxis?.analysisText || 'Kim Lân đã lựa chọn điểm nhìn trần thuật ngôi thứ ba toàn tri nhưng điểm nhìn nghệ thuật thường xuyên dịch chuyển và hòa nhập vào dòng tâm trạng bên trong của các nhân vật (Tràng, bà cụ Tứ, người vợ nhặt).'
      },
      {
        id: 'block-2',
        type: 'evidence',
        title: '2. Dẫn chứng & Lí giải nghệ thuật',
        evidence: '“Nhìn người đàn bà ngồi ở mép giường, Tràng chợt thấy thương thương... Trong một lúc, cái đói khát ghê gớm dường như lùi xa.”',
        contextNote: 'Dẫn chứng tại đoạn giữa tác phẩm khi Tràng dẫn vợ về nhà',
        content: 'Lời trần thuật nửa trực tiếp: Câu văn vừa là lời người kể chuyện ngôi thứ ba, vừa tái hiện chính xác cảm xúc rung động, thức tỉnh trách nhiệm của Tràng trước ngưỡng cửa gia đình.'
      },
      {
        id: 'block-3',
        type: 'table',
        title: '3. Bảng đối chiếu sự dịch chuyển điểm nhìn & Giọng điệu',
        content: '',
        tableData: [
          { col1: 'Điểm nhìn khách quan (bên ngoài)', col2: 'Mô tả cảnh xóm ngụ cư u ám, người chết như ngả rạ', col3: 'Giọng điệu lạnh lùng, xót xa' },
          { col1: 'Điểm nhìn hòa nhập vào Tràng', col2: 'Cảm giác êm ấm, bỡ ngỡ và niềm vui phơi phới', col3: 'Giọng tha thiết, ấm áp' },
          { col1: 'Điểm nhìn qua bà cụ Tứ', col2: 'Nỗi nghẹn ngào, vừa mừng vừa tủi cho phận con cái', col3: 'Giọng xót xa, bao dung, đầy tình mẫu tử' }
        ]
      },
      {
        id: 'block-4',
        type: 'timeline',
        title: '4. Tiến trình diễn biến tâm lý & Sự thức tỉnh',
        content: '',
        timelineItems: [
          { phase: 'Chiều hôm trước', psychologicalState: 'Liều lĩnh, bốc đồng nhưng ẩn chứa khao khát hạnh phúc', evidence: '“Đùa đấy chứ có muốn theo tớ về thì khuân đồ lên xe rồi cùng về!”' },
          { phase: 'Đêm tân hôn', psychologicalState: 'Ngỡ ngàng, thương xót, bắt đầu ý thức về trách nhiệm gia đình', evidence: '“Việc hắn có vợ đến hôm nay hắn vẫn còn thấy ngờ ngợ như không phải.”' },
          { phase: 'Sáng hôm sau', psychologicalState: 'Trưởng thành, hướng thiện, tin tưởng vào tương lai đổi đời', evidence: '“Hắn thấy hắn nên người, hắn thấy hắn có bổn phận phải lo lắng cho vợ con sau này.”' }
        ]
      }
    ];
  });

  // Track word count
  const totalWordCount = useMemo(() => {
    let words = 0;
    blocks.forEach(b => {
      if (b.content) words += b.content.trim().split(/\s+/).filter(Boolean).length;
      if (b.evidence) words += b.evidence.trim().split(/\s+/).filter(Boolean).length;
      if (b.tableData) {
        b.tableData.forEach(row => {
          words += (row.col1 + ' ' + row.col2 + ' ' + (row.col3 || '')).trim().split(/\s+/).filter(Boolean).length;
        });
      }
    });
    return words;
  }, [blocks]);

  // Autosave when blocks change
  const handleContentChange = useCallback((blockId: string, field: string, value: any) => {
    setBlocks(prev => prev.map(b => {
      if (b.id === blockId) {
        return { ...b, [field]: value };
      }
      return b;
    }));

    // Update into portfolio store
    const fullText = blocks.map(b => `${b.title || ''}\n${b.content || ''}\n${b.evidence || ''}`).join('\n\n');
    updateDraft(currentUser.id, assignment.id, activeAxisId, fullText);
  }, [blocks, currentUser.id, assignment.id, activeAxisId, updateDraft]);

  // Handle switching axis safely without data loss
  const handleSwitchAxis = (newAxisId: PoeticAxisId) => {
    manualSaveDraft(currentUser.id, assignment.id);
    setActiveAxisId(newAxisId);
  };

  // Add new block
  const handleAddBlock = (type: WorkspaceBlockType) => {
    const newBlock: WorkspaceBlock = {
      id: `block-${Date.now()}`,
      type,
      title: type === 'evidence' ? 'Dẫn chứng & Nhận xét mới' : type === 'table' ? 'Bảng đối chiếu mới' : type === 'timeline' ? 'Tiến trình tâm lý mới' : 'Đoạn phân tích mới',
      content: '',
      evidence: type === 'evidence' ? '' : undefined,
      tableData: type === 'table' ? [{ col1: '', col2: '', col3: '' }] : undefined,
      timelineItems: type === 'timeline' ? [{ phase: '', psychologicalState: '', evidence: '' }] : undefined
    };
    setBlocks(prev => [...prev, newBlock]);
    addToast({
      type: 'info',
      title: 'Đã thêm khối soạn thảo',
      message: `Khối ${type.toUpperCase()} đã được tạo thành công.`
    });
  };

  // Remove block
  const handleRemoveBlock = (blockId: string) => {
    setBlocks(prev => prev.filter(b => b.id !== blockId));
  };

  // Create Snapshot Version handler
  const handleConfirmCreateVersion = () => {
    setIsCreatingVersion(true);
    setTimeout(() => {
      setIsCreatingVersion(false);
      const nextVerNum = `v${((currentPortfolio?.versions?.length || 1) + 1).toFixed(1)}`;
      createSnapshot(
        currentUser.id,
        assignment.id,
        nextVerNum,
        versionChangelog || 'Bổ sung dẫn chứng điểm nhìn nửa trực tiếp và phản hồi từ giáo viên.',
        currentUser.name
      );
      setIsVersionModalOpen(false);
      setVersionChangelog('');
      addToast({
        type: 'success',
        title: 'Đã đóng băng phiên bản nghiên cứu',
        message: 'Bản snapshot mới đã được lưu bất biến vào hệ thống lưu trữ.'
      });
    }, 600);
  };

  // Submit portfolio handler
  const handleConfirmSubmit = () => {
    createSnapshot(
      currentUser.id,
      assignment.id,
      'v2.0',
      'Nộp bài chính thức hoàn thành nhiệm vụ.',
      currentUser.name
    );
    setIsSubmitModalOpen(false);
    addToast({
      type: 'success',
      title: 'Nộp bài thành công!',
      message: 'Hồ sơ đọc số của bạn đã được chuyển tới giáo viên bộ môn.'
    });
    onNavigate('student-dashboard');
  };

  // Feedbacks on current active axis
  const axisFeedbacks = allFeedbacks.filter(f => f.assignmentId === assignment?.id && f.axisId === activeAxisId && f.studentId === currentUser.id);
  const unresolvedAxisFbCount = axisFeedbacks.filter(f => !f.resolved).length;

  // Determine axis completion status
  const getAxisStatus = (axisId: PoeticAxisId) => {
    const resp = currentPortfolio?.currentDraft?.[axisId];
    const fbs = allFeedbacks.filter(f => f.assignmentId === assignment?.id && f.axisId === axisId && f.studentId === currentUser.id);
    const hasUnresolved = fbs.some(f => !f.resolved);

    if (!resp || !resp.analysisText.trim()) return 'Chưa làm';
    if (hasUnresolved) return 'Cần sửa';
    if (currentPortfolio?.versions && currentPortfolio.versions.length >= 2) return 'Đã duyệt';
    if (resp.analysisText.length > 100) return 'Hoàn thành';
    return 'Đang làm';
  };

  const formatDisplayDate = (dateStr?: string) => {
    if (!dateStr) return '14/08/2026 08:30';
    try {
      if (dateStr.includes('T')) {
        const d = new Date(dateStr);
        return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)] bg-slate-50 text-slate-900 font-sans">
      {/* ========================================================================= */}
      {/* A. WORKSPACE TOPBAR HEADER */}
      {/* ========================================================================= */}
      <header className="bg-white border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-30 shadow-xs">
        {/* Left: Back + Title + Work + Current Version */}
        <div className="flex items-center gap-3 min-w-0">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onNavigate('dashboard')}
            leftIcon={<ArrowLeftIcon className="w-4 h-4" />}
            className="text-slate-600 hover:text-slate-900 font-semibold"
          >
            Quay lại
          </Button>

          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                {literatureText?.title}
              </span>
              <span className="text-caption text-slate-500 hidden md:inline">
                ({literatureText?.author})
              </span>
              <Badge variant="blue" size="sm">
                {currentPortfolio?.currentActiveVersion || 'v1.0 (nháp)'}
              </Badge>
            </div>
            <p className="text-[11px] text-slate-500 truncate max-w-sm hidden sm:block">
              {assignment?.title}
            </p>
          </div>
        </div>

        {/* Right: Autosave State + Version History + Preview */}
        <div className="flex items-center gap-2.5">
          {/* Autosave indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
            <span
              className={`w-2 h-2 rounded-full ${
                isNetworkOffline
                  ? 'bg-rose-500'
                  : autosaveStatus === 'saving'
                  ? 'bg-amber-500 animate-ping'
                  : autosaveStatus === 'dirty'
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
            />
            <span className="hidden sm:inline">
              {isNetworkOffline
                ? 'Chưa đồng bộ (mất mạng)'
                : autosaveStatus === 'saving'
                ? 'Đang lưu…'
                : autosaveStatus === 'dirty'
                ? 'Có thay đổi chưa lưu'
                : `✓ Đã lưu lúc ${lastSavedTime || '14:32'}`}
            </span>
          </div>

          {/* Read Original Text Trigger */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsOriginalTextOpen(true)}
            leftIcon={<BookOpenIcon className="w-3.5 h-3.5" />}
            className="text-xs hidden md:flex"
          >
            Văn bản gốc
          </Button>

          {/* Version History Trigger */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsHistoryModalOpen(true)}
            leftIcon={<ClockIcon className="w-3.5 h-3.5" />}
            className="text-xs"
          >
            Lịch sử ({currentPortfolio?.versions?.length || 1})
          </Button>
        </div>
      </header>

      {/* Network Offline Alert Banner if applicable */}
      {isNetworkOffline && (
        <div className="bg-amber-500 text-amber-950 px-4 py-2 text-xs font-semibold flex items-center justify-between border-b border-amber-600">
          <div className="flex items-center gap-2">
            <ExclamationTriangleIcon className="w-4 h-4" />
            <span>Kết nối mạng đang không ổn định. Nội dung vẫn được giữ trên thiết bị và sẽ đồng bộ lại khi có thể.</span>
          </div>
          <button
            onClick={() => setIsNetworkOffline(false)}
            className="text-xs underline font-bold"
          >
            Thử đồng bộ lại
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MAIN 3-COLUMN WORKSPACE BODY */}
      {/* ========================================================================= */}
      <div className="flex-1 flex overflow-hidden min-h-[calc(100vh-8.5rem)] pb-14">
        {/* ======================================================================= */}
        {/* B. LEFT: POETICS AXIS NAVIGATOR (6 TRỤC THI PHÁP) */}
        {/* ======================================================================= */}
        <aside
          aria-label="Điều hướng 6 trục thi pháp"
          className="w-64 bg-white border-r border-slate-200 p-3 shrink-0 flex flex-col justify-between hidden lg:flex overflow-y-auto"
        >
          <div className="space-y-3">
            <div className="px-2 pt-1 pb-2 border-b border-slate-100 flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                6 Trục Thi Pháp THPT
              </span>
              <span className="text-caption font-bold text-indigo-700">
                {Object.values(currentPortfolio?.currentDraft || {}).filter((r: any) => r.analysisText.trim().length > 0).length || 1}/6
              </span>
            </div>

            <nav className="space-y-1.5">
              {POETIC_AXES.map((axis, index) => {
                const isActive = activeAxisId === axis.id;
                const status = getAxisStatus(axis.id);
                const axisFbs = allFeedbacks.filter(f => f.assignmentId === assignment?.id && f.axisId === axis.id && f.studentId === currentUser.id);
                const unresCount = axisFbs.filter(f => !f.resolved).length;

                return (
                  <button
                    key={axis.id}
                    type="button"
                    onClick={() => handleSwitchAxis(axis.id)}
                    className={`w-full text-left p-2.5 rounded-xl transition-all flex flex-col gap-1 border ${
                      isActive
                        ? 'bg-indigo-50/80 border-indigo-300 text-indigo-950 shadow-xs'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400">
                        TRỤC 0{index + 1}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                          status === 'Hoàn thành' || status === 'Đã duyệt'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : status === 'Cần sửa'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : status === 'Đang làm'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {status}
                      </span>
                    </div>

                    <div className="font-bold text-xs leading-snug">
                      {axis.shortName}
                    </div>

                    {unresCount > 0 && (
                      <div className="pt-0.5 flex items-center gap-1 text-[10px] font-bold text-amber-700">
                        <ChatBubbleLeftRightIcon className="w-3 h-3" />
                        <span>{unresCount} phản hồi cần tiếp thu</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Quick Poetics Scaffolding tip */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1 mt-4">
            <div className="font-bold text-slate-800 flex items-center gap-1">
              <LightBulbIcon className="w-3.5 h-3.5 text-amber-600" />
              Gợi ý thi pháp
            </div>
            <p className="leading-relaxed text-slate-500">
              Đọc hiểu truyện ngắn hiện đại đòi hỏi kết nối dẫn chứng nghệ thuật với tư tưởng nhân đạo của tác giả.
            </p>
          </div>
        </aside>

        {/* ======================================================================= */}
        {/* C & D. CENTER: COLLABORATIVE DOCUMENT WORKSPACE */}
        {/* ======================================================================= */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex justify-center bg-slate-100/60">
          <div className="w-full max-w-3xl space-y-6">
            {/* Mobile Horizontal Axis Selector (Visible only on < lg screens) */}
            <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto pb-1 -mt-2">
              {POETIC_AXES.map((axis, index) => {
                const isActive = activeAxisId === axis.id;
                return (
                  <button
                    key={axis.id}
                    type="button"
                    onClick={() => handleSwitchAxis(axis.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition border shrink-0 min-h-[40px] flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-[10px] opacity-70">T0{index + 1}</span>
                    <span>{axis.shortName}</span>
                  </button>
                );
              })}
            </div>

            {/* Axis Context Banner */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-card space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-caption font-bold text-indigo-700 uppercase tracking-wider">
                  Trục đang soạn thảo: {POETIC_AXES.find(a => a.id === activeAxisId)?.shortName}
                </span>
                <span className="text-caption text-slate-400">
                  {totalWordCount} từ • ~{Math.ceil(totalWordCount / 180)} phút đọc
                </span>
              </div>
              <h1 className="text-h3 font-bold text-slate-900 tracking-tight">
                {POETIC_AXES.find(a => a.id === activeAxisId)?.title}
              </h1>
              <p className="text-xs text-slate-600 leading-relaxed">
                {POETIC_AXES.find(a => a.id === activeAxisId)?.description}
              </p>
            </div>

            {/* Structured Blocks List */}
            <div className="space-y-4">
              {blocks.map(block => (
                <div
                  key={block.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-card hover:border-slate-300 transition-all space-y-3 relative group"
                >
                  {/* Block Header & Type Badge */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded shrink-0">
                        Khối {block.type.toUpperCase()}
                      </span>
                      <input
                        type="text"
                        value={block.title || ''}
                        onChange={e => handleContentChange(block.id, 'title', e.target.value)}
                        placeholder="Tiêu đề khối luận điểm..."
                        className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none focus:ring-1 focus:ring-slate-300 rounded px-1.5 py-0.5 flex-1 min-w-0"
                      />
                    </div>

                    <button
                      onClick={() => handleRemoveBlock(block.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 transition rounded shrink-0"
                      title="Xóa khối này"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>

                  {/* 1. TEXT BLOCK */}
                  {block.type === 'text' && (
                    <textarea
                      rows={4}
                      value={block.content}
                      onChange={e => handleContentChange(block.id, 'content', e.target.value)}
                      placeholder="Nhập nội dung phân tích, luận điểm thi pháp..."
                      className="w-full text-xs sm:text-sm text-slate-800 leading-relaxed focus:outline-none resize-y bg-transparent"
                    />
                  )}

                  {/* 2. EVIDENCE BLOCK (2 VÙNG: DẪN CHỨNG & NHẬN XÉT) */}
                  {block.type === 'evidence' && (
                    <div className="space-y-3">
                      {/* Vùng 1: Dẫn chứng văn bản gốc */}
                      <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-1.5">
                        <label className="block text-[10px] font-bold text-indigo-900 uppercase">
                          Vùng 1: Dẫn chứng trích dẫn văn bản nghệ thuật
                        </label>
                        <textarea
                          rows={2}
                          value={block.evidence || ''}
                          onChange={e => handleContentChange(block.id, 'evidence', e.target.value)}
                          placeholder="Trích dẫn câu văn, đoạn hội thoại hoặc chi tiết từ văn bản..."
                          className="w-full text-xs italic font-serif text-indigo-950 bg-transparent focus:outline-none resize-none"
                        />
                        <input
                          type="text"
                          value={block.contextNote || ''}
                          onChange={e => handleContentChange(block.id, 'contextNote', e.target.value)}
                          placeholder="Ghi chú ngữ cảnh (ví dụ: Đoạn đầu tác phẩm, khi Tràng gặp thị lần thứ hai...)"
                          className="w-full text-[11px] text-slate-500 bg-transparent focus:outline-none border-t border-indigo-100/60 pt-1"
                        />
                      </div>

                      {/* Vùng 2: Nhận xét / Phân tích lí giải */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">
                          Vùng 2: Nhận xét & Phân tích lí giải nghệ thuật
                        </label>
                        <textarea
                          rows={3}
                          value={block.content}
                          onChange={e => handleContentChange(block.id, 'content', e.target.value)}
                          placeholder="Phân tích tác dụng thẩm mỹ, sự dịch chuyển điểm nhìn hoặc giá trị biểu tượng..."
                          className="w-full text-xs sm:text-sm text-slate-800 leading-relaxed focus:outline-none resize-y bg-transparent"
                        />
                      </div>
                    </div>
                  )}

                  {/* 3. TABLE BLOCK (BẢNG ĐỐI CHIẾU) */}
                  {block.type === 'table' && (
                    <div className="space-y-2">
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left border border-slate-200 rounded-lg overflow-hidden">
                          <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                            <tr>
                              <th className="p-2 w-1/3">Dẫn chứng / Đối tượng</th>
                              <th className="p-2 w-1/3">Biểu hiện nghệ thuật</th>
                              <th className="p-2 w-1/3">Ý nghĩa thi pháp</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {block.tableData?.map((row, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/50">
                                <td className="p-2">
                                  <textarea
                                    rows={2}
                                    value={row.col1}
                                    onChange={e => {
                                      const updated = [...(block.tableData || [])];
                                      updated[idx].col1 = e.target.value;
                                      handleContentChange(block.id, 'tableData', updated);
                                    }}
                                    placeholder="Dẫn chứng..."
                                    className="w-full text-xs bg-transparent focus:outline-none resize-none"
                                  />
                                </td>
                                <td className="p-2">
                                  <textarea
                                    rows={2}
                                    value={row.col2}
                                    onChange={e => {
                                      const updated = [...(block.tableData || [])];
                                      updated[idx].col2 = e.target.value;
                                      handleContentChange(block.id, 'tableData', updated);
                                    }}
                                    placeholder="Biểu hiện..."
                                    className="w-full text-xs bg-transparent focus:outline-none resize-none"
                                  />
                                </td>
                                <td className="p-2">
                                  <textarea
                                    rows={2}
                                    value={row.col3 || ''}
                                    onChange={e => {
                                      const updated = [...(block.tableData || [])];
                                      updated[idx].col3 = e.target.value;
                                      handleContentChange(block.id, 'tableData', updated);
                                    }}
                                    placeholder="Ý nghĩa..."
                                    className="w-full text-xs bg-transparent focus:outline-none resize-none"
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <button
                        onClick={() => {
                          const updated = [...(block.tableData || []), { col1: '', col2: '', col3: '' }];
                          handleContentChange(block.id, 'tableData', updated);
                        }}
                        className="text-caption font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 pt-1"
                      >
                        <PlusIcon className="w-3.5 h-3.5" /> Thêm hàng trong bảng
                      </button>
                    </div>
                  )}

                  {/* 4. TIMELINE BLOCK (TIẾN TRÌNH TÂM LÝ) */}
                  {block.type === 'timeline' && (
                    <div className="space-y-3 pl-2">
                      {block.timelineItems?.map((item, idx) => (
                        <div key={idx} className="relative pl-5 border-l-2 border-indigo-200 space-y-1 pb-2">
                          <div className="absolute -left-[7px] top-0.5 w-3 h-3 rounded-full bg-indigo-600" />
                          <input
                            type="text"
                            value={item.phase}
                            onChange={e => {
                              const updated = [...(block.timelineItems || [])];
                              updated[idx].phase = e.target.value;
                              handleContentChange(block.id, 'timelineItems', updated);
                            }}
                            placeholder="Giai đoạn (Hiện tại / Hồi ức / Tương lai)..."
                            className="text-xs font-bold text-indigo-900 bg-transparent focus:outline-none block w-full"
                          />
                          <textarea
                            rows={1}
                            value={item.psychologicalState}
                            onChange={e => {
                              const updated = [...(block.timelineItems || [])];
                              updated[idx].psychologicalState = e.target.value;
                              handleContentChange(block.id, 'timelineItems', updated);
                            }}
                            placeholder="Diễn biến tâm lý nhân vật..."
                            className="text-xs text-slate-700 bg-transparent focus:outline-none block w-full resize-none"
                          />
                          <input
                            type="text"
                            value={item.evidence}
                            onChange={e => {
                              const updated = [...(block.timelineItems || [])];
                              updated[idx].evidence = e.target.value;
                              handleContentChange(block.id, 'timelineItems', updated);
                            }}
                            placeholder="Dẫn chứng câu văn chứng minh..."
                            className="text-[11px] italic font-serif text-slate-500 bg-transparent focus:outline-none block w-full"
                          />
                        </div>
                      ))}

                      <button
                        onClick={() => {
                          const updated = [...(block.timelineItems || []), { phase: 'Giai đoạn mới', psychologicalState: '', evidence: '' }];
                          handleContentChange(block.id, 'timelineItems', updated);
                        }}
                        className="text-caption font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 pt-1"
                      >
                        <PlusIcon className="w-3.5 h-3.5" /> Thêm mốc diễn biến tâm lý
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Quick Block Inserter Menu */}
            <div className="p-4 bg-white rounded-2xl border border-dashed border-slate-300 flex flex-wrap items-center justify-center gap-3 shadow-xs">
              <span className="text-xs font-bold text-slate-500 mr-2">
                + Thêm khối phân tích:
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAddBlock('text')}
                leftIcon={<DocumentTextIcon className="w-3.5 h-3.5" />}
              >
                Khối Văn bản (Text)
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAddBlock('evidence')}
                leftIcon={<SparklesIcon className="w-3.5 h-3.5" />}
              >
                Khối Dẫn chứng 2 Vùng
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAddBlock('table')}
                leftIcon={<TableCellsIcon className="w-3.5 h-3.5" />}
              >
                Khối Bảng Đối Chiếu
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAddBlock('timeline')}
                leftIcon={<ListBulletIcon className="w-3.5 h-3.5" />}
              >
                Khối Tiến Trình Tâm Lý
              </Button>
            </div>
          </div>
        </main>

        {/* ======================================================================= */}
        {/* E. RIGHT PANEL: FEEDBACK / RUBRIC / SCAFFOLDING HINTS */}
        {/* ======================================================================= */}
        <aside
          aria-label="Bảng phản hồi và Rubric"
          className={`bg-white border-l border-slate-200 shrink-0 transition-all duration-200 flex flex-col justify-between hidden md:flex ${
            isRightPanelOpen ? 'w-80' : 'w-10'
          }`}
        >
          {isRightPanelOpen ? (
            <div className="flex flex-col h-full">
              {/* Right Panel Header Tabs */}
              <div className="p-3 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setRightPanelTab('feedback')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                      rightPanelTab === 'feedback' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Phản hồi ({unresolvedAxisFbCount})
                  </button>
                  <button
                    onClick={() => setRightPanelTab('rubric')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                      rightPanelTab === 'rubric' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Rubric
                  </button>
                  <button
                    onClick={() => setRightPanelTab('hints')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                      rightPanelTab === 'hints' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Gợi ý
                  </button>
                </div>

                <button
                  onClick={() => setIsRightPanelOpen(false)}
                  className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                  title="Thu gọn panel"
                >
                  <ChevronRightIcon className="w-4 h-4" />
                </button>
              </div>

              {/* Panel Content Area */}
              <div className="p-4 overflow-y-auto flex-1 space-y-4">
                {/* 1. FEEDBACK TAB */}
                {rightPanelTab === 'feedback' && (
                  <div className="space-y-3">
                    <div className="text-caption font-bold text-slate-400 uppercase tracking-wider">
                      Phản hồi neo trên trục hiện tại:
                    </div>

                    {axisFeedbacks.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                        Chưa có phản hồi nào trên trục này. Sau khi lưu phiên bản v1.0, giáo viên sẽ gửi góp ý.
                      </div>
                    ) : (
                      axisFeedbacks.map(fb => (
                        <div
                          key={fb.id}
                          className={`p-3.5 rounded-xl border space-y-2 text-xs transition-all ${
                            fb.resolved ? 'bg-slate-50 border-slate-200 opacity-80' : 'bg-amber-50/50 border-amber-200 shadow-xs'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <Badge variant={fb.authorRole === 'teacher' ? 'emerald' : 'amber'} size="sm">
                              {fb.authorRole === 'teacher' ? 'Giáo viên' : 'Bạn học'}
                            </Badge>
                            <span className="text-[10px] text-slate-400">{formatDisplayDate(fb.createdAt)}</span>
                          </div>

                          <div className="font-bold text-slate-900">{fb.authorName}</div>

                          {fb.selectedSnippet && (
                            <div className="p-2 bg-white rounded border-l-2 border-amber-500 text-[11px] italic text-slate-700">
                              "{fb.selectedSnippet}"
                            </div>
                          )}

                          <p className="text-slate-800 leading-relaxed">{fb.comment}</p>

                          <div className="pt-2 border-t border-amber-100 flex items-center justify-between">
                            <span className={fb.resolved ? 'text-emerald-700 font-bold text-caption' : 'text-amber-700 font-bold text-caption'}>
                              {fb.resolved ? '✓ Đã tiếp thu' : '• Cần tiếp thu ở v2.0'}
                            </span>

                            {!fb.resolved && (
                              <button
                                onClick={() => {
                                  fb.resolved = true;
                                  addToast({
                                    type: 'success',
                                    title: 'Đã đánh dấu tiếp thu',
                                    message: 'Góp ý đã được ghi nhận vào bản chỉnh sửa.'
                                  });
                                }}
                                className="text-caption font-bold text-indigo-700 hover:underline"
                              >
                                Đánh dấu đã sửa
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* 2. RUBRIC TAB */}
                {rightPanelTab === 'rubric' && (
                  <div className="space-y-3 text-xs">
                    <div className="text-caption font-bold text-slate-400 uppercase tracking-wider">
                      Ma Trận Rubric 4 Mức Độ
                    </div>

                    <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-200 space-y-2">
                      <div className="font-bold text-indigo-950">Tiêu chí: {POETIC_AXES.find(a => a.id === activeAxisId)?.shortName}</div>
                      <p className="text-[11px] text-slate-600">Đánh giá khả năng phân tích và trích xuất dẫn chứng chính xác.</p>
                    </div>

                    <div className="space-y-2 text-[11px]">
                      <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
                        <span className="font-bold text-emerald-950 block">Mức 4: Xuất sắc (4.0 đ)</span>
                        <p className="text-emerald-800">Phân tích sâu sắc sự dịch chuyển điểm nhìn, dẫn chứng toàn diện, lập luận logic và sáng tạo.</p>
                      </div>

                      <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200">
                        <span className="font-bold text-blue-950 block">Mức 3: Khá (3.0 đ)</span>
                        <p className="text-blue-800">Nhận diện đúng ngôi kể và điểm nhìn, có trích dẫn cụ thể nhưng phân tích còn đôi chỗ dàn trải.</p>
                      </div>

                      <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200">
                        <span className="font-bold text-amber-950 block">Mức 2: Đạt (2.0 đ)</span>
                        <p className="text-amber-800">Chỉ ra được người kể chuyện, dẫn chứng còn ít hoặc chỉ tóm tắt cốt truyện.</p>
                      </div>

                      <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200">
                        <span className="font-bold text-rose-950 block">Mức 1: Chưa đạt (1.0 đ)</span>
                        <p className="text-rose-800">Chưa nắm được khái niệm điểm nhìn nghệ thuật, thiếu dẫn chứng văn bản.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. HINTS / SCAFFOLDING TAB */}
                {rightPanelTab === 'hints' && (
                  <div className="space-y-3 text-xs">
                    <div className="text-caption font-bold text-slate-400 uppercase tracking-wider">
                      Câu Hỏi Gợi Mở Dẫn Dắt
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-slate-700 leading-relaxed">
                      <p className="font-bold text-slate-900">1. Ngôi kể và khoảng cách trần thuật:</p>
                      <p className="text-[11px]">Người kể chuyện đứng ở đâu để quan sát số phận các nhân vật trong nạn đói năm 1945?</p>

                      <p className="font-bold text-slate-900 pt-1">2. Dịch chuyển điểm nhìn bên trong:</p>
                      <p className="text-[11px]">Những câu văn nào thể hiện suy nghĩ thầm kín của bà cụ Tứ khi đón nàng dâu mới?</p>

                      <p className="font-bold text-slate-900 pt-1">3. Ngôn ngữ nửa trực tiếp:</p>
                      <p className="text-[11px]">Tìm các câu văn có sự pha trộn giữa lời của tác giả và lời nội tâm của Tràng.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-4 flex flex-col items-center gap-4">
              <button
                onClick={() => setIsRightPanelOpen(true)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                title="Mở rộng panel"
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </button>
              <span className="text-[10px] font-bold text-slate-400 tracking-wider -rotate-90 origin-center whitespace-nowrap mt-12">
                PHẢN HỒI & RUBRIC
              </span>
            </div>
          )}
        </aside>
      </div>

      {/* ========================================================================= */}
      {/* F. STICKY BOTTOM ACTION BAR */}
      {/* ========================================================================= */}
      <footer className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 px-4 py-2.5 z-40 shadow-modal flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="font-semibold text-slate-700 hidden sm:inline">
            Tổng số: <strong className="text-slate-900">{totalWordCount}</strong> từ
          </span>
          <span className="text-slate-400 hidden sm:inline">•</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Bản nháp tự động lưu liên tục
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              manualSaveDraft(currentUser.id, assignment.id);
              addToast({
                type: 'success',
                title: 'Đã lưu bản nháp',
                message: 'Toàn bộ nội dung hiện tại đã được đồng bộ an toàn.'
              });
            }}
          >
            Lưu nháp
          </Button>

          <Button
            size="sm"
            variant="academic"
            onClick={() => setIsVersionModalOpen(true)}
            leftIcon={<DocumentDuplicateIcon className="w-4 h-4" />}
            className="font-bold"
          >
            Đóng băng phiên bản
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsSubmitModalOpen(true)}
            rightIcon={<DocumentArrowUpIcon className="w-4 h-4" />}
            className="bg-indigo-900 text-white font-bold"
          >
            Nộp bài
          </Button>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* MODALS: CREATE VERSION, HISTORY, ORIGINAL TEXT, SUBMIT */}
      {/* ========================================================================= */}

      {/* 1. Modal Create Version Snapshot */}
      <Modal
        isOpen={isVersionModalOpen}
        onClose={() => setIsVersionModalOpen(false)}
        title="Đóng Băng Phiên Bản Nghiên Cứu (Snapshot)"
        description="Tạo một bản ghi bất biến (Immutable Version) để lưu lại quá trình hình thành cách hiểu."
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsVersionModalOpen(false)}>
              Hủy bỏ
            </Button>
            <Button
              variant="primary"
              isLoading={isCreatingVersion}
              onClick={handleConfirmCreateVersion}
              className="bg-indigo-900 text-white font-bold"
            >
              Xác nhận đóng băng phiên bản
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-xs text-slate-700">
          <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200 text-indigo-950 space-y-1">
            <span className="font-bold block">Phiên bản chuẩn bị tạo: v{((currentPortfolio?.versions?.length || 1) + 1).toFixed(1)}</span>
            <p className="text-[11px] text-indigo-800">
              Bản ghi này sẽ được dùng để so sánh Visual Diff và đối chiếu với các góp ý từ giáo viên.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block font-bold text-slate-900">
              Nhật ký thay đổi (Changelog) so với bản trước:
            </label>
            <textarea
              rows={3}
              value={versionChangelog}
              onChange={e => setVersionChangelog(e.target.value)}
              placeholder="Ví dụ: Bổ sung dẫn chứng về sự thức tỉnh của Tràng sau khi tiếp thu góp ý của cô Mai..."
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-800"
            />
          </div>
        </div>
      </Modal>

      {/* 2. Modal Version History */}
      <Modal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title="Lịch Sử Các Phiên Bản Hồ Sơ"
        footer={<Button variant="secondary" onClick={() => setIsHistoryModalOpen(false)}>Đóng lại</Button>}
      >
        <div className="space-y-3 text-xs">
          {currentPortfolio?.versions && currentPortfolio.versions.length > 0 ? (
            currentPortfolio.versions.map((ver, idx) => (
              <div key={ver.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="blue" size="sm">{ver.versionNumber}</Badge>
                    <span className="font-bold text-slate-900">Mốc {idx + 1}</span>
                    <span className="text-caption text-slate-400">• {ver.createdAt}</span>
                  </div>
                  <p className="text-slate-600 text-[11px] mt-1">{ver.changeSummary}</p>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsHistoryModalOpen(false);
                    onNavigate('version-diff', { assignmentId: assignment.id, v1Number: 'v1.0', v2Number: ver.versionNumber });
                  }}
                >
                  Xem Diff
                </Button>
              </div>
            ))
          ) : (
            <div className="py-4 text-center text-slate-400">Chưa có phiên bản nào được đóng băng.</div>
          )}
        </div>
      </Modal>

      {/* 3. Modal Original Literature Text Reader */}
      <Modal
        isOpen={isOriginalTextOpen}
        onClose={() => setIsOriginalTextOpen(false)}
        title={`Đọc tác phẩm: ${literatureText?.title} (${literatureText?.author})`}
        description={`Năm sáng tác: ${literatureText?.year} • Thể loại: ${literatureText?.genre}`}
        footer={<Button variant="primary" onClick={() => setIsOriginalTextOpen(false)}>Đóng văn bản</Button>}
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto text-slate-800 text-xs sm:text-sm font-serif leading-relaxed pr-2">
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-950 font-sans text-xs">
            <strong>Bối cảnh sáng tác:</strong> {literatureText?.historicalContext}
          </div>

          <div className="whitespace-pre-line text-slate-800">
            {literatureText?.excerpt || literatureText?.fullContent}
          </div>
        </div>
      </Modal>

      {/* 4. Modal Submit Confirmation */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title="Xác Nhận Nộp Hồ Sơ Đọc Số"
        description="Bài nộp sẽ được chuyển sang trạng thái chính thức để giáo viên chấm điểm Rubric."
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsSubmitModalOpen(false)}>
              Xem lại bài
            </Button>
            <Button variant="primary" onClick={handleConfirmSubmit} className="bg-indigo-900 text-white font-bold">
              Xác nhận nộp bài
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-xs text-slate-700">
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-950">
            ✓ Đã hoàn thiện nội dung phân tích qua <strong>{blocks.length} khối luận điểm</strong>.
          </div>
          <p>
            Sau khi nộp bài, bạn vẫn có thể xem lại lịch sử các phiên bản và so sánh Visual Diff bất kỳ lúc nào.
          </p>
        </div>
      </Modal>
    </div>
  );
};
