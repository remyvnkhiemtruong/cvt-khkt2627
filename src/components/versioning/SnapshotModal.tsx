import React, { useState } from 'react';
import { GitCommit, X, AlertCircle, Sparkles } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-sky-700 font-bold">
            <GitCommit className="w-5 h-5" />
            <span>Tạo Phiên Bản Đóng Băng Mới</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 text-xs text-sky-900 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <div>
              <strong>Lưu ý nghiệp vụ:</strong> Việc "Tạo phiên bản" sẽ đóng băng toàn bộ 6 trục thi pháp hiện tại thành một bản ghi bất biến. Bản ghi này sẽ được gửi tới Giáo viên/Bạn học để nhận xét và so sánh Diff sau này.
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mã phiên bản (Version tag)
            </label>
            <input
              type="text"
              value={versionNumber}
              onChange={e => {
                setVersionNumber(e.target.value);
                setError('');
              }}
              placeholder="v1.0 hoặc v2.0"
              className="w-full text-sm font-medium border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nhật ký thay đổi & Lý do chỉnh sửa <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              value={changeSummary}
              onChange={e => {
                setChangeSummary(e.target.value);
                setError('');
              }}
              placeholder="Ví dụ: Đã tiếp thu nhận xét của GV về việc phân tích thời gian tâm lý và làm rõ chi tiết bát cháo cám..."
              className="w-full text-xs font-normal border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          {error && (
            <p className="text-xs font-semibold text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-200">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Xác nhận Đóng băng Phiên bản
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
