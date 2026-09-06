'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { api } from './axios';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId: string;
}

export interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  currency?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  tenant: TenantInfo | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<any>;
  logout: () => void;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [tenant, setTenant] = React.useState<TenantInfo | null>(null);
  const [token, setToken] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);

  // Initial session verification
  React.useEffect(() => {
    const verifySession = async () => {
      try {
        const savedToken = localStorage.getItem('nfa_auth_token');
        if (!savedToken) {
          setIsLoading(false);
          return;
        }

        setToken(savedToken);

        // Verify active session with backend /api/auth/me
        const res = await api.get('/auth/me');
        if (res.data?.user) {
          setUser(res.data.user);
          setTenant(res.data.tenant || null);
          localStorage.setItem('nfa_auth_user', JSON.stringify(res.data.user));
        }
      } catch (err) {
        console.warn('Session verification failed, logging out.');
        localStorage.removeItem('nfa_auth_token');
        localStorage.removeItem('nfa_auth_user');
        setToken(null);
        setUser(null);
        setTenant(null);
      } finally {
        setIsLoading(false);
      }
    };

    verifySession();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      const { access_token, user: loggedUser, tenant: loggedTenant } = res.data;

      localStorage.setItem('nfa_auth_token', access_token);
      localStorage.setItem('nfa_auth_user', JSON.stringify(loggedUser));

      setToken(access_token);
      setUser(loggedUser);
      setTenant(loggedTenant);

      router.push('/');
      return res.data;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('nfa_auth_token');
    localStorage.removeItem('nfa_auth_user');
    setToken(null);
    setUser(null);
    setTenant(null);
    router.push('/login');
  };

  const value = {
    user,
    tenant,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
