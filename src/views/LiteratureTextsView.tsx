import React, { useMemo, useState } from 'react';
import { usePortfolio } from '../contexts/PortfolioContext';
import type { LiteratureText } from '../types';
import { Alert, Button, FilterBar, Input, Modal } from '../components/ui';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

interface LiteratureTextsViewProps {
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
  if (!r.ok) throw new Error(d.message || d.code || 'Không thể lưu');
  return d;
}

export const LiteratureTextsView: React.FC<LiteratureTextsViewProps> = ({ onNavigate }) => {
  const { literatureTexts, refreshAcademicData, isLoading } = usePortfolio();
  const currentTexts = useMemo(() => literatureTexts.filter(text => text.isLatest !== false), [literatureTexts]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<LiteratureText | null>(null);
  const [selected, setSelected] = useState<LiteratureText | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [year, setYear] = useState('');
  const [genre, setGenre] = useState('Truyện ngắn hiện đại');
  const [synopsis, setSynopsis] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [fullContent, setFullContent] = useState('');
  const [context, setContext] = useState('');

  const filtered = useMemo(
    () => currentTexts.filter(t => `${t.title} ${t.author}`.toLowerCase().includes(search.toLowerCase().trim())),
    [currentTexts, search]
  );

  const resetForm = () => {
    setEditing(null);
    setTitle('');
    setAuthor('');
    setYear('');
    setGenre('Truyện ngắn hiện đại');
    setSynopsis('');
    setExcerpt('');
    setFullContent('');
    setContext('');
  };

  const openNew = () => {
    resetForm();
    setError(null);
    setOpen(true);
  };

  const openEdit = (text: LiteratureText) => {
    setEditing(text);
    setTitle(text.title);
    setAuthor(text.author);
    setYear(text.year || '');
    setGenre(text.genre || '');
    setSynopsis(text.synopsis || '');
    setExcerpt(text.excerpt || '');
    setFullContent(text.fullContent || text.excerpt || '');
    setContext(text.historicalContext || '');
    setSelected(null);
    setError(null);
    setOpen(true);
  };

  const save = async () => {
    setError(null);
    setSaving(true);
    try {
      await saveCatalog({
        action: 'save_literature',
        logicalId: editing?.logicalId,
        title,
        author,
        year,
        genre,
        synopsis,
        excerpt,
        fullContent,
        historicalContext: context,
        tags: editing?.tags?.length ? editing.tags : ['Ngữ văn THPT']
      });
      setOpen(false);
      resetForm();
      await refreshAcademicData();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Không thể lưu tác phẩm.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl space-y-6 pb-16">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between border-b border-slate-200 pb-4">
        <div>
          <div className="mb-1">
            <Button size="sm" variant="ghost" onClick={() => onNavigate('teacher-dashboard')} leftIcon={<ArrowLeftIcon className="h-4 w-4" />}>Quay lại</Button>
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">Kho tác phẩm</h1>
          <p className="text-sm text-slate-500 mt-0.5">Mỗi lần chỉnh sửa tạo một revision bất biến; nhiệm vụ cũ luôn giữ nguyên ngữ liệu đã giao</p>
        </div>
        <Button size="sm" variant="primary" onClick={openNew}>Thêm tác phẩm</Button>
      </div>

      {error && <Alert type="error" title="Lỗi">{error}</Alert>}

      <FilterBar searchQuery={search} onSearchChange={setSearch} searchPlaceholder="Tìm kiếm theo tác phẩm hoặc tác giả..." onResetFilters={() => setSearch('')} />

      <div className="border border-slate-200 rounded-md bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-600">
              <tr><th className="py-3 px-4">Tác phẩm</th><th className="py-3 px-4">Tác giả</th><th className="py-3 px-4">Revision</th><th className="py-3 px-4">Thể loại</th><th className="py-3 px-4">Năm / Giai đoạn</th><th className="py-3 px-4 text-right">Thao tác</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-xs text-slate-500">{isLoading ? 'Đang tải...' : 'Không tìm thấy tác phẩm phù hợp.'}</td></tr>
              ) : filtered.map(t => (
                <tr key={t.id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-medium text-slate-900"><button type="button" onClick={() => setSelected(t)} className="hover:underline text-left">{t.title}</button></td>
                  <td className="py-3 px-4 text-xs text-slate-700">{t.author}</td>
                  <td className="py-3 px-4 text-xs text-slate-600">{t.revisionNo ? `R${t.revisionNo}` : 'R1'}</td>
                  <td className="py-3 px-4 text-xs text-slate-600">{t.genre || 'Văn học'}</td>
                  <td className="py-3 px-4 text-xs text-slate-500">{t.year || '—'}</td>
                  <td className="py-3 px-4 text-right space-x-1">
                    <Button size="sm" variant="ghost" onClick={() => setSelected(t)}>Xem</Button>
                    <Button size="sm" variant="outline" onClick={() => openEdit(t)}>Tạo revision mới</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={open}
        onClose={() => { setOpen(false); resetForm(); }}
        title={editing ? `Tạo revision mới — ${editing.title}` : 'Thêm tác phẩm mới'}
        footer={<div className="flex items-center justify-end gap-2"><Button variant="outline" size="sm" onClick={() => { setOpen(false); resetForm(); }} disabled={saving}>Hủy</Button><Button variant="primary" size="sm" onClick={save} disabled={!title.trim() || !author.trim()} isLoading={saving}>{editing ? 'Lưu revision mới' : 'Lưu tác phẩm'}</Button></div>}
      >
        <div className="grid gap-3 sm:grid-cols-2 text-sm">
          {editing && <div className="sm:col-span-2 rounded-md border border-slate-200 bg-slate-50 p-2 text-xs text-slate-600">Revision hiện tại: R{editing.revisionNo || 1}. Nội dung cũ sẽ không bị sửa hoặc xóa.</div>}
          <Input label="Tên tác phẩm" value={title} onChange={e => setTitle(e.target.value)} />
          <Input label="Tác giả" value={author} onChange={e => setAuthor(e.target.value)} />
          <Input label="Năm / giai đoạn" value={year} onChange={e => setYear(e.target.value)} />
          <Input label="Thể loại" value={genre} onChange={e => setGenre(e.target.value)} />
          <div className="sm:col-span-2"><label className="block text-xs font-medium text-slate-700 mb-1">Tóm tắt tác phẩm</label><textarea className="w-full rounded-md border border-slate-300 p-2 text-sm outline-none focus:border-slate-500" rows={2} value={synopsis} onChange={e => setSynopsis(e.target.value)} /></div>
          <div className="sm:col-span-2"><label className="block text-xs font-medium text-slate-700 mb-1">Đoạn trích</label><textarea className="w-full rounded-md border border-slate-300 p-2 text-sm outline-none focus:border-slate-500 font-sans" rows={4} value={excerpt} onChange={e => setExcerpt(e.target.value)} /></div>
          <div className="sm:col-span-2"><label className="block text-xs font-medium text-slate-700 mb-1">Toàn văn / ngữ liệu đầy đủ</label><textarea className="w-full rounded-md border border-slate-300 p-2 text-sm outline-none focus:border-slate-500 font-sans" rows={7} value={fullContent} onChange={e => setFullContent(e.target.value)} /></div>
          <div className="sm:col-span-2"><label className="block text-xs font-medium text-slate-700 mb-1">Bối cảnh sáng tác</label><textarea className="w-full rounded-md border border-slate-300 p-2 text-sm outline-none focus:border-slate-500" rows={2} value={context} onChange={e => setContext(e.target.value)} /></div>
        </div>
      </Modal>

      <Modal isOpen={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.title || 'Chi tiết tác phẩm'} footer={<div className="flex justify-end gap-2">{selected && <Button variant="primary" size="sm" onClick={() => openEdit(selected)}>Tạo revision mới</Button>}<Button variant="outline" size="sm" onClick={() => setSelected(null)}>Đóng</Button></div>}>
        {selected && <div className="space-y-4 text-sm text-slate-700">
          <div className="text-xs text-slate-500">Tác giả: <strong className="text-slate-900">{selected.author}</strong> · Revision: R{selected.revisionNo || 1} · Thể loại: {selected.genre || 'Văn học'} · Năm: {selected.year || '—'}</div>
          {selected.synopsis && <div className="space-y-1"><span className="font-medium text-slate-900 text-xs block">Tóm tắt:</span><p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-md border border-slate-200">{selected.synopsis}</p></div>}
          {selected.excerpt && <div className="space-y-1"><span className="font-medium text-slate-900 text-xs block">Đoạn trích:</span><div className="whitespace-pre-wrap text-sm leading-7 text-slate-800 bg-white p-3 rounded-md border border-slate-200 max-h-64 overflow-y-auto">{selected.excerpt}</div></div>}
          {selected.historicalContext && <div className="space-y-1"><span className="font-medium text-slate-900 text-xs block">Bối cảnh sáng tác:</span><p className="text-xs text-slate-600 leading-relaxed">{selected.historicalContext}</p></div>}
        </div>}
      </Modal>
    </div>
  );
};
