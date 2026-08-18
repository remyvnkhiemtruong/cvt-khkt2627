import React, { useState } from 'react';
import { useNotificationStore } from '../app/store/useNotificationStore';
import { POETIC_AXES } from '../data/seedData';
import type { PoeticAxisId } from '../types';
import {
  Button,
  Badge,
  Card,
  Modal
} from '../components/ui';
import {
  SparklesIcon,
  PlusIcon,
  DocumentDuplicateIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface RubricManagementViewProps {
  onNavigate: (view: string, extraParams?: any) => void;
}

export const RubricManagementView: React.FC<RubricManagementViewProps> = ({ onNavigate }) => {
  const { addToast } = useNotificationStore();

  const [rubricTitle, setRubricTitle] = useState('Ma Trận Đánh Giá Năng Lực Đọc Hiểu 6 Trục Thi Pháp THPT');
  const [rubricVersion, setRubricVersion] = useState('v2.0');
  const [rubricDescription, setRubricDescription] = useState('Khung đánh giá định lượng và định tính dành cho đề tài nghiên cứu sư phạm cấp THPT, tuân thủ Chương trình GDPT 2018.');
  const [isLockedForResearch, setIsLockedForResearch] = useState(true);
  const [isNewVersionModalOpen, setIsNewVersionModalOpen] = useState(false);

  // Criteria State
  const [criteria, setCriteria] = useState(() => {
    return POETIC_AXES.map((axis, idx) => ({
      id: axis.id,
      title: axis.title,
      order: idx + 1,
      weight: 1.0,
      descriptors: {
        0: 'Chưa thể hiện được năng lực nhận diện trong bài viết.',
        1: 'Nhận biết sơ bộ ngôi kể / tình huống nhưng chưa phân tích được tác dụng.',
        2: 'Đạt yêu cầu cơ bản, trích dẫn được ngữ liệu minh chứng.',
        3: 'Phân tích rõ nét, chỉ ra được sự vận động và dịch chuyển nghệ thuật.',
        4: 'Vận dụng sâu sắc, lí giải độc lập và liên hệ phong cách tác giả.'
      }
    }));
  });

  const handleDuplicateCriterion = (axisId: PoeticAxisId) => {
    const target = criteria.find(c => c.id === axisId);
    if (!target) return;

    const duplicated = {
      ...target,
      id: `${target.id}_copy_${Date.now()}` as any,
      title: `${target.title} (Bản sao)`,
      order: criteria.length + 1
    };

    setCriteria(prev => [...prev, duplicated]);
    addToast({
      type: 'info',
      title: 'Đã nhân bản tiêu chí',
      message: `Đã tạo tiêu chí mới từ ${target.title}.`
    });
  };

  const handleSaveAsTemplate = () => {
    addToast({
      type: 'success',
      title: 'Đã lưu mẫu Rubric thành công',
      message: `Phiên bản ${rubricVersion} đã được ghi nhận vào kho lưu trữ mẫu.`
    });
  };

  const handleCreateNewVersion = () => {
    setIsLockedForResearch(false);
    setRubricVersion('v3.0 (Bản nháp mới)');
    setIsNewVersionModalOpen(false);
    addToast({
      type: 'info',
      title: 'Đã mở phiên bản mới v3.0',
      message: 'Các thay đổi sẽ được lưu vào v3.0 và không làm ảnh hưởng đến dữ liệu đã chấm của v2.0.'
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
            <span className="text-xs font-semibold text-slate-700">Quản Lý Ma Trận Rubric</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-h3 font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <ShieldCheckIcon className="w-6 h-6 text-indigo-700" />
              Thiết Kế & Quản Trị Phiên Bản Rubric
            </h1>
            <Badge variant="purple">{rubricVersion}</Badge>
            {isLockedForResearch && (
              <Badge variant="emerald">Đã khóa cho nghiên cứu</Badge>
            )}
          </div>
          <p className="text-small text-slate-500 mt-1">
            Bảo đảm tính toàn vẹn dữ liệu nghiên cứu khoa học qua cơ chế lưu phiên bản ma trận Rubric
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {isLockedForResearch ? (
            <Button
              size="sm"
              variant="academic"
              onClick={() => setIsNewVersionModalOpen(true)}
              leftIcon={<PlusIcon className="w-4 h-4" />}
            >
              Tạo phiên bản v3.0 để sửa
            </Button>
          ) : (
            <Button
              size="sm"
              variant="primary"
              onClick={handleSaveAsTemplate}
              className="bg-indigo-900 text-white font-bold"
            >
              Lưu mẫu Rubric
            </Button>
          )}
        </div>
      </header>

      {/* Research Integrity Warning Alert */}
      {isLockedForResearch && (
        <div className="p-4 bg-indigo-50/80 border border-indigo-200 rounded-2xl flex items-start gap-3 text-xs text-indigo-950">
          <ExclamationTriangleIcon className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="font-bold">Ma trận Rubric đang được bảo vệ tính toàn vẹn (Research Data Integrity):</strong>
            <p className="text-slate-700 leading-relaxed">
              Rubric <strong>{rubricVersion}</strong> này đã được sử dụng để chấm <strong>72 bài làm</strong> trong đề tài nghiên cứu đối chứng. Hệ thống không cho phép sửa trực tiếp để tránh làm sai lệch dữ liệu lịch sử. Để điều chỉnh tiêu chí, vui lòng bấm nút <em>“Tạo phiên bản v3.0 để sửa”</em>.
            </p>
          </div>
        </div>
      )}

      {/* Metadata Form */}
      <Card padding="lg" className="border-slate-200 bg-white shadow-card space-y-4">
        <div className="space-y-3 text-xs">
          <div className="space-y-1">
            <label className="block font-bold text-slate-800">Tên ma trận Rubric:</label>
            <input
              type="text"
              disabled={isLockedForResearch}
              value={rubricTitle}
              onChange={e => setRubricTitle(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none font-bold text-slate-900"
            />
          </div>

          <div className="space-y-1">
            <label className="block font-bold text-slate-800">Mục đích & Mô tả sư phạm:</label>
            <textarea
              rows={2}
              disabled={isLockedForResearch}
              value={rubricDescription}
              onChange={e => setRubricDescription(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none leading-relaxed"
            />
          </div>
        </div>
      </Card>

      {/* Rubric Criteria 0 - 4 Scales Editor */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 text-indigo-700" />
            Danh Sách Tiêu Chí Đánh Giá (6 Trục Thi Pháp THPT)
          </h2>
          <span className="text-xs text-slate-500 font-semibold">{criteria.length} tiêu chí</span>
        </div>

        <div className="space-y-4">
          {criteria.map((item, idx) => (
            <Card key={item.id} padding="lg" className="border-slate-200 bg-white shadow-card space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900">{item.title}</h3>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDuplicateCriterion(item.id as PoeticAxisId)}
                    leftIcon={<DocumentDuplicateIcon className="w-3.5 h-3.5" />}
                    className="text-xs text-slate-600"
                  >
                    Nhân bản
                  </Button>
                </div>
              </div>

              {/* 5 Descriptors (Levels 0 - 4) */}
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 text-xs">
                {[
                  { lvl: 0, label: 'Mức 0: Chưa đạt (0 đ)' },
                  { lvl: 1, label: 'Mức 1: Nhận biết (1 đ)' },
                  { lvl: 2, label: 'Mức 2: Cơ bản (2 đ)' },
                  { lvl: 3, label: 'Mức 3: Phân tích (3 đ)' },
                  { lvl: 4, label: 'Mức 4: Sâu sắc (4 đ)' },
                ].map(scale => (
                  <div
                    key={scale.lvl}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5"
                  >
                    <span className="font-bold text-slate-800 text-[11px] block">{scale.label}</span>
                    <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
                      {item.descriptors[scale.lvl as keyof typeof item.descriptors]}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Modal Confirm New Version */}
      <Modal
        isOpen={isNewVersionModalOpen}
        onClose={() => setIsNewVersionModalOpen(false)}
        title="Tạo Bản Sao Rubric v3.0"
        description="Mở khóa chỉnh sửa trên một phiên bản mới, bảo toàn nguyên vẹn dữ liệu điểm số của v2.0."
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsNewVersionModalOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateNewVersion}
              className="bg-indigo-900 text-white font-bold"
            >
              Tạo phiên bản v3.0
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-xs text-slate-700">
          <div className="p-3 bg-emerald-50 text-emerald-950 rounded-xl border border-emerald-200 flex items-center gap-2">
            <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Toàn bộ 72 bài làm đã chấm theo Rubric v2.0 sẽ giữ nguyên kết quả gốc.</span>
          </div>
          <p>
            Bạn có chắc chắn muốn tạo phiên bản <strong>v3.0</strong> để tiếp tục cải tiến các tiêu chí?
          </p>
        </div>
      </Modal>
    </div>
  );
};
