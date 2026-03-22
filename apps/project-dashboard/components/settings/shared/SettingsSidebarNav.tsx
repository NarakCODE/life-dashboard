"use client";

import { cn } from "@/lib/utils";
import {
  settingsItemIcons,
  settingsSections,
  type SettingsItemId,
} from "@/components/settings/settings-config";

export function SettingsSidebarNav({
  activeItemId,
  onSelect,
}: {
  activeItemId: SettingsItemId;
  onSelect: (itemId: SettingsItemId) => void;
}) {
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
