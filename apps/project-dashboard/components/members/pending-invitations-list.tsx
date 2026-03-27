"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getInitials } from "@/lib/utils";
import type { WorkspaceInvitation } from "@/lib/members/members-types";
import { formatWorkspaceRole, formatDateLabel } from "@/components/settings/shared/settings-formatters";
import { Mail, Clock, Eraser } from "lucide-react";
import { useRevokeInvitationMutation } from "@/lib/members/members-query";
import { toast } from "sonner";

interface PendingInvitationsListProps {
  workspaceId: string;
  invitations: WorkspaceInvitation[];
  canManageInvitations: boolean;
}

export function PendingInvitationsList({
  workspaceId,
  invitations,
  canManageInvitations,
}: PendingInvitationsListProps) {
  const revokeMutation = useRevokeInvitationMutation();

  const handleRevoke = async (invitationId: string) => {
    if (!confirm("Are you sure you want to revoke this invitation?")) return;

    try {
      await revokeMutation.mutateAsync({ workspaceId, invitationId });
      toast.success("Invitation revoked");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to revoke invitation",
      );
    }
  };

  if (invitations.length === 0) {
    return null;
  }

  return (
    <div className="mt-6">
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
        <Clock className="h-4 w-4" />
        Pending Invitations ({invitations.length})
      </h3>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Invited By</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invitations.map((invitation) => (
              <TableRow key={invitation.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{invitation.email}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100">
                    {formatWorkspaceRole(invitation.role)}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {invitation.invitedBy}
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {formatDateLabel(invitation.expiresAt)}
                  </span>
                </TableCell>
                <TableCell>
                  {canManageInvitations && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRevoke(invitation.id)}
                      disabled={revokeMutation.isPending}
                    >
                      <Eraser className="h-3.5 w-3.5 mr-1" />
                      Revoke
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
