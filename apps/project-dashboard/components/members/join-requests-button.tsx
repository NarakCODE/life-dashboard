"use client";

import { useState } from "react";
import { UserCirclePlus } from "@phosphor-icons/react/dist/ssr";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { JoinRequestsDialog } from "@/components/workspaces/JoinRequestsDialog";
import { useJoinRequestsQuery } from "@/lib/workspaces/workspace-query";

interface JoinRequestsButtonProps {
  workspaceId: string;
}

export function JoinRequestsButton({ workspaceId }: JoinRequestsButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { data: joinRequests = [] } = useJoinRequestsQuery(workspaceId, {
    enabled: true,
  });

  const pendingCount = joinRequests.filter((req) => req.status === "pending").length;

  if (pendingCount === 0) {
    return (
      <>
        <Button
          variant="outline"
          className="w-full justify-start text-muted-foreground"
          onClick={() => setIsOpen(true)}
        >
          <UserCirclePlus className="mr-2 h-4 w-4" />
          Join Requests
        </Button>
        <JoinRequestsDialog
          open={isOpen}
          onOpenChange={setIsOpen}
          workspaceId={workspaceId}
        />
      </>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        className="w-full justify-start"
        onClick={() => setIsOpen(true)}
      >
        <UserCirclePlus className="mr-2 h-4 w-4" />
        Join Requests
        <Badge variant="default" className="ml-auto bg-warning text-warning-foreground">
          {pendingCount}
        </Badge>
      </Button>
      <JoinRequestsDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        workspaceId={workspaceId}
      />
    </>
  );
}
