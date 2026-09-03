import React, { Suspense, lazy, useEffect, useState } from 'react';
import { AppProviders } from './app/providers/AppProviders';
import { MainLayout } from './components/layout/MainLayout';
import { LoginView } from './views/LoginView';
import { ForbiddenView } from './views/ForbiddenView';
import { NotFoundView } from './views/NotFoundView';
import { useAuthStore } from './app/store/useAuthStore';
import { APP_ROUTES } from './app/router/routes';
import { PortfolioProvider } from './contexts/PortfolioContext';
import { AuthProvider } from './contexts/AuthContext';
import type { UserRole } from './types';

const StudentDashboardView = lazy(() => import('./views/StudentDashboardView').then((module) => ({ default: module.StudentDashboardView })));
const AssignmentListView = lazy(() => import('./views/AssignmentListView').then((module) => ({ default: module.AssignmentListView })));
const PortfolioListView = lazy(() => import('./views/PortfolioListView').then((module) => ({ default: module.PortfolioListView })));
const PortfolioEditorView = lazy(() => import('./views/PortfolioEditorView').then((module) => ({ default: module.PortfolioEditorView })));
const VersionDiffView = lazy(() => import('./views/VersionDiffView').then((module) => ({ default: module.VersionDiffView })));
const StudentAnalyticsView = lazy(() => import('./views/StudentAnalyticsView').then((module) => ({ default: module.StudentAnalyticsView })));
const TeacherDashboardView = lazy(() => import('./views/TeacherDashboardView').then((module) => ({ default: module.TeacherDashboardView })));
const TeacherReviewView = lazy(() => import('./views/TeacherReviewView').then((module) => ({ default: module.TeacherReviewView })));
const AssignmentBuilderView = lazy(() => import('./views/AssignmentBuilderView').then((module) => ({ default: module.AssignmentBuilderView })));
const RubricManagementView = lazy(() => import('./views/RubricManagementView').then((module) => ({ default: module.RubricManagementView })));
const LiteratureTextsView = lazy(() => import('./views/LiteratureTextsView').then((module) => ({ default: module.LiteratureTextsView })));
const ClassAnalyticsView = lazy(() => import('./views/ClassAnalyticsView').then((module) => ({ default: module.ClassAnalyticsView })));
const ResearcherJudgeView = lazy(() => import('./views/ResearcherJudgeView').then((module) => ({ default: module.ResearcherJudgeView })));
const AdminAuditView = lazy(() => import('./views/AdminAuditView').then((module) => ({ default: module.AdminAuditView })));
const DesignSystemKitView = lazy(() => import('./views/DesignSystemKitView').then((module) => ({ default: module.DesignSystemKitView })));
const AiWorkspaceView = lazy(() => import('./views/AiWorkspaceView').then((module) => ({ default: module.AiWorkspaceView })));

const homeViewForRole = (role: UserRole) => {
  if (role === 'ai') return 'ai-workspace';
  if (role === 'teacher') return 'teacher-dashboard';
  if (role === 'researcher') return 'researcher-view';
  if (role === 'admin') return 'admin-view';
  if (role === 'peer') return 'portfolio-list';
  return 'dashboard';
};

const locationState = () => {
  const route = Object.values(APP_ROUTES).find(item => item.path === window.location.pathname);
  const query = new URLSearchParams(window.location.search);
  const params: Record<string,string> = {};
  query.forEach((value,key) => { params[key] = value; });
  return { view: route?.id || 'not-found', params };
};

const ViewLoading = () => (
  <div className="flex min-h-64 items-center justify-center px-4">
    <div className="text-center"><div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900"/><p className="text-sm font-semibold text-slate-600">Đang tải phân hệ…</p></div>
  </div>
);

