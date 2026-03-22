"use client";

import { useState, useTransition, useCallback } from "react";
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
  ChartBarIcon,
  GearIcon,
  LayoutIcon,
  QuestionIcon,
  SignOutIcon,
  CaretRightIcon,
  HouseIcon,
} from "@phosphor-icons/react/dist/ssr";
import {
  activeProjects,
  footerItems,
  navItems,
  type NavItemId,
  type SidebarFooterItemId,
} from "@/lib/data/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { SettingsDialog } from "@/components/settings/SettingsDialog";
import { WorkspaceCombobox } from "@/components/workspaces/workspace-combobox";
import {
  useWorkspacesQuery,
  useSwitchWorkspaceMutation,
  useWorkspaceContextQuery,
} from "@/lib/workspaces/workspace-query";
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
  performance: ChartBarIcon,
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
  const pathname = usePathname();
  const router = useRouter();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoggingOut, startLogout] = useTransition();

  // Workspace data fetching
  const { data: workspaces = [], isLoading: isLoadingWorkspaces } =
    useWorkspacesQuery();
  const { data: workspaceContext } = useWorkspaceContextQuery();
  const switchWorkspace = useSwitchWorkspaceMutation();

  const activeWorkspaceId = workspaceContext?.activeWorkspaceId;

  const handleWorkspaceSelect = useCallback(
    async (workspace: { id: string; name: string }) => {
      if (workspace.id === activeWorkspaceId) return;

      try {
        await switchWorkspace.mutateAsync(workspace.id);
        toast.success(`Switched to ${workspace.name}`);
        // Refresh the page to reload data with new workspace context
        router.refresh();
      } catch {
        toast.error("Failed to switch workspace");
      }
    },
    [activeWorkspaceId, switchWorkspace, router],
  );

  const handleCreateWorkspace = useCallback(() => {
    // TODO: Open create workspace modal
    toast.info("Create workspace coming soon");
  }, []);

  const handleManageWorkspaces = useCallback(() => {
    // TODO: Navigate to workspace management page
    router.push("/workspaces");
  }, [router]);

  const getHrefForNavItem = (id: NavItemId): string => {
    if (id === "dashboard") return "/";
    if (id === "my-tasks") return "/tasks";
    if (id === "projects") return "/projects";
    if (id === "inbox") return "/inbox";
    if (id === "clients") return "/clients";
    if (id === "performance") return "/performance";
    return "#";
  };

  const isItemActive = (id: NavItemId): boolean => {
    if (id === "dashboard") {
      return pathname === "/";
    }
    if (id === "projects") {
      return pathname.startsWith("/projects");
    }
    if (id === "my-tasks") {
      return pathname.startsWith("/tasks");
    }
    if (id === "inbox") {
      return pathname.startsWith("/inbox");
    }
    if (id === "clients") {
      return pathname.startsWith("/clients");
    }
    if (id === "performance") {
      return pathname.startsWith("/performance");
    }
    return false;
  };

  return (
    <Sidebar className="border-border/40 border-r-0 shadow-none border-none">
      <SidebarHeader className="p-4">
        <WorkspaceCombobox
          workspaces={workspaces.data || []}
          selectedId={activeWorkspaceId}
          onSelect={handleWorkspaceSelect}
          onCreateNew={handleCreateWorkspace}
          onManageWorkspaces={handleManageWorkspaces}
          isLoading={isLoadingWorkspaces}
          disabled={switchWorkspace.isPending}
          triggerClassName="h-10"
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
                    {item.badge && (
                      <SidebarMenuBadge className="bg-muted text-muted-foreground rounded-full px-2">
                        {item.badge}
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
              {activeProjects.map((project) => (
                <SidebarMenuItem key={project.name}>
                  <SidebarMenuButton className="h-9 rounded-lg px-3 group">
                    <ProgressCircle
                      progress={project.progress}
                      color={project.color}
                      size={18}
                    />
                    <span className="flex-1 truncate text-sm">
                      {project.name}
                    </span>
                    <span className="opacity-0 group-hover:opacity-100 rounded p-0.5 hover:bg-accent">
                      <span className="text-muted-foreground text-lg">···</span>
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/40 p-2">
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

      <SettingsDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
    </Sidebar>
  );
}
