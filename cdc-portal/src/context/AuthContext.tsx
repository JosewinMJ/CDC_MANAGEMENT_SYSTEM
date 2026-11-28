import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../shared/types';
import {
  apiRequest,
  detectPortalFromPath,
  getAuthToken,
  PortalScope,
  setAuthToken,
} from '../services/apiClient';

export interface AuthenticatedUser extends User {
  mustChangePassword?: boolean;
}

export interface UnifiedLoginResult {
  user: AuthenticatedUser;
  resolvedPortal: PortalScope;
  redirectTo: string;
}

interface AuthContextType {
  currentUser: AuthenticatedUser;
  currentRole: UserRole;
  getPortalUser: (scope: PortalScope) => AuthenticatedUser | null;
  isPortalAuthenticated: (scope: PortalScope) => boolean;
  loginUnified: (email: string, password: string, pattern: string) => Promise<UnifiedLoginResult>;
  logoutFromPortal: (scope?: PortalScope) => Promise<void>;
  clearMustChangePassword: (scope: PortalScope) => void;
  isStudent: boolean;
  isGuide: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_KEYS: Record<PortalScope, string> = {
  student: 'cdc_user_student',
  guide: 'cdc_user_guide',
  admin: 'cdc_user_admin',
};

function readStoredUser(scope: PortalScope): AuthenticatedUser | null {
  try {
    const raw = localStorage.getItem(USER_KEYS[scope]);
    return raw ? (JSON.parse(raw) as AuthenticatedUser) : null;
  } catch {
    return null;
  }
}

export function roleMatchesPortal(role: UserRole, scope: PortalScope): boolean {
  if (scope === 'student') return role === UserRole.STUDENT;
  if (scope === 'guide') return role === UserRole.GUIDE;
  return String(role).startsWith('ADMIN');
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [, setVersion] = useState(0);
  const bump = () => setVersion(v => v + 1);

  const activeScope = detectPortalFromPath();
  const activeUser = readStoredUser(activeScope);

  useEffect(() => {
    const scopes: PortalScope[] = ['student', 'guide', 'admin'];
    scopes.forEach(scope => {
      if (!getAuthToken(scope)) return;
      apiRequest<AuthenticatedUser>('/auth/me', { portal: scope })
        .then(user => {
          if (roleMatchesPortal(user.role, scope)) {
            localStorage.setItem(USER_KEYS[scope], JSON.stringify(user));
            bump();
          } else {
            setAuthToken(null, scope);
            localStorage.removeItem(USER_KEYS[scope]);
            bump();
          }
        })
        .catch(() => {
          setAuthToken(null, scope);
          localStorage.removeItem(USER_KEYS[scope]);
          bump();
        });
    });
  }, []);

  const fallbackUser: AuthenticatedUser = {
    id: 'guest',
    name: 'Guest',
    email: '',
    role:
      activeScope === 'admin'
        ? UserRole.ADMIN_SUPER
        : activeScope === 'guide'
        ? UserRole.GUIDE
        : UserRole.STUDENT,
  };

  const currentUser = activeUser ?? fallbackUser;
  const currentRole = currentUser.role;

  const getPortalUser = (scope: PortalScope): AuthenticatedUser | null => readStoredUser(scope);

  const isPortalAuthenticated = (scope: PortalScope): boolean => {
    const token = getAuthToken(scope);
    const user = readStoredUser(scope);
    return Boolean(token && user && roleMatchesPortal(user.role, scope));
  };

  const loginUnified = async (
    email: string,
    password: string,
    pattern: string
  ): Promise<UnifiedLoginResult> => {
    const res = await apiRequest<{
      token: string;
      resolvedPortal: PortalScope;
      redirectTo: string;
      user: AuthenticatedUser;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, pattern }),
    });

    const scope: PortalScope = res.resolvedPortal
      ?? (String(res.user.role).startsWith('ADMIN') ? 'admin' : res.user.role === UserRole.GUIDE ? 'guide' : 'student');
    const redirectTo = res.redirectTo || `/${scope}/dashboard`;

    setAuthToken(res.token, scope);
    localStorage.setItem(USER_KEYS[scope], JSON.stringify(res.user));
    bump();
    return {
      user: res.user,
      resolvedPortal: scope,
      redirectTo: redirectTo === `/${scope}` ? `/${scope}/dashboard` : redirectTo,
    };
  };

  const logoutFromPortal = async (scope?: PortalScope): Promise<void> => {
    const target = scope ?? detectPortalFromPath();
    try {
      if (getAuthToken(target)) {
        await apiRequest('/auth/logout', { method: 'POST', portal: target });
      }
    } catch {
      // ignore network errors on logout
    } finally {
      setAuthToken(null, target);
      localStorage.removeItem(USER_KEYS[target]);
      bump();
    }
  };

  const clearMustChangePassword = (scope: PortalScope) => {
    const user = readStoredUser(scope);
    if (user) {
      user.mustChangePassword = false;
      localStorage.setItem(USER_KEYS[scope], JSON.stringify(user));
      bump();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentRole,
        getPortalUser,
        isPortalAuthenticated,
        loginUnified,
        logoutFromPortal,
        clearMustChangePassword,
        isStudent: currentRole === UserRole.STUDENT,
        isGuide: currentRole === UserRole.GUIDE,
        isAdmin: String(currentRole).startsWith('ADMIN'),
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
