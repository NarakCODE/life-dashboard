"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building, CheckCircle, XCircle } from "@phosphor-icons/react/dist/ssr";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useJoinInfoQuery, useCreateJoinRequestMutation, useWorkspaceQuery } from "@/lib/workspaces/workspace-query";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { useWorkspaceScope } from "@/lib/workspaces/use-workspace-scope";

interface JoinWorkspacePageProps {
  token: string;
}

export function JoinWorkspacePage({ token }: JoinWorkspacePageProps) {
  const router = useRouter();
  const { workspaceId: currentWorkspaceId } = useWorkspaceScope();
  const auth = useAuth();
  const [isRequesting, setIsRequesting] = useState(false);

  const { data: joinInfo, isPending, error } = useJoinInfoQuery(token);
  const { data: workspace } = useWorkspaceQuery(joinInfo?.workspaceId ?? "", {
    enabled: Boolean(joinInfo?.workspaceId) && auth.isAuthenticated,
  });
  const createJoinRequestMutation = useCreateJoinRequestMutation();

  const alreadyMember = workspace?.members.some(
    (m) => m.userId === auth.user?.id,
  ) ?? false;

  const handleJoinRequest = async () => {
    if (!auth.isAuthenticated) {
      toast.error("Please sign in to request access");
      return;
    }

    setIsRequesting(true);
    try {
      await createJoinRequestMutation.mutateAsync(token);
      toast.success("Join request sent! Please wait for admin approval.");
      // Redirect to current workspace or home
      if (currentWorkspaceId) {
        router.push(`/w/${currentWorkspaceId}`);
      } else {
        router.push("/");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to send join request";
      toast.error("Failed to send join request", {
        description: message,
      });
    } finally {
      setIsRequesting(false);
    }
  };

  if (isPending) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
            <CardTitle>Loading...</CardTitle>
            <CardDescription>Fetching workspace information</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (error || !joinInfo) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <XCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-destructive">Invalid Join Link</CardTitle>
            <CardDescription>
              This join link is invalid or has expired. Please contact the workspace administrator.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button onClick={() => router.push("/")}>
              Go to Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Building className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Join {joinInfo.workspaceName}</CardTitle>
          <CardDescription>
            You&apos;ve been invited to join this workspace via a join link.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Workspace Name</span>
              <span className="font-medium">{joinInfo.workspaceName}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Workspace Type</span>
              <span className="font-medium capitalize">{joinInfo.workspaceType}</span>
            </div>
          </div>

          {!auth.isAuthenticated ? (
            <div className="rounded-lg border border-warning/20 bg-warning/10 p-4 text-center">
              <p className="text-sm text-warning-foreground">
                Please sign in to request access to this workspace.
              </p>
            </div>
          ) : alreadyMember ? (
            <div className="rounded-lg border border-success/20 bg-success/10 p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-success">
                <CheckCircle className="h-5 w-5" />
                <p className="text-sm font-medium">You&apos;re already a member!</p>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-info/20 bg-info/10 p-4 text-center">
              <p className="text-sm text-info-foreground">
                Click the button below to send a join request. An administrator will review and approve your request.
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          {!auth.isAuthenticated ? (
            <Button className="w-full" onClick={() => router.push("/auth/sign-in")}>
              Sign In
            </Button>
          ) : alreadyMember ? (
            <Button className="w-full" onClick={() => router.push(currentWorkspaceId ? `/w/${currentWorkspaceId}` : "/")}>
              Go to Dashboard
            </Button>
          ) : (
            <Button
              className="w-full"
              onClick={handleJoinRequest}
              disabled={isRequesting || createJoinRequestMutation.isPending}
            >
              {isRequesting || createJoinRequestMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending Request...
                </>
              ) : (
                "Request to Join"
              )}
            </Button>
          )}
          <Button variant="outline" className="w-full" onClick={() => router.push("/")}>
            Cancel
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
