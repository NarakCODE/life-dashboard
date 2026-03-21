'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { isHttpError } from '@/lib/http/http-error';
import {
  useCurrentUserQuery,
} from '@/features/auth/hooks/use-current-user-query';
import { useLoginMutation } from '@/features/auth/hooks/use-login-mutation';
import { useLogoutMutation } from '@/features/auth/hooks/use-logout-mutation';
import { useRegisterMutation } from '@/features/auth/hooks/use-register-mutation';
import type { User } from '@/lib/auth';

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
  const currentUserQuery = useCurrentUserQuery();
  const loginMutation = useLoginMutation();
  const registerMutation = useRegisterMutation();
  const logoutMutation = useLogoutMutation();

  const login = async (email: string, password: string) => {
    await loginMutation.mutateAsync({ email, password });
    router.push('/');
  };

  const register = async (email: string, password: string, displayName: string) => {
    await registerMutation.mutateAsync({ email, password, displayName });
    router.push('/login?registered=1');
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
    router.push('/login');
  };

  const error = useMemo(() => {
    const mutationError =
      loginMutation.error ?? registerMutation.error ?? logoutMutation.error ?? currentUserQuery.error;

    if (!mutationError) {
      return null;
    }

    if (isHttpError(mutationError)) {
      return mutationError.message;
    }

    return mutationError instanceof Error ? mutationError.message : 'Something went wrong.';
  }, [
    currentUserQuery.error,
    loginMutation.error,
    logoutMutation.error,
    registerMutation.error,
  ]);

  return {
    user: currentUserQuery.data ?? null,
    isLoading:
      currentUserQuery.isLoading ||
      loginMutation.isPending ||
      registerMutation.isPending ||
      logoutMutation.isPending,
    error,
    login,
    register,
    logout,
  };
}
