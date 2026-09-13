import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, PageHeader } from '../components/ui';
import type { AcademicSnapshot, AiReviewRequest, PoeticAxisId } from '../types';
import { ArrowPathIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

const axes: { id: PoeticAxisId; label: string }[] = [
  { id: 'plot_situation', label: 'Tình huống – Cốt truyện' },
  { id: 'character_detail', label: 'Nhân vật – Chi tiết' },
  { id: 'narrator_pov', label: 'Người kể chuyện – Điểm nhìn' },
  { id: 'space_time', label: 'Không gian – Thời gian' },
  { id: 'language_tone_symbol', label: 'Ngôn ngữ – Giọng điệu – Biểu tượng' },
  { id: 'form_argument', label: 'Tổng hợp & Lập luận' }
];

type QueueFilter = 'pending' | 'completed' | 'all';

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
  const [filter, setFilter] = useState<QueueFilter>('pending');

  const refresh = useCallback(async () => {
    const r = await fetch('/api/academic/snapshot', { credentials: 'include', cache: 'no-store' });
    const d = await r.json();
    if (!r.ok) throw new Error(d.message || 'Không thể tải hàng đợi');
    setSnapshot(d.snapshot);
  }, []);

  useEffect(() => { void refresh().catch(e => setMessage({ type: 'error', text: e.message })); }, [refresh]);

  const reviews = useMemo<AiReviewRequest[]>(() => snapshot?.aiReviews || [], [snapshot]);
  const pendingCount = reviews.filter(x => x.status !== 'completed').length;
  const completedCount = reviews.filter(x => x.status === 'completed').length;
  const displayedReviews = useMemo(() => reviews.filter(item => filter === 'all' ? true : filter === 'completed' ? item.status === 'completed' : item.status !== 'completed'), [reviews, filter]);
  const selected = displayedReviews.find(x => x.id === selectedId) || displayedReviews[0] || null;

  useEffect(() => {
    if (selected && selected.id !== selectedId) {
      setSelectedId(selected.id);
      setResponse(selected.response || '');
    }
    if (!selected && selectedId) setSelectedId('');
  }, [selected, selectedId]);

  const portfolioKey = selected ? `port-${selected.student_id}-${selected.assignment_id}` : '';
  const currentPortfolio = snapshot?.portfolios?.[portfolioKey];
  const currentVersion = currentPortfolio?.versions?.find(v => v.versionNumber === selected?.version_number);
  const assignment = snapshot?.assignments?.find(a => a.id === selected?.assignment_id);
  const literatureText = snapshot?.literatureTexts?.find(t => t.id === assignment?.textId);
  const rubric = assignment ? (snapshot?.rubrics?.[assignment.rubricId] || snapshot?.rubric) : snapshot?.rubric;
  const integrityError = Boolean(selected && (!currentPortfolio || !currentVersion));

  const publishAiFeedback = async () => {
    if (!selected || !currentVersion || integrityError) return;
    setLoading(true);
    setMessage(null);
    try {
      const rubricProposal = rubric?.criteria?.length
        ? { rubricId: rubric.id, criteria: rubric.criteria.map(c => ({ id: c.id, title: c.title })) }
        : null;
      await postAction({ action: 'ai_complete_review', reviewId: selected.id, response: response.trim(), axisId, rubricProposal });
      setMessage({ type: 'success', text: 'Đã gửi góp ý AI. Học sinh thấy ngay phản hồi này để chỉnh sửa; giáo viên vẫn xem được lịch sử và có thể bổ sung nhận xét riêng.' });
      await refresh();
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Không thể gửi góp ý AI' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="v3-page space-y-5 pb-20">
      <PageHeader
        eyebrow="AI Workspace"
        title="Nhập phản hồi AI"
        description="Không gọi API trả phí. Sao chép response từ ChatGPT, dán vào đúng phiên bản bất biến và gửi để học sinh nhận phản hồi ngay."
        actions={<Button size="sm" variant="outline" onClick={() => void refresh()} leftIcon={<ArrowPathIcon className="h-4 w-4" />}>Tải lại</Button>}
      />

      <div className="flex flex-wrap items-center gap-2">
        {([
          ['pending', `Chờ nhập · ${pendingCount}`],
          ['completed', `Đã gửi · ${completedCount}`],
          ['all', `Tất cả · ${reviews.length}`]
        ] as [QueueFilter, string][]).map(([value, label]) => (
          <button key={value} type="button" onClick={() => setFilter(value)} className={`rounded-lg border px-3 py-2 text-xs font-semibold ${filter === value ? 'border-primary-200 bg-primary-50 text-primary-900' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}>{label}</button>
        ))}
      </div>

      {message && <Alert type={message.type} title={message.type === 'success' ? 'Thành công' : 'Có lỗi'}>{message.text}</Alert>}
      {integrityError && <Alert type="error" title="Không thể mở bản đã nộp">Không tìm thấy đúng phiên bản bất biến gắn với yêu cầu AI. Hệ thống đã khóa thao tác gửi để tránh phản hồi nhầm vào bản nháp mới hơn.</Alert>}

      <div className="grid gap-5 lg:grid-cols-[290px_minmax(0,1fr)_370px]">
        <aside className="flex min-h-[620px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white lg:h-[78vh]">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/70 px-4 py-3">
            <div><span className="text-sm font-bold text-slate-800">Hàng đợi</span><div className="mt-0.5 text-xs text-slate-500">{displayedReviews.length} bài trong bộ lọc</div></div>
            <button type="button" onClick={() => void refresh()} className="rounded-lg p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-900" title="Tải lại" aria-label="Tải lại hàng đợi"><ArrowPathIcon className="h-4 w-4" /></button>
          </div>
          <div className="flex-1 space-y-1 overflow-y-auto p-2">
            {displayedReviews.length === 0 ? <p className="p-4 text-sm leading-6 text-slate-500">Không có bài trong trạng thái này.</p> : displayedReviews.map(item => {
              const isSelected = selected?.id === item.id;
              const completed = item.status === 'completed';
              return <button key={item.id} type="button" onClick={() => { setSelectedId(item.id); setResponse(item.response || ''); }} aria-current={isSelected ? 'true' : undefined} className={`w-full rounded-lg border p-3 text-left transition-colors ${isSelected ? 'border-primary-200 bg-primary-50' : 'border-transparent hover:border-slate-200 hover:bg-slate-50'}`}>
                <div className="flex items-start justify-between gap-2"><span className={`truncate text-sm ${isSelected ? 'font-bold text-primary-950' : 'font-semibold text-slate-900'}`}>{item.student_name}</span>{completed ? <CheckCircleIcon className="h-4 w-4 shrink-0 text-emerald-600" /> : <ClockIcon className="h-4 w-4 shrink-0 text-amber-600" />}</div>
                <div className={`mt-1 text-xs ${isSelected ? 'text-primary-700' : 'text-slate-500'}`}>{item.version_number} · {completed ? 'Đã gửi học sinh' : 'Chờ nhập'}</div>
              </button>;
            })}
          </div>
        </aside>

        <main className="min-h-[620px] overflow-y-auto rounded-xl border border-slate-200 bg-white p-4 sm:p-5 lg:h-[78vh]">
          {!selected ? <div className="flex min-h-[420px] items-center justify-center text-center text-sm text-slate-500">Chọn một bài từ hàng đợi bên trái.</div> : integrityError ? <div className="flex min-h-[420px] items-center justify-center text-center text-sm text-slate-500">Không thể hiển thị bài vì phiên bản bất biến không khớp yêu cầu AI.</div> : <>
            <div className="border-b border-slate-200 pb-4">
              <div className="flex flex-wrap items-center justify-between gap-2"><div><div className="v3-kicker">Bản học sinh đã nộp</div><h2 className="mt-1 text-lg font-bold tracking-tight text-slate-950">{selected.student_name}</h2></div><div className="flex items-center gap-2"><Badge variant="primary">{selected.version_number}</Badge><Badge variant="outline">{currentVersion?.stage === 'prediction' ? 'Dự đoán' : currentVersion?.stage === 'initial' ? 'Bản đầu' : 'Bản chỉnh sửa'}</Badge></div></div>
              <div className="mt-2 text-sm leading-6 text-slate-600">Nhiệm vụ: <strong className="font-semibold text-slate-800">{assignment?.title || selected.assignment_id}</strong>{literatureText && ` · ${literatureText.title} (${literatureText.author})`}</div>
            </div>
            {selected.prompt && <div className="mt-4 rounded-lg border-l-2 border-sky-400 bg-sky-50 p-3 text-sm leading-6 text-slate-700"><strong>Yêu cầu hệ thống:</strong> {selected.prompt}</div>}
            <div className="mt-5 space-y-4"><h3 className="text-sm font-bold text-slate-800">Bài viết theo 6 trục</h3>{axes.map(axis => {
              const resp = currentVersion?.responses?.[axis.id];
              const text = typeof resp?.analysisText === 'string' ? resp.analysisText.trim() : '';
              const quotes = Array.isArray(resp?.evidenceQuotes) ? resp.evidenceQuotes : [];
              return <section key={axis.id} className="space-y-2 border-t border-slate-100 pt-4"><div className="text-sm font-bold text-slate-900">{axis.label}</div>{text ? <p className="whitespace-pre-wrap text-[15px] leading-7 text-slate-800">{text}</p> : <span className="text-sm italic text-slate-400">Chưa viết nội dung ở trục này.</span>}{quotes.length > 0 && <div className="space-y-1.5 pt-1">{quotes.map(q => <blockquote key={q.id} className="border-l-2 border-primary-300 pl-3 text-sm italic leading-6 text-slate-500">{q.text}</blockquote>)}</div>}</section>;
            })}</div>
          </>}
        </main>

        <aside className="flex min-h-[620px] flex-col overflow-y-auto rounded-xl border border-slate-200 bg-white p-4 lg:h-[78vh]">
          <div className="space-y-4">
            <div className="border-b border-slate-200 pb-3"><div className="v3-kicker">Phản hồi</div><h2 className="mt-1 text-base font-bold text-slate-950">Dán response ChatGPT</h2><p className="mt-1 text-xs leading-5 text-slate-500">Đối chiếu đúng học sinh, nhiệm vụ và phiên bản trước khi gửi.</p></div>
            {assignment?.aiGuidance && <div className="rounded-lg border border-sky-200 bg-sky-50 p-3 text-xs leading-5 text-slate-700"><strong>Định hướng phản hồi:</strong><div className="mt-1 whitespace-pre-wrap">{assignment.aiGuidance}</div></div>}
            {assignment?.commonMistakes && <div className="rounded-lg border border-slate-200 p-3 text-xs leading-5 text-slate-700"><strong>Lỗi thường gặp:</strong><div className="mt-1 whitespace-pre-wrap">{assignment.commonMistakes}</div></div>}
            {assignment?.referenceGuide && <details className="rounded-lg border border-slate-200 p-3 text-xs leading-5 text-slate-700"><summary className="cursor-pointer font-semibold">Gợi ý chuyên môn tham chiếu</summary><div className="mt-2 max-h-48 overflow-y-auto whitespace-pre-wrap text-slate-600">{assignment.referenceGuide}</div></details>}
            {rubric?.criteria?.length ? <details className="rounded-lg border border-slate-200 p-3 text-xs leading-5 text-slate-700"><summary className="cursor-pointer font-semibold">Rubric giáo viên ({rubric.criteria.length} tiêu chí)</summary><div className="mt-2 space-y-1">{rubric.criteria.map(c => <div key={c.id} className="border-t border-slate-100 pt-1.5">{c.title}</div>)}</div></details> : null}
            <div><label className="mb-1.5 block text-xs font-semibold text-slate-700">Trọng tâm phản hồi</label><select value={axisId} onChange={e => setAxisId(e.target.value as PoeticAxisId)} className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm text-slate-800 outline-none focus:border-primary-600 focus:ring-3 focus:ring-primary-600/10">{axes.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}</select></div>
            <div><label className="mb-1.5 block text-xs font-semibold text-slate-700">Response từ ChatGPT</label><textarea rows={13} value={response} onChange={e => setResponse(e.target.value)} placeholder="Dán response ChatGPT tại đây. Khi bấm gửi, học sinh sẽ thấy nội dung này." className="w-full resize-y rounded-xl border border-slate-300 p-3 text-sm leading-6 text-slate-800 outline-none focus:border-primary-600 focus:ring-3 focus:ring-primary-600/10" /></div>
          </div>
          <div className="mt-auto border-t border-slate-200 pt-4"><Button variant="primary" className="w-full" isLoading={loading} disabled={!selected || !currentVersion || integrityError || !response.trim() || selected?.status === 'completed'} onClick={publishAiFeedback}>Gửi góp ý AI cho học sinh</Button><p className="mt-2 text-center text-xs leading-5 text-slate-400">Học sinh thấy ngay; giáo viên vẫn chấm Rubric chính thức.</p></div>
        </aside>
      </div>
    </div>
  );
};