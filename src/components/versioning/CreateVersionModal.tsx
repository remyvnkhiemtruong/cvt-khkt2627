import React, { useState } from 'react';
import { Button, Modal, Badge } from '../ui';
import type { FeedbackItem } from '../../types';

interface CreateVersionModalProps {
  isOpen: boolean;
  onClose: () => void;
  nextVersionNumber: string;
  isInitial?: boolean;
  isPrediction?: boolean;
  feedbacks?: FeedbackItem[];
  onConfirm: (data: {
    changeSummary: string;
    revisionReason: string;
    linkedFeedbackIds: string[];
    changeSource: string;
    confidence: number;
    stage?: 'prediction' | 'initial' | 'revision';
  }) => Promise<void>;
}

export const CreateVersionModal: React.FC<CreateVersionModalProps> = ({
  isOpen,
  onClose,
  nextVersionNumber,
  isInitial = false,
  isPrediction = false,
  feedbacks = [],
  onConfirm
}) => {
  const [changeSummary, setChangeSummary] = useState('');
  const [revisionReason, setRevisionReason] = useState('');
  const [linkedFeedbackIds, setLinkedFeedbackIds] = useState<string[]>([]);
  const [changeSource, setChangeSource] = useState('self');
  const [confidence, setConfidence] = useState<number>(3);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const toggleFeedback = (id: string) => {
    setLinkedFeedbackIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (!isInitial && !changeSummary.trim()) {
      setErrorMsg('Vui lòng mô tả tóm tắt nội dung bạn đã sửa.');
      return;
    }
    if (!isInitial && !revisionReason.trim()) {
      setErrorMsg('Vui lòng giải thích lí do bạn thực hiện chỉnh sửa này.');
      return;
    }

    setErrorMsg('');
    setIsSubmitting(true);
    try {
      const stage = isPrediction ? 'prediction' : (isInitial ? 'initial' : 'revision');
      await onConfirm({
        changeSummary: changeSummary.trim() || (isPrediction ? 'Bản dự đoán trước đọc' : isInitial ? 'Nộp bản đầu tiên' : 'Chỉnh sửa bài viết'),
        revisionReason: revisionReason.trim() || (isInitial ? 'Bản đầu tiên' : 'Chỉnh sửa theo yêu cầu'),
        linkedFeedbackIds,
        changeSource: isInitial ? (isPrediction ? 'initial_prediction' : 'initial_response') : changeSource,
        confidence,
        stage
      });
      onClose();
    } catch {
      setErrorMsg('Không thể nộp phiên bản. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isPrediction ? 'Nộp Bản Dự Đoán Trước Đọc' : isInitial ? `Nộp Bài Lần Đầu (${nextVersionNumber})` : `Nộp Phiên Bản Mới (${nextVersionNumber})`}
      description="Bài nộp sẽ được lưu thành phiên bản cố định để theo dõi tiến trình và gửi vào hàng đợi nhận xét."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Hủy bỏ
          </Button>
          <Button
            variant="primary"
            isLoading={isSubmitting}
            onClick={handleSubmit}
            className="bg-indigo-900 text-white font-bold"
          >
            {isPrediction ? 'Nộp bản dự đoán' : isInitial ? 'Nộp bài (gửi phản hồi)' : `Nộp phiên bản ${nextVersionNumber}`}
          </Button>
        </>
      }
    >
      <div className="space-y-4 text-xs text-slate-700">
        {errorMsg && (
          <div className="rounded-md border border-rose-200 bg-rose-50 p-2.5 text-rose-700 font-medium">
            {errorMsg}
          </div>
        )}

        <div className="flex items-center justify-between rounded-md border border-indigo-200 bg-indigo-50/70 p-3">
          <div>
            <span className="block text-[11px] font-semibold text-indigo-700">Mốc phiên bản</span>
            <span className="font-bold text-indigo-950 text-sm">{nextVersionNumber}</span>
          </div>
          <Badge variant="indigo">
            {isPrediction ? 'Dự đoán trước đọc' : isInitial ? 'Bản khởi đầu' : 'Bản sửa đổi (Revision)'}
          </Badge>
        </div>

        {/* Change Summary */}
        <div>
          <label className="block font-semibold text-slate-800 mb-1">
            {isInitial ? 'Ghi chú bài nộp:' : 'Tôi đã sửa gì? *'}
          </label>
          <textarea
            rows={3}
            value={changeSummary}
            onChange={e => setChangeSummary(e.target.value)}
            placeholder={isInitial ? 'Ghi chú các trọng tâm phân tích của bạn…' : 'Ví dụ: Đã bổ sung 2 dẫn chứng về người kể chuyện, sửa lại đoạn kết…'}
            className="w-full rounded-md border border-slate-300 p-2 text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* V2+ specific fields */}
        {!isInitial && (
          <>
            <div>
              <label className="block font-semibold text-slate-800 mb-1">Vì sao em sửa? *</label>
              <textarea
                rows={2}
                value={revisionReason}
                onChange={e => setRevisionReason(e.target.value)}
                placeholder="Giải thích lí do sửa (do phát hiện thiếu dẫn chứng, theo nhận xét giáo viên…)"
                className="w-full rounded-md border border-slate-300 p-2 text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">Nguồn thay đổi:</label>
              <select
                value={changeSource}
                onChange={e => setChangeSource(e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white p-2 text-xs outline-none focus:border-indigo-500"
              >
                <option value="self">Tự phát hiện & chỉnh sửa</option>
                <option value="teacher_feedback">Dựa trên phản hồi giáo viên</option>
                <option value="peer_feedback">Dựa trên phản hồi bạn học</option>
                <option value="mixed">Hỗn hợp (cả tự sửa và phản hồi)</option>
              </select>
            </div>

            {feedbacks.length > 0 && (
              <div>
                <label className="block font-semibold text-slate-800 mb-1.5">
                  Em sửa dựa trên phản hồi nào? (Chọn các góp ý liên quan)
                </label>
                <div className="max-h-36 overflow-y-auto space-y-1.5 rounded-md border border-slate-200 bg-slate-50 p-2">
                  {feedbacks.map(f => (
                    <label
                      key={f.id}
                      className="flex items-start gap-2 cursor-pointer rounded p-1 hover:bg-white text-[11px]"
                    >
                      <input
                        type="checkbox"
                        checked={linkedFeedbackIds.includes(f.id)}
                        onChange={() => toggleFeedback(f.id)}
                        className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold text-slate-800">
                          {f.authorRole === 'teacher' ? 'Giáo viên' : (f.authorRole === 'peer' ? 'Bạn học' : 'AI')}:
                        </span>{' '}
                        <span className="text-slate-600 truncate">{f.comment}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Confidence scale 1-5 */}
        <div>
          <label className="block font-semibold text-slate-800 mb-1">
            Mức độ tự tin với bài viết này (1: Chưa tự tin — 5: Rất tự tin):
          </label>
          <div className="flex items-center gap-3">
            {[1, 2, 3, 4, 5].map(val => (
              <button
                type="button"
                key={val}
                onClick={() => setConfidence(val)}
                className={`flex h-8 w-8 items-center justify-center rounded-md border text-xs font-bold transition-all ${
                  confidence === val
                    ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
                    : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
                }`}
              >
                {val}
              </button>
            ))}
            <span className="text-[11px] text-slate-500 ml-1">
              {confidence === 1 ? 'Chưa chắc chắn' : confidence === 3 ? 'Bình thường' : confidence === 5 ? 'Rất tự tin' : ''}
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
};
