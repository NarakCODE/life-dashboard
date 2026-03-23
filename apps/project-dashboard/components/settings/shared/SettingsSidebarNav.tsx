"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  settingsItemIcons,
  settingsSections,
  type SettingsItemId,
} from "@/components/settings/settings-config";

interface SettingsSidebarNavProps {
  activeItemId: SettingsItemId;
  badgeCounts?: Partial<Record<SettingsItemId, number>>;
  onSelect: (itemId: SettingsItemId) => void;
}

export function SettingsSidebarNav({
  activeItemId,
  onSelect,
  badgeCounts,
}: SettingsSidebarNavProps) {
  return (
    <aside className="w-full border-b border-border/60 bg-muted/40 px-4 py-4 sm:w-64 sm:border-b-0 sm:border-r">
      <div className="space-y-4 text-sm">
        {settingsSections.map((section) => (
          <div key={section.id} className="space-y-1.5">
            <div className="text-sm font-semibold text-muted-foreground">
              {section.label}
            </div>
            <div className="flex flex-col gap-0.5">
              {section.items.map((item) => {
                const isActive = item.id === activeItemId;
                const Icon = settingsItemIcons[item.id];
                const badgeCount = badgeCounts?.[item.id] ?? 0;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelect(item.id)}
                    className={cn(
                      "flex cursor-pointer items-center justify-between rounded-md px-2.5 py-2 text-left text-[15px] text-muted-foreground hover:bg-accent hover:text-foreground",
                      isActive && "bg-accent text-foreground",
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </span>
                    {badgeCount > 0 ? (
                      <Badge
                        variant={isActive ? "default" : "muted"}
                        className={cn(
                          "min-w-6 justify-center px-1.5 py-0 text-[11px]",
                          isActive && "bg-primary text-primary-foreground",
                        )}
                      >
                        {badgeCount > 99 ? "99+" : badgeCount}
                      </Badge>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
