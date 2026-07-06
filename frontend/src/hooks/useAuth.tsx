import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authAPI } from '@/lib/api';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  email: string;
  full_name: string;
  role?: string;
  department?: string;
  phone?: string;
  mfa_enabled?: boolean;
  has_face_id?: boolean;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  requires_mfa: boolean;
  user_id?: string;
}

interface AuthContextProps {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<TokenResponse>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  setToken: (token: string | null) => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const setToken = (newToken: string | null) => {
    setTokenState(newToken);
    if (newToken) {
      localStorage.setItem('authToken', newToken);
    } else {
      localStorage.removeItem('authToken');
    }
  };

  const login = async (email: string, password: string): Promise<TokenResponse> => {
    setIsLoading(true);
    try {
      const result = await authAPI.login(email, password);
      if (!result.requires_mfa) {
        setToken(result.access_token);
        setIsAuthenticated(true);
        await refreshUser();
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    setToken(null);
    navigate('/login');
  };

  const refreshUser = async () => {
    const activeToken = token || localStorage.getItem('authToken');
    if (!activeToken) return;
    const me = await authAPI.getMe(activeToken);
    setUser(me);
    setIsAuthenticated(true);
  };

  // Load token from local storage on mount
  useEffect(() => {
    const stored = localStorage.getItem('authToken');
    if (stored) {
      setToken(stored);
      refreshUser().catch(() => {
        setToken(null);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value: AuthContextProps = {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshUser,
    setToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};