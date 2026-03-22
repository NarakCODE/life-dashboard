"use client";

import { cn } from "@/lib/utils";

export type InlineInviteFeedback = {
  tone: "success" | "error" | "info";
  message: string;
};

export function InlineFeedbackBanner({
  feedback,
}: {
  feedback: InlineInviteFeedback;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-3 py-2 text-sm",
        feedback.tone === "success" &&
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
        feedback.tone === "error" &&
          "border-destructive/30 bg-destructive/10 text-destructive",
        feedback.tone === "info" &&
          "border-border bg-muted/40 text-foreground",
      )}
    >
      {feedback.message}
    </div>
  );
}
