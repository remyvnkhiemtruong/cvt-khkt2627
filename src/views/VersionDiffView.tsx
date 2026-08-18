import React, { useState, useMemo } from 'react';
import { useAuthStore } from '../app/store/useAuthStore';
import { usePortfolioStore } from '../app/store/usePortfolioStore';
import { useNotificationStore } from '../app/store/useNotificationStore';
import { mockDb } from '../services/mockApi/mockDb';
import { POETIC_AXES } from '../data/seedData';
import type { PoeticAxisId } from '../types';
import {
  Button,
  Badge,
  Card,
  Modal
} from '../components/ui';
import {
  ArrowsRightLeftIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ArrowUturnLeftIcon,
  PrinterIcon,
  PlusIcon,
  MinusIcon,
  PencilSquareIcon,
  TagIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

interface VersionDiffViewProps {
  assignmentId?: string;
  v1Number?: string;
  v2Number?: string;
  onNavigate: (view: string, extraParams?: any) => void;
}

export const VersionDiffView: React.FC<VersionDiffViewProps> = ({
  assignmentId = 'assign-vo-nhat',
  v1Number = 'v1.0',
  v2Number = 'v2.0',
  onNavigate
}) => {
  const { currentUser } = useAuthStore();
  const { getPortfolio, createSnapshot } = usePortfolioStore();
  const { addToast } = useNotificationStore();

  const assignments = mockDb.getAssignments();
  const allFeedbacks = mockDb.getFeedbacks();

  const assignment = assignments.find(a => a.id === assignmentId) || assignments[0];

  // Selected versions
  const [selectedV1, setSelectedV1] = useState(v1Number);
  const [selectedV2, setSelectedV2] = useState(v2Number);
  const [activeAxisId, setActiveAxisId] = useState<PoeticAxisId>('narrator_pov');
  const [diffMode, setDiffMode] = useState<'unified' | 'side_by_side'>(() => {
    return typeof window !== 'undefined' && window.innerWidth < 1024 ? 'unified' : 'side_by_side';
  });
  const [showFeedbackMarkers, setShowFeedbackMarkers] = useState(true);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);

  const currentPortfolio = getPortfolio(currentUser.id, assignment.id, currentUser.name, currentUser.className);
  const versions = currentPortfolio.versions.length > 0 ? currentPortfolio.versions : [
    {
      id: 'ver-1',
      versionNumber: 'v1.0',
      createdAt: '16/09/2026 09:15',
      createdBy: currentUser.id,
      authorName: currentUser.name,
      changeSummary: 'Bản sơ thảo ban đầu nộp cho giáo viên đánh giá.',
      responses: currentPortfolio.currentDraft,
      isFrozen: true,
      isSubmitted: true
    },
    {
      id: 'ver-2',
      versionNumber: 'v2.0',
      createdAt: '18/09/2026 14:32',
      createdBy: currentUser.id,
      authorName: currentUser.name,
      changeSummary: 'Tiếp thu phản hồi của cô Mai về điểm nhìn nửa trực tiếp và diễn biến tâm lý Tràng.',
      responses: currentPortfolio.currentDraft,
      isFrozen: true,
      isSubmitted: true
    }
  ];

  // Feedback for this assignment and axis
  const axisFeedbacks = allFeedbacks.filter(f => f.assignmentId === assignment.id && f.axisId === activeAxisId);

  // Pedagogical Diff Data for the signature demo
  const diffChunks = useMemo(() => {
    return [
      {
        id: 'chunk-1',
        type: 'unchanged' as const,
        label: 'Mở đầu luận điểm',
        v1Text: 'Kim Lân đã lựa chọn điểm nhìn trần thuật ngôi thứ ba toàn tri trong truyện ngắn Vợ nhặt.',
        v2Text: 'Kim Lân đã lựa chọn điểm nhìn trần thuật ngôi thứ ba toàn tri trong truyện ngắn Vợ nhặt.',
        explanation: 'Khái quát ngôi kể ban đầu chính xác.'
      },
      {
        id: 'chunk-2',
        type: 'changed' as const,
        label: 'Lí giải sâu hơn & Thay đổi luận điểm',
        pedagogicalLabel: 'Lí giải sâu hơn',
        relatedFeedbackId: 'fb-1',
        v1Text: 'Người kể chuyện đứng ngoài quan sát và kể lại việc Tràng nhặt được vợ giữa nạn đói năm 1945.',
        v2Text: 'Tuy nhiên, điểm nhìn nghệ thuật không cố định ở bên ngoài mà liên tục dịch chuyển, hòa nhập vào dòng tâm trạng bên trong của các nhân vật (Tràng, bà cụ Tứ, người vợ nhặt).',
        explanation: 'Nâng cấp từ nhận định ngôi kể đơn thuần sang phân tích sự dịch chuyển điểm nhìn bên trong.'
      },
      {
        id: 'chunk-3',
        type: 'added' as const,
        label: 'Bổ sung dẫn chứng nghệ thuật',
        pedagogicalLabel: 'Bổ sung dẫn chứng',
        relatedFeedbackId: 'fb-2',
        v1Text: '',
        v2Text: 'Dẫn chứng tiêu biểu: “Nhìn người đàn bà ngồi ở mép giường, Tràng chợt thấy thương thương... Trong một lúc, cái đói khát ghê gớm dường như lùi xa.” Câu văn thể hiện lời trần thuật nửa trực tiếp, nơi tiếng nói của nhà văn hòa lẫn với sự thức tỉnh tình người và trách nhiệm của Tràng.',
        explanation: 'Bổ sung ngữ liệu then chốt chứng minh cho hình thức lời nửa trực tiếp.'
      },
      {
        id: 'chunk-4',
        type: 'deleted' as const,
        label: 'Sửa diễn đạt & Lược bỏ chi tiết thừa',
        pedagogicalLabel: 'Sửa diễn đạt',
        v1Text: 'Nhân vật Tràng là một người nghèo khổ xấu xí nhưng may mắn lấy được vợ mà không mất tiền.',
        v2Text: '',
        explanation: 'Loại bỏ cách diễn đạt nôm na, thiếu tính học thuật để thay bằng phân tích phẩm chất nhân đạo.'
      },
      {
        id: 'chunk-5',
        type: 'changed' as const,
        label: 'Tổ chức lại cấu trúc lập luận',
        pedagogicalLabel: 'Tổ chức lại cấu trúc',
        v1Text: 'Tác giả miêu tả cảnh đói khát rất chân thực để người đọc thấy thương xót.',
        v2Text: 'Bằng cách đan cài giữa không gian bóng tối u ám của nạn đói và ánh sáng le lói của tình thân, Kim Lân khẳng định sức sống bất diệt và niềm tin vào tương lai của con người Việt Nam.',
        explanation: 'Khái quát hóa tư tưởng nhân văn sâu sắc kết nối với chủ đề tác phẩm.'
      }
    ];
  }, []);

  // Summary Metrics
  const diffSummary = {
    addedWords: 142,
    deletedWords: 28,
    changedBlocks: 3,
    resolvedFeedbacks: 2
  };

  const handleRestoreVersion = () => {
    createSnapshot(
      currentUser.id,
      assignment.id,
      `v${(versions.length + 1).toFixed(1)}`,
      `Khôi phục từ nội dung phiên bản ${selectedV1}`,
      currentUser.name
    );
    setIsRestoreModalOpen(false);
    addToast({
      type: 'success',
      title: 'Đã khôi phục phiên bản',
      message: `Bản nháp mới đã được tạo dựa trên snapshot ${selectedV1}.`
    });
    onNavigate('editor', { assignmentId: assignment.id });
  };

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
            <span className="text-xs font-semibold text-slate-700">Trình So Sánh Visual Diff</span>
          </div>

          <h1 className="text-h2 font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <ArrowsRightLeftIcon className="w-6 h-6 text-indigo-700" />
            So Sánh Sai Khác Phiên Bản (Visual Diff)
          </h1>
          <p className="text-small text-slate-500 mt-1">
            Minh chứng trực quan về quá trình phát triển cách hiểu và tiếp thu phản hồi qua các mốc lưu trữ
          </p>
        </div>

        {/* Header Action Tools */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.print()}
            leftIcon={<PrinterIcon className="w-4 h-4" />}
          >
            In / Xuất PDF
          </Button>

          <Button
            size="sm"
            variant="academic"
            onClick={() => setIsRestoreModalOpen(true)}
            leftIcon={<ArrowUturnLeftIcon className="w-4 h-4" />}
          >
            Khôi phục bản {selectedV1}
          </Button>
        </div>
      </header>

      {/* Selector & Mode Switch Bar */}
      <Card padding="md" className="border-slate-200 bg-white shadow-card space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          {/* Version Selectors */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Đối chiếu:
            </span>

            {/* V1 Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-600 font-semibold">Bản cũ:</span>
              <select
                value={selectedV1}
                onChange={e => setSelectedV1(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold py-1.5 px-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-800"
              >
                {versions.map(v => (
                  <option key={v.id} value={v.versionNumber}>
                    {v.versionNumber} ({v.createdAt})
                  </option>
                ))}
              </select>
            </div>

            <span className="text-slate-400 font-bold">➔</span>

            {/* V2 Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-600 font-semibold">Bản mới:</span>
              <select
                value={selectedV2}
                onChange={e => setSelectedV2(e.target.value)}
                className="bg-indigo-50 border border-indigo-300 rounded-lg text-xs font-bold py-1.5 px-3 text-indigo-950 focus:outline-none focus:ring-2 focus:ring-slate-800"
              >
                {versions.map(v => (
                  <option key={v.id} value={v.versionNumber}>
                    {v.versionNumber} ({v.createdAt})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Mode Switch & Feedback Toggle */}
          <div className="flex items-center gap-3">
            {/* Feedback Toggle */}
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showFeedbackMarkers}
                onChange={e => setShowFeedbackMarkers(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>Hiện phản hồi liên đới</span>
            </label>

            <div className="h-4 w-px bg-slate-200" />

            {/* View Mode Buttons */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1">
              <button
                type="button"
                onClick={() => setDiffMode('side_by_side')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  diffMode === 'side_by_side'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Song song (Side-by-Side)
              </button>
              <button
                type="button"
                onClick={() => setDiffMode('unified')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  diffMode === 'unified'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Hợp nhất (Unified)
              </button>
            </div>
          </div>
        </div>

        {/* Change Statistics Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-900 font-bold">
              <PlusIcon className="w-4 h-4 text-emerald-600" />
              <span>Thêm mới:</span>
            </div>
            <span className="font-bold text-emerald-800 text-sm">+{diffSummary.addedWords} từ</span>
          </div>

          <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-900 font-bold">
              <MinusIcon className="w-4 h-4 text-rose-600" />
              <span>Lược bỏ:</span>
            </div>
            <span className="font-bold text-rose-800 text-sm">-{diffSummary.deletedWords} từ</span>
          </div>

          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-900 font-bold">
              <PencilSquareIcon className="w-4 h-4 text-amber-600" />
              <span>Đoạn chỉnh sửa:</span>
            </div>
            <span className="font-bold text-amber-800 text-sm">~{diffSummary.changedBlocks} khối</span>
          </div>

          <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-900 font-bold">
              <CheckCircleIcon className="w-4 h-4 text-indigo-600" />
              <span>Phản hồi đã xử lý:</span>
            </div>
            <span className="font-bold text-indigo-800 text-sm">{diffSummary.resolvedFeedbacks} góp ý</span>
          </div>
        </div>

        {/* Axis Navigation Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2">
          {POETIC_AXES.map(axis => {
            const isActive = activeAxisId === axis.id;
            return (
              <button
                key={axis.id}
                onClick={() => setActiveAxisId(axis.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition border ${
                  isActive
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {axis.shortName}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Diff Legend Non-Color Indicator */}
      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-600">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-bold text-slate-800">Quy ước ký hiệu:</span>
          <span className="flex items-center gap-1.5">
            <span className="font-mono font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300">+ Thêm mới</span>
            <span>(Nội dung bổ sung)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="font-mono font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded border border-rose-300 line-through">− Lược bỏ</span>
            <span>(Nội dung xóa)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="font-mono font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300">✎ Chỉnh sửa</span>
            <span>(Nâng cấp lập luận)</span>
          </span>
        </div>
        <span className="text-slate-400">Unicode Normalized: NFC tiếng Việt</span>
      </div>

      {/* ========================================================================= */}
      {/* MAIN DIFF COMPARISON DISPLAY */}
      {/* ========================================================================= */}
      <div className="space-y-6">
        {/* 1. SIDE BY SIDE MODE */}
        {diffMode === 'side_by_side' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LEFT COLUMN: V1 (OLD VERSION) */}
            <div className="space-y-4">
              <div className="p-3.5 bg-slate-100 rounded-2xl border border-slate-300 flex items-center justify-between sticky top-16 z-20">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    Bản sơ thảo ({selectedV1})
                  </span>
                  <span className="text-[11px] text-slate-500">Mốc nộp: 16/09/2026 09:15</span>
                </div>
                <Badge variant="slate">{selectedV1}</Badge>
              </div>

              <div className="space-y-4">
                {diffChunks.map(chunk => (
                  <Card
                    key={chunk.id}
                    padding="md"
                    className={`border transition-all ${
                      chunk.type === 'deleted'
                        ? 'border-rose-300 bg-rose-50/40'
                        : chunk.type === 'changed'
                        ? 'border-amber-200 bg-amber-50/30'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-100 pb-1">
                        <span className="font-semibold text-slate-600">{chunk.label}</span>
                        {chunk.type === 'deleted' && (
                          <span className="text-rose-700 font-bold font-mono">− BỊ XÓA</span>
                        )}
                        {chunk.type === 'changed' && (
                          <span className="text-amber-700 font-bold font-mono">✎ BẢN CŨ</span>
                        )}
                      </div>

                      {chunk.v1Text ? (
                        <p className={`text-xs sm:text-sm leading-relaxed ${chunk.type === 'deleted' ? 'text-rose-900 line-through' : 'text-slate-800'}`}>
                          {chunk.v1Text}
                        </p>
                      ) : (
                        <div className="py-6 text-center text-xs text-slate-400 italic bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
                          (Chưa có nội dung ở phiên bản {selectedV1})
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* RIGHT COLUMN: V2 (NEW VERSION) */}
            <div className="space-y-4">
              <div className="p-3.5 bg-indigo-50/80 rounded-2xl border border-indigo-200 flex items-center justify-between sticky top-16 z-20">
                <div>
                  <span className="text-xs font-bold text-indigo-950 block">
                    Bản chỉnh sửa ({selectedV2})
                  </span>
                  <span className="text-[11px] text-indigo-700">Mốc cập nhật: 18/09/2026 14:32</span>
                </div>
                <Badge variant="purple">{selectedV2}</Badge>
              </div>

              <div className="space-y-4">
                {diffChunks.map(chunk => (
                  <Card
                    key={chunk.id}
                    padding="md"
                    className={`border transition-all relative ${
                      chunk.type === 'added'
                        ? 'border-emerald-300 bg-emerald-50/40 shadow-xs'
                        : chunk.type === 'changed'
                        ? 'border-amber-300 bg-amber-50/40 shadow-xs'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] border-b border-slate-100 pb-1">
                        <span className="font-semibold text-slate-600">{chunk.label}</span>

                        {chunk.pedagogicalLabel && (
                          <span className="font-bold text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 flex items-center gap-1">
                            <TagIcon className="w-3 h-3" />
                            {chunk.pedagogicalLabel}
                          </span>
                        )}

                        {chunk.type === 'added' && (
                          <span className="text-emerald-700 font-bold font-mono">+ MỚI THÊM</span>
                        )}
                        {chunk.type === 'changed' && (
                          <span className="text-amber-800 font-bold font-mono">✎ ĐÃ NÂNG CẤP</span>
                        )}
                      </div>

                      {chunk.v2Text ? (
                        <p className={`text-xs sm:text-sm leading-relaxed ${chunk.type === 'added' ? 'text-emerald-950 font-medium' : 'text-slate-900'}`}>
                          {chunk.type === 'added' && <span className="font-mono font-bold text-emerald-700 mr-1">+</span>}
                          {chunk.v2Text}
                        </p>
                      ) : (
                        <div className="py-6 text-center text-xs text-slate-400 italic bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
                          (Đã lược bỏ ở phiên bản {selectedV2})
                        </div>
                      )}

                      {/* Explanation & Connected Feedback */}
                      <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-caption">
                        <span className="text-slate-500 italic">
                          💡 Lí giải sư phạm: {chunk.explanation}
                        </span>

                        {showFeedbackMarkers && chunk.relatedFeedbackId && (
                          <span className="text-emerald-700 font-bold bg-emerald-100/70 px-2 py-0.5 rounded border border-emerald-300 flex items-center gap-1 shrink-0">
                            <CheckCircleIcon className="w-3.5 h-3.5" />
                            Phản hồi này được xử lý trong {selectedV2}
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 2. UNIFIED MODE */}
        {diffMode === 'unified' && (
          <Card padding="lg" className="border-slate-200 bg-white shadow-card space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800">
                Toàn văn hồ sơ tích hợp thay đổi ({selectedV1} ➔ {selectedV2})
              </span>
              <span className="text-slate-500">Trục: {POETIC_AXES.find(a => a.id === activeAxisId)?.shortName}</span>
            </div>

            <div className="space-y-4 text-xs sm:text-sm leading-relaxed divide-y divide-slate-100">
              {diffChunks.map(chunk => (
                <div key={chunk.id} className="pt-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{chunk.label}</span>
                    {chunk.pedagogicalLabel && (
                      <Badge variant="purple" size="sm">{chunk.pedagogicalLabel}</Badge>
                    )}
                  </div>

                  {chunk.type === 'deleted' && (
                    <div className="p-3 rounded-lg bg-rose-50 border-l-4 border-rose-500 text-rose-900 line-through">
                      <span className="font-mono font-bold mr-1">− </span>
                      {chunk.v1Text}
                    </div>
                  )}

                  {chunk.type === 'added' && (
                    <div className="p-3 rounded-lg bg-emerald-50 border-l-4 border-emerald-500 text-emerald-950 font-medium">
                      <span className="font-mono font-bold text-emerald-700 mr-1">+ </span>
                      {chunk.v2Text}
                    </div>
                  )}

                  {chunk.type === 'changed' && (
                    <div className="space-y-2">
                      <div className="p-2.5 rounded-lg bg-rose-50/60 border-l-2 border-rose-300 text-rose-800 line-through text-xs">
                        <span className="font-mono font-bold mr-1">− </span>
                        {chunk.v1Text}
                      </div>
                      <div className="p-2.5 rounded-lg bg-emerald-50 border-l-4 border-emerald-500 text-emerald-950 font-medium text-xs">
                        <span className="font-mono font-bold text-emerald-700 mr-1">+ </span>
                        {chunk.v2Text}
                      </div>
                    </div>
                  )}

                  {chunk.type === 'unchanged' && (
                    <p className="text-slate-800 px-3">
                      {chunk.v2Text}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Connected Pedagogical Feedbacks Section */}
      <section aria-labelledby="diff-feedbacks-heading">
        <Card padding="lg" className="border-indigo-200 bg-indigo-50/30 space-y-4">
          <div className="flex items-center justify-between">
            <h2 id="diff-feedbacks-heading" className="text-h4 font-bold text-slate-900 flex items-center gap-2">
              <ChatBubbleLeftRightIcon className="w-5 h-5 text-indigo-700" />
              Minh Chứng Tiếp Thu Phản Hồi Trong Phiên Bản {selectedV2}
            </h2>
            <Badge variant="emerald">{diffSummary.resolvedFeedbacks} phản hồi đã giải quyết</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {axisFeedbacks.map(fb => (
              <div
                key={fb.id}
                className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={fb.authorRole === 'teacher' ? 'emerald' : 'amber'} size="sm">
                      {fb.authorRole === 'teacher' ? 'Giáo viên' : 'Bạn học'}
                    </Badge>
                    <span className="font-bold text-slate-900">{fb.authorName}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">{fb.createdAt}</span>
                </div>

                <div className="p-2 rounded bg-slate-50 border-l-2 border-amber-400 text-slate-700 italic">
                  "{fb.selectedSnippet}"
                </div>

                <p className="text-slate-800 leading-relaxed">{fb.comment}</p>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-caption">
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircleIcon className="w-3.5 h-3.5" />
                    Đã nâng cấp trong {selectedV2}
                  </span>
                  <span className="text-slate-400">Trục: Điểm nhìn</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* Modal Restore Historical Version */}
      <Modal
        isOpen={isRestoreModalOpen}
        onClose={() => setIsRestoreModalOpen(false)}
        title={`Khôi Phục Bản Nháp Từ Phiên Bản ${selectedV1}`}
        description="Tạo một phiên bản làm việc mới kế thừa toàn bộ nội dung từ bản snapshot được chọn. Bản lịch sử cũ vẫn được bảo lưu bất biến."
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsRestoreModalOpen(false)}>
              Hủy bỏ
            </Button>
            <Button variant="primary" onClick={handleRestoreVersion} className="bg-indigo-900 text-white font-bold">
              Xác nhận khôi phục thành bản mới
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-xs text-slate-700">
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-950">
            <strong>Lưu ý quan trọng:</strong> Hệ thống không ghi đè (overwrite) lịch sử. Sau khi xác nhận, hệ thống sẽ tạo một phiên bản nháp tiếp theo với ghi chú <em>“Khôi phục từ {selectedV1}”</em>.
          </div>
          <p>
            Bạn có chắc chắn muốn nạp lại nội dung từ phiên bản <strong>{selectedV1}</strong> vào phòng soạn thảo?
          </p>
        </div>
      </Modal>
    </div>
  );
};
