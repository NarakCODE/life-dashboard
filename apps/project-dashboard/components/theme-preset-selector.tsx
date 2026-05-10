"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { CheckIcon, Monitor, Moon, Sun } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useThemePreset } from "@/components/theme-provider";
import {
  DEFAULT_THEME_PRESET,
  getThemePreset,
  THEME_PRESETS,
  type ThemePreset,
} from "@/lib/theme/theme-preset";
import { cn } from "@/lib/utils";

const modeOptions = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

export function ThemePresetSelector() {
  const { theme, setTheme } = useTheme();
  const { presetTheme, setPresetTheme, isLoaded } = useThemePreset();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const selectedMode = isMounted ? (theme ?? "system") : "system";
  const selectedPreset = isLoaded ? presetTheme : DEFAULT_THEME_PRESET;

  const activePreset = THEME_PRESETS.find((p) => p.value === selectedPreset);
  const activeMode = modeOptions.find((m) => m.value === selectedMode);

  const handlePresetChange = (value: ThemePreset) => {
    setPresetTheme(getThemePreset(value));
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Mode Selector */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Appearance
          </Label>
          <Badge variant="secondary" className="capitalize">
            {activeMode?.label ?? "System"}
          </Badge>
        </div>
        <Select value={selectedMode} onValueChange={(value) => setTheme(value)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select mode">
              {activeMode && (
                <span className="flex items-center gap-2">
                  <activeMode.icon className="size-4 text-muted-foreground" />
                  {activeMode.label}
                </span>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {modeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <span className="flex items-center gap-2">
                  <option.icon className="size-4 text-muted-foreground" />
                  {option.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Color Preset Selector */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Color preset
          </Label>
          <Badge variant="secondary">{activePreset?.label ?? "Default"}</Badge>
        </div>
        <Select value={selectedPreset} onValueChange={handlePresetChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select color preset">
              {activePreset && (
                <span className="flex items-center gap-2">
                  <span className="flex items-center gap-1">
                    {activePreset.swatches.slice(0, 3).map((swatch, i) => (
                      <span
                        key={i}
                        className="size-3.5 rounded-full border border-border/50 shadow-sm"
                        style={{ backgroundColor: swatch }}
                      />
                    ))}
                  </span>
                  {activePreset.label}
                </span>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="max-h-70">
            {THEME_PRESETS.map((preset) => {
              const isActive = selectedPreset === preset.value;
              return (
                <SelectItem
                  key={preset.value}
                  value={preset.value}
                  className="py-3"
                >
                  <span className="flex w-full items-center justify-between gap-4">
                    <span className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        {preset.swatches.map((swatch, i) => (
                          <span
                            key={i}
                            className={cn(
                              "size-4 rounded-full border border-border/50 shadow-sm",
                              isActive && "ring-2 ring-primary/30",
                            )}
                            style={{ backgroundColor: swatch }}
                          />
                        ))}
                      </span>
                      <span className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium">
                          {preset.label}
                        </span>
                        <span className="text-xs text-muted-foreground line-clamp-1">
                          {preset.description}
                        </span>
                      </span>
                    </span>
                    {isActive && (
                      <CheckIcon className="size-4 text-primary shrink-0" />
                    )}
                  </span>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
