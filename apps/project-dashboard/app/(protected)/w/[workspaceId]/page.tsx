"use client";

import { Suspense } from "react";
import { PlusIcon } from "@phosphor-icons/react";

import { SectionCards } from "@/components/dashboard/SectionCards";
import { ErrorBoundary } from "@/components/error-boundary";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function WorkspaceDashboardPage() {
  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <header className="flex flex-col border-b border-border/40">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-accent" />
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

      <div className="px-4 lg:px-6">
        <h2 className="text-lg font-semibold tracking-tight">
          Recent Activity
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your latest task updates and completions will appear here.
        </p>
      </div>
    </div>
  );
}

function SectionCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 px-4 py-4 sm:grid-cols-2 lg:px-6 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="h-32 rounded-lg bg-muted animate-pulse" />
      ))}
    </div>
  );
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
  );
}
