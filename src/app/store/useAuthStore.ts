import { create } from 'zustand';
import type { User, UserRole } from '../../types';

interface AuthState {
  currentUser: User;
  allUsers: User[];
  isAuthenticated: boolean;
  setAuthenticatedUser: (user: User) => void;
  logout: () => void;
  switchUser: (userId: string) => void;
  switchRole: (role: UserRole) => void;
  canEditPortfolio: () => boolean;
  canGradeRubric: () => boolean;
  canManageSystem: () => boolean;
  isResearcher: () => boolean;
}
const guest: User = { id: '', name: '', email: '', role: 'student' };
const saved = (() => { try { return JSON.parse(localStorage.getItem('cvt_auth_user') || 'null'); } catch { return null; } })();
export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: saved || guest,
  allUsers: saved ? [saved] : [],
  isAuthenticated: Boolean(saved && localStorage.getItem('cvt_auth_token')),
  setAuthenticatedUser: (user) => { localStorage.setItem('cvt_auth_user', JSON.stringify(user)); set({ currentUser:user, allUsers:[user], isAuthenticated:true }); },
  logout: () => { localStorage.removeItem('cvt_auth_user'); localStorage.removeItem('cvt_auth_token'); set({ currentUser:guest, allUsers:[], isAuthenticated:false }); },
  switchUser: () => {},
  switchRole: () => {},
  canEditPortfolio: () => get().currentUser.role === 'student',
  canGradeRubric: () => ['teacher', 'peer', 'student'].includes(get().currentUser.role),
  canManageSystem: () => get().currentUser.role === 'admin',
  isResearcher: () => get().currentUser.role === 'researcher',
}));
