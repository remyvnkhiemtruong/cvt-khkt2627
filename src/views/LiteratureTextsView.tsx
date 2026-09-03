import React, { useMemo, useState } from 'react';
import { usePortfolio } from '../contexts/PortfolioContext';
import { Alert, Badge, Button, Card, FilterBar, Input, Modal, PageHeader } from '../components/ui';
import { ArrowLeftIcon, PlusIcon } from '@heroicons/react/24/outline';

interface LiteratureTextsViewProps { onNavigate:(view:string,extraParams?:any)=>void; }
async function saveCatalog(payload:unknown){const r=await fetch('/api/academic/catalog',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify(payload)});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.message||d.code||'Không thể lưu');return d;}

export const LiteratureTextsView:React.FC<LiteratureTextsViewProps>=({onNavigate})=>{
  const {literatureTexts,refreshAcademicData,isLoading}=usePortfolio();
  const [search,setSearch]=useState('');const [open,setOpen]=useState(false);const [selected,setSelected]=useState<(typeof literatureTexts)[number]|null>(null);const [error,setError]=useState<string|null>(null);
  const [title,setTitle]=useState('');const [author,setAuthor]=useState('');const [year,setYear]=useState('');const [genre,setGenre]=useState('Truyện ngắn hiện đại');const [synopsis,setSynopsis]=useState('');const [excerpt,setExcerpt]=useState('');const [context,setContext]=useState('');
  const filtered=useMemo(()=>literatureTexts.filter(t=>`${t.title} ${t.author}`.toLowerCase().includes(search.toLowerCase().trim())),[literatureTexts,search]);
  const save=async()=>{setError(null);try{await saveCatalog({action:'save_literature',title,author,year,genre,synopsis,excerpt,fullContent:excerpt,historicalContext:context,tags:['Ngữ văn THPT']});setOpen(false);setTitle('');setAuthor('');setSynopsis('');setExcerpt('');setContext('');await refreshAcademicData();}catch(e:any){setError(e.message);}};

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-16">
      <div>
        <div className="mb-2">
          <Button size="sm" variant="ghost" onClick={()=>onNavigate('teacher-dashboard')} leftIcon={<ArrowLeftIcon className="h-4 w-4"/>}>Quay lại</Button>
        </div>
        <PageHeader
          title="Kho ngữ liệu tác phẩm"
          description="Danh mục văn bản, trích đoạn và ngữ liệu văn học dùng cho các nhiệm vụ đọc hiểu."
          actions={
            <Button size="sm" variant="primary" onClick={()=>setOpen(true)} leftIcon={<PlusIcon className="h-4 w-4"/>}>
              Thêm tác phẩm
            </Button>
          }
        />
      </div>

      {error&&<Alert type="error" title="Không thể lưu">{error}</Alert>}

      <Card padding="md">
        <FilterBar searchQuery={search} onSearchChange={setSearch} searchPlaceholder="Tìm tác phẩm hoặc tác giả..." onResetFilters={()=>setSearch('')} />
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {filtered.map(t=>(
            <button
              key={t.id}
              onClick={()=>setSelected(t)}
              className="rounded-lg border border-slate-200 p-3.5 text-left transition-colors hover:border-slate-300 hover:bg-slate-50/50"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">{t.title}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">{t.author} • {t.year||'Không rõ năm'}</p>
                </div>
                <Badge variant="blue" size="sm">{t.genre||'Văn học'}</Badge>
              </div>
              <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-600">{t.synopsis||t.excerpt}</p>
            </button>
          ))}
          {!isLoading&&filtered.length===0&&<p className="text-xs text-slate-500 py-4">Chưa có tác phẩm phù hợp.</p>}
        </div>
      </Card>

      <Modal
        isOpen={open}
        onClose={()=>setOpen(false)}
        title="Thêm ngữ liệu văn học"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={()=>setOpen(false)}>Hủy</Button>
            <Button variant="primary" size="sm" onClick={save} disabled={!title.trim()||!author.trim()}>Lưu tác phẩm</Button>
          </div>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Tên tác phẩm" value={title} onChange={e=>setTitle(e.target.value)}/>
          <Input label="Tác giả" value={author} onChange={e=>setAuthor(e.target.value)}/>
          <Input label="Năm / giai đoạn" value={year} onChange={e=>setYear(e.target.value)}/>
          <Input label="Thể loại" value={genre} onChange={e=>setGenre(e.target.value)}/>
          <label className="sm:col-span-2 text-xs font-semibold text-slate-700">Tóm tắt tác phẩm
            <textarea className="mt-1.5 w-full rounded-md border border-slate-300 p-2.5 text-xs outline-none focus:border-indigo-500" rows={3} value={synopsis} onChange={e=>setSynopsis(e.target.value)}/>
          </label>
          <label className="sm:col-span-2 text-xs font-semibold text-slate-700">Đoạn trích
            <textarea className="mt-1.5 w-full rounded-md border border-slate-300 p-2.5 text-xs outline-none focus:border-indigo-500" rows={5} value={excerpt} onChange={e=>setExcerpt(e.target.value)}/>
          </label>
          <label className="sm:col-span-2 text-xs font-semibold text-slate-700">Bối cảnh sáng tác
            <textarea className="mt-1.5 w-full rounded-md border border-slate-300 p-2.5 text-xs outline-none focus:border-indigo-500" rows={2} value={context} onChange={e=>setContext(e.target.value)}/>
          </label>
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(selected)}
        onClose={()=>setSelected(null)}
        title={selected?.title||'Chi tiết tác phẩm'}
        footer={<Button variant="outline" size="sm" onClick={()=>setSelected(null)}>Đóng</Button>}
      >
        {selected&&(
          <div className="space-y-3 text-xs leading-5 text-slate-700">
            <div><strong className="text-slate-900">Tác giả:</strong> {selected.author}</div>
            <div><strong className="text-slate-900">Thể loại:</strong> {selected.genre}</div>
            <div>
              <strong className="text-slate-900">Tóm tắt:</strong>
              <p className="mt-1 text-slate-600">{selected.synopsis}</p>
            </div>
            <div>
              <strong className="text-slate-900">Đoạn trích:</strong>
              <p className="mt-1 whitespace-pre-wrap rounded-md border border-slate-200 bg-slate-50 p-2.5 text-slate-800">{selected.excerpt}</p>
            </div>
            <div>
              <strong className="text-slate-900">Bối cảnh sáng tác:</strong>
              <p className="mt-1 text-slate-600">{selected.historicalContext}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
