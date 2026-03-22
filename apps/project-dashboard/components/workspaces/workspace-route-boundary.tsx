"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useWorkspaceContextQuery } from "@/lib/workspaces/workspace-query";
import {
  replaceWorkspaceInPath,
  useWorkspaceRouteId,
} from "@/lib/workspaces/workspace-routing";

interface WorkspaceRouteBoundaryProps {
  children: React.ReactNode;
}

export function WorkspaceRouteBoundary({
  children,
}: WorkspaceRouteBoundaryProps) {
  const router = useRouter();
  const pathname = usePathname();
  const routeWorkspaceId = useWorkspaceRouteId();
  const routeContextQuery = useWorkspaceContextQuery(routeWorkspaceId, {
    retry: false,
  });
  const fallbackContextQuery = useWorkspaceContextQuery(undefined, {
    enabled: Boolean(routeWorkspaceId) && routeContextQuery.isError,
    retry: false,
  });

  useEffect(() => {
    if (!routeWorkspaceId || !routeContextQuery.isError) {
      return;
    }

    const fallbackWorkspaceId = fallbackContextQuery.data?.activeWorkspaceId;
    if (!fallbackWorkspaceId) {
      return;
    }

    router.replace(
      replaceWorkspaceInPath(pathname, fallbackWorkspaceId, routeWorkspaceId),
    );
  }, [
    fallbackContextQuery.data?.activeWorkspaceId,
    pathname,
    routeContextQuery.isError,
    routeWorkspaceId,
    router,
  ]);

  if (!routeWorkspaceId) {
    return <>{children}</>;
  }

  if (
    routeContextQuery.isPending ||
    (routeContextQuery.isError && fallbackContextQuery.isPending)
  ) {
    return null;
  }

  if (routeContextQuery.isError) {
    return null;
  }

  return <>{children}</>;
}
