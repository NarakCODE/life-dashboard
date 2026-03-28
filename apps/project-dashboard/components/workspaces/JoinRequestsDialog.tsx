"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  UserCircle,
  Clock,
  CheckCircle,
  XCircle,
  Warning,
} from "@phosphor-icons/react/dist/ssr";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useJoinRequestsQuery,
  useApproveJoinRequestMutation,
  useRejectJoinRequestMutation,
} from "@/lib/workspaces/workspace-query";
import type { WorkspaceJoinRequest } from "@/lib/workspaces/workspace-types";
import { toast } from "sonner";

interface JoinRequestsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
}

export function JoinRequestsDialog({
  open,
  onOpenChange,
  workspaceId,
}: JoinRequestsDialogProps) {
  const { data: joinRequests = [], isPending, refetch } = useJoinRequestsQuery(workspaceId, {
    enabled: open,
  });
  const approveMutation = useApproveJoinRequestMutation();
  const rejectMutation = useRejectJoinRequestMutation();
  const [requestToProcess, setRequestToProcess] = useState<WorkspaceJoinRequest | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject">("approve");

  const pendingRequests = joinRequests.filter((req) => req.status === "pending");

  const handleOpenDialog = (request: WorkspaceJoinRequest, action: "approve" | "reject") => {
    setRequestToProcess(request);
    setActionType(action);
  };

  const handleCloseDialog = () => {
    setRequestToProcess(null);
  };

  const handleConfirm = async () => {
    if (!requestToProcess) return;

    try {
      if (actionType === "approve") {
        await approveMutation.mutateAsync({
          workspaceId,
          requestId: requestToProcess.id,
        });
        toast.success("Join request approved");
      } else {
        await rejectMutation.mutateAsync({
          workspaceId,
          requestId: requestToProcess.id,
        });
        toast.success("Join request rejected");
      }
      handleCloseDialog();
      refetch();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong";
      toast.error(
        actionType === "approve" ? "Failed to approve request" : "Failed to reject request",
        {
          description: message,
        }
      );
    }
  };

  const isProcessing = approveMutation.isPending || rejectMutation.isPending;

  const getStatusBadge = (status: WorkspaceJoinRequest["status"]) => {
    const badges = {
      pending: (
        <Badge variant="secondary" className="gap-1">
          <Clock className="h-3 w-3" />
          Pending
        </Badge>
      ),
      approved: (
        <Badge variant="default" className="gap-1 bg-success">
          <CheckCircle className="h-3 w-3" />
          Approved
        </Badge>
      ),
      rejected: (
        <Badge variant="secondary" className="gap-1 bg-destructive text-destructive-foreground">
          <XCircle className="h-3 w-3" />
          Rejected
        </Badge>
      ),
    };
    return badges[status];
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <UserCircle className="size-5" />
              </div>
              <div className="flex-1">
                <DialogTitle>Join Requests</DialogTitle>
                <DialogDescription>
                  Review and manage requests to join this workspace.
                </DialogDescription>
              </div>
              {pendingRequests.length > 0 && (
                <Badge variant="default" className="bg-warning text-warning-foreground">
                  {pendingRequests.length} pending
                </Badge>
              )}
            </div>
          </DialogHeader>

          <ScrollArea className="max-h-[400px] pr-4">
            <div className="space-y-4">
              {isPending && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}

              {!isPending && joinRequests.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <UserCircle className="mb-3 h-12 w-12 text-muted-foreground/50" />
                  <p className="text-sm font-medium text-muted-foreground">No join requests yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    When someone requests to join, they&apos;ll appear here.
                  </p>
                </div>
              )}

              {!isPending && joinRequests.length > 0 && (
                <>
                  {pendingRequests.length > 0 && (
                    <>
                      <div>
                        <h4 className="text-sm font-medium mb-2">Pending Requests</h4>
                        <div className="space-y-3">
                          {pendingRequests.map((request) => (
                            <RequestItem
                              key={request.id}
                              request={request}
                              getStatusBadge={getStatusBadge}
                              onApprove={() => handleOpenDialog(request, "approve")}
                              onReject={() => handleOpenDialog(request, "reject")}
                              disabled={isProcessing}
                            />
                          ))}
                        </div>
                      </div>

                      {joinRequests.some((r) => r.status !== "pending") && (
                        <>
                          <Separator />
                          <div>
                            <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                              History
                            </h4>
                            <div className="space-y-3">
                              {joinRequests
                                .filter((r) => r.status !== "pending")
                                .map((request) => (
                                  <RequestItem
                                    key={request.id}
                                    request={request}
                                    getStatusBadge={getStatusBadge}
                                    disabled
                                  />
                                ))}
                            </div>
                          </div>
                        </>
                      )}
                    </>
                  )}

                  {pendingRequests.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <CheckCircle className="mb-3 h-12 w-12 text-success/50" />
                      <p className="text-sm font-medium text-muted-foreground">
                        All caught up!
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        No pending join requests to review.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!requestToProcess} onOpenChange={handleCloseDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === "approve" ? "Approve" : "Reject"} Join Request
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === "approve" ? (
                <>
                  Are you sure you want to approve{" "}
                  <span className="font-medium text-foreground">
                    {requestToProcess?.user.displayName}
                  </span>{" "}
                  to join this workspace? They will gain access immediately.
                </>
              ) : (
                <>
                  Are you sure you want to reject{" "}
                  <span className="font-medium text-foreground">
                    {requestToProcess?.user.displayName}
                  </span>
                  &apos;s request to join? This action cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              disabled={isProcessing}
              className={
                actionType === "reject"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : undefined
              }
            >
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {actionType === "approve" ? "Approve Request" : "Reject Request"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

interface RequestItemProps {
  request: WorkspaceJoinRequest;
  getStatusBadge: (status: WorkspaceJoinRequest["status"]) => React.ReactNode;
  onApprove?: () => void;
  onReject?: () => void;
  disabled?: boolean;
}

function RequestItem({
  request,
  getStatusBadge,
  onApprove,
  onReject,
  disabled = false,
}: RequestItemProps) {
  const isPending = request.status === "pending";
  const canAct = !disabled && isPending;

  return (
    <div className="rounded-lg border border-border p-3 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <UserCircle className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium text-sm truncate">{request.user.displayName}</p>
              {getStatusBadge(request.status)}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{request.user.email}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Requested on {format(new Date(request.createdAt), "MMM d, yyyy h:mm a")}
            </p>
          </div>
        </div>
      </div>

      {canAct && (
        <>
          <Separator />
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={onReject}
            >
              <XCircle className="mr-1 h-4 w-4" />
              Reject
            </Button>
            <Button
              size="sm"
              className="flex-1 bg-success hover:bg-success/90"
              onClick={onApprove}
            >
              <CheckCircle className="mr-1 h-4 w-4" />
              Approve
            </Button>
          </div>
        </>
      )}

      {!isPending && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Warning className="h-3 w-3" />
          {request.status === "approved" ? "Approved" : "Rejected"} on{" "}
          {format(new Date(request.updatedAt), "MMM d, yyyy h:mm a")}
        </div>
      )}
    </div>
  );
}
