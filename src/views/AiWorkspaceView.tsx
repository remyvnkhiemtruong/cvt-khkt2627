import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button } from '../components/ui';
import type { AcademicSnapshot, AiReviewRequest, PoeticAxisId } from '../types';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

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

  const pendingCount = reviews.filter(x => x.status !== 'completed').length;
  const completedCount = reviews.filter(x => x.status === 'completed').length;

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
    <div className="max-w-7xl space-y-5 pb-16">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Hàng đợi AI</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Soạn đề xuất phản hồi học thuật. Đề xuất sẽ được giáo viên duyệt trước khi gửi học sinh.
          </p>
        </div>
        <div className="text-xs text-slate-600">
          {pendingCount} chờ xử lý · {completedCount} đã đề xuất
        </div>
      </div>

      {message && (
        <Alert type={message.type} title={message.type === 'success' ? 'Thành công' : 'Có lỗi'}>
          {message.text}
        </Alert>
      )}

      {/* Review Inbox Layout */}
      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)_340px]">
        {/* Left: Queue Rows */}
        <aside className="border border-slate-200 rounded-md bg-white overflow-hidden flex flex-col h-[78vh]">
          <div className="p-3 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">Danh sách bài nộp</span>
            <button
              onClick={() => void refresh()}
              className="rounded p-1 hover:bg-slate-200 text-slate-500"
              title="Tải lại"
            >
              <ArrowPathIcon className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {reviews.length === 0 ? (
              <p className="p-4 text-xs text-slate-500">Chưa có bài nộp trong hàng đợi.</p>
            ) : (
              reviews.map(item => {
                const isSelected = selected?.id === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSelectedId(item.id);
                      setResponse(item.response || '');
                    }}
                    className={`w-full p-3 text-left transition-colors ${
                      isSelected ? 'bg-slate-100 font-medium' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm text-slate-900 truncate">{item.student_name}</span>
                      <span className="text-xs text-slate-500 shrink-0">
                        {item.status === 'completed' ? 'Đã đề xuất' : 'Chờ xử lý'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {item.version_number} · {item.assignment_id}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Center: Student Submission Content */}
        <main className="border border-slate-200 rounded-md bg-white p-5 overflow-y-auto h-[78vh] space-y-5">
          {!selected ? (
            <div className="py-24 text-center text-sm text-slate-500">
              Chọn một bài từ hàng đợi bên trái để xem nội dung.
            </div>
          ) : (
            <>
              <div className="border-b border-slate-200 pb-3">
                <div className="flex items-baseline justify-between gap-2">
                  <h2 className="text-lg font-semibold text-slate-900">
                    {selected.student_name} — {selected.version_number}
                  </h2>
                  <span className="text-xs text-slate-500">
                    {currentVersion?.stage === 'prediction'
                      ? 'Dự đoán trước đọc'
                      : currentVersion?.stage === 'initial'
                      ? 'Bản đầu'
                      : 'Bản chỉnh sửa'}
                  </span>
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  Nhiệm vụ: {assignment?.title || selected.assignment_id}
                  {literatureText && ` · Tác phẩm: ${literatureText.title} (${literatureText.author})`}
                </div>
              </div>

              {/* Assignment Prompt */}
              {selected.prompt && (
                <div className="bg-slate-50 border-l-2 border-slate-400 p-3 rounded-r text-xs text-slate-700 leading-relaxed">
                  <strong>Yêu cầu:</strong> {selected.prompt}
                </div>
              )}

              {/* Student Responses by Axis */}
              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-slate-800">Bài viết của học sinh theo các trục:</h3>
                {axes.map(axis => {
                  const resp = currentVersion?.responses?.[axis.id] || currentPortfolio?.currentDraft?.[axis.id];
                  const text = resp?.analysisText?.trim();
                  const quotes = resp?.evidenceQuotes || [];

                  return (
                    <div key={axis.id} className="border-t border-slate-100 pt-3 space-y-1">
                      <div className="text-xs font-medium text-slate-900">{axis.label}</div>
                      {text ? (
                        <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                          {text}
                        </p>
                      ) : (
                        <span className="text-xs italic text-slate-400">Chưa viết nội dung ở trục này.</span>
                      )}
                      {quotes.length > 0 && (
                        <div className="pt-1 space-y-0.5">
                          {quotes.map(q => (
                            <blockquote key={q.id} className="border-l-2 border-slate-300 pl-2 text-xs italic text-slate-500">
                              {q.text}
                            </blockquote>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </main>

        {/* Right: Proposal Composer */}
        <aside className="border border-slate-200 rounded-md bg-white p-4 h-[78vh] flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-slate-200 pb-2">
              <h2 className="text-sm font-semibold text-slate-900">Soạn đề xuất AI</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Nhận xét gợi ý giúp giáo viên tham khảo khi chấm bài.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Trọng tâm phản hồi</label>
              <select
                value={axisId}
                onChange={e => setAxisId(e.target.value as PoeticAxisId)}
                className="w-full rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-800 outline-none focus:border-slate-500"
              >
                {axes.map(a => (
                  <option key={a.id} value={a.id}>{a.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Nội dung đề xuất</label>
              <textarea
                rows={12}
                value={response}
                onChange={e => setResponse(e.target.value)}
                placeholder="Gợi ý nhận xét cụ thể: điểm tốt, chỗ cần đào sâu và hướng sửa đổi..."
                className="w-full rounded-md border border-slate-300 p-2.5 text-sm text-slate-800 outline-none focus:border-slate-500"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200">
            <Button
              variant="primary"
              size="sm"
              className="w-full"
              isLoading={loading}
              disabled={!selected || !response.trim()}
              onClick={saveAiProposal}
            >
              Lưu đề xuất
            </Button>
            <p className="text-xs text-slate-400 text-center mt-2">
              Đề xuất sẽ được chuyển tới giáo viên phê duyệt.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};
