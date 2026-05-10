"use client";

import { useState, useTransition, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProgressCircle } from "@/components/progress-circle";
import {
  MagnifyingGlassIcon,
  TrayIcon,
  CheckSquareIcon,
  FolderIcon,
  UsersIcon,
  UsersThreeIcon,
  CurrencyDollarIcon,
  CreditCardIcon,
  ChartBarIcon,
  BellIcon,
  NotebookIcon,
  GearIcon,
  LayoutIcon,
  QuestionIcon,
  SignOutIcon,
  CaretRightIcon,
  HouseIcon,
  TargetIcon,
  FlagIcon,
} from "@phosphor-icons/react/dist/ssr";
import {
  footerItems,
  navItems,
  getProjectColor,
  calculateProjectProgress,
  type NavItemId,
  type SidebarFooterItemId,
} from "@/lib/data/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { SettingsDialog } from "@/components/settings/SettingsDialog";
import { NotificationsDropdown } from "@/components/notifications/NotificationsDropdown";
import { WorkspaceCombobox } from "@/components/workspaces/workspace-combobox";
import { ManageWorkspaceDialog } from "@/components/workspaces/ManageWorkspaceDialog";
import type { SettingsItemId } from "@/components/settings/settings-config";
import { useUnreadNotificationCountQuery } from "@/lib/notifications/notifications-query";
import {
  useWorkspacesQuery,
  useSwitchWorkspaceMutation,
} from "@/lib/workspaces/workspace-query";
import { useProjectsQuery } from "@/lib/projects/projects-query";
import {
  buildWorkspacePath,
  getWorkspaceChildPath,
  replaceWorkspaceInPath,
} from "@/lib/workspaces/workspace-routing";
import { useWorkspaceScope } from "@/lib/workspaces/use-workspace-scope";
import { toast } from "sonner";

const navItemIcons: Record<
  NavItemId,
  React.ComponentType<{ className?: string }>
> = {
  dashboard: HouseIcon,
  inbox: TrayIcon,
  "my-tasks": CheckSquareIcon,
  projects: FolderIcon,
  clients: UsersIcon,
  members: UsersThreeIcon,
  budgets: CurrencyDollarIcon,
  transactions: CreditCardIcon,
  notifications: BellIcon,
  performance: ChartBarIcon,
  habits: TargetIcon,
  "habit-logs": TargetIcon,
  journal: NotebookIcon,
  goals: FlagIcon,
  issues: FlagIcon,
};

const footerItemIcons: Record<
  SidebarFooterItemId,
  React.ComponentType<{ className?: string }>
> = {
  settings: GearIcon,
  templates: LayoutIcon,
  help: QuestionIcon,
};

