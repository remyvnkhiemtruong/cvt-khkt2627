import React, { useState } from 'react';
import { GitCommit, X, AlertCircle } from 'lucide-react';

interface SnapshotModalProps {
  isOpen: boolean;
  onClose: () => void;
  nextSuggestedVersion: string;
  onCommitSnapshot: (versionNumber: string, changeSummary: string) => void;
}

export const SnapshotModal: React.FC<SnapshotModalProps> = ({
  isOpen,
  onClose,
  nextSuggestedVersion,
  onCommitSnapshot
}) => {
  const [versionNumber, setVersionNumber] = useState(nextSuggestedVersion);
  const [changeSummary, setChangeSummary] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!versionNumber.trim()) {
      setError('Vui lòng nhập số hiệu phiên bản (ví dụ: v1.0, v2.0).');
      return;
    }
    if (!changeSummary.trim() || changeSummary.trim().length < 8) {
      setError('Vui lòng viết rõ chú thích thay đổi / lý do chỉnh sửa (tối thiểu 8 ký tự).');
      return;
    }

    onCommitSnapshot(versionNumber.trim(), changeSummary.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 animate-fade-in">
      <div className="bg-white rounded-lg max-w-lg w-full p-5 shadow-modal border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
            <GitCommit className="w-4 h-4 text-sky-600" />
            <span>Tạo phiên bản mới</span>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div className="p-2.5 bg-slate-50 rounded-md border border-slate-200 text-xs text-slate-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <div>
              Việc tạo phiên bản sẽ lưu lại bản thảo của 6 trục thi pháp thành một mốc lịch sử để so sánh và nhận xét sau này.
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Ký hiệu phiên bản (Version tag)
            </label>
            <input
              type="text"
              value={versionNumber}
              onChange={e => {
                setVersionNumber(e.target.value);
                setError('');
              }}
              placeholder="v1.0 hoặc v2.0"
              className="w-full text-xs font-medium border border-slate-300 rounded-md px-2.5 py-1.5 focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Ghi chú nội dung chỉnh sửa <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={changeSummary}
              onChange={e => {
                setChangeSummary(e.target.value);
                setError('');
              }}
              placeholder="Ví dụ: Đã tiếp thu nhận xét của GV về việc phân tích thời gian tâm lý và làm rõ chi tiết bát cháo cám..."
              className="w-full text-xs font-normal border border-slate-300 rounded-md p-2.5 focus:border-sky-500 focus:outline-none"
            />
          </div>

          {error && (
            <p className="text-xs font-medium text-rose-600 bg-rose-50 p-2 rounded-md border border-rose-200">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-md transition-colors"
            >
              <GitCommit className="w-3.5 h-3.5" />
              Lưu phiên bản
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
