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
    const r = await fetch('/api/academic/snapshot', { credentials: 'include', cache: 'no-store' });
    const d = await r.json();
    if (!r.ok) throw new Error(d.message || 'Không thể tải hàng đợi');
    setSnapshot(d.snapshot);
  }, []);

  useEffect(() => { void refresh().catch(e => setMessage({ type: 'error', text: e.message })); }, [refresh]);

  const reviews = useMemo<AiReviewRequest[]>(() => snapshot?.aiReviews || [], [snapshot]);
  const selected = reviews.find(x => x.id === selectedId) || reviews[0] || null;

  useEffect(() => {
    if (selected && selected.id !== selectedId) {
      setSelectedId(selected.id);
      setResponse(selected.response || '');
    }
  }, [selected, selectedId]);

  const portfolioKey = selected ? `port-${selected.student_id}-${selected.assignment_id}` : '';
  const currentPortfolio = snapshot?.portfolios?.[portfolioKey];
  const currentVersion = currentPortfolio?.versions?.find(v => v.versionNumber === selected?.version_number);
  const assignment = snapshot?.assignments?.find(a => a.id === selected?.assignment_id);
  const literatureText = snapshot?.literatureTexts?.find(t => t.id === assignment?.textId);
  const rubric = assignment ? (snapshot?.rubrics?.[assignment.rubricId] || snapshot?.rubric) : snapshot?.rubric;
  const integrityError = Boolean(selected && (!currentPortfolio || !currentVersion));

  const pendingCount = reviews.filter(x => x.status !== 'completed').length;
  const completedCount = reviews.filter(x => x.status === 'completed').length;

  const publishAiFeedback = async () => {
    if (!selected || !currentVersion || integrityError) return;
    setLoading(true);
    setMessage(null);
    try {
      const rubricProposal = rubric?.criteria?.length
        ? { rubricId: rubric.id, criteria: rubric.criteria.map(c => ({ id: c.id, title: c.title })) }
        : null;
      await postAction({ action: 'ai_complete_review', reviewId: selected.id, response: response.trim(), axisId, rubricProposal });
      setMessage({ type: 'success', text: 'Đã gửi góp ý AI. Học sinh thấy ngay phản hồi này để chỉnh sửa; giáo viên vẫn xem được lịch sử và có thể duyệt, sửa hoặc bổ sung sau.' });
      await refresh();
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Không thể gửi góp ý AI' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl space-y-5 pb-16">
      <div className="flex flex-col gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Tài khoản phản hồi AI</h1>
          <p className="mt-0.5 text-sm text-slate-500">Không gọi API trả phí. Bạn sao chép response từ ChatGPT, dán vào đây và gửi để học sinh nhận góp ý AI ngay.</p>
        </div>
        <div className="text-sm text-slate-600">{pendingCount} chờ nhập · {completedCount} đã gửi</div>
      </div>

      {message && <Alert type={message.type} title={message.type === 'success' ? 'Thành công' : 'Có lỗi'}>{message.text}</Alert>}
      {integrityError && <Alert type="error" title="Không thể mở bản đã nộp">Không tìm thấy đúng phiên bản bất biến gắn với yêu cầu AI. Hệ thống đã khóa thao tác gửi để tránh phản hồi nhầm vào bản nháp mới hơn.</Alert>}

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)_360px]">
        <aside className="flex h-[78vh] flex-col overflow-hidden rounded-md border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/70 p-3">
            <span className="text-sm font-semibold text-slate-700">Danh sách bài nộp</span>
            <button onClick={() => void refresh()} className="rounded p-1 text-slate-500 hover:bg-slate-200" title="Tải lại" aria-label="Tải lại hàng đợi"><ArrowPathIcon className="h-4 w-4" /></button>
          </div>
          <div className="flex-1 divide-y divide-slate-100 overflow-y-auto">
            {reviews.length === 0 ? <p className="p-4 text-sm text-slate-500">Chưa có bài nộp trong hàng đợi.</p> : reviews.map(item => {
              const isSelected = selected?.id === item.id;
              return <button key={item.id} onClick={() => { setSelectedId(item.id); setResponse(item.response || ''); }} className={`w-full p-3 text-left transition-colors ${isSelected ? 'bg-slate-100 font-medium' : 'hover:bg-slate-50'}`}>
                <div className="flex items-center justify-between gap-2"><span className="truncate text-sm text-slate-900">{item.student_name}</span><span className="shrink-0 text-sm text-slate-500">{item.status === 'completed' ? 'Đã gửi HS' : 'Chờ nhập'}</span></div>
                <div className="mt-0.5 text-sm text-slate-500">{item.version_number} · {item.assignment_id}</div>
              </button>;
            })}
          </div>
        </aside>

        <main className="h-[78vh] space-y-5 overflow-y-auto rounded-md border border-slate-200 bg-white p-5">
          {!selected ? <div className="py-24 text-center text-sm text-slate-500">Chọn một bài từ hàng đợi bên trái để xem nội dung.</div> : integrityError ? <div className="py-24 text-center text-sm text-slate-500">Không thể hiển thị bài vì phiên bản bất biến không khớp yêu cầu AI.</div> : <>
            <div className="border-b border-slate-200 pb-3">
              <div className="flex items-baseline justify-between gap-2"><h2 className="text-lg font-semibold text-slate-900">{selected.student_name} — {selected.version_number}</h2><span className="text-sm text-slate-500">{currentVersion?.stage === 'prediction' ? 'Dự đoán trước đọc' : currentVersion?.stage === 'initial' ? 'Bản đầu' : 'Bản chỉnh sửa'}</span></div>
              <div className="mt-1 text-sm text-slate-600">Nhiệm vụ: {assignment?.title || selected.assignment_id}{literatureText && ` · Tác phẩm: ${literatureText.title} (${literatureText.author})`}</div>
            </div>
            {selected.prompt && <div className="rounded-r border-l-2 border-slate-400 bg-slate-50 p-3 text-sm leading-relaxed text-slate-700"><strong>Yêu cầu hệ thống:</strong> {selected.prompt}</div>}
            <div className="space-y-4"><h3 className="text-sm font-semibold text-slate-800">Bài viết của học sinh theo các trục</h3>{axes.map(axis => {
              const resp = currentVersion?.responses?.[axis.id];
              const text = typeof resp?.analysisText === 'string' ? resp.analysisText.trim() : '';
              const quotes = Array.isArray(resp?.evidenceQuotes) ? resp.evidenceQuotes : [];
              return <div key={axis.id} className="space-y-1 border-t border-slate-100 pt-3"><div className="text-sm font-medium text-slate-900">{axis.label}</div>{text ? <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">{text}</p> : <span className="text-sm italic text-slate-400">Chưa viết nội dung ở trục này.</span>}{quotes.length > 0 && <div className="space-y-0.5 pt-1">{quotes.map(q => <blockquote key={q.id} className="border-l-2 border-slate-300 pl-2 text-sm italic text-slate-500">{q.text}</blockquote>)}</div>}</div>;
            })}</div>
          </>}
        </main>

        <aside className="flex h-[78vh] flex-col overflow-y-auto rounded-md border border-slate-200 bg-white p-4">
          <div className="space-y-4">
            <div className="border-b border-slate-200 pb-2"><h2 className="text-sm font-semibold text-slate-900">Dán response ChatGPT</h2><p className="mt-0.5 text-sm text-slate-500">Đây là thao tác thủ công thay cho tích hợp API. Hãy đối chiếu đúng bài, đúng phiên bản trước khi gửi.</p></div>
            {assignment?.aiGuidance && <div className="rounded-md border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-700"><strong>Định hướng AI:</strong><div className="mt-1 whitespace-pre-wrap">{assignment.aiGuidance}</div></div>}
            {assignment?.commonMistakes && <div className="rounded-md border border-slate-200 p-2.5 text-sm text-slate-700"><strong>Lỗi thường gặp:</strong><div className="mt-1 whitespace-pre-wrap">{assignment.commonMistakes}</div></div>}
            {assignment?.referenceGuide && <details className="rounded-md border border-slate-200 p-2.5 text-sm text-slate-700"><summary className="cursor-pointer font-medium">Gợi ý chuyên môn tham chiếu</summary><div className="mt-2 max-h-48 overflow-y-auto whitespace-pre-wrap text-slate-600">{assignment.referenceGuide}</div></details>}
            {rubric?.criteria?.length ? <details className="rounded-md border border-slate-200 p-2.5 text-sm text-slate-700"><summary className="cursor-pointer font-medium">Rubric giáo viên ({rubric.criteria.length} tiêu chí)</summary><div className="mt-2 space-y-1">{rubric.criteria.map(c => <div key={c.id} className="border-t border-slate-100 pt-1">{c.title}</div>)}</div></details> : null}
            <div><label className="mb-1 block text-sm font-medium text-slate-700">Trọng tâm phản hồi</label><select value={axisId} onChange={e => setAxisId(e.target.value as PoeticAxisId)} className="w-full rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-800 outline-none focus:border-slate-500">{axes.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}</select></div>
            <div><label className="mb-1 block text-sm font-medium text-slate-700">Response từ ChatGPT</label><textarea rows={10} value={response} onChange={e => setResponse(e.target.value)} placeholder="Dán toàn bộ response ChatGPT tại đây. Khi bấm gửi, học sinh sẽ thấy nội dung này." className="w-full rounded-md border border-slate-300 p-2.5 text-sm text-slate-800 outline-none focus:border-slate-500" /></div>
          </div>
          <div className="mt-4 border-t border-slate-200 pt-3"><Button variant="primary" size="sm" className="w-full" isLoading={loading} disabled={!selected || !currentVersion || integrityError || !response.trim() || selected?.status === 'completed'} onClick={publishAiFeedback}>Gửi góp ý AI cho học sinh</Button><p className="mt-2 text-center text-sm text-slate-400">Học sinh thấy ngay; giáo viên vẫn giữ quyền đánh giá chính thức.</p></div>
        </aside>
      </div>
    </div>
  );
};