export function AppSidebar() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const router = useRouter();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] =
    useState<SettingsItemId>("account");
  const [isLoggingOut, startLogout] = useTransition();

  // Quick create workspace dialog state (for sidebar shortcut)
  const [isCreateWorkspaceOpen, setIsCreateWorkspaceOpen] = useState(false);

  const { workspaceId: currentWorkspaceId, routeWorkspaceId } =
    useWorkspaceScope();
  const activeWorkspaceId = currentWorkspaceId;

  // Workspace data fetching
  const { data: workspaces = [], isLoading: isLoadingWorkspaces } =
    useWorkspacesQuery();

  // Active projects data fetching
  const { data: projects = [], isLoading: isLoadingProjects } =
    useProjectsQuery(activeWorkspaceId ?? "", Boolean(activeWorkspaceId));

  // Filter active projects and map to sidebar format
  const activeProjects = projects
    .filter((p) => p.status === "active")
    .slice(0, 5) // Limit to 5 most active projects
    .map((p) => ({
      id: p.id,
      name: p.name,
      color: getProjectColor(p.id),
      progress: calculateProjectProgress(p.id),
    }));

  const switchWorkspace = useSwitchWorkspaceMutation();
  const unreadNotificationsQuery = useUnreadNotificationCountQuery(
    activeWorkspaceId ?? "",
    Boolean(activeWorkspaceId),
  );
  const scopedPathname = getWorkspaceChildPath(
    pathname,
    routeWorkspaceId ?? currentWorkspaceId,
  );

  const handleWorkspaceSelect = useCallback(
    async (workspace: { id: string; name: string }) => {
      if (workspace.id === activeWorkspaceId) return;

      try {
        await switchWorkspace.mutateAsync(workspace.id);

        if (activeWorkspaceId) {
          await queryClient.cancelQueries({
            queryKey: ["workspace", activeWorkspaceId],
          });
          queryClient.removeQueries({
            queryKey: ["workspace", activeWorkspaceId],
          });
        }

        toast.success(`Switched to ${workspace.name}`);
        router.push(
          replaceWorkspaceInPath(
            pathname,
            workspace.id,
            routeWorkspaceId ?? activeWorkspaceId,
          ),
        );
      } catch {
        toast.error("Failed to switch workspace");
      }
    },
    [
      activeWorkspaceId,
      pathname,
      queryClient,
      routeWorkspaceId,
      router,
      switchWorkspace,
    ],
  );

  const handleCreateWorkspace = useCallback(() => {
    setIsCreateWorkspaceOpen(true);
  }, []);

  const handleManageWorkspaces = useCallback(() => {
    // Open Settings dialog on Preferences tab
    setSettingsInitialTab("preferences");
    setIsSettingsOpen(true);
  }, []);

  const getHrefForNavItem = (id: NavItemId): string => {
    if (!currentWorkspaceId) return "#";

    if (id === "dashboard") return buildWorkspacePath(currentWorkspaceId);
    if (id === "my-tasks")
      return buildWorkspacePath(currentWorkspaceId, "/tasks");
    if (id === "projects")
      return buildWorkspacePath(currentWorkspaceId, "/projects");
    if (id === "issues")
      return buildWorkspacePath(currentWorkspaceId, "/issues");
    if (id === "inbox") return buildWorkspacePath(currentWorkspaceId, "/inbox");
    if (id === "clients")
      return buildWorkspacePath(currentWorkspaceId, "/clients");
    if (id === "members")
      return buildWorkspacePath(currentWorkspaceId, "/members");
    if (id === "budgets")
      return buildWorkspacePath(currentWorkspaceId, "/budgets");
    if (id === "transactions")
      return buildWorkspacePath(currentWorkspaceId, "/transactions");
    if (id === "notifications")
      return buildWorkspacePath(currentWorkspaceId, "/notifications");
    if (id === "performance")
      return buildWorkspacePath(currentWorkspaceId, "/performance");
    if (id === "habits")
      return buildWorkspacePath(currentWorkspaceId, "/habits");
    if (id === "habit-logs")
      return buildWorkspacePath(currentWorkspaceId, "/habit-logs");
    if (id === "journal")
      return buildWorkspacePath(currentWorkspaceId, "/journal");
    if (id === "goals") return buildWorkspacePath(currentWorkspaceId, "/goals");

    return "#";
  };

  const isItemActive = (id: NavItemId): boolean => {
    if (id === "dashboard") {
      return scopedPathname === "/";
    }
    if (id === "projects") {
      return scopedPathname.startsWith("/projects");
    }
    if (id === "issues") {
      return scopedPathname.startsWith("/issues");
    }
    if (id === "my-tasks") {
      return scopedPathname.startsWith("/tasks");
    }
    if (id === "inbox") {
      return scopedPathname.startsWith("/inbox");
    }
    if (id === "clients") {
      return scopedPathname.startsWith("/clients");
    }
    if (id === "members") {
      return scopedPathname.startsWith("/members");
    }
    if (id === "budgets") {
      return scopedPathname.startsWith("/budgets");
    }
    if (id === "transactions") {
      return scopedPathname.startsWith("/transactions");
    }
    if (id === "notifications") {
      return scopedPathname.startsWith("/notifications");
    }
    if (id === "performance") {
      return scopedPathname.startsWith("/performance");
    }
    if (id === "habits") {
      return scopedPathname.startsWith("/habits");
    }
    if (id === "habit-logs") {
      return scopedPathname.startsWith("/habit-logs");
    }
    if (id === "journal") {
      return scopedPathname.startsWith("/journal");
    }
    if (id === "goals") {
      return scopedPathname.startsWith("/goals");
    }

    return false;
  };

  return (
    <Sidebar className="border-border/40 border-r-0 shadow-none border-none">
      <SidebarHeader>
        <WorkspaceCombobox
          workspaces={workspaces}
          selectedId={activeWorkspaceId}
          userActiveWorkspaceId={auth.user?.activeWorkspaceId}
          onSelect={handleWorkspaceSelect}
          onCreateNew={handleCreateWorkspace}
          onManageWorkspaces={handleManageWorkspaces}
          isLoading={isLoadingWorkspaces}
          disabled={switchWorkspace.isPending}
        />

        <ManageWorkspaceDialog
          open={isCreateWorkspaceOpen}
          onOpenChange={setIsCreateWorkspaceOpen}
          onCreateSuccess={(workspace) => {
            toast.success(`Created workspace "${workspace.name}"`);
            void handleWorkspaceSelect(workspace);
          }}
        />
      </SidebarHeader>

      <SidebarContent className="px-0 gap-0">
        <SidebarGroup>
          <div className="relative px-0 py-0">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search"
              className="h-9 rounded-lg bg-muted/50 pl-8 text-sm placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary/20 border-border border shadow-none"
            />
            <kbd className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
              <span className="text-xs">⌘</span>K
            </kbd>
          </div>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const href = getHrefForNavItem(item.id);
                const active = isItemActive(item.id);
                const badgeCount =
                  item.id === "inbox"
                    ? (unreadNotificationsQuery.data?.count ?? 0)
                    : (item.badge ?? 0);

                return (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      className="h-9 rounded-lg px-3 font-normal text-muted-foreground"
                    >
                      <Link href={href}>
                        {(() => {
                          const Icon = navItemIcons[item.id];
                          return Icon ? <Icon className="h-4.5 w-4.5" /> : null;
                        })()}
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                    {badgeCount > 0 && (
                      <SidebarMenuBadge className="bg-muted text-muted-foreground rounded-full px-2">
                        {badgeCount > 99 ? "99+" : badgeCount}
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-xs font-medium text-muted-foreground">
            Active Projects
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {isLoadingProjects ? (
                // Loading skeleton
                <>
                  {[1, 2, 3].map((i) => (
                    <SidebarMenuItem key={i}>
                      <div className="flex h-9 items-center gap-3 px-3">
                        <div className="h-4.5 w-4.5 rounded-full bg-muted animate-pulse" />
                        <div className="h-4 flex-1 bg-muted animate-pulse rounded" />
                      </div>
                    </SidebarMenuItem>
                  ))}
                </>
              ) : activeProjects.length === 0 ? (
                <SidebarMenuItem>
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    No active projects
                  </div>
                </SidebarMenuItem>
              ) : (
                activeProjects.map((project) => (
                  <SidebarMenuItem key={project.id}>
                    <SidebarMenuButton
                      asChild
                      className="h-9 rounded-lg px-3 group"
                    >
                      <Link
                        href={buildWorkspacePath(
                          currentWorkspaceId ?? "",
                          `/projects/${project.id}`,
                        )}
                      >
                        <ProgressCircle
                          progress={project.progress}
                          color={project.color}
                          size={18}
                        />
                        <span className="flex-1 truncate text-sm">
                          {project.name}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/40 p-2">
        <div className="mb-2 flex items-center justify-end">
          <NotificationsDropdown workspaceId={activeWorkspaceId} />
        </div>

        <SidebarMenu>
          {footerItems.map((item) => (
            <SidebarMenuItem key={item.label}>
              <SidebarMenuButton
                className="h-9 rounded-lg px-3 text-muted-foreground"
                onClick={() => {
                  if (item.id === "settings") {
                    setIsSettingsOpen(true);
                  }
                }}
              >
                {(() => {
                  const Icon = footerItemIcons[item.id];
                  return Icon ? <Icon className="h-4.5 w-4.5" /> : null;
                })()}
                <span>{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="mt-2 flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-accent cursor-pointer"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src="/avatar-profile.jpg" />
                <AvatarFallback>
                  {auth.user?.displayName
                    ?.split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-1 flex-col">
                <span className="text-sm font-medium">
                  {auth.user?.displayName ?? "Workspace User"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {auth.user?.email ?? "Loading..."}
                </span>
              </div>
              <CaretRightIcon className="h-4 w-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="end" className="w-40">
            <DropdownMenuItem
              className="cursor-pointer text-destructive focus:text-destructive"
              disabled={isLoggingOut}
              onSelect={() => {
                startLogout(() => {
                  void auth.logout();
                });
              }}
            >
              <SignOutIcon className="h-4 w-4" />
              {isLoggingOut ? "Logging out..." : "Logout"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>

      <SettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        initialItemId={settingsInitialTab}
      />
    </Sidebar>
  );
}
