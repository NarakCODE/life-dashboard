"use client";

import * as React from "react";
import { Building, Check, ChevronsUpDown, Plus, Settings } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import type { Workspace } from "@/lib/workspaces/workspace-types";

export interface WorkspaceComboboxProps {
  /** List of workspaces to display */
  workspaces: Workspace[];
  /** Currently selected workspace ID */
  selectedId?: string | null;
  /** Callback when a workspace is selected */
  onSelect: (workspace: Workspace) => void;
  /** Callback when create new is clicked */
  onCreateNew?: () => void;
  /** Callback when manage workspaces is clicked */
  onManageWorkspaces?: () => void;
  /** Loading state */
  isLoading?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Custom trigger className */
  triggerClassName?: string;
  /** Custom popover content className */
  contentClassName?: string;
  /** Placeholder text for the trigger */
  placeholder?: string;
  /** Search placeholder text */
  searchPlaceholder?: string;
}

/**
 * Reusable workspace combobox component
 * Displays a dropdown with searchable workspace list
 */
export function WorkspaceCombobox({
  workspaces,
  selectedId,
  onSelect,
  onCreateNew,
  onManageWorkspaces,
  isLoading = false,
  disabled = false,
  triggerClassName,
  contentClassName,
  placeholder = "Select workspace...",
  searchPlaceholder = "Search workspaces...",
}: WorkspaceComboboxProps) {
  const [open, setOpen] = React.useState(false);
  console.log("workspaces", workspaces);
  const selectedWorkspace = React.useMemo(
    () => workspaces.find((w) => w.id === selectedId),
    [workspaces, selectedId],
  );

  const handleSelect = React.useCallback(
    (workspace: Workspace) => {
      onSelect(workspace);
      setOpen(false);
    },
    [onSelect],
  );

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 w-full">
        <Skeleton className="h-9 w-9 rounded-md" />
        <Skeleton className="h-9 flex-1 rounded-md" />
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between px-2 hover:bg-accent",
            triggerClassName,
          )}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <Avatar className="h-7 w-7 shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {selectedWorkspace ? (
                  selectedWorkspace.name.slice(0, 2).toUpperCase()
                ) : (
                  <Building className="h-3.5 w-3.5" />
                )}
              </AvatarFallback>
            </Avatar>
            <span className="truncate text-sm font-medium">
              {selectedWorkspace?.name ?? placeholder}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          "w-[--radix-popover-trigger-width] p-0",
          contentClassName,
        )}
        align="start"
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>No workspace found.</CommandEmpty>
            <CommandGroup>
              {workspaces.map((workspace) => (
                <CommandItem
                  key={workspace.id}
                  value={workspace.id}
                  onSelect={() => handleSelect(workspace)}
                  className="flex items-center gap-2"
                >
                  <Check
                    className={cn(
                      "h-4 w-4 shrink-0",
                      selectedId === workspace.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <Avatar className="h-6 w-6 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                      {workspace.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-0.5 overflow-hidden">
                    <span className="truncate text-sm">{workspace.name}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {workspace.owner.displayName}
                    </span>
                  </div>
                  {workspace.type === "solo" && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      Personal
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
            {(onCreateNew || onManageWorkspaces) && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  {onCreateNew && (
                    <CommandItem
                      onSelect={() => {
                        onCreateNew();
                        setOpen(false);
                      }}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4 shrink-0" />
                      <span className="text-sm">Create new workspace</span>
                    </CommandItem>
                  )}
                  {onManageWorkspaces && (
                    <CommandItem
                      onSelect={() => {
                        onManageWorkspaces();
                        setOpen(false);
                      }}
                      className="flex items-center gap-2"
                    >
                      <Settings className="h-4 w-4 shrink-0" />
                      <span className="text-sm">Manage workspaces</span>
                    </CommandItem>
                  )}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// Hook-based wrapper for simpler usage with TanStack Query
export interface UseWorkspaceComboboxProps {
  selectedId?: string | null;
  onSelect: (workspace: Workspace) => void;
  onCreateNew?: () => void;
  onManageWorkspaces?: () => void;
}

/**
 * Hook to get workspace combobox props with data fetching
 */
export function useWorkspaceCombobox(props: UseWorkspaceComboboxProps) {
  const { useWorkspacesQuery } = require("@/lib/workspaces/workspace-query");
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
