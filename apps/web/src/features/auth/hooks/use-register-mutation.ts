'use client';

import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/lib/api';

export function useRegisterMutation() {
  return useMutation({
    mutationFn: authApi.register,
  });
}
