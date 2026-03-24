"use client";

import { useEffect, useMemo, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { XIcon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { SettingsSidebarNav } from "@/components/settings/shared/SettingsSidebarNav";
import { SettingsItemId } from "@/components/settings/settings-config";
import { AccountSettingsPane } from "@/components/settings/panels/AccountSettingsPane";
import { NotificationsSettingsPane } from "@/components/settings/panels/NotificationsSettingsPane";
import { PreferencesSettingsPane } from "@/components/settings/panels/PreferencesSettingsPane";
import { TeammatesSettingsPane } from "@/components/settings/panels/TeammatesSettingsPane";
import { IdentitySettingsPane } from "@/components/settings/panels/IdentitySettingsPane";
import { TypesSettingsPane } from "@/components/settings/panels/TypesSettingsPane";
import { BillingSettingsPane } from "@/components/settings/panels/BillingSettingsPane";
import { ImportSettingsPane } from "@/components/settings/panels/ImportSettingsPane";
import { AgentsSettingsPane } from "@/components/settings/panels/AgentsSettingsPane";
import { SkillsSettingsPane } from "@/components/settings/panels/SkillsSettingsPane";
import { PlaceholderSettingsPane } from "@/components/settings/panels/PlaceholderSettingsPane";
import { Dialog } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  useMyInvitationsQuery,
  useWorkspaceInvitationsQuery,
} from "@/lib/workspaces/workspace-query";
import { useWorkspaceScope } from "@/lib/workspaces/use-workspace-scope";

type SettingsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialItemId?: SettingsItemId;
};

export function SettingsDialog({
  open,
  onOpenChange,
  initialItemId = "account",
}: SettingsDialogProps) {
  const [activeItemId, setActiveItemId] =
    useState<SettingsItemId>(initialItemId);

  // Update active item when initialItemId changes and dialog opens
  useEffect(() => {
    if (open) {
      setActiveItemId(initialItemId);
    }
  }, [open, initialItemId]);

  const { workspaceContext, workspaceId } = useWorkspaceScope();
  const canManageInvitations =
    workspaceContext?.role === "OWNER" || workspaceContext?.role === "ADMIN";

  const myInvitationsQuery = useMyInvitationsQuery({
    enabled: open && Boolean(workspaceId),
  });

  const workspaceInvitationsQuery = useWorkspaceInvitationsQuery(
    workspaceId ?? "",
    {
      enabled: open && Boolean(workspaceId) && canManageInvitations,
    }
  );

  const teammatesBadgeCount = useMemo(() => {
    const myInvitationCount = myInvitationsQuery.data?.length ?? 0;
    const workspaceInvitationCount = canManageInvitations
      ? workspaceInvitationsQuery.data?.length ?? 0
      : 0;
    return myInvitationCount + workspaceInvitationCount;
  }, [
    canManageInvitations,
    myInvitationsQuery.data?.length,
    workspaceInvitationsQuery.data?.length,
  ]);

  const renderContent = () => {
    switch (activeItemId) {
      case "account":
        return <AccountSettingsPane />;
      case "notifications":
        return <NotificationsSettingsPane />;
      case "preferences":
        return <PreferencesSettingsPane />;
      case "teammates":
        return <TeammatesSettingsPane />;
      case "identity":
        return <IdentitySettingsPane />;
      case "types":
        return <TypesSettingsPane />;
      case "billing":
        return <BillingSettingsPane />;
      case "import":
        return <ImportSettingsPane />;
      case "agents":
        return <AgentsSettingsPane />;
      case "skills":
        return <SkillsSettingsPane />;
      default:
        return <PlaceholderSettingsPane />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-black/40 backdrop-blur-sm",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-[50%] top-[50%] z-50 w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 outline-none",
            "sm:w-[calc(100%-3rem)] md:max-w-4xl"
          )}
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "relative overflow-hidden rounded-2xl bg-background shadow-2xl",
              "border border-border/60",
              "h-[calc(100vh-3rem)] max-h-[680px] min-h-[480px]"
            )}
          >
            {/* Close button */}
            <DialogPrimitive.Close
              className={cn(
                "absolute right-3 top-3 z-50 rounded-lg p-2",
                "text-muted-foreground opacity-70",
                "transition-all duration-200",
                "hover:opacity-100 hover:bg-accent hover:text-foreground",
                "focus:outline-none focus:ring-2 focus:ring-ring"
              )}
            >
              <XIcon className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>

            {/* Main layout: sidebar + content */}
            <div className="flex h-full flex-col sm:flex-row">
              {/* Sidebar */}
              <aside
                className={cn(
                  "shrink-0 border-b border-border/50 bg-muted/30",
                  "sm:w-60 sm:border-b-0 sm:border-r lg:w-64"
                )}
              >
                {/* Desktop header */}
                <div className="hidden border-b border-border/50 px-4 py-4 sm:block">
                  <h2 className="text-sm font-semibold text-foreground">
                    Settings
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Manage your preferences
                  </p>
                </div>
                {/* Navigation */}
                <div className="overflow-x-auto overflow-y-hidden px-2 py-2 sm:h-[calc(100%-60px)] sm:overflow-x-hidden sm:overflow-y-auto sm:px-3 sm:py-3">
                  <SettingsSidebarNav
                    activeItemId={activeItemId}
                    badgeCounts={{ teammates: teammatesBadgeCount }}
                    onSelect={setActiveItemId}
                  />
                </div>
              </aside>

              {/* Content area */}
              <main className="flex-1 overflow-y-auto bg-background">
                <div className="px-5 py-5 sm:px-8 sm:py-8">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={activeItemId}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                    >
                      {renderContent()}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </main>
            </div>
          </motion.div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </Dialog>
  );
}