const AppContent: React.FC = () => {
  const currentUser = useAuthStore((state) => state.currentUser);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setAuthenticatedUser = useAuthStore((state) => state.setAuthenticatedUser);
  const clearAuth = useAuthStore((state) => state.logout);
  const initial = locationState();
  const [sessionChecking, setSessionChecking] = useState(true);
  const [currentView, setCurrentView] = useState<string>(initial.view);
  const [navParams, setNavParams] = useState<any>(initial.params);

  const replaceToView = (view:string, params:Record<string,any> = {}) => {
    const route = APP_ROUTES[view];
    if (!route) return;
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key,value]) => { if(value!==undefined && value!==null && value!=='') query.set(key,String(value)); });
    const url = `${route.path}${query.size ? `?${query.toString()}` : ''}`;
    window.history.replaceState({},'',url);
    setCurrentView(view); setNavParams(params);
  };

  useEffect(() => {
    let active = true;
    const verifySession = async () => {
      try {
        const response = await fetch('/api/auth/me', { method: 'GET', credentials: 'include' });
        if (!response.ok) throw new Error('SESSION_INVALID');
        const data = await response.json();
        if (!data?.user?.id || !data?.user?.role) throw new Error('SESSION_INVALID');
        if (!active) return;
        setAuthenticatedUser({
          id:data.user.id,
          name:data.user.name,
          email:data.user.email,
          role:data.user.role,
          mustChangePassword:Boolean(data.user.mustChangePassword),
          accountStatus:data.user.accountStatus,
          lastLogin:data.user.lastLogin || null,
          className:data.user.className || '',
          profile:data.user.profile || {}
        });
        const current = locationState();
        if (current.view === 'login' || current.view === 'not-found') replaceToView(homeViewForRole(data.user.role));
        else { setCurrentView(current.view); setNavParams(current.params); }
      } catch {
        if (!active) return;
        clearAuth(); replaceToView('login');
      } finally { if(active) setSessionChecking(false); }
    };
    void verifySession();
    const onPop = () => { const current=locationState(); setCurrentView(current.view); setNavParams(current.params); };
    window.addEventListener('popstate',onPop);
    return () => { active=false; window.removeEventListener('popstate',onPop); };
  }, [clearAuth, setAuthenticatedUser]);

  const handleLoginSuccess = () => replaceToView(homeViewForRole(useAuthStore.getState().currentUser.role));

  const handleLogout = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }); }
    finally { clearAuth(); replaceToView('login'); }
  };

  const handleNavigate = (view: string, extraParams?: any) => {
    const route = APP_ROUTES[view];
    if (!route) { setCurrentView(view); return; }
    const params = extraParams || {};
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key,value]) => { if(value!==undefined && value!==null && value!=='') query.set(key,String(value)); });
    window.history.pushState({},'',`${route.path}${query.size ? `?${query.toString()}` : ''}`);
    setCurrentView(view); setNavParams(params); window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (sessionChecking) return <div className="flex min-h-[100dvh] items-center justify-center bg-slate-50 px-4"><div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 text-center shadow-sm"><div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900"/><p className="text-sm font-semibold text-slate-800">Đang xác thực phiên đăng nhập…</p></div></div>;
  if (!isAuthenticated || currentView === 'login') return <LoginView onLoginSuccess={handleLoginSuccess} />;

  const routeConfig = APP_ROUTES[currentView];
  if (routeConfig?.allowedRoles && !routeConfig.allowedRoles.includes(currentUser.role)) return <MainLayout currentView={currentView} onNavigate={handleNavigate} onLogout={handleLogout}><ForbiddenView onNavigate={handleNavigate} requiredRole={routeConfig.allowedRoles.join(', ')} /></MainLayout>;

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <StudentDashboardView onNavigate={handleNavigate} />;
      case 'assignment-list': case 'student-dashboard': return <AssignmentListView onNavigate={handleNavigate} />;
      case 'portfolio-list': return <PortfolioListView onNavigate={handleNavigate} />;
      case 'editor': return <PortfolioEditorView assignmentId={navParams.assignmentId || 'assign-vo-nhat'} onNavigate={handleNavigate} />;
      case 'version-diff': return <VersionDiffView assignmentId={navParams.assignmentId || 'assign-vo-nhat'} v1Number={navParams.v1Number} v2Number={navParams.v2Number} onNavigate={handleNavigate} />;
      case 'student-analytics': return <StudentAnalyticsView studentId={navParams.studentId || currentUser.id} assignmentId={navParams.assignmentId || 'assign-vo-nhat'} onNavigate={handleNavigate} />;
      case 'teacher-dashboard': return <TeacherDashboardView onNavigate={handleNavigate} />;
      case 'teacher-review': return <TeacherReviewView studentId={navParams.studentId || ''} assignmentId={navParams.assignmentId || 'assign-vo-nhat'} isPeerMode={navParams.isPeerMode === 'true' || navParams.isPeerMode === true} onNavigate={handleNavigate} />;
      case 'assignment-builder': return <AssignmentBuilderView onNavigate={handleNavigate} />;
      case 'rubric-management': return <RubricManagementView onNavigate={handleNavigate} />;
      case 'literature-texts': return <LiteratureTextsView onNavigate={handleNavigate} />;
      case 'class-analytics': return <ClassAnalyticsView onNavigate={handleNavigate} />;
      case 'researcher-view': return <ResearcherJudgeView onNavigate={handleNavigate} />;
      case 'admin-view': return <AdminAuditView onNavigate={handleNavigate} />;
      case 'ai-workspace': return <AiWorkspaceView />;
      case 'ui-kit': case 'design-system': return <DesignSystemKitView />;
      default: return <NotFoundView onNavigate={handleNavigate} />;
    }
  };

  return <MainLayout currentView={currentView} onNavigate={handleNavigate} onLogout={handleLogout}><Suspense fallback={<ViewLoading />}>{renderView()}</Suspense></MainLayout>;
};

export function App() {
  return <AuthProvider><PortfolioProvider><AppProviders><AppContent /></AppProviders></PortfolioProvider></AuthProvider>;
}

export default App;
