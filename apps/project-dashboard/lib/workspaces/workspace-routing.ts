"use client";

import { useParams } from "next/navigation";

export const WORKSPACE_ROUTE_PREFIX = "/w";

export function normalizeWorkspaceChildPath(pathname = "/") {
  if (!pathname || pathname === "/") {
    return "";
  }

  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}

export function buildWorkspacePath(workspaceId: string, pathname = "/") {
  const childPath = normalizeWorkspaceChildPath(pathname);
  return `${WORKSPACE_ROUTE_PREFIX}/${workspaceId}${childPath}`;
}

export function getWorkspaceChildPath(
  pathname: string,
  workspaceId?: string | null,
) {
  if (!workspaceId) {
    return pathname || "/";
  }

  const workspacePrefix = buildWorkspacePath(workspaceId);

  if (pathname === workspacePrefix) {
    return "/";
  }

  if (pathname.startsWith(`${workspacePrefix}/`)) {
    return pathname.slice(workspacePrefix.length);
  }

  return pathname || "/";
}

export function replaceWorkspaceInPath(
  pathname: string,
  nextWorkspaceId: string,
  currentWorkspaceId?: string | null,
) {
  return buildWorkspacePath(
    nextWorkspaceId,
    getWorkspaceChildPath(pathname, currentWorkspaceId),
  );
}

export function useWorkspaceRouteId() {
  const params = useParams<{ workspaceId?: string | string[] }>();
  const value = params.workspaceId;

  return Array.isArray(value) ? value[0] : value;
}
