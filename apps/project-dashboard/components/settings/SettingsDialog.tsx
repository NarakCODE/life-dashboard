"use client";

import { useMemo, useState } from "react";

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
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  useMyInvitationsQuery,
  useWorkspaceInvitationsQuery,
} from "@/lib/workspaces/workspace-query";
import { useWorkspaceScope } from "@/lib/workspaces/use-workspace-scope";

type SettingsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [activeItemId, setActiveItemId] = useState<SettingsItemId>("account");
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
    },
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="h-[85vh] w-full overflow-hidden rounded-3xl p-0 sm:max-h-[85vh] sm:max-w-5xl"
      >
        <div className="flex h-full flex-col sm:flex-row sm:min-h-0">
          <SettingsSidebarNav
            activeItemId={activeItemId}
            badgeCounts={{ teammates: teammatesBadgeCount }}
            onSelect={setActiveItemId}
          />

          <main className="min-h-0 flex-1 overflow-y-auto px-6 py-6 sm:min-h-0">
            {activeItemId === "account" && <AccountSettingsPane />}
            {activeItemId === "notifications" && <NotificationsSettingsPane />}
            {activeItemId === "preferences" && <PreferencesSettingsPane />}
            {activeItemId === "teammates" && <TeammatesSettingsPane />}
            {activeItemId === "identity" && <IdentitySettingsPane />}
            {activeItemId === "types" && <TypesSettingsPane />}
            {activeItemId === "billing" && <BillingSettingsPane />}
            {activeItemId === "import" && <ImportSettingsPane />}
            {activeItemId === "agents" && <AgentsSettingsPane />}
            {activeItemId === "skills" && <SkillsSettingsPane />}
            {activeItemId !== "account" &&
              activeItemId !== "notifications" &&
              activeItemId !== "preferences" &&
              activeItemId !== "teammates" &&
              activeItemId !== "identity" &&
              activeItemId !== "types" &&
              activeItemId !== "billing" &&
              activeItemId !== "import" &&
              activeItemId !== "agents" &&
              activeItemId !== "skills" && <PlaceholderSettingsPane />}
          </main>
        </div>
      </DialogContent>
    </Dialog>
  );
}
