import { apiRequest } from "@/lib/api/api-client";
import type {
  AuthMessageResponse,
  AuthTokens,
  AuthUser,
  LoginInput,
  RegisterInput,
  ResendVerificationInput,
  VerifyEmailInput,
} from "@/lib/auth/types";

/**
 * Backend AuthTokensDto structure (camelCase):
 * {
 *   accessToken: string   // JWT access token (15 min expiry)
 *   refreshToken: string  // JWT refresh token (7 day expiry)
 *   expiresIn: number     // Seconds until access token expires (e.g., 900)
 * }
 *
 * The API wraps this in an envelope: { success: true, data: AuthTokensDto, timestamp: string }
 * The apiRequest function automatically unwraps the envelope and returns the data.
 */

/**
 * Backend MeResponseDto structure (nested)
 */
interface BackendMeResponse {
  identity: {
    id: string;
    email: string;
    roles: string[];
    isEmailVerified: boolean;
  };
  profile: {
    displayName: string;
    avatarUrl?: string | null;
    profileMetadata?: Record<string, string>;
  };
  metadata: {
    status: string;
    createdAt: string;
    updatedAt: string;
    lastLogin?: string | null;
    defaultWorkspaceId?: string | null;
    activeWorkspaceId?: string | null;
    onboarding: {
      status: string;
      requiresOnboarding: boolean;
      currentStep?: string | null;
      workspaceId?: string | null;
    };
  };
}

interface BackendWrappedData<T> {
  data: T;
}

function unwrapBackendData<T>(response: T | BackendWrappedData<T>): T {
  if (
    response &&
    typeof response === "object" &&
    "data" in response &&
    (response as BackendWrappedData<T>).data !== undefined
  ) {
    return (response as BackendWrappedData<T>).data
  }

  return response as T
}

/**
 * Transform backend nested MeResponseDto to flat AuthUser format
 */
function transformMeResponseToAuthUser(response: BackendMeResponse): AuthUser {
  return {
    id: response.identity.id,
    email: response.identity.email,
    displayName: response.profile.displayName,
    avatarUrl: response.profile.avatarUrl,
    isEmailVerified: response.identity.isEmailVerified,
    defaultWorkspaceId: response.metadata.defaultWorkspaceId ?? null,
    activeWorkspaceId: response.metadata.activeWorkspaceId,
    onboarding: {
      ...response.metadata.onboarding,
      currentStep: response.metadata.onboarding.currentStep ?? null,
      workspaceId: response.metadata.onboarding.workspaceId ?? null,
    },
    createdAt: response.metadata.createdAt,
    updatedAt: response.metadata.updatedAt,
  };
}

export function login(input: LoginInput) {
  return apiRequest<AuthTokens | BackendWrappedData<AuthTokens>>({
    path: "/auth/login",
    method: "POST",
    body: input,
    auth: "none",
  }).then(unwrapBackendData);
}

export function devBootstrapSession() {
  return apiRequest<AuthTokens | BackendWrappedData<AuthTokens>>({
    path: "/auth/dev-bootstrap",
    method: "POST",
    auth: "none",
  }).then(unwrapBackendData);
}

export function register(input: RegisterInput) {
  return apiRequest<AuthMessageResponse>({
    path: "/auth/register",
    method: "POST",
    body: input,
    auth: "none",
  });
}

export function verifyEmail(input: VerifyEmailInput) {
  return apiRequest<AuthMessageResponse>({
    path: "/auth/verify-email",
    method: "POST",
    body: input,
    auth: "none",
  });
}

export function resendVerification(input: ResendVerificationInput) {
  return apiRequest<AuthMessageResponse>({
    path: "/auth/resend-verification",
    method: "POST",
    body: input,
    auth: "none",
  });
}

export function refreshSession(refreshToken: string) {
  return apiRequest<AuthTokens>({
    path: "/auth/refresh",
    method: "POST",
    headers: {
      Authorization: `Bearer ${refreshToken}`,
    },
    auth: "none",
  });
}

export function logout() {
  return apiRequest<AuthMessageResponse>({
    path: "/auth/logout",
    method: "POST",
    auth: "required",
  });
}

export function getCurrentUser() {
  return apiRequest<BackendMeResponse | BackendWrappedData<BackendMeResponse>>({
    path: "/auth/me",
    auth: "required",
  }).then(unwrapBackendData).then(transformMeResponseToAuthUser);
}

export interface UpdateProfileInput {
  displayName?: string;
  avatarUrl?: string | null;
}

export function updateProfile(input: UpdateProfileInput) {
  return apiRequest<BackendMeResponse | BackendWrappedData<BackendMeResponse>>({
    path: "/auth/me",
    method: "PATCH",
    body: input,
    auth: "required",
  }).then(unwrapBackendData).then(transformMeResponseToAuthUser);
}
