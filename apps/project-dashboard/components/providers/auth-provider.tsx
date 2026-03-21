"use client"

import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react"
import { useQueryClient } from "@tanstack/react-query"

import { AuthContext } from "@/hooks/use-auth"
import { logout, refreshSession } from "@/lib/auth/auth-client"
import {
  authKeys,
  useCurrentUserQuery,
} from "@/lib/auth/auth-query"
import {
  clearAuthTokens,
  configureAuthStore,
  getAuthSnapshot,
  hydrateAuthStore,
  setAuthTokens,
  subscribeToAuthStore,
} from "@/lib/auth/auth-store"

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const queryClient = useQueryClient()
  const snapshot = useSyncExternalStore(
    subscribeToAuthStore,
    getAuthSnapshot,
    getAuthSnapshot
  )

  useEffect(() => {
    hydrateAuthStore()
  }, [])

  const clearSession = useCallback(() => {
    clearAuthTokens()
    queryClient.removeQueries({ queryKey: authKeys.me() })
  }, [queryClient])

  useEffect(() => {
    configureAuthStore({
      onRefreshSession: async () => {
        const tokens = getAuthSnapshot().tokens
        if (!tokens?.refreshToken) {
          clearSession()
          return null
        }

        try {
          const nextTokens = await refreshSession(tokens.refreshToken)
          setAuthTokens(nextTokens)
          return nextTokens
        } catch {
          clearSession()
          return null
        }
      },
      onUnauthorized: clearSession,
    })
  }, [clearSession])

  const currentUserQuery = useCurrentUserQuery(
    snapshot.hasHydrated && Boolean(snapshot.tokens?.accessToken)
  )

  const refreshCurrentUser = useCallback(() => {
    return queryClient.invalidateQueries({ queryKey: authKeys.me() })
  }, [queryClient])

  const logoutUser = useCallback(async () => {
    try {
      if (getAuthSnapshot().tokens?.accessToken) {
        await logout()
      }
    } finally {
      clearSession()
    }
  }, [clearSession])

  const value = useMemo(
    () => ({
      hasHydrated: snapshot.hasHydrated,
      isAuthenticated: Boolean(snapshot.tokens?.accessToken) && Boolean(currentUserQuery.data),
      isAuthLoading:
        !snapshot.hasHydrated ||
        (Boolean(snapshot.tokens?.accessToken) && currentUserQuery.isPending),
      user: currentUserQuery.data ?? null,
      tokens: snapshot.tokens,
      authError: currentUserQuery.error ?? null,
      refreshCurrentUser,
      logout: logoutUser,
    }),
    [
      currentUserQuery.data,
      currentUserQuery.error,
      currentUserQuery.isPending,
      logoutUser,
      refreshCurrentUser,
      snapshot.hasHydrated,
      snapshot.tokens,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
