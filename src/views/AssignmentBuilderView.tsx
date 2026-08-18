import React, { useState } from 'react';
import { useNotificationStore } from '../app/store/useNotificationStore';
import { mockDb } from '../services/mockApi/mockDb';
import { POETIC_AXES } from '../data/seedData';
import type { PoeticAxisId, Assignment } from '../types';
import {
  Button,
  Badge,
  Card,
  Modal
} from '../components/ui';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  SparklesIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

interface AssignmentBuilderViewProps {
  onNavigate: (view: string, extraParams?: any) => void;
}

export const AssignmentBuilderView: React.FC<AssignmentBuilderViewProps> = ({ onNavigate }) => {
  const { addToast } = useNotificationStore();
  const literatureTexts = mockDb.getLiteratureTexts();

  // 7-Step Wizard State
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 7;

  // Step 1: Thông tin
  const [title, setTitle] = useState('Phân tích nghệ thuật xây dựng tình huống & điểm nhìn trần thuật');
  const [selectedTextId, setSelectedTextId] = useState(literatureTexts[0]?.id || 'lit-vo-nhat');
  const [targetClasses, setTargetClasses] = useState<string[]>(['11A1']);
  const [description, setDescription] = useState('Tìm hiểu cách Kim Lân sử dụng điểm nhìn nửa trực tiếp để khắc họa tâm lý nhân vật Tràng và sự thức tỉnh tình người trong nạn đói 1945.');
  const [objectives, setObjectives] = useState('Học sinh nhận diện được sự dịch chuyển điểm nhìn từ người kể chuyện sang dòng tâm trạng nhân vật; đối chiếu không gian bóng tối và ánh sáng ngày mới.');

  // Step 2: Trục thi pháp
  const [selectedAxes, setSelectedAxes] = useState<PoeticAxisId[]>([
    'plot_situation',
    'character_detail',
    'narrator_pov',
    'space_time'
  ]);

  // Step 3: Mẫu hồ sơ (Scaffolding blocks)
  const [enabledBlocks, setEnabledBlocks] = useState({
    text: true,
    evidence: true,
    table: true,
    timeline: true,
    diagram: false,
    media: false
  });

  // Step 5: Thiết lập thời gian & Peer Review
  const [startDate, setStartDate] = useState('2026-09-20');
  const [deadline, setDeadline] = useState('2026-09-30');
  const [enablePeerReview, setEnablePeerReview] = useState(true);
  const [peerReviewCount, setPeerReviewCount] = useState(2);

  // Publish Modal State
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleAxis = (axisId: PoeticAxisId) => {
    if (selectedAxes.includes(axisId)) {
      if (selectedAxes.length > 1) {
        setSelectedAxes(selectedAxes.filter(id => id !== axisId));
      }
    } else {
      setSelectedAxes([...selectedAxes, axisId]);
    }
  };

  const toggleClass = (className: string) => {
    if (targetClasses.includes(className)) {
      if (targetClasses.length > 1) {
        setTargetClasses(targetClasses.filter(c => c !== className));
      }
    } else {
      setTargetClasses([...targetClasses, className]);
    }
  };

  const handleNextStep = () => {
    if (currentStep === 1 && !title.trim()) {
      addToast({ type: 'error', title: 'Thiếu thông tin', message: 'Vui lòng nhập tên nhiệm vụ.' });
      return;
    }
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handlePublish = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsPublishModalOpen(false);

      const newAssignment: Assignment = {
        id: `assign-${Date.now()}`,
        title,
        textId: selectedTextId,
        classId: targetClasses[0] || '11A1',
        assignedDate: startDate,
        deadline,
        difficulty: 'Nâng cao',
        targetAxes: selectedAxes,
        prompt: description,
        guidingSteps: [
          'Bước 1: Đọc kỹ văn bản và trích xuất dẫn chứng.',
          'Bước 2: Phân tích sự dịch chuyển điểm nhìn nghệ thuật.',
          'Bước 3: Đóng băng bản sơ thảo v1.0 và tiếp thu phản hồi.'
        ],
        rubricId: 'rubric-poetics-standard'
      };

      mockDb.saveAssignment(newAssignment);

      addToast({
        type: 'success',
        title: 'Đã xuất bản nhiệm vụ thành công',
        message: `Nhiệm vụ đã được gửi tới học sinh lớp ${targetClasses.join(', ')}.`
      });

      onNavigate('teacher-dashboard');
    }, 800);
  };

  const selectedText = literatureTexts.find(t => t.id === selectedTextId);

  return (
    <div className="space-y-6 animate-fade-in pb-16 max-w-5xl mx-auto">
      {/* Header */}
      <header className="bg-white rounded-2xl border border-slate-200 p-5 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
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
            <span className="text-xs font-semibold text-slate-700">Tạo Nhiệm Vụ 7 Bước</span>
          </div>

          <h1 className="text-h3 font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <SparklesIcon className="w-6 h-6 text-indigo-700" />
            Thiết Kế Nhiệm Vụ Đọc Hiểu Theo Trục Thi Pháp
          </h1>
          <p className="text-small text-slate-500 mt-1">
            Quy trình tạo nhiệm vụ chuẩn mực sư phạm gồm 7 bước định hướng rõ ràng
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="purple" size="md">
            Bước {currentStep} / {totalSteps}
          </Badge>
        </div>
      </header>

      {/* Stepper Progress Indicator */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-card">
        <div className="grid grid-cols-7 gap-1 text-center">
          {[
            '1. Thông tin',
            '2. Trục thi pháp',
            '3. Mẫu khối',
            '4. Rubric',
            '5. Thiết lập',
            '6. Xem trước',
            '7. Xuất bản'
          ].map((stepName, idx) => {
            const stepNum = idx + 1;
            const isDone = stepNum < currentStep;
            const isCurrent = stepNum === currentStep;

            return (
              <button
                key={stepNum}
                type="button"
                onClick={() => setCurrentStep(stepNum)}
                className={`py-2 px-1 rounded-xl text-[11px] font-bold transition flex flex-col items-center gap-1 ${
                  isCurrent
                    ? 'bg-slate-900 text-white shadow-xs'
                    : isDone
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-slate-50 text-slate-400'
                }`}
              >
                <span>{stepName}</span>
                {isDone && <span className="text-[10px] text-emerald-600">✓ Đã xong</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Wizard Form Container */}
      <Card padding="lg" className="border-slate-200 bg-white shadow-card space-y-6">
        {/* ========================================================================= */}
        {/* STEP 1: THÔNG TIN CƠ BẢN */}
        {/* ========================================================================= */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">
                Bước 1: Thông Tin Nhiệm Vụ & Ngữ Liệu Văn Học
              </h2>
              <p className="text-xs text-slate-500">Khai báo tiêu đề, tác phẩm văn học đối chiếu và mục tiêu cần đạt.</p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="block font-bold text-slate-800">
                  Tên nhiệm vụ đọc hiểu: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Ví dụ: Phân tích nghệ thuật xây dựng tình huống & điểm nhìn..."
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800 font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-800">
                    Chọn tác phẩm văn học:
                  </label>
                  <select
                    value={selectedTextId}
                    onChange={e => setSelectedTextId(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none font-semibold text-slate-800"
                  >
                    {literatureTexts.map(t => (
                      <option key={t.id} value={t.id}>{t.title} ({t.author})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-800">
                    Lớp áp dụng:
                  </label>
                  <div className="flex gap-2 pt-1">
                    {['11A1', '11A2'].map(cls => (
                      <button
                        key={cls}
                        type="button"
                        onClick={() => toggleClass(cls)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                          targetClasses.includes(cls)
                            ? 'bg-indigo-900 text-white border-indigo-900'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        {targetClasses.includes(cls) ? `✓ Lớp ${cls}` : `+ Lớp ${cls}`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-800">
                  Mô tả hướng dẫn học sinh:
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none leading-relaxed"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-800">
                  Mục tiêu năng lực cần đạt (Yêu cầu cần đạt Chương trình 2018):
                </label>
                <textarea
                  rows={2}
                  value={objectives}
                  onChange={e => setObjectives(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none leading-relaxed"
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: TRỤC THI PHÁP */}
        {/* ========================================================================= */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">
                Bước 2: Lựa Chọn Trục Thi Pháp Bắt Buộc
              </h2>
              <p className="text-xs text-slate-500">Chọn một hoặc nhiều trục thi pháp mà học sinh cần nghiên cứu và viết trong hồ sơ.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {POETIC_AXES.map(axis => {
                const isSelected = selectedAxes.includes(axis.id);
                return (
                  <button
                    key={axis.id}
                    type="button"
                    onClick={() => toggleAxis(axis.id)}
                    className={`p-4 rounded-xl border text-left transition-all space-y-1.5 ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{axis.title}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${isSelected ? 'bg-indigo-900 text-white' : 'bg-slate-100 text-slate-500'}`}>
                        {isSelected ? '✓ Đã chọn' : '+ Chọn'}
                      </span>
                    </div>
                    <p className="text-slate-600 text-caption leading-relaxed">{axis.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: MẪU KHỐI HỒ SƠ (SCAFFOLDING TEMPLATES) */}
        {/* ========================================================================= */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">
                Bước 3: Cấu Hình Mẫu Khối Soạn Thảo (Scaffolding Blocks)
              </h2>
              <p className="text-xs text-slate-500">Bật/tắt các loại khối công cụ hỗ trợ tư duy học sinh trong Workspace.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {[
                { key: 'text', title: 'Khối Văn bản (TextBlock)', desc: 'Phân tích tự do, luận điểm chính.' },
                { key: 'evidence', title: 'Khối Dẫn chứng & Lí giải (EvidenceBlock)', desc: '2 vùng tách biệt: Trích dẫn ngữ liệu & Lí giải nghệ thuật.' },
                { key: 'table', title: 'Khối Bảng đối chiếu (TableBlock)', desc: 'So sánh đối xứng hai mặt (ví dụ: Bóng tối vs Ánh sáng).' },
                { key: 'timeline', title: 'Khối Tiến trình tâm lý (TimelineBlock)', desc: 'Theo dõi diễn biến cảm xúc nhân vật theo thứ tự thời gian.' },
                { key: 'diagram', title: 'Khối Sơ đồ tư duy (DiagramBlock)', desc: 'Vẽ sơ đồ phân nhánh cấu trúc cốt truyện.' },
                { key: 'media', title: 'Khối Minh họa (MediaBlock)', desc: 'Chèn hình ảnh hoặc trích đoạn phim chuyển thể.' },
              ].map(item => {
                const isEnabled = enabledBlocks[item.key as keyof typeof enabledBlocks];
                return (
                  <div
                    key={item.key}
                    className="p-4 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3"
                  >
                    <div>
                      <span className="font-bold text-slate-900 block">{item.title}</span>
                      <span className="text-[11px] text-slate-500">{item.desc}</span>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isEnabled}
                        onChange={() => setEnabledBlocks(prev => ({
                          ...prev,
                          [item.key]: !prev[item.key as keyof typeof enabledBlocks]
                        }))}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-900" />
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 4: RUBRIC */}
        {/* ========================================================================= */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div className="pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">
                Bước 4: Thiết Lập Ma Trận Rubric Đánh Giá
              </h2>
              <p className="text-xs text-slate-500">Gắn ma trận Rubric 4 mức độ chuẩn của Bộ GD&ĐT.</p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-4 bg-indigo-50/70 rounded-xl border border-indigo-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-950">Ma trận Rubric 6 Trục Thi Pháp THPT (Bộ GD&ĐT 2018)</span>
                  <Badge variant="emerald">Chuẩn nghiên cứu</Badge>
                </div>
                <p className="text-slate-700 leading-relaxed text-[11px]">
                  Thang điểm 0–4 (*Chưa thể hiện, Nhận biết sơ bộ, Đạt cơ bản, Phân tích rõ, Vận dụng sâu/độc lập*) áp dụng tự động cho các trục đã chọn.
                </p>
              </div>

              <div className="pt-2">
                <span className="font-bold text-slate-800 block mb-2">Xem trước mô tả tiêu chí:</span>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedAxes.map(axisId => {
                    const ax = POETIC_AXES.find(a => a.id === axisId);
                    return (
                      <div key={axisId} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-[11px]">
                        <strong>{ax?.title}:</strong> {ax?.description}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 5: THIẾT LẬP THỜI GIAN & PEER REVIEW */}
        {/* ========================================================================= */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <div className="pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">
                Bước 5: Thiết Lập Thời Gian & Đánh Giá Đồng Đẳng (Peer Review)
              </h2>
              <p className="text-xs text-slate-500">Cấu hình thời hạn nộp bài và chế độ phản biện giữa các học sinh.</p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-800">Ngày mở nhiệm vụ:</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-800">Hạn nộp chính thức (Deadline):</label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={e => setDeadline(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none font-semibold text-rose-800"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 block">Bật đánh giá đồng đẳng (Peer Review)</span>
                    <span className="text-[11px] text-slate-500">Cho phép học sinh phản biện và neo nhận xét vào bài của bạn học.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={enablePeerReview}
                    onChange={e => setEnablePeerReview(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                </div>

                {enablePeerReview && (
                  <div className="pt-2 border-t border-slate-200 flex items-center gap-3">
                    <span className="font-semibold text-slate-700">Số lượng bạn học chấm chéo mỗi bài:</span>
                    <select
                      value={peerReviewCount}
                      onChange={e => setPeerReviewCount(Number(e.target.value))}
                      className="bg-white border border-slate-300 rounded-lg text-xs py-1 px-2.5 font-bold"
                    >
                      <option value={1}>1 bạn học</option>
                      <option value={2}>2 bạn học (Khuyến nghị)</option>
                      <option value={3}>3 bạn học</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 6: PREVIEW STUDENT VIEW */}
        {/* ========================================================================= */}
        {currentStep === 6 && (
          <div className="space-y-4">
            <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <EyeIcon className="w-5 h-5 text-indigo-700" />
                  Bước 6: Xem Trước Giao Diện Học Sinh (Student Preview)
                </h2>
                <p className="text-xs text-slate-500">Kiểm tra chính xác cách học sinh sẽ nhìn thấy bài tập khi đăng nhập.</p>
              </div>
              <Badge variant="emerald">Preview Mode</Badge>
            </div>

            {/* Student Assignment Preview Mock */}
            <div className="p-5 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-caption font-bold text-indigo-700 uppercase tracking-wider">
                  Nhiệm vụ: {selectedText?.title}
                </span>
                <Badge variant="blue">Hạn nộp: {deadline}</Badge>
              </div>

              <h3 className="text-base font-bold text-slate-900">{title}</h3>
              <p className="text-slate-700 leading-relaxed">{description}</p>

              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                <span className="font-bold text-slate-800 block">Các trục thi pháp cần hoàn thành:</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedAxes.map(axisId => (
                    <Badge key={axisId} variant="purple" size="sm">
                      {POETIC_AXES.find(a => a.id === axisId)?.shortName}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 7: XUẤT BẢN */}
        {/* ========================================================================= */}
        {currentStep === 7 && (
          <div className="space-y-4 text-center py-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full mx-auto flex items-center justify-center">
              <CheckCircleIcon className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h2 className="text-base font-bold text-slate-900">
                Bước 7: Xác Nhận & Xuất Bản Nhiệm Vụ
              </h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Tất cả 6 bước cấu hình đã hoàn tất hợp lệ. Nhấn nút bên dưới để phát hành nhiệm vụ tới các lớp đã chọn.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 max-w-md mx-auto text-left text-xs space-y-1.5">
              <div><strong>Tác phẩm:</strong> {selectedText?.title}</div>
              <div><strong>Lớp nhận:</strong> {targetClasses.join(', ')}</div>
              <div><strong>Số trục thi pháp:</strong> {selectedAxes.length} trục</div>
              <div><strong>Hạn nộp:</strong> {deadline}</div>
            </div>

            <Button
              variant="primary"
              size="lg"
              onClick={() => setIsPublishModalOpen(true)}
              className="bg-indigo-900 text-white font-bold px-8 mt-2"
            >
              Xuất bản nhiệm vụ ngay
            </Button>
          </div>
        )}

        {/* Wizard Bottom Navigation Buttons */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <Button
            variant="secondary"
            disabled={currentStep === 1}
            onClick={handlePrevStep}
            leftIcon={<ArrowLeftIcon className="w-4 h-4" />}
          >
            Quay lại
          </Button>

          {currentStep < totalSteps ? (
            <Button
              variant="primary"
              onClick={handleNextStep}
              rightIcon={<ArrowRightIcon className="w-4 h-4" />}
              className="bg-slate-900 text-white font-bold"
            >
              Tiếp tục bước {currentStep + 1}
            </Button>
          ) : null}
        </div>
      </Card>

      {/* Confirmation Modal */}
      <Modal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        title="Xác Nhận Xuất Bản Nhiệm Vụ"
        description="Nhiệm vụ sẽ ngay lập tức hiển thị trên Dashboard của tất cả học sinh trong lớp được chỉ định."
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsPublishModalOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="primary"
              isLoading={isSubmitting}
              onClick={handlePublish}
              className="bg-indigo-900 text-white font-bold"
            >
              Xác nhận phát hành
            </Button>
          </>
        }
      >
        <p className="text-xs text-slate-700">
          Bạn có chắc chắn muốn xuất bản nhiệm vụ <strong>“{title}”</strong> cho lớp <strong>{targetClasses.join(', ')}</strong>?
        </p>
      </Modal>
    </div>
  );
};
