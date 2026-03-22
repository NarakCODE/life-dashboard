"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Inbox, Mail, Users } from "lucide-react";
import { Spinner } from "@phosphor-icons/react/dist/ssr";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyStateInline } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { InlineFeedbackBanner, type InlineInviteFeedback } from "@/components/settings/shared/InlineFeedbackBanner";
import {
  formatDateLabel,
  formatRelativeDate,
  formatWorkspaceRole,
} from "@/components/settings/shared/settings-formatters";
import {
  useAcceptInvitationMutation,
  useInviteMemberMutation,
  useMyInvitationsQuery,
  useRejectInvitationMutation,
  useRevokeInvitationMutation,
  useWorkspaceInvitationsQuery,
  useWorkspaceQuery,
} from "@/lib/workspaces/workspace-query";
import { useWorkspaceScope } from "@/lib/workspaces/use-workspace-scope";
import type { WorkspaceRole } from "@/lib/workspaces/workspace-types";
import { getInitials } from "@/lib/utils";

export function TeammatesSettingsPane() {
  const { workspaceId, workspaceContext } = useWorkspaceScope();
  const workspaceQuery = useWorkspaceQuery(workspaceId ?? "", {
    enabled: Boolean(workspaceId),
  });
  const invitationsQuery = useWorkspaceInvitationsQuery(workspaceId ?? "", {
    enabled: Boolean(workspaceId),
  });
  const inviteMutation = useInviteMemberMutation();
  const revokeInvitationMutation = useRevokeInvitationMutation();
  const myInvitationsQuery = useMyInvitationsQuery({
    enabled: Boolean(workspaceId),
  });
  const acceptInvitationMutation = useAcceptInvitationMutation();
  const rejectInvitationMutation = useRejectInvitationMutation();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<WorkspaceRole>("MEMBER");
  const [inviteFeedback, setInviteFeedback] =
    useState<InlineInviteFeedback | null>(null);
  const members = useMemo(
    () => workspaceQuery.data?.members ?? [],
    [workspaceQuery.data?.members],
  );
  const pendingInvitations = invitationsQuery.data ?? [];
  const myPendingInvitations = myInvitationsQuery.data ?? [];
  const hasWorkspace = Boolean(workspaceId);
  const canManageInvitations =
    workspaceContext?.role === "OWNER" || workspaceContext?.role === "ADMIN";

  const handleAcceptInvitation = async (invitationId: string) => {
    try {
      await acceptInvitationMutation.mutateAsync(invitationId);
      toast.success("Invitation accepted");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to accept invitation";
      toast.error(message);
    }
  };

  const handleRejectInvitation = async (invitationId: string) => {
    try {
      await rejectInvitationMutation.mutateAsync(invitationId);
      toast.success("Invitation rejected");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to reject invitation";
      toast.error(message);
    }
  };

  const handleInvite = async () => {
    if (!workspaceId) {
      toast.error("No workspace selected");
      setInviteFeedback({
        tone: "error",
        message: "Select a workspace before sending invitations.",
      });
      return;
    }
    if (!canManageInvitations) {
      setInviteFeedback({
        tone: "error",
        message: "Only workspace owners and admins can invite teammates.",
      });
      return;
    }
    if (!inviteEmail.trim()) {
      toast.error("Please enter an email address");
      setInviteFeedback({
        tone: "error",
        message: "Enter an email address to send an invitation.",
      });
      return;
    }

    try {
      await inviteMutation.mutateAsync({
        workspaceId,
        input: {
          email: inviteEmail.trim(),
          role: inviteRole,
        },
      });
      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteFeedback({
        tone: "success",
        message: `Invitation sent to ${inviteEmail.trim()}. It now appears in pending invitations below.`,
      });
      setInviteEmail("");
      setInviteRole("MEMBER");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to send invitation";
      toast.error(message);
      setInviteFeedback({
        tone: "error",
        message,
      });
    }
  };

  const handleRevokeInvitation = async (invitationId: string) => {
    if (!workspaceId) return;
    if (!canManageInvitations) {
      setInviteFeedback({
        tone: "error",
        message: "Only workspace owners and admins can revoke invitations.",
      });
      return;
    }

    try {
      await revokeInvitationMutation.mutateAsync({
        workspaceId,
        invitationId,
      });
      toast.success("Invitation revoked");
      setInviteFeedback({
        tone: "info",
        message: "Invitation revoked. The pending list has been updated.",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to revoke invitation";
      toast.error(message);
      setInviteFeedback({
        tone: "error",
        message,
      });
    }
  };

  const invitedByLabel = useMemo(() => {
    const memberMap = new Map(
      members.map((member) => [member.userId, member.user.displayName]),
    );

    return (invitedBy: string) => memberMap.get(invitedBy) ?? "Workspace admin";
  }, [members]);

  return (
    <div className="space-y-8">
      <div>
        <DialogTitle className="text-xl">Teammates</DialogTitle>
        <DialogDescription className="mt-1">
          Invite and manage your teammates to collaborate. You can also{" "}
          <Link href="#" className="text-primary underline underline-offset-4">
            set up AI agents
          </Link>{" "}
          to work alongside your team.
        </DialogDescription>
      </div>

      {myPendingInvitations.length > 0 && (
        <div className="rounded-2xl border border-border bg-muted/30">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <Inbox className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Pending Invitations</span>
            <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {myPendingInvitations.length}
            </span>
          </div>
          <div className="divide-y divide-border">
            {myPendingInvitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex items-center justify-between px-4 py-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">
                    Invitation to join workspace
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Role: {formatWorkspaceRole(invitation.role)} · Expires{" "}
                    {formatDateLabel(invitation.expiresAt)}
                  </p>
                </div>
                <div className="ml-4 flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-xs"
                    disabled={rejectInvitationMutation.isPending}
                    onClick={() => handleRejectInvitation(invitation.id)}
                  >
                    {rejectInvitationMutation.isPending ? (
                      <Spinner className="mr-1 h-3 w-3 animate-spin" />
                    ) : null}
                    Decline
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 px-3 text-xs"
                    disabled={acceptInvitationMutation.isPending}
                    onClick={() => handleAcceptInvitation(invitation.id)}
                  >
                    {acceptInvitationMutation.isPending ? (
                      <Spinner className="mr-1 h-3 w-3 animate-spin" />
                    ) : null}
                    Accept
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Separator />

      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            placeholder="Invite teammates by email"
            className="flex-1"
            value={inviteEmail}
            onChange={(event) => setInviteEmail(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !inviteMutation.isPending) {
                handleInvite();
              }
            }}
            disabled={
              !hasWorkspace || !canManageInvitations || inviteMutation.isPending
            }
          />
          <Select
            value={inviteRole}
            onValueChange={(value) => setInviteRole(value as WorkspaceRole)}
          >
            <SelectTrigger
              className="sm:w-40"
              disabled={
                !hasWorkspace ||
                !canManageInvitations ||
                inviteMutation.isPending
              }
            >
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MEMBER">Member</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
              <SelectItem value="VIEWER">Viewer</SelectItem>
            </SelectContent>
          </Select>
          <Button
            type="button"
            size="lg"
            className="rounded-lg sm:w-auto"
            onClick={handleInvite}
            disabled={
              !hasWorkspace ||
              !canManageInvitations ||
              inviteMutation.isPending ||
              !inviteEmail.trim()
            }
          >
            {inviteMutation.isPending ? (
              <Spinner className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Invite
          </Button>
        </div>
        {!hasWorkspace && (
          <p className="text-xs text-muted-foreground">
            Select a workspace before inviting teammates.
          </p>
        )}
        {hasWorkspace && !canManageInvitations && (
          <p className="text-xs text-muted-foreground">
            Only workspace owners and admins can invite or revoke teammates.
          </p>
        )}
        {inviteFeedback && <InlineFeedbackBanner feedback={inviteFeedback} />}
      </div>

      <div className="rounded-2xl border border-border">
        <div className="grid grid-cols-12 px-4 py-3 text-xs font-medium text-muted-foreground">
          <span className="col-span-6">Name</span>
          <span className="col-span-3">Status</span>
          <span className="col-span-3 text-right sm:text-left">Role</span>
        </div>
        <div className="divide-y divide-border">
          {workspaceQuery.isPending ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              Loading teammates...
            </div>
          ) : members.length === 0 ? (
            <EmptyStateInline
              title="No teammates yet"
              description="Invite someone to get started!"
              icon={Users}
            />
          ) : (
            members.map((member) => (
              <div
                key={member.userId}
                className="grid grid-cols-12 items-center px-4 py-4"
              >
                <div className="col-span-6 flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={undefined} />
                    <AvatarFallback>
                      {getInitials(member.user.displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">
                      {member.user.displayName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {member.user.email}
                    </span>
                  </div>
                </div>
                <div className="col-span-3 text-sm text-muted-foreground">
                  Active
                </div>
                <div className="col-span-3 text-right text-sm capitalize text-foreground sm:text-left">
                  {member.role.toLowerCase()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border">
        <div className="grid grid-cols-12 px-4 py-3 text-xs font-medium text-muted-foreground">
          <span className="col-span-4">Email</span>
          <span className="col-span-2">Role</span>
          <span className="col-span-3">Invited by</span>
          <span className="col-span-2">Expires</span>
          <span className="col-span-1 text-right sm:text-left">Action</span>
        </div>
        <div className="divide-y divide-border">
          {invitationsQuery.isPending ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              Loading pending invitations...
            </div>
          ) : pendingInvitations.length === 0 ? (
            <EmptyStateInline
              title="No pending invitations"
              description="Invitations you send will appear here."
              icon={Mail}
            />
          ) : (
            pendingInvitations.map((invitation) => (
              <div
                key={invitation.id}
                className="grid grid-cols-12 items-center px-4 py-4"
              >
                <div className="col-span-4 min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {invitation.email}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Sent {formatRelativeDate(invitation.createdAt)}
                  </p>
                </div>
                <div className="col-span-2 text-sm text-foreground">
                  {formatWorkspaceRole(invitation.role)}
                </div>
                <div className="col-span-3 text-sm text-muted-foreground">
                  {invitedByLabel(invitation.invitedBy)}
                </div>
                <div className="col-span-2 text-sm text-muted-foreground">
                  {formatDateLabel(invitation.expiresAt)}
                </div>
                <div className="col-span-1 flex justify-end sm:justify-start">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="h-8 px-2 text-xs"
                    disabled={
                      !canManageInvitations ||
                      revokeInvitationMutation.isPending
                    }
                    onClick={() => handleRevokeInvitation(invitation.id)}
                  >
                    Revoke
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
