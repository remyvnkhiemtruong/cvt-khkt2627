import React, { useState } from 'react';
import { mockDb } from '../services/mockApi/mockDb';
import { useNotificationStore } from '../app/store/useNotificationStore';
import type { LiteratureText } from '../types';
import {
  Button,
  Badge,
  Card,
  Modal,
  FilterBar
} from '../components/ui';
import {
  BookOpenIcon,
  PlusIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  DocumentTextIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';

interface LiteratureTextsViewProps {
  onNavigate: (view: string, extraParams?: any) => void;
}

export const LiteratureTextsView: React.FC<LiteratureTextsViewProps> = ({ onNavigate }) => {
  const { addToast } = useNotificationStore();
  const [texts, setTexts] = useState<LiteratureText[]>(() => mockDb.getLiteratureTexts());
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Literature Text Form State
  const [newTitle, setNewTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newYear, setNewYear] = useState('1952');
  const [newGenre, setNewGenre] = useState('Truyện ngắn hiện đại');
  const [newSynopsis, setNewSynopsis] = useState('');
  const [newExcerpt, setNewExcerpt] = useState('');
  const [newContext, setNewContext] = useState('');

  // Selected Text Drawer / Detail modal
  const [selectedText, setSelectedText] = useState<LiteratureText | null>(null);

  const filteredTexts = texts.filter(t => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return t.title.toLowerCase().includes(q) || t.author.toLowerCase().includes(q);
    }
    return true;
  });

  const handleAddText = () => {
    if (!newTitle.trim() || !newAuthor.trim()) {
      addToast({ type: 'error', title: 'Thiếu thông tin', message: 'Vui lòng nhập tên tác phẩm và tác giả.' });
      return;
    }

    const created: LiteratureText = {
      id: `lit-${Date.now()}`,
      title: newTitle,
      author: newAuthor,
      year: newYear,
      genre: newGenre,
      synopsis: newSynopsis || 'Tóm tắt tác phẩm phục vụ nghiên cứu đọc hiểu.',
      excerpt: newExcerpt || 'Trích đoạn tiêu biểu.',
      fullContent: newExcerpt || 'Ngữ liệu văn học trích đoạn.',
      historicalContext: newContext || 'Bối cảnh lịch sử xã hội.',
      tags: ['Truyện ngắn 1945-1975', 'Ngữ văn 11']
    };

    setTexts(prev => [created, ...prev]);
    setIsAddModalOpen(false);
    setNewTitle('');
    setNewAuthor('');
    setNewSynopsis('');
    setNewExcerpt('');
    setNewContext('');

    addToast({
      type: 'success',
      title: 'Đã thêm ngữ liệu văn học',
      message: `Tác phẩm “${created.title}” đã được thêm vào kho ngữ liệu.`
    });
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16 max-w-5xl mx-auto">
      {/* Header */}
      <header className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onNavigate('teacher-dashboard')}
              leftIcon={<ArrowLeftIcon className="w-4 h-4" />}
              className="text-slate-600 hover:text-slate-900 p-0 pr-2"
            >
              Bàn làm việc Giáo viên
            </Button>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-semibold text-slate-700">Kho Ngữ Liệu Văn Học</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-h3 font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <BookOpenIcon className="w-6 h-6 text-indigo-700" />
              Kho Tác Phẩm & Ngữ Liệu Truyện Ngắn Hiện Đại
            </h1>
            <Badge variant="blue">{texts.length} tác phẩm</Badge>
          </div>
          <p className="text-small text-slate-500 mt-1">
            Quản lý kho văn bản phục vụ phân tích 6 trục thi pháp theo Chương trình GDPT 2018
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsAddModalOpen(true)}
          leftIcon={<PlusIcon className="w-4 h-4" />}
          className="bg-indigo-900 text-white font-bold"
        >
          Thêm tác phẩm mới
        </Button>
      </header>

      {/* Search Bar */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Tìm tác phẩm hoặc tên tác giả (Kim Lân, Nam Cao, Thạch Lam...)..."
        onResetFilters={() => setSearchQuery('')}
      />

      {/* Grid of Literature Texts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTexts.map(item => (
          <Card
            key={item.id}
            padding="lg"
            className="border-slate-200 bg-white shadow-card hover:border-indigo-300 transition flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="purple" size="sm">{item.genre}</Badge>
                <span className="text-[11px] text-slate-400 font-bold">{item.year}</span>
              </div>

              <div>
                <h2 className="font-bold text-base text-slate-900">{item.title}</h2>
                <span className="text-xs font-semibold text-indigo-800 block mt-0.5">Tác giả: {item.author}</span>
              </div>

              <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                {item.synopsis}
              </p>

              {/* Trích đoạn mẫu */}
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-caption font-serif italic text-slate-700 line-clamp-2">
                "{item.excerpt}"
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedText(item)}
                leftIcon={<DocumentTextIcon className="w-4 h-4" />}
                className="text-xs"
              >
                Đoạn trích
              </Button>

              <Button
                size="sm"
                variant="academic"
                onClick={() => onNavigate('assignment-builder', { textId: item.id })}
                rightIcon={<ArrowRightIcon className="w-3.5 h-3.5" />}
                className="text-xs font-bold"
              >
                Giao bài
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Modal Add Literature Text */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Thêm Ngữ Liệu Tác Phẩm Mới"
        description="Bổ sung tác phẩm truyện ngắn hiện đại vào kho ngữ liệu phục vụ thiết kế nhiệm vụ đọc hiểu."
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsAddModalOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="primary"
              onClick={handleAddText}
              className="bg-indigo-900 text-white font-bold"
            >
              Lưu tác phẩm
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-xs text-slate-700">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block font-bold text-slate-800">Tên tác phẩm: *</label>
              <input
                type="text"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="Ví dụ: Vợ chồng A Phủ"
                className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="block font-bold text-slate-800">Tác giả: *</label>
              <input
                type="text"
                value={newAuthor}
                onChange={e => setNewAuthor(e.target.value)}
                placeholder="Ví dụ: Tô Hoài"
                className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block font-bold text-slate-800">Năm sáng tác:</label>
              <input
                type="text"
                value={newYear}
                onChange={e => setNewYear(e.target.value)}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="block font-bold text-slate-800">Thể loại:</label>
              <input
                type="text"
                value={newGenre}
                onChange={e => setNewGenre(e.target.value)}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block font-bold text-slate-800">Tóm tắt tác phẩm:</label>
            <textarea
              rows={2}
              value={newSynopsis}
              onChange={e => setNewSynopsis(e.target.value)}
              placeholder="Tóm tắt ngắn gọn cốt truyện và nhân vật..."
              className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="block font-bold text-slate-800">Đoạn trích tiêu biểu (Ngữ liệu đọc hiểu):</label>
            <textarea
              rows={3}
              value={newExcerpt}
              onChange={e => setNewExcerpt(e.target.value)}
              placeholder="Nhập trích đoạn văn bản dùng cho học sinh phân tích..."
              className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none font-serif"
            />
          </div>

          <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-200 flex items-center gap-2 text-caption text-indigo-950">
            <LockClosedIcon className="w-4 h-4 text-indigo-700 shrink-0" />
            <span>Cam kết tuân thủ quyền trích dẫn học thuật phi thương mại theo Luật Sở hữu trí tuệ.</span>
          </div>
        </div>
      </Modal>

      {/* Modal View Excerpt Detail */}
      <Modal
        isOpen={!!selectedText}
        onClose={() => setSelectedText(null)}
        title={`Văn Bản: ${selectedText?.title}`}
        description={`Tác giả: ${selectedText?.author} • Năm sáng tác: ${selectedText?.year}`}
        footer={
          <Button variant="primary" onClick={() => setSelectedText(null)}>
            Đóng
          </Button>
        }
      >
        {selectedText && (
          <div className="space-y-3 text-xs text-slate-700">
            <div className="space-y-1">
              <span className="font-bold text-slate-900 block">Bối cảnh lịch sử - xã hội:</span>
              <p className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 leading-relaxed text-slate-700">
                {selectedText.historicalContext || 'Tác phẩm phản ánh hiện thực đời sống và vẻ đẹp tâm hồn con người Việt Nam trong hoàn cảnh ngặt nghèo.'}
              </p>
            </div>

            <div className="space-y-1">
              <span className="font-bold text-slate-900 block">Đoạn trích ngữ liệu trọng tâm:</span>
              <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-200 text-indigo-950 font-serif leading-relaxed italic text-xs max-h-48 overflow-y-auto">
                "{selectedText.excerpt}"
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
