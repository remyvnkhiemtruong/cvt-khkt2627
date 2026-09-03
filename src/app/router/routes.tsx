import type { UserRole } from '../../types';

export interface RouteDefinition {
  id: string;
  path: string;
  title: string;
  allowedRoles?: UserRole[];
  isGuestOnly?: boolean;
}

export const APP_ROUTES: Record<string, RouteDefinition> = {
  login: { id:'login', path:'/login', title:'Đăng nhập', isGuestOnly:true },
  dashboard: { id:'dashboard', path:'/', title:'Bàn học', allowedRoles:['student','teacher','peer','researcher','admin'] },
  ...(import.meta.env?.DEV ? {
    'ui-kit': { id:'ui-kit', path:'/ui-kit', title:'Bản mẫu giao diện', allowedRoles:['admin'] }
  } : {}),
  'assignment-list': { id:'assignment-list', path:'/assignments', title:'Nhiệm vụ Ngữ văn', allowedRoles:['student','teacher','peer','researcher','admin'] },
  'student-dashboard': { id:'student-dashboard', path:'/student/assignments', title:'Nhiệm vụ của tôi', allowedRoles:['student','teacher'] },
  'portfolio-list': { id:'portfolio-list', path:'/portfolios', title:'Hồ sơ học tập', allowedRoles:['student','teacher','peer','researcher','admin'] },
  editor: { id:'editor', path:'/student/editor', title:'Không gian viết & phân tích', allowedRoles:['student'] },
  'version-diff': { id:'version-diff', path:'/student/diff', title:'So sánh phiên bản', allowedRoles:['student','teacher','peer','researcher'] },
  'student-analytics': { id:'student-analytics', path:'/student/analytics', title:'Tiến bộ & Đề xuất', allowedRoles:['student','teacher'] },
  'teacher-dashboard': { id:'teacher-dashboard', path:'/teacher/overview', title:'Bàn làm việc Giáo viên', allowedRoles:['teacher','admin'] },
  'teacher-review': { id:'teacher-review', path:'/teacher/review', title:'Chấm bài & Phản hồi', allowedRoles:['teacher','peer','admin'] },
  'assignment-builder': { id:'assignment-builder', path:'/teacher/assignment-builder', title:'Tạo nhiệm vụ & Rubric', allowedRoles:['teacher','admin'] },
  'rubric-management': { id:'rubric-management', path:'/teacher/rubrics', title:'Quản lý ma trận Rubric', allowedRoles:['teacher','admin','researcher'] },
  'literature-texts': { id:'literature-texts', path:'/teacher/literature-texts', title:'Kho tác phẩm văn học', allowedRoles:['teacher','admin','student','researcher'] },
  'class-analytics': { id:'class-analytics', path:'/teacher/class-analytics', title:'Thống kê toàn lớp', allowedRoles:['teacher','admin','researcher'] },
  'researcher-view': { id:'researcher-view', path:'/research/blind-eval', title:'Dữ liệu Ẩn danh & Nghiên cứu', allowedRoles:['researcher','admin'] },
  'admin-view': { id:'admin-view', path:'/admin/audit', title:'Quản trị hệ thống & Audit', allowedRoles:['admin'] },
  'ai-workspace': { id:'ai-workspace', path:'/ai/workspace', title:'Hàng đợi phản hồi AI', allowedRoles:['ai','teacher','admin'] }
};
