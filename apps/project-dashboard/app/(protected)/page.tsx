"use client"

import { SectionCards } from "@/components/dashboard/SectionCards"
import { Suspense } from "react"
import { ErrorBoundary } from "@/components/error-boundary"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { PlusIcon } from "@phosphor-icons/react"

export default function DashboardPage() {
  return (
    <div className="flex flex-1 flex-col min-w-0">
   <header className="flex flex-col border-b border-border/40">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="h-8 w-8 rounded-lg hover:bg-accent text-muted-foreground" />
            <p className="text-base font-medium text-foreground">Clients</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <PlusIcon className="h-4 w-4" weight="bold" />
              New client
            </Button>
          </div>
        </div>
      </header>

      <ErrorBoundary fallback={<DashboardError />}>
        <Suspense fallback={<SectionCardsSkeleton />}>
          <SectionCards />
        </Suspense>
      </ErrorBoundary>

      {/* Additional dashboard sections can be added here */}
      <div className="px-4 lg:px-6">
        <h2 className="text-lg font-semibold tracking-tight">Recent Activity</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Your latest task updates and completions will appear here.
        </p>
      </div>
    </div>
  )
}

function SectionCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-32 animate-pulse rounded-lg bg-muted"
        />
      ))}
    </div>
  )
}

function DashboardError() {
  return (
    <div className="px-4 lg:px-6">
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <p className="text-sm text-destructive">
          Failed to load dashboard stats. Please try refreshing the page.
        </p>
      </div>
    </div>
  )
}
