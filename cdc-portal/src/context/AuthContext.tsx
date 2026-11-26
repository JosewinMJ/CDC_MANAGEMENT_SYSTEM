import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../shared/types';
import { db } from '../services/storage';

interface AuthContextType {
  currentUser: User;
  currentRole: UserRole;
  switchRole: (role: UserRole) => void;
  isStudent: boolean;
  isGuide: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    const saved = localStorage.getItem('cdc_active_role');
    return (saved as UserRole) || UserRole.STUDENT;
  });

  const student = db.getStudent();

  const currentUser: User = {
    id: currentRole === UserRole.STUDENT ? student.id : currentRole === UserRole.GUIDE ? 'guide-201' : 'admin-01',
    name: currentRole === UserRole.STUDENT ? student.fullName : currentRole === UserRole.GUIDE ? 'Dr. K. Ramanathan' : 'Dr. S. Varma (Admin)',
    email: currentRole === UserRole.STUDENT ? student.email : currentRole === UserRole.GUIDE ? 'k.ramanathan@vit.ac.in' : 'cdc.admin@vit.ac.in',
    role: currentRole,
    avatarUrl: currentRole === UserRole.STUDENT ? student.avatarUrl : undefined,
    department: 'School of Computer Science and Engineering',
  };

  const switchRole = (role: UserRole) => {
    setCurrentRole(role);
    localStorage.setItem('cdc_active_role', role);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentRole,
        switchRole,
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
