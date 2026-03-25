"use client";

import { Wifi, WifiOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConnectionStatusProps {
  isConnected: boolean;
  isConnecting?: boolean;
  error?: string | null;
  className?: string;
}

export function ConnectionStatus({
  isConnected,
  isConnecting = false,
  error,
  className,
}: ConnectionStatusProps) {
  if (isConnecting) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-full bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground",
          className
        )}
      >
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        <span>Connecting...</span>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-full px-3 py-1.5 text-xs",
          error
            ? "bg-destructive/10 text-destructive"
            : "bg-amber-500/10 text-amber-600 dark:text-amber-500",
          className
        )}
        title={error || "Disconnected from chat server"}
      >
        <WifiOff className="h-3.5 w-3.5" />
        <span>{error ? "Connection error" : "Disconnected"}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-600 dark:text-emerald-500",
        className
      )}
      title="Connected to chat server"
    >
      <Wifi className="h-3.5 w-3.5" />
      <span>Connected</span>
    </div>
  );
}
