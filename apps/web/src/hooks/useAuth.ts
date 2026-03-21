'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { setTokens, clearTokens, type User, type AuthTokens } from '@/lib/auth';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const { data } = await api.post<ApiResponse<AuthTokens>>('/auth/login', {
          email,
          password,
        });
        setTokens(data.data);
        router.push('/');
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : 'Login failed. Please check your credentials.';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [router],
  );

  const register = useCallback(
    async (email: string, password: string, displayName: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const { data } = await api.post<ApiResponse<AuthTokens>>('/auth/register', {
          email,
          password,
          displayName,
        });
        setTokens(data.data);
        router.push('/');
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Registration failed. Please try again.';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [router],
  );

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await api.post('/auth/logout');
    } finally {
      clearTokens();
      setUser(null);
      setIsLoading(false);
      router.push('/login');
    }
  }, [router]);

  return { user, isLoading, error, login, register, logout };
}
