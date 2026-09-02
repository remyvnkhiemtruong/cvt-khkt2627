import React, { createContext, useContext } from 'react';
import type { User, UserRole } from '../types';
import { useAuthStore } from '../app/store/useAuthStore';

interface AuthContextType {
  currentUser: User;
  switchUser: (userId: string) => void;
  switchRole: (role: UserRole) => void;
  allUsers: User[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Compatibility provider for components that still consume useAuth().
 * The source of truth is the production Zustand auth store; mock users and
 * client-side role switching are intentionally disabled.
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const currentUser = useAuthStore((state) => state.currentUser);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const allUsers = isAuthenticated && currentUser.id ? [currentUser] : [];
  const switchUser = () => undefined;
  const switchRole = () => undefined;

  return (
    <AuthContext.Provider value={{ currentUser, switchUser, switchRole, allUsers }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
