"use client";

import * as React from "react";
import { Building2, ChevronsUpDown, Plus, Settings2 } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
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
  const { isMobile } = useSidebar();

  const effectiveSelectedId = selectedId ?? userActiveWorkspaceId;

  const selectedWorkspace = React.useMemo(
    () => workspaces.find((workspace) => workspace.id === effectiveSelectedId),
    [effectiveSelectedId, workspaces],
  );

  const handleSelect = React.useCallback(
    (workspace: Workspace) => {
      if (workspace.id === effectiveSelectedId) {
        return;
      }

      onSelect(workspace);
    },
    [effectiveSelectedId, onSelect],
  );

  if (isLoading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" disabled>
            <Skeleton className="aspect-square size-8 rounded-lg" />
            <div className="grid flex-1 gap-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              disabled={disabled}
              className={cn(
                "data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground",
                triggerClassName,
              )}
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                {selectedWorkspace ? (
                  <span className="text-xs font-medium">
                    {getWorkspaceInitials(selectedWorkspace.name)}
                  </span>
                ) : (
                  <Building2 className="size-4" />
                )}
              </div>

              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {selectedWorkspace?.name ?? placeholder}
                </span>
                <span className="truncate text-xs">
                  {selectedWorkspace
                    ? getWorkspaceTypeLabel(selectedWorkspace.type)
                    : "Workspace"}
                </span>
              </div>

              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className={cn(
              "w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg",
              contentClassName,
            )}
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Workspaces
            </DropdownMenuLabel>

            {workspaces.map((workspace, index) => {
              const isSelected = workspace.id === selectedWorkspace?.id;

              return (
                <DropdownMenuItem
                  key={workspace.id}
                  onClick={() => handleSelect(workspace)}
                  className={cn("gap-2 p-2", isSelected && "bg-card")}
                >
                  <div className="flex size-6 items-center justify-center rounded-md border">
                    <span className="text-[10px] font-medium">
                      {getWorkspaceInitials(workspace.name)}
                    </span>
                  </div>

                  <div className="grid min-w-0 flex-1 text-sm leading-tight">
                    <span className="truncate">{workspace.name}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {getWorkspaceTypeLabel(workspace.type)}
                    </span>
                  </div>

                  {!isSelected ? (
                    <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                  ) : null}
                </DropdownMenuItem>
              );
            })}

            {(onCreateNew || onManageWorkspaces) && (
              <>
                <DropdownMenuSeparator />

                {onCreateNew ? (
                  <DropdownMenuItem onClick={onCreateNew} className="gap-2 p-2">
                    <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                      <Plus className="size-4" />
                    </div>
                    <div className="font-medium text-muted-foreground">
                      Create workspace
                    </div>
                  </DropdownMenuItem>
                ) : null}

                {onManageWorkspaces ? (
                  <DropdownMenuItem
                    onClick={onManageWorkspaces}
                    className="gap-2 p-2"
                  >
                    <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                      <Settings2 className="size-4" />
                    </div>
                    <div className="font-medium text-muted-foreground">
                      Manage workspaces
                    </div>
                  </DropdownMenuItem>
                ) : null}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export interface UseWorkspaceComboboxProps {
  selectedId?: string | null;
  userActiveWorkspaceId?: string | null;
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
