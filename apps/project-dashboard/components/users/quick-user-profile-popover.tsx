"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  MailIcon,
  RefreshCcwIcon,
} from "lucide-react";
import GLightbox from "glightbox";
import "glightbox/dist/css/glightbox.css";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  prefetchUserDetails,
  useUserDetailsQuery,
} from "@/lib/users/users-query";

interface QuickUserProfilePopoverProps {
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
  children: ReactNode;
}

type LightboxController = {
  setElements(elements: Array<Record<string, unknown>>): void;
  openAt(index?: number): void;
  destroy(): void;
};

const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "U";

const formatDateTime = (value?: string | null) => {
  if (!value) return "Not available";

  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const buildAvatarIframeUrl = (imageUrl: string, displayName: string) => {
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${displayName}</title>
    <style>
      :root { color-scheme: light dark; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        width: 100vw;
        height: 100vh;
        overflow: hidden;
        background: transparent;
        font-family: ui-sans-serif, system-ui, sans-serif;
      }
      img {
        display: block;
        width: 100vw;
        height: 100vh;
        object-fit: contain;
        object-position: center;
      }
    </style>
  </head>
  <body>
    <img src="${imageUrl}" alt="${displayName}" />
  </body>
</html>`;

  return `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
};

export function QuickUserProfilePopover({
  userId,
  displayName,
  avatarUrl,
  children,
}: QuickUserProfilePopoverProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const lightboxRef = useRef<LightboxController | null>(null);

  const userQuery = useUserDetailsQuery(userId, {
    enabled: open && Boolean(userId),
  });

  const handlePrefetch = () => {
    if (!userId) return;
    void prefetchUserDetails(queryClient, userId);
  };

  const user = userQuery.data;
  const resolvedAvatarUrl = user?.avatarUrl ?? avatarUrl ?? null;

  useEffect(() => {
    lightboxRef.current = GLightbox({
      touchNavigation: true,
      loop: false,
      closeButton: true,
      selector: "",
      width: "100vw",
      height: "100vh",
    }) as LightboxController;

    return () => {
      lightboxRef.current?.destroy();
      lightboxRef.current = null;
    };
  }, []);

  const handleOpenAvatarPreview = () => {
    if (!resolvedAvatarUrl || !lightboxRef.current) return;

    lightboxRef.current.setElements([
      {
        href: buildAvatarIframeUrl(resolvedAvatarUrl, displayName),
        type: "external",
        width: "100vw",
        height: "100vh",
      },
    ]);
    lightboxRef.current.openAt(0);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        asChild
        onMouseEnter={handlePrefetch}
        onFocus={handlePrefetch}
      >
        {children}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 rounded-2xl p-0">
        <div className="space-y-4 p-4">
          {userQuery.isPending ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="size-14 rounded-full" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-44" />
                </div>
              </div>
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          ) : userQuery.isError ? (
            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-3">
                <AlertCircleIcon className="mt-0.5 size-4 text-destructive" />
                <div className="space-y-1 text-sm">
                  <p className="font-medium text-foreground">
                    Failed to load profile
                  </p>
                  <p className="text-muted-foreground">
                    The user details request did not complete.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => void userQuery.refetch()}
              >
                <RefreshCcwIcon className="size-4" />
                Retry
              </Button>
            </div>
          ) : user ? (
            <>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleOpenAvatarPreview}
                  disabled={!resolvedAvatarUrl}
                  className="rounded-full transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-default disabled:hover:scale-100"
                  aria-label={
                    resolvedAvatarUrl
                      ? `Open large profile image for ${user.displayName}`
                      : `No profile image available for ${user.displayName}`
                  }
                >
                  <Avatar className="size-14 border">
                    <AvatarImage
                      src={resolvedAvatarUrl ?? undefined}
                      alt={user.displayName}
                    />
                    <AvatarFallback className="text-sm">
                      {initials(user.displayName)}
                    </AvatarFallback>
                  </Avatar>
                </button>
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {user.displayName}
                    </p>
                    <Badge
                      variant={
                        user.status === "active" ? "secondary" : "outline"
                      }
                      className="capitalize"
                    >
                      {user.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MailIcon className="size-3.5" />
                    <span className="truncate">{user.email}</span>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 rounded-xl border bg-muted/20 p-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Roles</span>
                  <span className="text-right font-medium capitalize">
                    {user.roles.join(", ").toLowerCase()}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Email</span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 text-right font-medium",
                      user.isEmailVerified
                        ? "text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    {user.isEmailVerified ? (
                      <CheckCircle2Icon className="size-3.5 text-emerald-600" />
                    ) : null}
                    {user.isEmailVerified ? "Verified" : "Unverified"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Last login</span>
                  <span className="text-right font-medium">
                    {formatDateTime(user.lastLogin)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Joined</span>
                  <span className="text-right font-medium">
                    {formatDateTime(user.createdAt)}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-border/60 bg-muted/20 p-3 text-sm text-muted-foreground">
              No user details available for {displayName}.
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
