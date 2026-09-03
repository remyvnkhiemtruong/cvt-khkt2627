import React, { useEffect, useState } from 'react';
import { usePortfolio } from '../contexts/PortfolioContext';
import type { RubricCriterion } from '../types';
import { Alert, Button, Input } from '../components/ui';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

interface RubricManagementViewProps {
  onNavigate: (view: string, extraParams?: any) => void;
}

async function saveCatalog(payload: unknown) {
  const r = await fetch('/api/academic/catalog', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload)
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.message || d.code || 'Không thể lưu rubric');
  return d;
}

export const RubricManagementView: React.FC<RubricManagementViewProps> = ({ onNavigate }) => {
  const { rubric, refreshAcademicData } = usePortfolio();
  const [title, setTitle] = useState(rubric.title);
  const [description, setDescription] = useState('Rubric 4 mức đánh giá năng lực đọc hiểu theo 6 trục thi pháp.');
  const [criteria, setCriteria] = useState<RubricCriterion[]>(rubric.criteria);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setTitle(rubric.title);
    setCriteria(rubric.criteria);
  }, [rubric]);

  const updateDescription = (criterionIndex: number, levelIndex: number, value: string) => {
    setCriteria(prev =>
      prev.map((c, i) =>
        i !== criterionIndex
          ? c
          : {
              ...c,
              levels: c.levels.map((l, j) => (j !== levelIndex ? l : { ...l, description: value }))
            }
      )
    );
  };

  const saveVersion = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const d = await saveCatalog({ action: 'create_rubric_version', title, description, criteria });
      setMessage({
        type: 'success',
        text: `Đã tạo phiên bản Rubric mới (${d.id}). Các bài đã chấm trước đó vẫn giữ nguyên tiêu chí cũ.`
      });
      await refreshAcademicData();
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between border-b border-slate-200 pb-4">
        <div>
          <div className="mb-1">
            <Button size="sm" variant="ghost" onClick={() => onNavigate('teacher-dashboard')} leftIcon={<ArrowLeftIcon className="h-4 w-4" />}>
              Quay lại
            </Button>
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">Ma trận Rubric</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Tiêu chí đánh giá năng lực đọc hiểu theo 6 trục thi pháp
          </p>
        </div>

        <div className="text-xs text-slate-500">
          Mã phiên bản: <span className="font-mono">{rubric.id}</span>
        </div>
      </div>

      {message && (
        <Alert type={message.type} title={message.type === 'success' ? 'Thành công' : 'Lỗi'}>
          {message.text}
        </Alert>
      )}

      {/* Meta configuration */}
      <div className="border border-slate-200 rounded-md bg-white p-4 space-y-3">
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Tên ma trận Rubric" value={title} onChange={e => setTitle(e.target.value)} />
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Mô tả ma trận</label>
            <textarea
              className="w-full rounded-md border border-slate-300 p-2 text-sm text-slate-800 outline-none focus:border-slate-500"
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Matrix Criteria: Table format instead of 24 nested cards! */}
      <div className="border border-slate-200 rounded-md bg-white overflow-hidden divide-y divide-slate-200">
        <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Bảng mô tả các mức độ đạt chuẩn</h2>
          <span className="text-xs text-slate-500">Thang 4 mức: 1 (Chưa đạt) đến 4 (Xuất sắc)</span>
        </div>

        {criteria.map((criterion, ci) => (
          <div key={criterion.id} className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-semibold text-slate-500">Trục {ci + 1}:</span>
                <h3 className="text-sm font-semibold text-slate-900">{criterion.title}</h3>
              </div>
              <span className="text-xs text-slate-500">Trọng số: {criterion.weight}</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {criterion.levels.map((level, li) => (
                <div key={level.level} className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span className="font-medium">Mức {level.level}: {level.label}</span>
                    <span>{level.score}đ</span>
                  </div>
                  <textarea
                    value={level.description}
                    onChange={e => updateDescription(ci, li, e.target.value)}
                    rows={4}
                    className="w-full rounded-md border border-slate-200 bg-slate-50/50 p-2 text-xs leading-relaxed text-slate-800 outline-none focus:bg-white focus:border-slate-400"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Save Action */}
      <div className="flex items-center justify-between gap-4 pt-2">
        <p className="text-xs text-slate-500">
          * Các bài nộp đã được chấm bằng phiên bản trước sẽ giữ nguyên kết quả đánh giá cũ.
        </p>
        <Button
          variant="primary"
          size="sm"
          onClick={saveVersion}
          isLoading={saving}
          disabled={!criteria.length || !title.trim()}
        >
          Lưu phiên bản Rubric mới
        </Button>
      </div>
    </div>
  );
};
