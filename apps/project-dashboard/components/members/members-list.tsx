"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getInitials } from "@/lib/utils";
import type { WorkspaceMemberWithDetails } from "@/lib/members/members-types";
import { formatWorkspaceRole } from "@/components/settings/shared/settings-formatters";
import { MoreHorizontal, UserMinus, Shield, Mail } from "lucide-react";
import { useRemoveMemberMutation, useUpdateMemberRoleMutation } from "@/lib/members/members-query";
import { toast } from "sonner";
import { WorkspaceRole } from "@/lib/workspaces/workspace-types";

interface MembersListProps {
  workspaceId: string;
  currentUserId: string;
  members: WorkspaceMemberWithDetails[];
  canManageMembers: boolean;
}

export function MembersList({
  workspaceId,
  currentUserId,
  members,
  canManageMembers,
}: MembersListProps) {
  const updateRoleMutation = useUpdateMemberRoleMutation();
  const removeMemberMutation = useRemoveMemberMutation();

  const handleRoleChange = async (memberId: string, newRole: WorkspaceRole) => {
    try {
      await updateRoleMutation.mutateAsync({
        workspaceId,
        memberId,
        input: { role: newRole },
      });
      toast.success("Member role updated");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update role",
      );
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return;

    try {
      await removeMemberMutation.mutateAsync({ workspaceId, memberId });
      toast.success("Member removed");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to remove member",
      );
    }
  };

  const sortedMembers = [...members].sort((a, b) => {
    // Owner first
    if (a.role === "OWNER") return -1;
    if (b.role === "OWNER") return 1;
    // Then admins
    if (a.role === "ADMIN") return -1;
    if (b.role === "ADMIN") return 1;
    return 0;
  });

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead>Role</TableHead>
            <TableHead className="w-[70px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedMembers.map((member) => {
            const isCurrentUser = member.userId === currentUserId;
            const isOwner = member.role === "OWNER";

            return (
              <TableRow key={member.userId}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage
                        src={member.user.avatarUrl || undefined}
                        alt={member.user.displayName}
                      />
                      <AvatarFallback className="bg-muted text-sm">
                        {getInitials(member.user.displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">
                        {member.user.displayName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {member.user.email}
                      </span>
                    </div>
                    {isCurrentUser && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        (You)
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      member.role === "OWNER"
                        ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100"
                        : member.role === "ADMIN"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
                    }`}
                  >
                    {formatWorkspaceRole(member.role)}
                  </span>
                </TableCell>
                <TableCell>
                  {!isOwner && canManageMembers && !isCurrentUser && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Change Role</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() =>
                            handleRoleChange(member.userId, "ADMIN")
                          }
                        >
                          <Shield className="mr-2 h-4 w-4" />
                          Admin
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            handleRoleChange(member.userId, "MEMBER")
                          }
                        >
                          <UserMinus className="mr-2 h-4 w-4" />
                          Member
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleRemoveMember(member.userId)}
                          className="text-destructive focus:text-destructive"
                        >
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
