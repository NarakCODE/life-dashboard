"use client";

import { useMemo } from "react";

import { useWorkspaceContextQuery } from "@/lib/workspaces/workspace-query";
import { useWorkspaceRouteId } from "@/lib/workspaces/workspace-routing";

export function useWorkspaceScope() {
  const routeWorkspaceId = useWorkspaceRouteId();
  const workspaceContextQuery = useWorkspaceContextQuery(routeWorkspaceId);

  const workspaceId = useMemo(() => {
    if (routeWorkspaceId) {
      return workspaceContextQuery.data?.workspaceId ?? null;
    }

    return (
      workspaceContextQuery.data?.activeWorkspaceId ??
      workspaceContextQuery.data?.workspaceId ??
      null
    );
  }, [routeWorkspaceId, workspaceContextQuery.data]);

  return {
    workspaceId,
    routeWorkspaceId,
    workspaceContext: workspaceContextQuery.data ?? null,
    isPending: workspaceContextQuery.isPending && !workspaceId,
    error: workspaceContextQuery.error,
  };
}
