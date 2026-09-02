import React, { useState } from 'react';
import { AppProviders } from './app/providers/AppProviders';
import { MainLayout } from './components/layout/MainLayout';
import { StudentDashboardView } from './views/StudentDashboardView';
import { AssignmentListView } from './views/AssignmentListView';
import { PortfolioListView } from './views/PortfolioListView';
import { PortfolioEditorView } from './views/PortfolioEditorView';
import { VersionDiffView } from './views/VersionDiffView';
import { StudentAnalyticsView } from './views/StudentAnalyticsView';
import { TeacherDashboardView } from './views/TeacherDashboardView';
import { TeacherReviewView } from './views/TeacherReviewView';
import { AssignmentBuilderView } from './views/AssignmentBuilderView';
import { RubricManagementView } from './views/RubricManagementView';
import { LiteratureTextsView } from './views/LiteratureTextsView';
import { ClassAnalyticsView } from './views/ClassAnalyticsView';
import { ResearcherJudgeView } from './views/ResearcherJudgeView';
import { AdminAuditView } from './views/AdminAuditView';
import { DesignSystemKitView } from './views/DesignSystemKitView';
import { LoginView } from './views/LoginView';
import { AiWorkspaceView } from './views/AiWorkspaceView';
import { ForbiddenView } from './views/ForbiddenView';
import { NotFoundView } from './views/NotFoundView';
import { useAuthStore } from './app/store/useAuthStore';
import { APP_ROUTES } from './app/router/routes';
import { PortfolioProvider } from './contexts/PortfolioContext';
import { AuthProvider } from './contexts/AuthContext';

const AppContent: React.FC = () => {
  const { currentUser, isAuthenticated: authStoreAuthenticated } = useAuthStore();
  
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return authStoreAuthenticated;
  });

  // View navigation state
  const [currentView, setCurrentView] = useState<string>(() => {
    if (currentUser.role === 'ai') return 'ai-workspace';
    if (currentUser.role === 'teacher') return 'teacher-dashboard';
    if (currentUser.role === 'researcher') return 'researcher-view';
    if (currentUser.role === 'admin') return 'admin-view';
    return 'dashboard';
  });

  const [navParams, setNavParams] = useState<any>({
    assignmentId: 'assign-vo-nhat',
    studentId: 'user-std-1'
  });

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    localStorage.setItem('poetic_is_authenticated', 'true');
    const role = useAuthStore.getState().currentUser.role;
    if (role === 'ai') setCurrentView('ai-workspace');
    else if (role === 'teacher') setCurrentView('teacher-dashboard');
    else if (role === 'researcher') setCurrentView('researcher-view');
    else if (role === 'admin') setCurrentView('admin-view');
    else setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.setItem('poetic_is_authenticated', 'false');
    useAuthStore.getState().logout();
    setCurrentView('login');
  };

  const handleNavigate = (view: string, extraParams?: any) => {
    setCurrentView(view);
    if (extraParams) {
      setNavParams((prev: any) => ({ ...prev, ...extraParams }));
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // If not authenticated, render Login View
  if (!isAuthenticated || currentView === 'login') {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  // Route Guard Check
  const routeConfig = APP_ROUTES[currentView];
  if (routeConfig && routeConfig.allowedRoles && !routeConfig.allowedRoles.includes(currentUser.role)) {
    return (
      <MainLayout currentView={currentView} onNavigate={handleNavigate} onLogout={handleLogout}>
        <ForbiddenView
          onNavigate={handleNavigate}
          requiredRole={routeConfig.allowedRoles.join(', ')}
        />
      </MainLayout>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <StudentDashboardView onNavigate={handleNavigate} />;

      case 'assignment-list':
      case 'student-dashboard':
        return <AssignmentListView onNavigate={handleNavigate} />;

      case 'portfolio-list':
        return <PortfolioListView onNavigate={handleNavigate} />;

      case 'editor':
        return (
          <PortfolioEditorView
            assignmentId={navParams.assignmentId || 'assign-vo-nhat'}
            onNavigate={handleNavigate}
          />
        );

      case 'version-diff':
        return (
          <VersionDiffView
            assignmentId={navParams.assignmentId || 'assign-vo-nhat'}
            v1Number={navParams.v1Number}
            v2Number={navParams.v2Number}
            onNavigate={handleNavigate}
          />
        );

      case 'student-analytics':
        return (
          <StudentAnalyticsView
            studentId={currentUser.id}
            assignmentId={navParams.assignmentId || 'assign-vo-nhat'}
            onNavigate={handleNavigate}
          />
        );

      case 'teacher-dashboard':
        return <TeacherDashboardView onNavigate={handleNavigate} />;

      case 'teacher-review':
        return (
          <TeacherReviewView
            studentId={navParams.studentId || 'user-std-1'}
            assignmentId={navParams.assignmentId || 'assign-vo-nhat'}
            isPeerMode={navParams.isPeerMode || false}
            onNavigate={handleNavigate}
          />
        );

      case 'assignment-builder':
        return <AssignmentBuilderView onNavigate={handleNavigate} />;

      case 'rubric-management':
        return <RubricManagementView onNavigate={handleNavigate} />;

      case 'literature-texts':
        return <LiteratureTextsView onNavigate={handleNavigate} />;

      case 'class-analytics':
        return <ClassAnalyticsView onNavigate={handleNavigate} />;

      case 'researcher-view':
        return <ResearcherJudgeView onNavigate={handleNavigate} />;

      case 'admin-view':
        return <AdminAuditView onNavigate={handleNavigate} />;

      case 'ai-workspace':
        return <AiWorkspaceView />;

      case 'ui-kit':
      case 'design-system':
        return <DesignSystemKitView />;

      default:
        return <NotFoundView onNavigate={handleNavigate} />;
    }
  };

  return (
    <MainLayout
      currentView={currentView}
      onNavigate={handleNavigate}
      onLogout={handleLogout}
    >
      {renderView()}
    </MainLayout>
  );
};

export function App() {
  return (
    <AuthProvider>
      <PortfolioProvider>
        <AppProviders>
          <AppContent />
        </AppProviders>
      </PortfolioProvider>
    </AuthProvider>
  );
}
export default App;
