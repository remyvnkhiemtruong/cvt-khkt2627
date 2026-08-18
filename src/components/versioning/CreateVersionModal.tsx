import React, { useState } from 'react';
import { Button, Modal, Badge } from '../ui';
import {
  SparklesIcon,
  PlusIcon,
  MinusIcon,
  PencilSquareIcon
} from '@heroicons/react/24/outline';

interface CreateVersionModalProps {
  isOpen: boolean;
  onClose: () => void;
  nextVersionNumber: string;
  onConfirm: (data: { reason: string; note: string; labels: string[] }) => void;
  stats?: {
    addedWords: number;
    deletedWords: number;
    changedBlocks: number;
  };
}

export const CreateVersionModal: React.FC<CreateVersionModalProps> = ({
  isOpen,
  onClose,
  nextVersionNumber,
  onConfirm,
  stats = { addedWords: 126, deletedWords: 32, changedBlocks: 4 }
}) => {
  const [reason, setReason] = useState('Sau phản hồi của giáo viên');
  const [note, setNote] = useState('');
  const [selectedLabels, setSelectedLabels] = useState<string[]>([
    'Bổ sung dẫn chứng',
    'Lí giải sâu hơn'
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const availableReasons = [
    'Sau phản hồi của giáo viên',
    'Sau phản biện của bạn học',
    'Tự đánh giá và đối chiếu Rubric',
    'Bổ sung dẫn chứng nghệ thuật & điểm nhìn',
    'Hoàn thiện hồ sơ trước hạn nộp'
  ];

  const changeLabels = [
    'Bổ sung dẫn chứng',
    'Sửa diễn đạt',
    'Thay đổi luận điểm',
    'Lí giải sâu hơn',
    'Sửa sai kiến thức',
    'Tổ chức lại cấu trúc'
  ];

  const toggleLabel = (label: string) => {
    if (selectedLabels.includes(label)) {
      setSelectedLabels(selectedLabels.filter(l => l !== label));
    } else {
      setSelectedLabels([...selectedLabels, label]);
    }
  };

  const handleConfirm = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onConfirm({
        reason,
        note: note || `Đóng băng phiên bản ${nextVersionNumber} theo lý do: ${reason}`,
        labels: selectedLabels
      });
      onClose();
    }, 500);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tạo Phiên Bản Nghiên Cứu Mới"
      description="Đóng băng bản ghi hiện tại thành mốc bất biến (Immutable Snapshot) để phục vụ so sánh Visual Diff và đánh giá tiến trình."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Hủy bỏ
          </Button>
          <Button
            variant="primary"
            isLoading={isLoading}
            onClick={handleConfirm}
            className="bg-indigo-900 text-white font-bold"
          >
            Tạo phiên bản {nextVersionNumber}
          </Button>
        </>
      }
    >
      <div className="space-y-4 text-xs text-slate-700">
        {/* Version Badge & Notice */}
        <div className="p-3.5 bg-indigo-50/70 rounded-2xl border border-indigo-200 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">
              Phiên bản tiếp theo:
            </span>
            <span className="text-sm font-bold text-indigo-950">
              Phiên bản {nextVersionNumber}
            </span>
          </div>
          <Badge variant="purple" size="md">
            Mốc nghiên cứu
          </Badge>
        </div>

        {/* Change Statistics Preview */}
        <div className="space-y-1.5">
          <label className="block font-bold text-slate-800 text-[11px] uppercase tracking-wider">
            Thay đổi từ lần lưu gần nhất:
          </label>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold flex items-center justify-center gap-1">
              <PlusIcon className="w-3.5 h-3.5" />
              <span>+{stats.addedWords} từ</span>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 font-bold flex items-center justify-center gap-1">
              <MinusIcon className="w-3.5 h-3.5" />
              <span>-{stats.deletedWords} từ</span>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 font-bold flex items-center justify-center gap-1">
              <PencilSquareIcon className="w-3.5 h-3.5" />
              <span>~{stats.changedBlocks} đoạn sửa</span>
            </div>
          </div>
        </div>

        {/* Reason Selector */}
        <div className="space-y-1">
          <label className="block font-bold text-slate-800">
            Lý do tạo phiên bản:
          </label>
          <select
            value={reason}
            onChange={e => setReason(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg text-xs py-2 px-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-800"
          >
            {availableReasons.map((r, idx) => (
              <option key={idx} value={r}>{r}</option>
            ))}
          </select>
        </div>

        {/* Pedagogical Change Labels */}
        <div className="space-y-1.5">
          <label className="block font-bold text-slate-800 flex items-center gap-1">
            <SparklesIcon className="w-3.5 h-3.5 text-indigo-600" />
            Gắn nhãn thay đổi sư phạm (Change Labels):
          </label>
          <div className="flex flex-wrap gap-1.5">
            {changeLabels.map(label => {
              const isSelected = selectedLabels.includes(label);
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => toggleLabel(label)}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {isSelected ? `✓ ${label}` : `+ ${label}`}
                </button>
              );
            })}
          </div>
        </div>

        {/* Notes / Changelog */}
        <div className="space-y-1">
          <label className="block font-bold text-slate-800">
            Ghi chú chi tiết về phiên bản này:
          </label>
          <textarea
            rows={3}
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Mô tả cụ thể những điểm mới đã hoàn thiện, phản hồi đã tiếp thu..."
            className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-800"
          />
        </div>
      </div>
    </Modal>
  );
};
