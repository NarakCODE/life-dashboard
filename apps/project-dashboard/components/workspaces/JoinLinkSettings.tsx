"use client";

import { useState } from "react";
import { Copy, Check, Link as LinkIcon, ToggleLeft, ToggleRight } from "@phosphor-icons/react/dist/ssr";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  useJoinLinkQuery,
  useCreateJoinLinkMutation,
  useUpdateJoinLinkMutation,
} from "@/lib/workspaces/workspace-query";
import { toast } from "sonner";
import { getApiBaseUrl } from "@/lib/api/api-utils";

interface JoinLinkSettingsProps {
  workspaceId: string;
}

export function JoinLinkSettings({ workspaceId }: JoinLinkSettingsProps) {
  const [copied, setCopied] = useState(false);
  const { data: joinLink, isPending, error } = useJoinLinkQuery(workspaceId);
  const createJoinLinkMutation = useCreateJoinLinkMutation();
  const updateJoinLinkMutation = useUpdateJoinLinkMutation();

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

  const isUpdating = updateJoinLinkMutation.isPending;
  const isCreating = createJoinLinkMutation.isPending;

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

  if (isPending || !joinLink) {
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
            disabled={isUpdating}
          />
        </div>

        {joinLink.isEnabled && (
          <>
            <div className="rounded-lg border border-border p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">Your Join Link</p>
                  <p className="text-xs text-muted-foreground truncate font-mono">
                    {`${getApiBaseUrl()}/workspaces/join/${joinLink.token}`}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyLink}
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

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="flex-1"
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
            </div>
          </>
        )}

        {!joinLink.isEnabled && (
          <div className="rounded-lg border border-warning/20 bg-warning/10 p-4 text-center">
            <p className="text-sm text-warning-foreground">
              Enable the join link to allow people to request access.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
