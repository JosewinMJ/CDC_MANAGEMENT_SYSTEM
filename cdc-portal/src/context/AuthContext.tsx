import React, { createContext, useContext, useState } from 'react';
import { User, UserRole } from '../shared/types';
import { db } from '../services/storage';
import { apiRequest, getAuthToken, setAuthToken } from '../services/apiClient';

interface AuthContextType {
  currentUser: User;
  currentRole: UserRole;
  switchRole: (role: UserRole) => void;
  loginWithBackend: (email: string, password: string) => Promise<User>;
  logoutBackend: () => Promise<void>;
  hasBackendSession: boolean;
  isStudent: boolean;
  isGuide: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const BACKEND_USER_KEY = 'cdc_backend_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    const saved = localStorage.getItem('cdc_active_role');
    return (saved as UserRole) || UserRole.STUDENT;
  });

  const [backendUser, setBackendUser] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem(BACKEND_USER_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  });

  const student = db.getStudent();

  const fallbackUser: User = {
    id: currentRole === UserRole.STUDENT ? student.id : currentRole === UserRole.GUIDE ? 'guide-201' : 'admin-01',
    name: currentRole === UserRole.STUDENT ? student.fullName : currentRole === UserRole.GUIDE ? 'Dr. K. Ramanathan' : 'Dr. S. Varma (Admin)',
    email: currentRole === UserRole.STUDENT ? student.email : currentRole === UserRole.GUIDE ? 'k.ramanathan@vit.ac.in' : 'cdc.admin@vit.ac.in',
    role: currentRole,
    avatarUrl: currentRole === UserRole.STUDENT ? student.avatarUrl : undefined,
    department: 'School of Computer Science and Engineering',
  };

  const currentUser: User = backendUser && backendUser.role === currentRole ? backendUser : fallbackUser;

  const switchRole = (role: UserRole) => {
    setCurrentRole(role);
    localStorage.setItem('cdc_active_role', role);
  };

  const loginWithBackend = async (email: string, password: string): Promise<User> => {
    const res = await apiRequest<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setAuthToken(res.token);
    localStorage.setItem(BACKEND_USER_KEY, JSON.stringify(res.user));
    setBackendUser(res.user);
    switchRole(res.user.role);
    return res.user;
  };

  const logoutBackend = async (): Promise<void> => {
    try {
      if (getAuthToken()) {
        await apiRequest('/auth/logout', { method: 'POST' });
      }
    } catch {
      // ignore network error on logout
    } finally {
      setAuthToken(null);
      localStorage.removeItem(BACKEND_USER_KEY);
      setBackendUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentRole,
        switchRole,
        loginWithBackend,
        logoutBackend,
        hasBackendSession: Boolean(getAuthToken() && backendUser),
        isStudent: currentRole === UserRole.STUDENT,
        isGuide: currentRole === UserRole.GUIDE,
        isAdmin: currentRole.startsWith('ADMIN'),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
