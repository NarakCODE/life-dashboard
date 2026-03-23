import { apiRequest } from "@/lib/api/api-client"
import type {
  AuthMessageResponse,
  AuthTokens,
  AuthUser,
  LoginInput,
  RegisterInput,
  ResendVerificationInput,
  VerifyEmailInput,
} from "@/lib/auth/types"

export function login(input: LoginInput) {
  return apiRequest<AuthTokens>({
    path: "/auth/login",
    method: "POST",
    body: input,
    auth: "none",
  })
}

export function devBootstrapSession() {
  return apiRequest<AuthTokens>({
    path: "/auth/dev-bootstrap",
    method: "POST",
    auth: "none",
  })
}

export function register(input: RegisterInput) {
  return apiRequest<AuthMessageResponse>({
    path: "/auth/register",
    method: "POST",
    body: input,
    auth: "none",
  })
}

export function verifyEmail(input: VerifyEmailInput) {
  return apiRequest<AuthMessageResponse>({
    path: "/auth/verify-email",
    method: "POST",
    body: input,
    auth: "none",
  })
}

export function resendVerification(input: ResendVerificationInput) {
  return apiRequest<AuthMessageResponse>({
    path: "/auth/resend-verification",
    method: "POST",
    body: input,
    auth: "none",
  })
}

export function refreshSession(refreshToken: string) {
  return apiRequest<AuthTokens>({
    path: "/auth/refresh",
    method: "POST",
    headers: {
      Authorization: `Bearer ${refreshToken}`,
    },
    auth: "none",
  })
}

export function logout() {
  return apiRequest<AuthMessageResponse>({
    path: "/auth/logout",
    method: "POST",
    auth: "required",
  })
}

export function getCurrentUser() {
  return apiRequest<AuthUser>({
    path: "/auth/me",
    auth: "required",
  })
}

export interface UpdateProfileInput {
  displayName?: string
  avatarUrl?: string | null
}

export function updateProfile(input: UpdateProfileInput) {
  return apiRequest<AuthUser>({
    path: "/auth/me",
    method: "PATCH",
    body: input,
    auth: "required",
  })
}
