"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Check,
  Copy,
  MoreHorizontal,
  Pencil,
  Plus,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemePresetSelector } from "@/components/theme-preset-selector";
import { SettingSection } from "@/components/settings/shared/SettingSection";
import { SettingRow } from "@/components/settings/shared/SettingRow";
import { ManageWorkspaceDialog } from "@/components/workspaces/ManageWorkspaceDialog";
import {
  useWorkspacesQuery,
  useSwitchWorkspaceMutation,
} from "@/lib/workspaces/workspace-query";
import { useWorkspaceScope } from "@/lib/workspaces/use-workspace-scope";
import type { Workspace } from "@/lib/workspaces/workspace-types";

// ============================================================================
// Component
// ============================================================================

export function PreferencesSettingsPane() {
  const router = useRouter();
  const { workspaceId: activeWorkspaceId, workspaceContext } =
    useWorkspaceScope();

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<
    string | undefined
  >();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Data fetching
  const { data: workspaces = [], isLoading } = useWorkspacesQuery();
  const switchWorkspace = useSwitchWorkspaceMutation();

  const currentWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);
  const isOwner = workspaceContext?.role === "OWNER";

  // Clear copied state after delay
  useEffect(() => {
    if (!copiedId) return;
    const timeout = setTimeout(() => setCopiedId(null), 1500);
    return () => clearTimeout(timeout);
  }, [copiedId]);

  const handleCopyId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(id);
      toast.success("Workspace ID copied");
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleCreateWorkspace = () => {
    setDialogMode("create");
    setSelectedWorkspaceId(undefined);
    setIsDialogOpen(true);
  };

  const handleEditWorkspace = (workspaceId: string) => {
    setDialogMode("edit");
    setSelectedWorkspaceId(workspaceId);
    setIsDialogOpen(true);
  };

  const handleSwitchWorkspace = async (workspace: Workspace) => {
    if (workspace.id === activeWorkspaceId) return;

    try {
      await switchWorkspace.mutateAsync(workspace.id);
      toast.success(`Switched to ${workspace.name}`);
      router.refresh();
    } catch {
      toast.error("Failed to switch workspace");
    }
  };

  const otherWorkspaces = workspaces.filter((w) => w.id !== activeWorkspaceId);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <DialogTitle className="text-xl">Preferences</DialogTitle>
        <DialogDescription className="mt-1">
          Manage your workspace settings, switch between workspaces, and
          configure preferences.
        </DialogDescription>
      </div>

      <Separator />

      <SettingSection title="Appearance">
        <SettingRow
          label="Theme"
          description="Choose light, dark, or system mode and select your preferred color preset."
        >
          <ThemePresetSelector />
        </SettingRow>
      </SettingSection>

      <Separator />

      {/* Current Workspace */}
      <SettingSection title="Current Workspace">
        {isLoading ? (
          <div className="flex items-center gap-4">
            <Skeleton className="h-14 w-14 rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ) : currentWorkspace ? (
          <SettingRow
            label={currentWorkspace.name}
            description={`${currentWorkspace.type === "solo" ? "Personal workspace" : "Team workspace"} • ${currentWorkspace.members?.length ?? 1} member${(currentWorkspace.members?.length ?? 1) > 1 ? "s" : ""}`}
          >
            <div className="flex items-center gap-3">
              {/* Workspace Avatar */}
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                <Building2 className="h-6 w-6" />
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      currentWorkspace.type === "solo" ? "secondary" : "default"
                    }
                  >
                    {currentWorkspace.type === "solo" ? "Personal" : "Team"}
                  </Badge>
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {currentWorkspace.id.slice(0, 8)}...
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  {isOwner && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2"
                      onClick={() => handleEditWorkspace(currentWorkspace.id)}
                    >
                      <Pencil className="mr-1.5 h-3.5 w-3.5" />
                      Edit name
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                    onClick={() => handleCopyId(currentWorkspace.id)}
                  >
                    {copiedId === currentWorkspace.id ? (
                      <Check className="mr-1.5 h-3.5 w-3.5" />
                    ) : (
                      <Copy className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    {copiedId === currentWorkspace.id ? "Copied" : "Copy ID"}
                  </Button>
                </div>
              </div>
            </div>
          </SettingRow>
        ) : (
          <div className="text-sm text-muted-foreground">
            No workspace selected.
          </div>
        )}
      </SettingSection>

      <Separator />

      {/* Workspace Switcher */}
      <SettingSection title="Switch Workspace">
        <SettingRow
          label="Your workspaces"
          description="Select a different workspace to work in."
        >
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : otherWorkspaces.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
              You only have one workspace. Create another to switch between
              them.
            </div>
          ) : (
            <div className="space-y-2">
              {otherWorkspaces.map((workspace) => (
                <div
                  key={workspace.id}
                  className="group flex items-center justify-between rounded-lg border border-border/60 p-3 hover:bg-accent/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{workspace.name}</p>
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        {workspace.members?.length ?? 1}
                        <span className="mx-1">•</span>
                        {workspace.type === "solo" ? "Personal" : "Team"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8"
                      onClick={() => handleSwitchWorkspace(workspace)}
                      disabled={switchWorkspace.isPending}
                    >
                      Switch
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleCopyId(workspace.id)}
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Copy ID
                        </DropdownMenuItem>
                        {workspace.ownerId ===
                          workspaceContext?.actorUserId && (
                          <DropdownMenuItem
                            onClick={() => handleEditWorkspace(workspace.id)}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Button
            variant="outline"
            className="w-full"
            onClick={handleCreateWorkspace}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create new workspace
          </Button>
        </SettingRow>
      </SettingSection>

      {/* Workspace Management Dialog */}
      <ManageWorkspaceDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        workspaceId={selectedWorkspaceId}
        onCreateSuccess={(workspace) => {
          toast.success(`Created workspace "${workspace.name}"`);
          if (workspace.id !== activeWorkspaceId) {
            void handleSwitchWorkspace(workspace);
          }
        }}
        onUpdateSuccess={(workspace) => {
          toast.success(`Updated workspace "${workspace.name}"`);
        }}
        onDeleteSuccess={() => {
          toast.success("Workspace deleted");
          const remainingWorkspace = workspaces.find(
            (w) => w.id !== selectedWorkspaceId && w.id !== activeWorkspaceId,
          );
          if (remainingWorkspace) {
            void handleSwitchWorkspace(remainingWorkspace);
          }
        }}
      />
    </div>
  );
}
