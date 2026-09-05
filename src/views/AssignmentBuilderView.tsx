import React, { useEffect, useMemo, useState } from 'react';
import { usePortfolio } from '../contexts/PortfolioContext';
import type { AcademicClass, PoeticAxisId } from '../types';
import { Alert, Button, Input } from '../components/ui';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { POETIC_AXES } from '../data/seedData';

interface AssignmentBuilderViewProps {
  onNavigate: (view: string, extraParams?: any) => void;
}

async function post(payload: unknown) {
  const r = await fetch('/api/academic/action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload)
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.message || d.code || 'Không thể tạo nhiệm vụ');
  return d;
}

export const AssignmentBuilderView: React.FC<AssignmentBuilderViewProps> = ({ onNavigate }) => {
  const { literatureTexts, rubric, rubrics, refreshAcademicData } = usePortfolio();
  const currentTexts = useMemo(() => literatureTexts.filter(text => text.isLatest !== false), [literatureTexts]);
  const rubricOptions = useMemo(() => Object.values(rubrics || {}), [rubrics]);
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [title, setTitle] = useState('');
  const [textId, setTextId] = useState('');
  const [rubricId, setRubricId] = useState('');
  const [classId, setClassId] = useState('');
  const [deadline, setDeadline] = useState('');
  const [difficulty, setDifficulty] = useState<'Cơ bản' | 'Nâng cao' | 'Chuyên sâu'>('Nâng cao');
  const [prompt, setPrompt] = useState('');
  const [axes, setAxes] = useState<PoeticAxisId[]>(POETIC_AXES.map(x => x.id));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!textId && currentTexts[0]) setTextId(currentTexts[0].id);
  }, [currentTexts, textId]);

  useEffect(() => {
    if (!rubricId) setRubricId(rubricOptions[0]?.id || rubric.id || '');
  }, [rubric.id, rubricId, rubricOptions]);

  useEffect(() => {
    let cancelled = false;
    void fetch('/api/academic/snapshot', { credentials: 'include', cache: 'no-store' })
      .then(r => r.json())
      .then(d => {
        if (cancelled) return;
        const cs = d.snapshot?.classes || [];
        setClasses(cs);
        setClassId(previous => previous || cs[0]?.code || '');
      })
      .catch(() => {
        if (!cancelled) setMessage({ type: 'error', text: 'Không thể tải danh sách lớp được phân công.' });
      });
    return () => { cancelled = true; };
  }, []);

  const toggle = (id: PoeticAxisId) =>
    setAxes(prev => (prev.includes(id) ? (prev.length > 1 ? prev.filter(x => x !== id) : prev) : [...prev, id]));

  const publish = async () => {
    if (!title.trim() || !textId || !classId || !rubricId) {
      setMessage({ type: 'error', text: 'Vui lòng nhập tên nhiệm vụ, lớp, tác phẩm và rubric.' });
      return;
    }
    const selectedText = currentTexts.find(text => text.id === textId);
    if (!selectedText || selectedText.isLatest === false) {
      setMessage({ type: 'error', text: 'Phiên bản ngữ liệu đã thay đổi. Hãy chọn bản mới nhất.' });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      await post({
        action: 'create_assignment',
        title: title.trim(),
        textVersionId: textId,
        classId,
        rubricId,
        deadline: deadline || null,
        difficulty,
        targetAxes: axes,
        prompt,
        guidingSteps: [
          'Đọc kĩ tác phẩm và xác định các dẫn chứng tiêu biểu',
          'Phân tích chi tiết theo các trục thi pháp trọng tâm',
          'Nộp bản V1 để giáo viên phản hồi và đánh giá',
          'Tiếp thu nhận xét và hoàn thiện bài viết ở bản tiếp theo'
        ]
      });
      await refreshAcademicData();
      setMessage({ type: 'success', text: 'Đã tạo nhiệm vụ với đúng revision ngữ liệu và rubric đã chọn.' });
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Không thể tạo nhiệm vụ.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6 pb-16">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between border-b border-slate-200 pb-4">
        <div>
          <div className="mb-1">
            <Button size="sm" variant="ghost" onClick={() => onNavigate('teacher-dashboard')} leftIcon={<ArrowLeftIcon className="h-4 w-4" />}>
              Quay lại
            </Button>
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">Tạo nhiệm vụ</h1>
          <p className="text-sm text-slate-500 mt-0.5">Thiết lập đề bài, revision ngữ liệu và rubric chính xác cho lớp học</p>
        </div>
      </div>

      {message && <Alert type={message.type} title={message.type === 'success' ? 'Thành công' : 'Lỗi'}>{message.text}</Alert>}

      <div className="border border-slate-200 rounded-md bg-white p-5 space-y-5">
        <h2 className="text-base font-semibold text-slate-900 border-b border-slate-100 pb-2">Thông tin nhiệm vụ</h2>
        <div className="grid gap-4 md:grid-cols-2 text-sm">
          <Input label="Tên nhiệm vụ" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ví dụ: Phân tích Vợ nhặt theo 6 trục thi pháp" />

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Lớp được giao</label>
            <select value={classId} onChange={e => setClassId(e.target.value)} className="w-full rounded-md border border-slate-300 p-2 text-sm text-slate-800 outline-none focus:border-slate-500">
              {classes.map(c => <option key={c.id} value={c.code}>{c.code} — {c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Tác phẩm — revision mới nhất</label>
            <select value={textId} onChange={e => setTextId(e.target.value)} className="w-full rounded-md border border-slate-300 p-2 text-sm text-slate-800 outline-none focus:border-slate-500">
              {currentTexts.map(t => <option key={t.id} value={t.id}>{t.title} ({t.author}){t.revisionNo ? ` · R${t.revisionNo}` : ''}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Rubric áp dụng</label>
            <select value={rubricId} onChange={e => setRubricId(e.target.value)} className="w-full rounded-md border border-slate-300 p-2 text-sm text-slate-800 outline-none focus:border-slate-500">
              {rubricOptions.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Mức độ</label>
            <select value={difficulty} onChange={e => setDifficulty(e.target.value as 'Cơ bản' | 'Nâng cao' | 'Chuyên sâu')} className="w-full rounded-md border border-slate-300 p-2 text-sm text-slate-800 outline-none focus:border-slate-500">
              <option>Cơ bản</option><option>Nâng cao</option><option>Chuyên sâu</option>
            </select>
          </div>

          <Input label="Hạn nộp bài" type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)} />

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-1">Yêu cầu đề bài</label>
            <textarea rows={4} value={prompt} onChange={e => setPrompt(e.target.value)} className="w-full rounded-md border border-slate-300 p-2.5 text-sm outline-none focus:border-slate-500" placeholder="Ghi rõ định hướng phân tích, yêu cầu dẫn chứng và mục tiêu bài viết..." />
          </div>
        </div>
      </div>

      <div className="border border-slate-200 rounded-md bg-white p-5 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Trục thi pháp trọng tâm</h2>
          <p className="text-xs text-slate-500 mt-0.5">Chọn các trục thi pháp bắt buộc trong bài làm của học sinh</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {POETIC_AXES.map(axis => {
            const checked = axes.includes(axis.id);
            return (
              <label key={axis.id} className="flex items-start gap-3 p-3 rounded-md border border-slate-200 hover:bg-slate-50 cursor-pointer text-sm">
                <input type="checkbox" checked={checked} onChange={() => toggle(axis.id)} className="mt-1 rounded border-slate-300 text-slate-900 focus:ring-slate-500" />
                <div className="space-y-0.5 min-w-0"><div className="font-medium text-slate-900">{axis.title}</div><p className="text-xs text-slate-500 leading-relaxed">{axis.description}</p></div>
              </label>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" size="sm" onClick={() => onNavigate('teacher-dashboard')}>Hủy</Button>
        <Button variant="primary" size="sm" onClick={publish} isLoading={saving} disabled={!currentTexts.length || !rubricOptions.length}>Xuất bản nhiệm vụ</Button>
      </div>
    </div>
  );
};
