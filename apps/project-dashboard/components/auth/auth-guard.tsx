"use client"

import { useEffect } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { useAuth } from "@/hooks/use-auth"
import {
  isOnboardingPath,
  normalizeNextTarget,
} from "@/lib/onboarding/onboarding-utils"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

interface AuthGuardProps {
  children: React.ReactNode
}

interface GuestOnlyGuardProps {
  children: React.ReactNode
}

/**
 * Skeleton loader that mimics the app layout for auth redirect states
 * Shows a sidebar skeleton and main content skeleton for better UX
 */
function AuthRedirectSkeleton({ message }: { message: string }) {
  return (
    <div className="flex min-h-svh">
      {/* Sidebar Skeleton */}
      <div className="hidden w-64 flex-col border-r border-border/40 bg-background md:flex">
        {/* Workspace Combobox Skeleton */}
        <div className="border-b border-border/40 p-4">
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>

        {/* Search Input Skeleton */}
        <div className="p-4">
          <Skeleton className="h-9 w-full rounded-lg" />
        </div>

        {/* Nav Items Skeleton */}
        <div className="flex-1 space-y-1 px-3 py-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2">
              <Skeleton className="h-4.5 w-4.5 rounded" />
              <Skeleton className="h-4 w-24 rounded" />
            </div>
          ))}
        </div>

        {/* Active Projects Section Skeleton */}
        <div className="px-3 py-2">
          <Skeleton className="mb-3 h-3 w-24 rounded" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2">
                <Skeleton className="h-4.5 w-4.5 rounded-full" />
                <Skeleton className="h-4 w-32 rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Footer Skeleton */}
        <div className="border-t border-border/40 p-3">
          <div className="flex items-center gap-3 rounded-lg p-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-3 w-24 rounded" />
              <Skeleton className="h-2 w-32 rounded" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="flex flex-1 flex-col">
        {/* Header Skeleton */}
        <header className="flex h-14 items-center justify-between border-b border-border/40 px-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-4 w-24 rounded" />
          </div>
          <Skeleton className="h-9 w-32 rounded-lg" />
        </header>

        {/* Page Content Skeleton */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <div className="mx-auto max-w-5xl space-y-6">
            {/* Loading State Message */}
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3 rounded-full bg-muted/50 px-6 py-3">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="text-sm font-medium text-muted-foreground">{message}</p>
              </div>
            </div>

            {/* Content Skeleton */}
            <div className="space-y-4">
              <Skeleton className="h-8 w-48 rounded-lg" />
              <div className="rounded-lg border">
                <div className="grid grid-cols-3 gap-4 border-b p-4">
                  <Skeleton className="h-5 w-20 rounded" />
                  <Skeleton className="h-5 w-16 rounded" />
                  <Skeleton className="h-5 w-16 justify-self-end rounded" />
                </div>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-3 gap-4 border-b p-4 last:border-b-0"
                  >
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-9 w-9 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32 rounded" />
                        <Skeleton className="h-3 w-24 rounded" />
                      </div>
                    </div>
                    <Skeleton className="h-6 w-20 rounded" />
                    <Skeleton className="h-8 w-8 justify-self-end rounded" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

/**
 * Simple card-based redirect state for non-sidebar contexts
 */
function AuthRedirectState({ message }: { message: string }) {
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-3xl border bg-card p-8 text-center shadow-sm">
        <div className="mb-4 flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
        <p className="text-sm font-medium text-foreground">{message}</p>
      </div>
    </div>
  )
}

function AuthErrorState({
  onRetry,
}: {
  onRetry: () => Promise<unknown>
}) {
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <div className="w-full max-w-md rounded-3xl border bg-card p-8 shadow-sm">
        <div className="space-y-2">
          <h1 className="text-lg font-semibold">Unable to verify your session</h1>
          <p className="text-sm text-muted-foreground">
            Your stored session exists, but the user profile check failed. Retry once before signing in again.
          </p>
        </div>
        <Button className="mt-6 w-full" onClick={() => void onRetry()}>
          Retry auth check
        </Button>
      </div>
    </div>
  )
}

export function AuthGuard({ children }: AuthGuardProps) {
  const auth = useAuth()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()

  const nextPath = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`
  const nextTarget = normalizeNextTarget(searchParams.get("next"))
  const requiresOnboarding = auth.user?.onboarding.requiresOnboarding ?? false
  const isOnboardingRoute = isOnboardingPath(pathname)

  useEffect(() => {
    if (!auth.hasHydrated || auth.isAuthLoading) return
    if (!auth.isAuthenticated) {
      const loginUrl = `/login?next=${encodeURIComponent(nextPath)}`
      router.replace(loginUrl)
      return
    }
    if (requiresOnboarding && !isOnboardingRoute) {
      router.replace(`/onboarding?next=${encodeURIComponent(nextPath)}`)
      return
    }
    if (!requiresOnboarding && isOnboardingRoute) {
      router.replace(nextTarget === "/onboarding" ? "/" : nextTarget)
    }
  }, [
    auth.hasHydrated,
    auth.isAuthLoading,
    auth.isAuthenticated,
    isOnboardingRoute,
    nextPath,
    nextTarget,
    requiresOnboarding,
    router,
  ])

  if (!auth.hasHydrated || auth.isAuthLoading) {
    return <AuthRedirectSkeleton message="Checking your session..." />
  }

  if (auth.authError && auth.tokens) {
    return <AuthErrorState onRetry={auth.refreshCurrentUser} />
  }

  if (!auth.isAuthenticated) {
    return <AuthRedirectSkeleton message="Redirecting to login..." />
  }

  if (requiresOnboarding && !isOnboardingRoute) {
    return <AuthRedirectSkeleton message="Redirecting to workspace setup..." />
  }

  if (!requiresOnboarding && isOnboardingRoute) {
    return <AuthRedirectSkeleton message="Redirecting to your workspace..." />
  }

  return <>{children}</>
}

export function GuestOnlyGuard({ children }: GuestOnlyGuardProps) {
  const auth = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const nextTarget = normalizeNextTarget(searchParams.get("next"))
  const requiresOnboarding = auth.user?.onboarding.requiresOnboarding ?? false

  useEffect(() => {
    if (!auth.hasHydrated || auth.isAuthLoading) return
    if (!auth.isAuthenticated) return
    if (requiresOnboarding) {
      router.replace(`/onboarding?next=${encodeURIComponent(nextTarget)}`)
      return
    }
    router.replace(nextTarget)
  }, [
    auth.hasHydrated,
    auth.isAuthLoading,
    auth.isAuthenticated,
    nextTarget,
    requiresOnboarding,
    router,
  ])

  if (!auth.hasHydrated || auth.isAuthLoading) {
    return <AuthRedirectState message="Checking your session..." />
  }

  if (auth.isAuthenticated) {
    return (
      <AuthRedirectState
        message={
          requiresOnboarding
            ? "Redirecting to workspace setup..."
            : "Redirecting to your workspace..."
        }
      />
    )
  }

  return <>{children}</>
}
