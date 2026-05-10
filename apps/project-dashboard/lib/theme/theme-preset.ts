export const THEME_PRESET_STORAGE_KEY = "project-dashboard:theme-preset";

export const THEME_PRESETS = [
  {
    value: "default",
    label: "Default",
    description: "Balanced blue accent",
    swatches: [
      "oklch(0.995 0 0)",
      "oklch(0.43 0.215 254.5)",
      "oklch(0.96 0 0)",
      "oklch(0.99 0 0)",
    ],
  },
  {
    value: "slate",
    label: "Slate",
    description: "Cool muted slate",
    swatches: [
      "oklch(0.985 0.004 255)",
      "oklch(0.53 0.07 255)",
      "oklch(0.96 0.01 255)",
      "oklch(0.97 0.006 255)",
    ],
  },
  {
    value: "zinc",
    label: "Zinc",
    description: "Soft graphite neutral",
    swatches: [
      "oklch(0.985 0.003 286)",
      "oklch(0.52 0.02 286)",
      "oklch(0.96 0.006 286)",
      "oklch(0.97 0.004 286)",
    ],
  },
  {
    value: "stone",
    label: "Stone",
    description: "Warm mineral neutral",
    swatches: [
      "oklch(0.99 0.004 75)",
      "oklch(0.56 0.03 65)",
      "oklch(0.97 0.008 75)",
      "oklch(0.98 0.006 75)",
    ],
  },
  {
    value: "blue",
    label: "Blue",
    description: "Bright product blue",
    swatches: [
      "oklch(0.995 0 0)",
      "oklch(0.5 0.22 259)",
      "oklch(0.95 0.03 250)",
      "oklch(0.98 0.01 250)",
    ],
  },
  {
    value: "green",
    label: "Light Green",
    description: "Soft lime with cool contrast",
    swatches: [
      "oklch(0.9892 0.0054 117.9205)",
      "oklch(0.8871 0.2122 128.5041)",
      "oklch(0.9819 0.0181 155.8263)",
      "oklch(1 0 0)",
    ],
  },
  {
    value: "orange",
    label: "Orange",
    description: "Vibrant amber orange",
    swatches: [
      "oklch(0.995 0 0)",
      "oklch(0.64 0.17 50)",
      "oklch(0.97 0.03 55)",
      "oklch(0.985 0.015 55)",
    ],
  },
  {
    value: "rose",
    label: "Rose",
    description: "Warm rose accent",
    swatches: [
      "oklch(0.995 0 0)",
      "oklch(0.63 0.2 18)",
      "oklch(0.97 0.03 20)",
      "oklch(0.985 0.015 20)",
    ],
  },
  {
    value: "violet",
    label: "Violet",
    description: "Electric violet accent",
    swatches: [
      "oklch(0.995 0 0)",
      "oklch(0.58 0.22 300)",
      "oklch(0.96 0.03 300)",
      "oklch(0.98 0.015 300)",
    ],
  },
] as const;

export type ThemePreset = (typeof THEME_PRESETS)[number]["value"];

export const DEFAULT_THEME_PRESET: ThemePreset = "default";

const themePresetValues = new Set<ThemePreset>(
  THEME_PRESETS.map((preset) => preset.value),
);

export function isThemePreset(
  value: string | null | undefined,
): value is ThemePreset {
  return (
    value !== null &&
    value !== undefined &&
    themePresetValues.has(value as ThemePreset)
  );
}

export function getThemePreset(value: string | null | undefined): ThemePreset {
  return isThemePreset(value) ? value : DEFAULT_THEME_PRESET;
}

export const themePresetScript = `(() => {
  const storageKey = ${JSON.stringify(THEME_PRESET_STORAGE_KEY)};
  const defaultPreset = ${JSON.stringify(DEFAULT_THEME_PRESET)};
  const themePresets = ${JSON.stringify(THEME_PRESETS.map((preset) => preset.value))};

  try {
    const storedPreset = window.localStorage.getItem(storageKey);
    const nextPreset = themePresets.includes(storedPreset ?? "") ? storedPreset : defaultPreset;
    document.documentElement.setAttribute("data-theme", nextPreset);
  } catch (error) {
    document.documentElement.setAttribute("data-theme", defaultPreset);
  }
})();`;
