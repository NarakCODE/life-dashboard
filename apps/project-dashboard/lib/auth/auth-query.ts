import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { ApiError } from "@/lib/api/api-client"
import {
  devBootstrapSession,
  getCurrentUser,
  login,
  refreshSession,
  register,
  resendVerification,
  updateProfile,
  verifyEmail,
} from "@/lib/auth/auth-client"
import type { UpdateProfileInput } from "@/lib/auth/auth-client"
import { clearAuthTokens, setAuthTokens } from "@/lib/auth/auth-store"
import type {
  LoginInput,
  RegisterInput,
  ResendVerificationInput,
  VerifyEmailInput,
} from "@/lib/auth/types"

export const authKeys = {
  all: ["auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
}

export function useCurrentUserQuery(enabled: boolean) {
  return useQuery({
    queryKey: authKeys.me(),
    queryFn: getCurrentUser,
    enabled,
    staleTime: 60_000,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.statusCode < 500) return false
      return failureCount < 1
    },
  })
}

export function useLoginMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: LoginInput) => login(input),
    onSuccess: async (tokens) => {
      setAuthTokens(tokens)
      await queryClient.invalidateQueries({ queryKey: authKeys.me() })
    },
  })
}

export function useDevBootstrapMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => devBootstrapSession(),
    onSuccess: async (tokens) => {
      setAuthTokens(tokens)
      await queryClient.invalidateQueries({ queryKey: authKeys.me() })
    },
  })
}

export function useRegisterMutation() {
  return useMutation({
    mutationFn: (input: RegisterInput) => register(input),
  })
}

export function useVerifyEmailMutation() {
  return useMutation({
    mutationFn: (input: VerifyEmailInput) => verifyEmail(input),
  })
}

export function useResendVerificationMutation() {
  return useMutation({
    mutationFn: (input: ResendVerificationInput) => resendVerification(input),
  })
}

export function useRefreshSessionMutation() {
  return useMutation({
    mutationFn: (refreshToken: string) => refreshSession(refreshToken),
  })
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateProfileInput) => updateProfile(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: authKeys.me() })
    },
  })
}

export function resetAuthQueryState(queryClient: ReturnType<typeof useQueryClient>) {
  clearAuthTokens()
  queryClient.removeQueries({ queryKey: authKeys.me() })
}
