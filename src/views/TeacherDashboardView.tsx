import React from 'react';
import { Button } from '../components/ui';
import { usePortfolio } from '../contexts/PortfolioContext';

interface Props { onNavigate: (view: string, params?: any) => void; }

export const TeacherDashboardView: React.FC<Props> = ({ onNavigate }) => {
  const { assignments, portfolios, aiReviews, rubricSubmissions } = usePortfolio();
  const list = Object.values(portfolios);
  const aiPending = aiReviews.filter(r => r.status === 'completed' && r.teacher_review_status === 'pending').length;
  const rubricPending = list.filter(p => p.status === 'waiting_official_rubric' && !rubricSubmissions.some(r => r.studentId === p.studentId && r.assignmentId === p.assignmentId && r.evaluatorRole === 'teacher')).length;
  const revising = list.filter(p => p.status === 'feedback_received' || p.status === 'revising').length;
  const done = list.filter(p => p.status === 'completed').length;

  return <div className="mx-auto max-w-7xl space-y-6 pb-16">
    <div className="flex items-end justify-between border-b border-slate-200 pb-4"><div><h1 className="text-2xl font-semibold text-slate-950">Hàng đợi giáo viên</h1><p className="mt-1 text-sm text-slate-500">Ưu tiên đúng việc cần xử lý tiếp theo.</p></div><Button variant="primary" onClick={() => onNavigate('assignment-builder')}>Tạo nhiệm vụ</Button></div>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[['AI chờ xem',aiPending],['Chờ Rubric',rubricPending],['HS đang sửa',revising],['Hoàn thành',done]].map(([label,count]) => <div key={String(label)} className="rounded-xl border border-slate-200 bg-white p-4"><div className="text-2xl font-semibold">{count}</div><div className="text-xs text-slate-500">{label}</div></div>)}</div>
    <div className="rounded-xl border border-slate-200 bg-white p-5"><div className="flex items-center justify-between"><div><div className="font-semibold text-slate-900">{assignments.length} nhiệm vụ đang quản lý</div><div className="mt-1 text-sm text-slate-500">Mở danh sách hồ sơ để xử lý theo học sinh.</div></div><Button variant="outline" onClick={() => onNavigate('portfolio-list')}>Xem hồ sơ</Button></div></div>
  </div>;
};
