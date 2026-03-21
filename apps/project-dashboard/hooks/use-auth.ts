"use client"

import { createContext, useContext } from "react"

import type { AuthTokens, AuthUser } from "@/lib/auth/types"

interface AuthContextValue {
  hasHydrated: boolean
  isAuthenticated: boolean
  isAuthLoading: boolean
  user: AuthUser | null
  tokens: AuthTokens | null
  authError: Error | null
  refreshCurrentUser: () => Promise<unknown>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }

  return context
}
