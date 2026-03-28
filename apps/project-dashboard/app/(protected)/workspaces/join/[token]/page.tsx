"use client";

import { use, Suspense } from "react";
import { JoinWorkspacePage } from "@/components/workspaces/JoinWorkspacePage";
import { Loader2 } from "@phosphor-icons/react/dist/ssr";

interface JoinWorkspaceRouteProps {
  params: Promise<{
    token: string;
  }>;
}

function JoinWorkspaceContent({ params }: JoinWorkspaceRouteProps) {
  const { token } = use(params);
  return <JoinWorkspacePage token={token} />;
}

export default function JoinWorkspaceRoute({ params }: JoinWorkspaceRouteProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <JoinWorkspaceContent params={params} />
    </Suspense>
  );
}
