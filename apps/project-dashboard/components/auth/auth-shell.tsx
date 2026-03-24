"use client";

import { usePathname } from "next/navigation";
import { AuthGuard, GuestOnlyGuard } from "@/components/auth/auth-guard";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { WorkspaceRouteBoundary } from "@/components/workspaces/workspace-route-boundary";
import { useAuth } from "@/hooks/use-auth";
import { isOnboardingPath } from "@/lib/onboarding/onboarding-utils";

interface ProtectedAppShellProps {
  children: React.ReactNode;
}

interface GuestShellProps {
  children: React.ReactNode;
}

export function ProtectedAppShell({ children }: ProtectedAppShellProps) {
  const pathname = usePathname();
  const auth = useAuth();
  const shouldUseOnboardingShell =
    isOnboardingPath(pathname) || auth.user?.onboarding.requiresOnboarding;

  return (
    <AuthGuard>
      {shouldUseOnboardingShell ? (
        <div className="min-h-svh bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_48%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.98))] px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      ) : (
        <WorkspaceRouteBoundary>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="min-w-0">
              {children}
            </SidebarInset>
          </SidebarProvider>
        </WorkspaceRouteBoundary>
      )}
    </AuthGuard>
  );
}

export function GuestShell({ children }: GuestShellProps) {
  const backgroundImageUrl =
    "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

  return (
    <GuestOnlyGuard>
      <div
        className="relative flex min-h-svh items-center justify-center overflow-hidden bg-cover bg-center bg-no-repeat p-6 md:p-10"
        style={{ backgroundImage: `url('${backgroundImageUrl}')` }}
      >
        {/* Semi-transparent Overlay to keep the login form readable */}
        <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]" />

        {/* The Grid Pattern & Gradients (Kept from your original design) */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(30,64,175,0.15),transparent_50%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-size-[44px_44px]" />

        {/* Login Form Container */}
        <div className="relative z-10 w-full">{children}</div>
      </div>
    </GuestOnlyGuard>
  );
}
