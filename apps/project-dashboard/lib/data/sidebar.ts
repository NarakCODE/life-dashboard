export type NavItemId =
  | "dashboard"
  | "inbox"
  | "my-tasks"
  | "projects"
  | "clients"
  | "budgets"
  | "transactions"
  | "notifications"
  | "performance"
  | "habits"
  | "habit-logs"
  | "journal"
  | "goals"
  | "chat"
  | "chats";

export type SidebarFooterItemId = "settings" | "templates" | "help";

export type NavItem = {
  id: NavItemId;
  label: string;
  badge?: number;
  isActive?: boolean;
};

export type SidebarFooterItem = {
  id: SidebarFooterItemId;
  label: string;
};

export const navItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", isActive: true },
  { id: "inbox", label: "Inbox" },
  { id: "my-tasks", label: "My task" },
  { id: "projects", label: "Projects" },
  { id: "clients", label: "Clients" },
  { id: "budgets", label: "Budgets" },
  { id: "transactions", label: "Transactions" },
  { id: "notifications", label: "Notifications" },
  { id: "performance", label: "Performance" },
  { id: "habits", label: "Habits" },
  { id: "habit-logs", label: "Habit Logs" },
  { id: "journal", label: "Journal" },
  { id: "goals", label: "Goals" },
  { id: "chat", label: "Chat" },
  { id: "chats", label: "Chats" },
];

export const footerItems: SidebarFooterItem[] = [
  { id: "settings", label: "Settings" },
  { id: "templates", label: "Templates" },
  { id: "help", label: "Help" },
];

// Color palette for project indicators (CSS variable names)
const PROJECT_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
] as const;

/**
 * Generate a consistent color for a project based on its ID
 */
export function getProjectColor(projectId: string): string {
  // Simple hash function to get consistent color for same project ID
  let hash = 0;
  for (let i = 0; i < projectId.length; i++) {
    hash = projectId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash % PROJECT_COLORS.length);
  return PROJECT_COLORS[index] ?? "var(--chart-1)";
}

/**
 * Calculate project progress from tasks (placeholder - should come from backend)
 * For now, returns a deterministic value based on project ID
 */
export function calculateProjectProgress(projectId: string): number {
  // This should be replaced with actual progress calculation from tasks
  // For now, generate a deterministic progress based on project ID
  let hash = 0;
  for (let i = 0; i < projectId.length; i++) {
    hash = projectId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 101; // 0-100
}
