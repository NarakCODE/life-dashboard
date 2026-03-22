"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { buildWorkspacePath } from "@/lib/workspaces/workspace-routing";
import { useWorkspaceScope } from "@/lib/workspaces/use-workspace-scope";

interface WorkspaceRouteRedirectProps {
  pathname?: string;
}

export function WorkspaceRouteRedirect({
  pathname = "/",
}: WorkspaceRouteRedirectProps) {
  const router = useRouter();
  const { workspaceId, isPending } = useWorkspaceScope();

  useEffect(() => {
    if (!workspaceId) {
      return;
    }

    router.replace(buildWorkspacePath(workspaceId, pathname));
  }, [pathname, router, workspaceId]);

  if (isPending || !workspaceId) {
    return null;
  }

  return null;
}
