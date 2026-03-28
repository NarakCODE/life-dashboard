"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Mail, Link as LinkIcon, Copy, Check, RefreshCw, Trash2, Loader2, Send } from "lucide-react";
import { useInviteMemberMutation } from "@/lib/members/members-query";
import {
  useJoinLinkQuery,
  useCreateJoinLinkMutation,
  useUpdateJoinLinkMutation,
  useDeleteJoinLinkMutation,
} from "@/lib/workspaces/workspace-query";
import { toast } from "sonner";
import { getApiBaseUrl } from "@/lib/api/api-utils";
import type { WorkspaceRole } from "@/lib/workspaces/workspace-types";

interface InviteMemberDialogProps {
  workspaceId: string;
}

export function InviteMemberDialog({ workspaceId }: InviteMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("email");
  
  // Email invite state
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<WorkspaceRole>("MEMBER");
  const inviteMutation = useInviteMemberMutation();
  
  // Join link state
  const [copied, setCopied] = useState(false);
  const [regenerateDialogOpen, setRegenerateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  const { data: joinLink, isPending: isJoinLinkLoading } = useJoinLinkQuery(workspaceId);
  const createJoinLinkMutation = useCreateJoinLinkMutation();
  const updateJoinLinkMutation = useUpdateJoinLinkMutation();
  const deleteJoinLinkMutation = useDeleteJoinLinkMutation();

  const handleInvite = async () => {
    if (!email) {
      toast.error("Please enter an email address");
      return;
    }

    try {
      await inviteMutation.mutateAsync({
        workspaceId,
        input: { email, role },
      });
      toast.success("Invitation sent!");
      setEmail("");
      setRole("MEMBER");
      setOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to send invitation",
      );
    }
  };

  const handleCreateLink = async () => {
    try {
      await createJoinLinkMutation.mutateAsync(workspaceId);
      toast.success("Join link created successfully");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create join link";
      toast.error("Failed to create join link", { description: message });
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
      toast.error("Failed to update join link", { description: message });
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
      toast.error("Failed to regenerate join link", { description: message });
    }
  };

  const handleDeleteLink = async () => {
    try {
      await deleteJoinLinkMutation.mutateAsync(workspaceId);
      toast.success("Join link deleted successfully");
      setDeleteDialogOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete join link";
      toast.error("Failed to delete join link", { description: message });
    }
  };

  const handleCopyLink = async () => {
    if (!joinLink?.token) return;
    const joinUrl = `${getApiBaseUrl()}/workspaces/join/${joinLink.token}`;
    
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const joinUrl = joinLink ? `${getApiBaseUrl()}/workspaces/join/${joinLink.token}` : "";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Invite Member
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Invite team member</DialogTitle>
          <DialogDescription>
            Invite people to join your workspace via email or share a link.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email" className="gap-2">
              <Mail className="h-4 w-4" />
              By Email
            </TabsTrigger>
            <TabsTrigger value="link" className="gap-2">
              <LinkIcon className="h-4 w-4" />
              Share Link
            </TabsTrigger>
          </TabsList>

          {/* Email Invite Tab */}
          <TabsContent value="email" className="mt-4 space-y-4">
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="colleague@example.com"
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !inviteMutation.isPending) {
                        handleInvite();
                      }
                    }}
                  />
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <Select value={role} onValueChange={(v) => setRole(v as WorkspaceRole)}>
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="MEMBER">Member</SelectItem>
                    <SelectItem value="VIEWER">Viewer</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  <strong>Admin:</strong> Can manage members and workspace settings
                  <br />
                  <strong>Member:</strong> Can view and edit content
                  <br />
                  <strong>Viewer:</strong> Read-only access
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleInvite} 
                disabled={inviteMutation.isPending || !email.trim()}
                className="gap-2"
              >
                {inviteMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {inviteMutation.isPending ? "Sending..." : "Send Invitation"}
              </Button>
            </DialogFooter>
          </TabsContent>

          {/* Share Link Tab */}
          <TabsContent value="link" className="mt-4 space-y-4">
            {!joinLink ? (
              /* No link exists - Show create button */
              <div className="rounded-lg border border-dashed border-border p-8 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <LinkIcon className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="mb-2 text-sm font-medium">No join link yet</h3>
                <p className="mb-4 text-xs text-muted-foreground">
                  Create a shareable link so people can request to join your workspace.
                </p>
                <Button
                  onClick={handleCreateLink}
                  disabled={createJoinLinkMutation.isPending}
                  className="gap-2"
                >
                  {createJoinLinkMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LinkIcon className="h-4 w-4" />
                  )}
                  {createJoinLinkMutation.isPending ? "Generating..." : "Generate Link"}
                </Button>
              </div>
            ) : (
              /* Link exists - Show full UI */
              <div className="space-y-4">
                {/* Enable Toggle */}
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">Link is {joinLink.isEnabled ? "enabled" : "disabled"}</p>
                    <p className="text-xs text-muted-foreground">
                      {joinLink.isEnabled
                        ? "People can request to join using this link"
                        : "No one can join using this link right now"}
                    </p>
                  </div>
                  <Switch
                    checked={joinLink.isEnabled}
                    onCheckedChange={handleToggleLink}
                    disabled={updateJoinLinkMutation.isPending}
                  />
                </div>

                {/* Link Display */}
                <div className="space-y-2">
                  <Label>Shareable link</Label>
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
                      onClick={handleCopyLink}
                      disabled={!joinLink.isEnabled}
                      className="shrink-0"
                      aria-label={copied ? "Copied" : "Copy link"}
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Anyone with this link can request to join. You&apos;ll need to approve requests.
                  </p>
                </div>

                {/* Share Options */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      window.open(
                        `mailto:?subject=Join my workspace&body=I'd like to invite you to join my workspace. Click here to request access: ${encodeURIComponent(joinUrl)}`,
                        "_blank"
                      );
                    }}
                    disabled={!joinLink.isEnabled}
                    className="gap-2"
                  >
                    <Mail className="h-4 w-4" />
                    Email Link
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const text = `Join my workspace: ${joinUrl}`;
                      navigator.clipboard.writeText(text);
                      toast.success("Copied as text");
                    }}
                    disabled={!joinLink.isEnabled}
                    className="gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    Copy Text
                  </Button>
                </div>

                {/* Danger Zone */}
                <div className="pt-4 border-t">
                  <p className="text-xs font-medium text-muted-foreground mb-3">Manage Link</p>
                  <div className="flex items-center gap-2">
                    {/* Regenerate Dialog */}
                    <AlertDialog open={regenerateDialogOpen} onOpenChange={setRegenerateDialogOpen}>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="flex-1 gap-2">
                          <RefreshCw className="h-4 w-4" />
                          Regenerate
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Regenerate Link?</AlertDialogTitle>
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
                        <Button variant="destructive" size="sm" className="flex-1 gap-2">
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Link?</AlertDialogTitle>
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
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Done
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
