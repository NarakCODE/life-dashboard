"use client";

import type { ComponentType } from "react";
import {
  Bell,
  CreditCard,
  Robot,
  ShieldCheck,
  SlidersHorizontal,
  Sparkle,
  SquaresFour,
  UploadSimple,
  UserCircle,
  UsersThree,
} from "@phosphor-icons/react/dist/ssr";

export const settingsSections = [
  {
    id: "personal",
    label: "Personal",
    items: [
      { id: "account", label: "Account" },
      { id: "notifications", label: "Notifications" },
    ],
  },
  {
    id: "workspace",
    label: "Workspace",
    items: [
      { id: "preferences", label: "Preferences" },
      { id: "teammates", label: "Teammates" },
      { id: "identity", label: "Identity" },
      { id: "types", label: "Types" },
      { id: "billing", label: "Plans and billing" },
      { id: "import", label: "Import" },
    ],
  },
  {
    id: "ai",
    label: "AI",
    items: [
      { id: "agents", label: "Agents" },
      { id: "skills", label: "Skills" },
    ],
  },
] as const;

export type SettingsItemId =
  (typeof settingsSections)[number]["items"][number]["id"];

export const settingsItemIcons: Record<
  SettingsItemId,
  ComponentType<{ className?: string }>
> = {
  account: UserCircle,
  notifications: Bell,
  preferences: SlidersHorizontal,
  teammates: UsersThree,
  identity: ShieldCheck,
  types: SquaresFour,
  billing: CreditCard,
  import: UploadSimple,
  agents: Robot,
  skills: Sparkle,
};
