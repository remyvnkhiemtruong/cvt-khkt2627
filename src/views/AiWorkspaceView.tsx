import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, PageHeader, Card } from '../components/ui';
import type { AcademicSnapshot, AiReviewRequest, PoeticAxisId } from '../types';
import {
  ArrowPathIcon,
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

const axes: { id: PoeticAxisId; label: string }[] = [
  { id: 'plot_situation', label: 'Tình huống – Cốt truyện' },
  { id: 'character_detail', label: 'Nhân vật – Chi tiết' },
  { id: 'narrator_pov', label: 'Người kể chuyện – Điểm nhìn' },
  { id: 'space_time', label: 'Không gian – Thời gian' },
  { id: 'language_tone_symbol', label: 'Ngôn ngữ – Giọng điệu – Biểu tượng' },
  { id: 'form_argument', label: 'Tổng hợp & Lập luận' }
];

async function postAction(payload: unknown) {
  const r = await fetch('/api/academic/action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload)
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.message || d.code || 'Không thể cập nhật');
  return d;
}

export const AiWorkspaceView: React.FC = () => {
  const [snapshot, setSnapshot] = useState<AcademicSnapshot | null>(null);
  const [selectedId, setSelectedId] = useState('');
  const [response, setResponse] = useState('');
  const [axisId, setAxisId] = useState<PoeticAxisId>('form_argument');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const refresh = useCallback(async () => {
    const r = await fetch('/api/academic/snapshot', { credentials: 'include' });
    const d = await r.json();
    if (!r.ok) throw new Error(d.message || 'Không thể tải hàng đợi');
    setSnapshot(d.snapshot);
  }, []);

  useEffect(() => {
    void refresh().catch(e => setMessage({ type: 'error', text: e.message }));
  }, [refresh]);

  const reviews = useMemo<AiReviewRequest[]>(() => snapshot?.aiReviews || [], [snapshot]);
  const selected = reviews.find(x => x.id === selectedId) || reviews[0] || null;

  useEffect(() => {
    if (selected && selected.id !== selectedId) {
      setSelectedId(selected.id);
      setResponse(selected.response || '');
    }
  }, [selected, selectedId]);

  // Context lookup
  const portfolioKey = selected ? `port-${selected.student_id}-${selected.assignment_id}` : '';
  const currentPortfolio = snapshot?.portfolios?.[portfolioKey];
  const currentVersion = currentPortfolio?.versions?.find(v => v.versionNumber === selected?.version_number);
  const assignment = snapshot?.assignments?.find(a => a.id === selected?.assignment_id);
  const literatureText = snapshot?.literatureTexts?.find(t => t.id === assignment?.textId);
  const priorFeedbacks = useMemo(() => {
    if (!snapshot || !selected) return [];
    return (snapshot.feedbacks || []).filter(
      f => f.studentId === selected.student_id && f.assignmentId === selected.assignment_id
    );
  }, [snapshot, selected]);

  const saveAiProposal = async () => {
    if (!selected) return;
    setLoading(true);
    setMessage(null);
    try {
      await postAction({
        action: 'ai_complete_review',
        reviewId: selected.id,
        response: response.trim(),
        axisId
      });
      setMessage({
        type: 'success',
        text: 'Đã lưu đề xuất phản hồi AI. Đang chờ giáo viên phụ trách duyệt.'
      });
      await refresh();
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-16">
      <PageHeader
        title="Hàng đợi phản hồi AI"
        description="Đề xuất phản hồi học thuật theo 6 trục thi pháp. Đề xuất sẽ chuyển đến giáo viên kiểm duyệt trước khi hiển thị cho học sinh."
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="amber">Chờ AI xử lý: {reviews.filter(x => x.status !== 'completed').length}</Badge>
            <Badge variant="emerald">Đã lưu đề xuất: {reviews.filter(x => x.status === 'completed').length}</Badge>
          </div>
        }
      />

      {message && (
        <Alert type={message.type} title={message.type === 'success' ? 'Thành công' : 'Có lỗi xảy ra'}>
          {message.text}
        </Alert>
      )}

      <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
        {/* Left list */}
        <aside className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="mb-2 flex items-center justify-between px-1">
            <span className="text-xs font-semibold text-slate-700">Hàng đợi bài nộp</span>
            <button
              onClick={() => void refresh()}
              className="rounded p-1 hover:bg-slate-100 text-slate-500"
              title="Tải lại"
            >
              <ArrowPathIcon className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="max-h-[72vh] space-y-1.5 overflow-y-auto">
            {reviews.length === 0 ? (
              <p className="rounded border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
                Chưa có bài nộp nào trong hàng đợi.
              </p>
            ) : (
              reviews.map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    setSelectedId(item.id);
                    setResponse(item.response || '');
                  }}
                  className={`w-full rounded-md border p-2.5 text-left transition-colors ${
                    selected?.id === item.id
                      ? 'border-indigo-400 bg-indigo-50/50'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex justify-between items-center gap-2">
                    <b className="text-xs font-semibold text-slate-900 truncate">{item.student_name}</b>
                    <Badge variant={item.status === 'completed' ? 'emerald' : 'amber'} size="sm">
                      {item.status === 'completed' ? 'Đã đề xuất' : 'Chờ AI'}
                    </Badge>
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500">
                    {item.assignment_id} • {item.version_number}
                  </div>
                  {item.teacher_review_status && item.teacher_review_status !== 'pending' && (
                    <div className="mt-1 text-[11px] font-medium text-indigo-700">
                      GV đã duyệt: {item.teacher_review_status}
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Right workspace: Full Context + Proposal Composer */}
        <main className="space-y-4">
          {!selected ? (
            <Card padding="lg">
              <div className="py-20 text-center text-xs text-slate-500">
                Chọn một bài trong hàng đợi bên trái để xem ngữ cảnh và soạn đề xuất.
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Context Panel */}
              <Card padding="md">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">
                      Học sinh: {selected.student_name} — Phiên bản: {selected.version_number}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Nhiệm vụ: {assignment?.title || selected.assignment_id}
                    </p>
                  </div>
                  <Badge variant="indigo">
                    {currentVersion?.stage === 'prediction'
                      ? 'Dự đoán trước đọc'
                      : currentVersion?.stage === 'initial'
                      ? 'Bản đầu tiên'
                      : 'Bản sửa đổi (Revision)'}
                  </Badge>
                </div>

                {/* Assignment & Literature Excerpt */}
                <div className="mt-3 grid gap-3 md:grid-cols-2 text-xs">
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-3 leading-5">
                    <span className="font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
                      <BookOpenIcon className="h-3.5 w-3.5 text-slate-500" />
                      Yêu cầu nhiệm vụ:
                    </span>
                    <p className="text-slate-600">{selected.prompt || assignment?.prompt}</p>
                  </div>

                  {literatureText && (
                    <div className="rounded-md border border-slate-200 bg-slate-50 p-3 leading-5">
                      <span className="font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
                        <DocumentTextIcon className="h-3.5 w-3.5 text-slate-500" />
                        Tác phẩm: {literatureText.title} ({literatureText.author})
                      </span>
                      <p className="text-slate-600 line-clamp-3 italic">
                        {literatureText.synopsis || literatureText.excerpt}
                      </p>
                    </div>
                  )}
                </div>

                {/* Student Responses across 6 axes */}
                <div className="mt-4 border-t border-slate-100 pt-3">
                  <span className="text-xs font-semibold text-slate-800 block mb-2">
                    Bài viết của học sinh ({selected.version_number}):
                  </span>
                  <div className="grid gap-2 sm:grid-cols-2 max-h-64 overflow-y-auto rounded-md border border-slate-200 bg-slate-50/50 p-2 text-xs">
                    {axes.map(axis => {
                      const resp = currentVersion?.responses?.[axis.id] || currentPortfolio?.currentDraft?.[axis.id];
                      const text = resp?.analysisText?.trim();
                      const quotes = resp?.evidenceQuotes || [];
                      return (
                        <div key={axis.id} className="rounded border border-slate-200 bg-white p-2.5">
                          <span className="font-semibold text-indigo-900 block mb-1">{axis.label}</span>
                          {text ? (
                            <p className="text-slate-700 whitespace-pre-wrap leading-5">{text}</p>
                          ) : (
                            <span className="italic text-slate-400">Chưa viết nội dung</span>
                          )}
                          {quotes.length > 0 && (
                            <div className="mt-1.5 border-t border-slate-100 pt-1 text-[11px] text-slate-500 italic">
                              Dẫn chứng: {quotes.map(q => `"${q.text}"`).join('; ')}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Prior feedbacks if any */}
                {priorFeedbacks.length > 0 && (
                  <div className="mt-3 border-t border-slate-100 pt-3">
                    <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5 mb-1.5">
                      <ChatBubbleLeftRightIcon className="h-3.5 w-3.5 text-slate-500" />
                      Lịch sử phản hồi trước đó ({priorFeedbacks.length} nhận xét):
                    </span>
                    <div className="space-y-1.5 max-h-28 overflow-y-auto rounded border border-slate-200 bg-slate-50 p-2 text-xs">
                      {priorFeedbacks.map(f => (
                        <div key={f.id} className="text-slate-700">
                          <span className="font-semibold text-slate-800">
                            {f.authorRole === 'teacher' ? 'Giáo viên' : (f.authorRole === 'peer' ? 'Bạn học' : 'AI')}:
                          </span>{' '}
                          {f.comment}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>

              {/* Proposal Composer */}
              <Card padding="md">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <SparklesIcon className="h-4 w-4 text-indigo-600" />
                    Soạn đề xuất phản hồi AI
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Nội dung lưu tại đây sẽ hiển thị trong danh sách chờ duyệt của giáo viên phụ trách.
                  </p>
                </div>

                <div className="mt-3 space-y-3">
                  <label className="block text-xs font-semibold text-slate-700">
                    Trọng tâm nhận xét (Trục thi pháp chính):
                    <select
                      className="mt-1.5 w-full rounded-md border border-slate-300 p-2 text-xs outline-none focus:border-indigo-500"
                      value={axisId}
                      onChange={e => setAxisId(e.target.value as PoeticAxisId)}
                    >
                      {axes.map(x => (
                        <option key={x.id} value={x.id}>
                          {x.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block text-xs font-semibold text-slate-700">
                    Nội dung đề xuất phản hồi:
                    <textarea
                      className="mt-1.5 w-full rounded-md border border-slate-300 p-3 text-xs leading-5 text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      rows={8}
                      value={response}
                      onChange={e => setResponse(e.target.value)}
                      placeholder="Nhập đề xuất phản hồi sư phạm: chỉ ra điểm làm tốt, điểm cần bổ sung dẫn chứng, gợi ý bước tiếp theo..."
                    />
                  </label>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-slate-500">
                      {selected.teacher_review_status === 'pending'
                        ? 'Trạng thái: Đang chờ giáo viên duyệt'
                        : `Trạng thái giáo viên: ${selected.teacher_review_status}`}
                    </span>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={saveAiProposal}
                      isLoading={loading}
                      disabled={!response.trim()}
                      leftIcon={<SparklesIcon className="h-4 w-4" />}
                    >
                      Lưu đề xuất AI
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
