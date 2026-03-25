"use client";

import { useState } from "react";
import { Settings, Clock, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  useChatConfigQuery,
  useUpdateChatConfigMutation,
} from "@/lib/chat/chat-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ChatAutoDeleteSettingsProps {
  workspaceId: string;
}

const AUTO_DELETE_OPTIONS = [
  { value: "off", label: "Off", description: "Messages never auto-delete" },
  { value: "1h", label: "1 hour", description: "Delete after 1 hour" },
  { value: "1d", label: "24 hours", description: "Delete after 1 day" },
  { value: "7d", label: "7 days", description: "Delete after 1 week" },
  { value: "30d", label: "30 days", description: "Delete after 1 month" },
] as const;

export function ChatAutoDeleteSettings({
  workspaceId,
}: ChatAutoDeleteSettingsProps) {
  const [open, setOpen] = useState(false);

  const { data: config, isLoading } = useChatConfigQuery(workspaceId);
  const updateMutation = useUpdateChatConfigMutation(workspaceId);

  const handleSelectPreset = (preset: string) => {
    updateMutation.mutate(
      { autoDeletePreset: preset as any },
      {
        onSuccess: () => {
          toast.success("Auto-delete settings updated");
          setOpen(false);
        },
        onError: () => {
          toast.error("Failed to update settings");
        },
      },
    );
  };

  const currentOption = AUTO_DELETE_OPTIONS.find(
    (opt) => opt.value === config?.autoDeletePreset,
  );

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Settings className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <div className="px-2 py-2">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-sm">Auto-delete messages</span>
          </div>

          {isLoading ? (
            <div className="space-y-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-10 w-full animate-pulse rounded bg-muted"
                />
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {AUTO_DELETE_OPTIONS.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => handleSelectPreset(option.value)}
                  className={cn(
                    "flex flex-col items-start gap-1 p-3 cursor-pointer",
                    config?.autoDeletePreset === option.value && "bg-accent",
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium text-sm">{option.label}</span>
                    {config?.autoDeletePreset === option.value && (
                      <Check className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {option.description}
                  </span>
                </DropdownMenuItem>
              ))}
            </div>
          )}

          <DropdownMenuSeparator />

          <div className="px-3 py-2 text-xs text-muted-foreground">
            <p>
              Messages will be automatically deleted based on the selected
              duration.
            </p>
            <p className="mt-1">
              This setting applies to all channels in this workspace.
            </p>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
