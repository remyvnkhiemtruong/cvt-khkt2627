import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, UserRole } from '../types';
import { MOCK_USERS } from '../data/seedData';

interface AuthContextType {
  currentUser: User;
  switchUser: (userId: string) => void;
  switchRole: (role: UserRole) => void;
  allUsers: User[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'poetic_current_user_id';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const savedId = localStorage.getItem(STORAGE_KEY);
    const found = MOCK_USERS.find(u => u.id === savedId);
    return found || MOCK_USERS[0]; // Default to Student Nguyễn Văn An
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, currentUser.id);
  }, [currentUser]);

  const switchUser = (userId: string) => {
    const user = MOCK_USERS.find(u => u.id === userId);
    if (user) {
      setCurrentUser(user);
    }
  };

  const switchRole = (role: UserRole) => {
    const user = MOCK_USERS.find(u => u.role === role);
    if (user) {
      setCurrentUser(user);
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, switchUser, switchRole, allUsers: MOCK_USERS }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
