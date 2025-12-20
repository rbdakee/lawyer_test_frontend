'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, TokenResponse, UserRegister, UserLogin } from '@/types';
import { apiRequest } from '@/config/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (data: UserLogin) => Promise<void>;
  register: (data: UserRegister) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Проверяем сохраненный токен и пользователя при загрузке
    const savedToken = localStorage.getItem('auth_token');
    const savedUser = localStorage.getItem('auth_user');
    
    if (savedToken) {
      setToken(savedToken);
      
      // Восстанавливаем пользователя из localStorage для быстрого отображения
      if (savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          setUser(userData);
        } catch (e) {
          console.error('Error parsing saved user:', e);
        }
      }
      
      // Проверяем токен через API (валидируем и обновляем данные пользователя)
      checkAuth(savedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const checkAuth = async (authToken: string) => {
    try {
      const userData = await apiRequest<User>('/api/auth/me', {
        method: 'GET',
      }, authToken);
      setUser(userData);
      // Сохраняем пользователя в localStorage
      localStorage.setItem('auth_user', JSON.stringify(userData));
    } catch (error) {
      // Токен невалидный, удаляем его и пользователя
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (data: UserLogin) => {
    const response = await apiRequest<TokenResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    setToken(response.access_token);
    setUser(response.user);
    localStorage.setItem('auth_token', response.access_token);
    localStorage.setItem('auth_user', JSON.stringify(response.user));
  };

  const register = async (data: UserRegister) => {
    const response = await apiRequest<TokenResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    setToken(response.access_token);
    setUser(response.user);
    localStorage.setItem('auth_token', response.access_token);
    localStorage.setItem('auth_user', JSON.stringify(response.user));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user && !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

