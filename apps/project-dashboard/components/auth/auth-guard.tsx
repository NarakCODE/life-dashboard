"use client"

import { useEffect } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"

interface AuthGuardProps {
  children: React.ReactNode
}

interface GuestOnlyGuardProps {
  children: React.ReactNode
}

function AuthRedirectState({ message }: { message: string }) {
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-3xl border bg-card p-8 text-center shadow-sm">
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

  useEffect(() => {
    if (!auth.hasHydrated || auth.isAuthLoading) return
    if (auth.isAuthenticated) return

    const loginUrl = `/login?next=${encodeURIComponent(nextPath)}`
    router.replace(loginUrl)
  }, [auth.hasHydrated, auth.isAuthLoading, auth.isAuthenticated, nextPath, router])

  if (!auth.hasHydrated || auth.isAuthLoading) {
    return <AuthRedirectState message="Checking your session..." />
  }

  if (auth.authError && auth.tokens) {
    return <AuthErrorState onRetry={auth.refreshCurrentUser} />
  }

  if (!auth.isAuthenticated) {
    return <AuthRedirectState message="Redirecting to login..." />
  }

  return <>{children}</>
}

export function GuestOnlyGuard({ children }: GuestOnlyGuardProps) {
  const auth = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const nextTarget = searchParams.get("next") || "/"

  useEffect(() => {
    if (!auth.hasHydrated || auth.isAuthLoading) return
    if (!auth.isAuthenticated) return
    router.replace(nextTarget)
  }, [auth.hasHydrated, auth.isAuthLoading, auth.isAuthenticated, nextTarget, router])

  if (!auth.hasHydrated || auth.isAuthLoading) {
    return <AuthRedirectState message="Checking your session..." />
  }

  if (auth.isAuthenticated) {
    return <AuthRedirectState message="Redirecting to your workspace..." />
  }

  return <>{children}</>
}
