"use client"

import { AuthProvider } from "@/components/providers/auth-provider"
import { QueryProvider } from "@/components/providers/query-provider"

interface AppProvidersProps {
  children: React.ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryProvider>
      <AuthProvider>{children}</AuthProvider>
    </QueryProvider>
  )
}
