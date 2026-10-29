import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserSession } from '../types/radix';
import { authApiService as authService } from '../services/api/auth.api';
import { LoginPayload, SignupPayload, AuthProviderType } from '../services/interfaces';

interface AuthContextValue {
  user: UserSession | null;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<UserSession>;
  signup: (payload: SignupPayload) => Promise<UserSession>;
  loginWithProvider: (provider: AuthProviderType) => Promise<UserSession>;
  logout: () => Promise<void>;
  switchCandidate: (candidateId: string) => Promise<UserSession>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(() => authService.getCurrentSession());
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const existing = authService.getCurrentSession();
    if (existing) {
      setUser(existing);
    }
  }, []);

  const login = async (payload: LoginPayload) => {
    setIsLoading(true);
    try {
      const session = await authService.login(payload);
      setUser(session);
      return session;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (payload: SignupPayload) => {
    setIsLoading(true);
    try {
      const session = await authService.signup(payload);
      setUser(session);
      return session;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithProvider = async (provider: AuthProviderType) => {
    setIsLoading(true);
    try {
      const session = await authService.loginWithProvider(provider);
      setUser(session);
      return session;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const switchCandidate = async (candidateId: string) => {
    const session = await authService.switchDemoCandidate(candidateId);
    setUser(session);
    return session;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        signup,
        loginWithProvider,
        logout,
        switchCandidate,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
