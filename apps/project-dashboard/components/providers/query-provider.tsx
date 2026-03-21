"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

interface QueryProviderProps {
  children: React.ReactNode
}

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
  })
}

let browserQueryClient: QueryClient | undefined

function getQueryClient() {
  if (typeof window === "undefined") {
    return makeQueryClient()
  }

  browserQueryClient ??= makeQueryClient()
  return browserQueryClient
}

export function QueryProvider({ children }: QueryProviderProps) {
  const queryClient = getQueryClient()

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
