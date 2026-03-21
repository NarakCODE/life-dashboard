import { clearStoredSession, readStoredSession, writeStoredSession } from "@/lib/auth/session-storage"
import type { AuthTokens } from "@/lib/auth/types"

interface AuthSnapshot {
  hasHydrated: boolean
  tokens: AuthTokens | null
}

interface AuthStoreConfig {
  onRefreshSession?: () => Promise<AuthTokens | null>
  onUnauthorized?: () => Promise<void> | void
}

let snapshot: AuthSnapshot = {
  hasHydrated: false,
  tokens: null,
}

const listeners = new Set<() => void>()

let refreshPromise: Promise<AuthTokens | null> | null = null
let config: AuthStoreConfig = {}

function emitChange() {
  listeners.forEach((listener) => listener())
}

export function subscribeToAuthStore(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getAuthSnapshot() {
  return snapshot
}

export function configureAuthStore(nextConfig: AuthStoreConfig) {
  config = nextConfig
}

export function hydrateAuthStore() {
  snapshot = {
    hasHydrated: true,
    tokens: readStoredSession(),
  }

  emitChange()
}

export function setAuthTokens(tokens: AuthTokens) {
  writeStoredSession(tokens)
  snapshot = {
    hasHydrated: true,
    tokens,
  }

  emitChange()
}

export function clearAuthTokens() {
  clearStoredSession()
  snapshot = {
    hasHydrated: true,
    tokens: null,
  }

  emitChange()
}

export async function refreshAuthSession() {
  if (!config.onRefreshSession) return null

  if (!refreshPromise) {
    refreshPromise = config.onRefreshSession().finally(() => {
      refreshPromise = null
    })
  }

  return refreshPromise
}

export async function handleUnauthorizedSession() {
  await config.onUnauthorized?.()
}
