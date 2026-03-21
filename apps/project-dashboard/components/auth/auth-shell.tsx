"use client"

import { AuthGuard, GuestOnlyGuard } from "@/components/auth/auth-guard"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

interface ProtectedAppShellProps {
  children: React.ReactNode
}

interface GuestShellProps {
  children: React.ReactNode
}

export function ProtectedAppShell({ children }: ProtectedAppShellProps) {
  return (
    <AuthGuard>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="bg-background mx-2 my-2 border border-border rounded-lg min-w-0">
          {children}
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  )
}

export function GuestShell({ children }: GuestShellProps) {
  return (
    <GuestOnlyGuard>
      <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(30,64,175,0.12),_transparent_35%),linear-gradient(180deg,_rgba(248,250,252,1),_rgba(241,245,249,1))] p-6 md:p-10">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:44px_44px]" />
        <div className="relative w-full">{children}</div>
      </div>
    </GuestOnlyGuard>
  )
}
