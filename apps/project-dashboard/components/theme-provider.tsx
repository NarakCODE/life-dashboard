"use client";

import * as React from "react";
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from "next-themes";
import {
  DEFAULT_THEME_PRESET,
  getThemePreset,
  THEME_PRESET_STORAGE_KEY,
  type ThemePreset,
} from "@/lib/theme/theme-preset";

type ThemePresetContextValue = {
  presetTheme: ThemePreset;
  setPresetTheme: (preset: ThemePreset) => void;
  isLoaded: boolean;
};

const ThemePresetContext = React.createContext<ThemePresetContextValue | null>(
  null,
);

function applyThemePreset(preset: ThemePreset) {
  document.documentElement.setAttribute("data-theme", preset);
}

function ThemePresetProvider({ children }: { children: React.ReactNode }) {
  const [presetTheme, setPresetThemeState] = React.useState<ThemePreset>(() => {
    if (typeof document === "undefined") {
      return DEFAULT_THEME_PRESET;
    }

    return getThemePreset(document.documentElement.dataset.theme);
  });
  const [isLoaded, setIsLoaded] = React.useState(false);

  React.useEffect(() => {
    let storedPreset = DEFAULT_THEME_PRESET;

    try {
      storedPreset = getThemePreset(
        window.localStorage.getItem(THEME_PRESET_STORAGE_KEY),
      );
    } catch {
      storedPreset = DEFAULT_THEME_PRESET;
    }

    setPresetThemeState(storedPreset);
    applyThemePreset(storedPreset);
    setIsLoaded(true);
  }, []);

  const setPresetTheme = (preset: ThemePreset) => {
    setPresetThemeState(preset);
    applyThemePreset(preset);

    try {
      window.localStorage.setItem(THEME_PRESET_STORAGE_KEY, preset);
    } catch {
      // Ignore storage failures and keep the in-memory theme selection.
    }
  };

  return (
    <ThemePresetContext.Provider
      value={{
        presetTheme,
        setPresetTheme,
        isLoaded,
      }}
    >
      {children}
    </ThemePresetContext.Provider>
  );
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      <ThemePresetProvider>{children}</ThemePresetProvider>
    </NextThemesProvider>
  );
}

export function useThemePreset() {
  const context = React.useContext(ThemePresetContext);

  if (!context) {
    throw new Error("useThemePreset must be used within ThemeProvider");
  }

  return context;
}
