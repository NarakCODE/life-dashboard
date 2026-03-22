"use client";

import * as React from "react";
import { Building2, ChevronDown, Plus, Settings2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import type { Workspace } from "@/lib/workspaces/workspace-types";
import { useWorkspacesQuery } from "@/lib/workspaces/workspace-query";

export interface WorkspaceComboboxProps {
  workspaces: Workspace[];
  selectedId?: string | null;
  /** User's active workspace ID from /me response - used as fallback when selectedId is not provided */
  userActiveWorkspaceId?: string | null;
  onSelect: (workspace: Workspace) => void;
  onCreateNew?: () => void;
  onManageWorkspaces?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  triggerClassName?: string;
  contentClassName?: string;
  placeholder?: string;
  searchPlaceholder?: string;
}

function getWorkspaceInitials(name: string) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return initials || "WS";
}

function getWorkspaceTypeLabel(type: Workspace["type"]) {
  return type === "solo" ? "Personal" : "Team";
}

/**
 * Sidebar-friendly workspace selector rendered as a dropdown menu.
 */
export function WorkspaceCombobox({
  workspaces,
  selectedId,
  userActiveWorkspaceId,
  onSelect,
  onCreateNew,
  onManageWorkspaces,
  isLoading = false,
  disabled = false,
  triggerClassName,
  contentClassName,
  placeholder = "Select workspace",
}: WorkspaceComboboxProps) {
  // Use selectedId if provided, otherwise fall back to user's activeWorkspaceId from /me
  const effectiveSelectedId = selectedId ?? userActiveWorkspaceId;

  const selectedWorkspace = React.useMemo(
    () => workspaces.find((workspace) => workspace.id === effectiveSelectedId),
    [effectiveSelectedId, workspaces],
  );

  const handleSelect = React.useCallback(
    (workspaceId: string) => {
      if (workspaceId === effectiveSelectedId) {
        return;
      }

      const workspace = workspaces.find((item) => item.id === workspaceId);
      if (workspace) {
        onSelect(workspace);
      }
    },
    [onSelect, effectiveSelectedId, workspaces],
  );

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-sidebar-border/70 bg-sidebar-accent/30 p-2">
        <Skeleton className="size-10 rounded-xl" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-4 w-24 rounded-md" />
          <Skeleton className="h-3 w-36 rounded-md" />
        </div>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          size={"lg"}
          className={cn(triggerClassName)}
        >
          <div className="flex w-full flex-1 items-center justify-between gap-3">
            <Avatar>
              <AvatarFallback className="rounded-xl bg-sidebar-primary/12 text-sidebar-primary">
                {selectedWorkspace ? (
                  getWorkspaceInitials(selectedWorkspace.name)
                ) : (
                  <Building2 />
                )}
              </AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate text-sm font-semibold">
                {selectedWorkspace?.name ?? placeholder}
              </span>
            </div>
            <ChevronDown className="size-4 shrink-0 text-sidebar-foreground/60" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        sideOffset={8}
        className={cn("w-80 rounded-2xl p-2", contentClassName)}
      >
        <DropdownMenuLabel className="px-2 py-2">
          <div className="flex items-center gap-3">
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="text-sm font-semibold">Switch workspace</span>
              <span className="truncate text-xs font-normal text-muted-foreground">
                {workspaces.length} available workspace
                {workspaces.length === 1 ? "" : "s"}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuRadioGroup
            value={selectedWorkspace?.id}
            onValueChange={handleSelect}
          >
            {workspaces.map((workspace) => {
              const isSelected = workspace.id === selectedWorkspace?.id;

              return (
                <DropdownMenuRadioItem
                  key={workspace.id}
                  value={workspace.id}
                  disabled={isSelected}
                  className="min-h-14 rounded-xl pr-2 pl-8"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <Avatar className="size-9 rounded-xl border border-border/60">
                      <AvatarFallback className="rounded-xl bg-primary/10 text-primary">
                        {getWorkspaceInitials(workspace.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="truncate text-sm font-medium">
                        {workspace.name}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {getWorkspaceTypeLabel(workspace.type)}
                      </span>
                    </div>
                    {/* <div className="flex items-center gap-2">
                      <span className="rounded-full bg-muted px-2 py-1 text-[11px] font-medium text-muted-foreground">
                        {workspace.owner.displayName}
                      </span>
                    </div> */}
                  </div>
                </DropdownMenuRadioItem>
              );
            })}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
        {(onCreateNew || onManageWorkspaces) && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {onCreateNew ? (
                <DropdownMenuItem
                  onSelect={onCreateNew}
                  className="rounded-xl py-2"
                >
                  <Plus />
                  Create workspace
                </DropdownMenuItem>
              ) : null}
              {onManageWorkspaces ? (
                <DropdownMenuItem
                  onSelect={onManageWorkspaces}
                  className="rounded-xl py-2"
                >
                  <Settings2 />
                  Manage workspaces
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuGroup>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export interface UseWorkspaceComboboxProps {
  selectedId?: string | null;
  onSelect: (workspace: Workspace) => void;
  onCreateNew?: () => void;
  onManageWorkspaces?: () => void;
}

export function useWorkspaceCombobox(props: UseWorkspaceComboboxProps) {
  const { data: workspaces = [], isLoading } = useWorkspacesQuery();

  return {
    workspaces,
    isLoading,
    comboboxProps: {
      workspaces,
      isLoading,
      ...props,
    } as WorkspaceComboboxProps,
  };
}
