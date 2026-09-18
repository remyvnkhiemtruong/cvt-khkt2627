import type { UserRole } from '../../types';

export interface RouteDefinition {
  id: string;
  path: string;
  title: string;
  allowedRoles?: UserRole[];
  isGuestOnly?: boolean;
}

export const APP_ROUTES: Record<string, RouteDefinition> = {
  landing: { id:'landing', path:'/', title:'Trang chủ', isGuestOnly:true },
  login: { id:'login', path:'/login', title:'Đăng nhập', isGuestOnly:true },
  dashboard: { id:'dashboard', path:'/dashboard', title:'Bàn học', allowedRoles:['student'] },
  ...(import.meta.env?.DEV ? {
    'ui-kit': { id:'ui-kit', path:'/ui-kit', title:'Bản mẫu giao diện', allowedRoles:['admin'] }
  } : {}),
  'assignment-list': { id:'assignment-list', path:'/assignments', title:'Nhiệm vụ', allowedRoles:['student','teacher','peer','researcher','admin','ai'] },
  'student-dashboard': { id:'student-dashboard', path:'/student/assignments', title:'Nhiệm vụ của tôi', allowedRoles:['student'] },
  'portfolio-list': { id:'portfolio-list', path:'/portfolios', title:'Hồ sơ học tập', allowedRoles:['student','teacher','peer','researcher','admin','ai'] },
  editor: { id:'editor', path:'/student/editor', title:'Bài viết', allowedRoles:['student'] },
  'version-diff': { id:'version-diff', path:'/student/diff', title:'So sánh phiên bản', allowedRoles:['student','teacher'] },
  'student-analytics': { id:'student-analytics', path:'/student/analytics', title:'Tiến độ', allowedRoles:['student','teacher'] },
  'teacher-dashboard': { id:'teacher-dashboard', path:'/teacher/overview', title:'Giảng dạy', allowedRoles:['teacher','admin'] },
  'teacher-review': { id:'teacher-review', path:'/teacher/review', title:'Chấm bài & Phản hồi', allowedRoles:['teacher','peer','admin'] },
  'assignment-builder': { id:'assignment-builder', path:'/teacher/assignment-builder', title:'Tạo nhiệm vụ & Rubric', allowedRoles:['teacher','admin'] },
  'rubric-management': { id:'rubric-management', path:'/teacher/rubrics', title:'Rubric', allowedRoles:['teacher','admin','researcher'] },
  'literature-texts': { id:'literature-texts', path:'/teacher/literature-texts', title:'Ngữ liệu', allowedRoles:['teacher','admin','researcher'] },
  'class-analytics': { id:'class-analytics', path:'/teacher/class-analytics', title:'Thống kê toàn lớp', allowedRoles:['teacher','admin','researcher'] },
  'researcher-view': { id:'researcher-view', path:'/research/blind-eval', title:'Nghiên cứu', allowedRoles:['researcher','admin'] },
  'admin-view': { id:'admin-view', path:'/admin/audit', title:'Quản trị hệ thống & Nhật ký', allowedRoles:['admin'] },
  'ai-workspace': { id:'ai-workspace', path:'/ai/workspace', title:'Phản hồi AI', allowedRoles:['ai','teacher','admin'] }
};
