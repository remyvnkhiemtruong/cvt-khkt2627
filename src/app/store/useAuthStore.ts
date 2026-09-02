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

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: guest,
  allUsers: [],
  isAuthenticated: false,
  setAuthenticatedUser: (user) => set({ currentUser: user, allUsers: [user], isAuthenticated: true }),
  logout: () => set({ currentUser: guest, allUsers: [], isAuthenticated: false }),
  switchUser: () => {},
  switchRole: () => {},
  canEditPortfolio: () => get().currentUser.role === 'student',
  canGradeRubric: () => ['teacher', 'peer', 'student'].includes(get().currentUser.role),
  canManageSystem: () => get().currentUser.role === 'admin',
  isResearcher: () => get().currentUser.role === 'researcher'
}));
