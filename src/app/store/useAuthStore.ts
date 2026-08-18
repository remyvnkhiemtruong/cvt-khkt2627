import { create } from 'zustand';
import type { User, UserRole } from '../../types';
import { MOCK_USERS } from '../../data/seedData';

interface AuthState {
  currentUser: User;
  allUsers: User[];
  switchUser: (userId: string) => void;
  switchRole: (role: UserRole) => void;
  canEditPortfolio: () => boolean;
  canGradeRubric: () => boolean;
  canManageSystem: () => boolean;
  isResearcher: () => boolean;
}

const STORAGE_KEY = 'poetic_auth_user_id';

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: (() => {
    const savedId = localStorage.getItem(STORAGE_KEY);
    const user = MOCK_USERS.find(u => u.id === savedId);
    return user || MOCK_USERS[0]; // Default to Student Nguyễn Văn An
  })(),

  allUsers: MOCK_USERS,

  switchUser: (userId: string) => {
    const found = MOCK_USERS.find(u => u.id === userId);
    if (found) {
      localStorage.setItem(STORAGE_KEY, found.id);
      set({ currentUser: found });
    }
  },

  switchRole: (role: UserRole) => {
    const found = MOCK_USERS.find(u => u.role === role);
    if (found) {
      localStorage.setItem(STORAGE_KEY, found.id);
      set({ currentUser: found });
    }
  },

  canEditPortfolio: () => get().currentUser.role === 'student',
  canGradeRubric: () => ['teacher', 'peer', 'student'].includes(get().currentUser.role),
  canManageSystem: () => get().currentUser.role === 'admin',
  isResearcher: () => get().currentUser.role === 'researcher',
}));
