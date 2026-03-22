export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface AuthUser {
  id: string
  email: string
  displayName: string
  isEmailVerified: boolean
  defaultWorkspaceId: string | null
  activeWorkspaceId: string | null
  createdAt: string
  updatedAt: string
}

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput {
  email: string
  password: string
  displayName: string
}

export interface VerifyEmailInput {
  email: string
  code: string
}

export interface ResendVerificationInput {
  email: string
}

export interface AuthMessageResponse {
  message: string
}
