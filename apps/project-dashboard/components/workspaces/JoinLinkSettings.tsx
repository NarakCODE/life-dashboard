"use client";

import { useState } from "react";
import { Copy, Check, Link as LinkIcon, Trash2, RefreshCw, Share2 } from "lucide-react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  useJoinLinkQuery,
  useCreateJoinLinkMutation,
  useUpdateJoinLinkMutation,
  useDeleteJoinLinkMutation,
} from "@/lib/workspaces/workspace-query";
import { toast } from "sonner";
import { getApiBaseUrl } from "@/lib/api/api-utils";

interface JoinLinkSettingsProps {
  workspaceId: string;
}

export function JoinLinkSettings({ workspaceId }: JoinLinkSettingsProps) {
  const [copied, setCopied] = useState(false);
  const [regenerateDialogOpen, setRegenerateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  const { data: joinLink, isPending, error } = useJoinLinkQuery(workspaceId);
  const createJoinLinkMutation = useCreateJoinLinkMutation();
  const updateJoinLinkMutation = useUpdateJoinLinkMutation();
  const deleteJoinLinkMutation = useDeleteJoinLinkMutation();

  const handleCreateLink = async () => {
    try {
      await createJoinLinkMutation.mutateAsync(workspaceId);
      toast.success("Join link created successfully");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create join link";
      toast.error("Failed to create join link", {
        description: message,
      });
    }
  };

  const handleToggleLink = async (enabled: boolean) => {
    try {
      await updateJoinLinkMutation.mutateAsync({
        workspaceId,
        input: { isEnabled: enabled },
      });
      toast.success(enabled ? "Join link enabled" : "Join link disabled");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update join link";
      toast.error("Failed to update join link", {
        description: message,
      });
    }
  };

  const handleRegenerateLink = async () => {
    try {
      await deleteJoinLinkMutation.mutateAsync(workspaceId);
      await createJoinLinkMutation.mutateAsync(workspaceId);
      toast.success("Join link regenerated successfully");
      setRegenerateDialogOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to regenerate join link";
      toast.error("Failed to regenerate join link", {
        description: message,
      });
    }
  };

  const handleDeleteLink = async () => {
    try {
      await deleteJoinLinkMutation.mutateAsync(workspaceId);
      toast.success("Join link deleted successfully");
      setDeleteDialogOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete join link";
      toast.error("Failed to delete join link", {
        description: message,
      });
    }
  };

  const handleCopyLink = async (customUrl?: string) => {
    const urlToCopy = customUrl || (joinLink ? `${getApiBaseUrl()}/workspaces/join/${joinLink.token}` : "");
    if (!urlToCopy) return;

    try {
      await navigator.clipboard.writeText(urlToCopy);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const joinUrl = joinLink ? `${getApiBaseUrl()}/workspaces/join/${joinLink.token}` : "";

  // State 1: Loading
  if (isPending) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            Join Link
          </CardTitle>
          <CardDescription>
            Allow people to request access to your workspace via a link.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // State 2: Error
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            Join Link
          </CardTitle>
          <CardDescription>
            Allow people to request access to your workspace via a link.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-center text-sm text-destructive">
            Failed to load join link settings. Please try again.
          </div>
        </CardContent>
      </Card>
    );
  }

  // State 3: No link exists - Show create button
  if (!joinLink) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            Join Link
          </CardTitle>
          <CardDescription>
            Create a shareable link so people can request to join your workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleCreateLink}
            disabled={createJoinLinkMutation.isPending}
            className="w-full"
          >
            {createJoinLinkMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <LinkIcon className="mr-2 h-4 w-4" />
                Generate Join Link
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // State 4: Link exists - Show full UI
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LinkIcon className="h-5 w-5" />
          Join Link
        </CardTitle>
        <CardDescription>
          Allow people to request access to your workspace via a shareable link.
          When enabled, anyone with the link can request to join.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">Enable Join Link</p>
            <p className="text-xs text-muted-foreground">
              {joinLink.isEnabled
                ? "People can request access with the link"
                : "Join link is currently disabled"}
            </p>
          </div>
          <Switch
            checked={joinLink.isEnabled}
            onCheckedChange={handleToggleLink}
            disabled={updateJoinLinkMutation.isPending}
          />
        </div>

        {joinLink.isEnabled && (
          <>
            {/* Link Display */}
            <div className="rounded-lg border border-border p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Input
                  value={joinUrl}
                  readOnly
                  className="font-mono text-sm flex-1"
                  onClick={(e) => e.currentTarget.select()}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleCopyLink()}
                  disabled={copied}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
                <p>
                  <strong>How it works:</strong> When someone visits this link, they can request
                  to join your workspace. You&apos;ll need to approve their request before they
                  gain access.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => handleCopyLink()}
                className="flex-1"
                disabled={copied}
              >
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4 text-success" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Link
                  </>
                )}
              </Button>

              <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex-1">
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Share Join Link</DialogTitle>
                    <DialogDescription>
                      Share this link with people you want to invite to your workspace.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="flex items-center gap-2">
                      <Input
                        value={joinUrl}
                        readOnly
                        className="font-mono text-sm flex-1"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleCopyLink()}
                      >
                        {copied ? (
                          <Check className="h-4 w-4 text-success" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          window.open(
                            `mailto:?subject=Join my workspace&body=I'd like to invite you to join my workspace. Click here to request access: ${encodeURIComponent(joinUrl)}`,
                            "_blank"
                          );
                        }}
                      >
                        Share via Email
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          const text = `Join my workspace: ${joinUrl}`;
                          handleCopyLink(text);
                        }}
                      >
                        Copy as Text
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </>
        )}

        {!joinLink.isEnabled && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 p-4 text-center">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Enable the join link to allow people to request access.
            </p>
          </div>
        )}

        {/* Danger Zone */}
        <div className="pt-4 border-t">
          <p className="text-xs font-medium text-muted-foreground mb-3">Danger Zone</p>
          <div className="flex items-center gap-2">
            {/* Regenerate Dialog */}
            <AlertDialog open={regenerateDialogOpen} onOpenChange={setRegenerateDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex-1">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Regenerate
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Regenerate Join Link?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will invalidate the current link and create a new one. Anyone
                    with the old link will no longer be able to use it.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleRegenerateLink}
                    disabled={deleteJoinLinkMutation.isPending || createJoinLinkMutation.isPending}
                  >
                    {(deleteJoinLinkMutation.isPending || createJoinLinkMutation.isPending) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Regenerate
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Delete Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="flex-1">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Join Link?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete the join link. You can create a new one
                    at any time. Anyone with the current link will no longer be able to use it.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteLink}
                    disabled={deleteJoinLinkMutation.isPending}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    {deleteJoinLinkMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
