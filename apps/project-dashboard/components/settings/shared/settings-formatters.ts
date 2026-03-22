"use client";

import type { WorkspaceRole } from "@/lib/workspaces/workspace-types";

export function formatWorkspaceRole(role: WorkspaceRole) {
  return role.charAt(0) + role.slice(1).toLowerCase();
}

export function formatDateLabel(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatRelativeDate(value: string) {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return "today";
  if (diffDays === 1) return "1 day ago";
  return `${diffDays} days ago`;
}
