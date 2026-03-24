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
    <nav className="flex min-w-max flex-row gap-1 sm:flex-col sm:gap-6">
      {settingsSections.map((section) => (
        <div key={section.id} className="flex flex-row items-center gap-1 sm:flex-col sm:items-stretch sm:gap-1">
          {/* Section label - hidden on mobile, visible on desktop */}
          <div className="hidden px-2.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/70 sm:block">
            {section.label}
          </div>
          
          {/* Items */}
          <div className="flex flex-row gap-1 sm:flex-col">
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
                    "flex items-center justify-between gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm transition-all",
                    "text-muted-foreground hover:bg-background hover:text-foreground",
                    "sm:px-2.5 sm:py-2 sm:text-[15px]",
                    isActive && [
                      "bg-background text-foreground shadow-sm",
                      "ring-1 ring-border/60",
                    ]
                  )}
                >
                  <span className="flex items-center gap-2">
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="hidden sm:inline">{item.label}</span>
                    {/* Mobile: show label inline */}
                    <span className="text-xs sm:hidden">{item.label}</span>
                  </span>
                  {badgeCount > 0 ? (
                    <Badge
                      variant={isActive ? "default" : "muted"}
                      className={cn(
                        "ml-1 min-w-5 justify-center rounded-full px-1.5 py-0 text-[10px]",
                        "sm:min-w-6 sm:text-[11px]",
                        isActive && "bg-primary text-primary-foreground"
                      )}
                    >
                      {badgeCount > 99 ? "99+" : badgeCount}
                    </Badge>
                  ) : null}
                </button>
              );
            })}
          </div>
          
          {/* Divider between sections on mobile */}
          <div className="mx-1 h-6 w-px bg-border/50 sm:hidden last:hidden" />
        </div>
      ))}
    </nav>
  );
}
