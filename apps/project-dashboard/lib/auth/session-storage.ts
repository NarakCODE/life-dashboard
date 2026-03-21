import type { AuthTokens } from "@/lib/auth/types"

const AUTH_STORAGE_KEY = "project-dashboard.auth.session"

function canUseStorage() {
  return typeof window !== "undefined"
}

export function readStoredSession(): AuthTokens | null {
  if (!canUseStorage()) return null

  const rawValue = window.localStorage.getItem(AUTH_STORAGE_KEY)
  if (!rawValue) return null

  try {
    return JSON.parse(rawValue) as AuthTokens
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY)
    return null
  }
}

export function writeStoredSession(tokens: AuthTokens) {
  if (!canUseStorage()) return
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(tokens))
}

export function clearStoredSession() {
  if (!canUseStorage()) return
  window.localStorage.removeItem(AUTH_STORAGE_KEY)
}
