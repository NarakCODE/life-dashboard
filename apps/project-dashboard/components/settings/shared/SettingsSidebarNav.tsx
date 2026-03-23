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
    <aside className="flex w-full flex-col border-b border-border/60 bg-muted/60 sm:h-full sm:w-[280px] sm:border-b-0 sm:border-r">
      <div className="flex-1 space-y-6 px-3 py-4 text-sm sm:px-4 sm:py-5">
        {settingsSections.map((section) => (
          <div key={section.id} className="space-y-1.5">
            <div className="px-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/80">
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
                      "flex cursor-pointer items-center justify-between rounded-xl px-2.5 py-2.5 text-left text-[15px] text-muted-foreground transition-colors hover:bg-background/70 hover:text-foreground",
                      isActive && "bg-background text-foreground shadow-sm ring-1 ring-border/60",
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <Icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </span>
                    {badgeCount > 0 ? (
                      <Badge
                        variant={isActive ? "default" : "muted"}
                        className={cn(
                          "min-w-6 justify-center rounded-full px-1.5 py-0 text-[11px]",
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
