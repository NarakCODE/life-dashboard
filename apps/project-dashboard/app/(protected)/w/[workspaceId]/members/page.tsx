"use client";

import { Suspense } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ErrorBoundary } from "@/components/error-boundary";
import { useWorkspaceScope } from "@/lib/workspaces/use-workspace-scope";
import { MembersList, PendingInvitationsList } from "@/components/members";
import { InviteMemberDialog } from "@/components/members/invite-member-dialog";
import {
  useWorkspaceMembersQuery,
  useWorkspaceInvitationsQuery,
} from "@/lib/members/members-query";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyStateInline } from "@/components/ui/empty-state";
import { Users } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { JoinLinkSettings } from "@/components/workspaces/JoinLinkSettings";
import { JoinRequestsButton } from "@/components/members";

export default function MembersPage() {
  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <header className="flex flex-col border-b border-border/40">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-accent" />
            <p className="text-base font-medium text-foreground">Members</p>
          </div>
          <Suspense fallback={<InviteButtonSkeleton />}>
            <InviteMemberButton />
          </Suspense>
        </div>
      </header>

      <ErrorBoundary fallback={<MembersError />}>
        <Suspense fallback={<MembersListSkeleton />}>
          <MembersContent />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}

function InviteButtonSkeleton() {
  return <Skeleton className="h-9 w-32" />;
}

function InviteMemberButton() {
  const { workspaceId, workspaceContext } = useWorkspaceScope();
  const canInvite =
    workspaceContext?.role === "OWNER" || workspaceContext?.role === "ADMIN";

  if (!workspaceId || !canInvite) {
    return null;
  }

  return <InviteMemberDialog workspaceId={workspaceId} />;
}

function MembersContent() {
  const { workspaceId, workspaceContext } = useWorkspaceScope();
  const { user } = useAuth();
  const membersQuery = useWorkspaceMembersQuery(workspaceId ?? "");
  const invitationsQuery = useWorkspaceInvitationsQuery(workspaceId ?? "");

  if (!workspaceId) {
    return (
      <div className="p-6">
        <EmptyStateInline
          icon={Users}
          title="No workspace selected"
          description="Select a workspace to view and manage members."
        />
      </div>
    );
  }

  if (membersQuery.isPending) {
    return <MembersListSkeleton />;
  }

  if (membersQuery.error) {
    return (
      <div className="p-6">
        <EmptyStateInline
          icon={Users}
          title="Failed to load members"
          description={membersQuery.error.message}
        />
      </div>
    );
  }

  const members = membersQuery.data ?? [];
  const invitations = invitationsQuery.data ?? [];
  const canManageMembers =
    workspaceContext?.role === "OWNER" || workspaceContext?.role === "ADMIN";

  return (
    <div className="flex-1 overflow-auto p-4 lg:p-6">
      <div className="max-w-5xl space-y-6">
        {/* Join Link Settings (Admin only) */}
        {canManageMembers && <JoinLinkSettings workspaceId={workspaceId} />}

        {/* Join Requests Button (Admin only) */}
        {canManageMembers && <JoinRequestsButton workspaceId={workspaceId} />}

        {/* Members List */}
        {members.length === 0 ? (
          <EmptyStateInline
            icon={Users}
            title="No members yet"
            description="Invite team members to collaborate in this workspace."
          />
        ) : (
          <MembersList
            workspaceId={workspaceId}
            currentUserId={user?.id ?? ""}
            members={members}
            canManageMembers={canManageMembers}
          />
        )}

        {/* Pending Invitations */}
        {invitations.length > 0 && (
          <PendingInvitationsList
            workspaceId={workspaceId}
            invitations={invitations}
            canManageInvitations={canManageMembers}
          />
        )}
      </div>
    </div>
  );
}

function MembersListSkeleton() {
  return (
    <div className="space-y-4 p-4 lg:p-6">
      <div className="rounded-md border">
        <div className="grid grid-cols-3 gap-4 border-b p-4">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-16 justify-self-end" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-3 gap-4 border-b p-4 last:border-b-0"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-8 w-8 justify-self-end" />
          </div>
        ))}
      </div>
    </div>
  );
}

function MembersError() {
  return (
    <div className="p-6">
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <p className="text-sm text-destructive">
          Failed to load members. Please try refreshing the page.
        </p>
      </div>
    </div>
  );
}
