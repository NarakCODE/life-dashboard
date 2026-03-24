"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  DotsThreeVertical,
  PencilSimple,
  Trash,
} from "@phosphor-icons/react/dist/ssr";
import { toast } from "sonner";

import { ProjectBoardView } from "@/components/project-board-view";
import { ProjectCardsView } from "@/components/project-cards-view";
import { ProjectHeader } from "@/components/project-header";
import { ProjectTimeline } from "@/components/project-timeline";
import { ProjectFormDialog } from "@/components/projects/ProjectFormDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  useCreateProjectMutation,
  useDeleteProjectMutation,
  useProjectsQuery,
  useUpdateProjectMutation,
} from "@/lib/projects/projects-query";
import type { FilterCounts } from "@/lib/data/projects";
import type {
  ProjectInput,
  ProjectSummary,
  ProjectStatus,
} from "@/lib/projects/projects-client";
import {
  DEFAULT_VIEW_OPTIONS,
  type FilterChip,
  type ViewOptions,
} from "@/lib/view-options";
import { chipsToParams, paramsToChips } from "@/lib/url/filters";
import { useWorkspaceScope } from "@/lib/workspaces/use-workspace-scope";
import { PageLayout } from "@/components/page-layout";

function computeFilterCounts(projects: ProjectSummary[]) {
  const counts: FilterCounts = {
    status: {},
    priority: {},
    tags: {},
    members: {},
  };

  for (const project of projects) {
    counts.status![project.status] = (counts.status![project.status] || 0) + 1;
    counts.priority![project.priority] =
      (counts.priority![project.priority] || 0) + 1;

    for (const workstream of project.workstreams) {
      const key = workstream.name.toLowerCase();
      counts.tags![key] = (counts.tags![key] || 0) + 1;
    }

    counts.members!["no-member"] = (counts.members!["no-member"] || 0) + 1;
  }

  return counts;
}

type ProjectDialogState =
  | { mode: "create"; project: null }
  | { mode: "edit"; project: ProjectSummary };

function ProjectActionsMenu({
  project,
  onEdit,
  onDelete,
}: {
  project: ProjectSummary;
  onEdit: (project: ProjectSummary) => void;
  onDelete: (project: ProjectSummary) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
          <DotsThreeVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEdit(project)}>
          <PencilSimple />
          Edit project
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onDelete(project)}
          className="text-destructive focus:text-destructive"
        >
          <Trash />
          Delete project
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ProjectsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const {
    workspaceId,
    workspaceContext,
    isPending: isWorkspacePending,
  } = useWorkspaceScope();

  const [viewOptions, setViewOptions] = useState<ViewOptions>({
    ...DEFAULT_VIEW_OPTIONS,
    viewType: "board",
  });
  const [filters, setFilters] = useState<FilterChip[]>([]);
  const [dialogState, setDialogState] = useState<ProjectDialogState | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<ProjectSummary | null>(null);

  const isSyncingRef = useRef(false);
  const prevParamsRef = useRef("");

  const canManageProjects =
    workspaceContext?.permissions.includes("project.write") ?? false;

  const { data: projects = [], isPending: isProjectsPending } =
    useProjectsQuery(workspaceId ?? "", Boolean(workspaceId));
  const createProjectMutation = useCreateProjectMutation(workspaceId ?? "");
  const updateProjectMutation = useUpdateProjectMutation(workspaceId ?? "");
  const deleteProjectMutation = useDeleteProjectMutation(workspaceId ?? "");

  const isLoading =
    isWorkspacePending || (Boolean(workspaceId) && isProjectsPending);

  const openCreateDialog = () => {
    setDialogState({ mode: "create", project: null });
  };

  const openEditDialog = (project: ProjectSummary) => {
    setDialogState({ mode: "edit", project });
  };

  const closeDialog = () => {
    if (createProjectMutation.isPending || updateProjectMutation.isPending)
      return;
    setDialogState(null);
  };

  const removeFilter = (key: string, value: string) => {
    const next = filters.filter(
      (filter) => !(filter.key === key && filter.value === value),
    );
    setFilters(next);
    replaceUrlFromChips(next);
  };

  const applyFilters = (chips: FilterChip[]) => {
    setFilters(chips);
    replaceUrlFromChips(chips);
  };

  useEffect(() => {
    const currentParams = searchParams.toString();

    if (prevParamsRef.current === currentParams) return;

    if (isSyncingRef.current) {
      isSyncingRef.current = false;
      return;
    }

    prevParamsRef.current = currentParams;
    const params = new URLSearchParams(searchParams.toString());
    setFilters(paramsToChips(params));
  }, [searchParams]);

  const replaceUrlFromChips = (chips: FilterChip[]) => {
    const params = chipsToParams(chips);
    const queryString = params.toString();
    const url = queryString ? `${pathname}?${queryString}` : pathname;

    isSyncingRef.current = true;
    prevParamsRef.current = queryString;
    router.replace(url, { scroll: false });
  };

  const filteredProjects = useMemo(() => {
    let list = projects.slice();

    if (!viewOptions.showClosedProjects) {
      list = list.filter(
        (project) =>
          project.status !== "completed" && project.status !== "cancelled",
      );
    }

    const statusSet = new Set<string>();
    const prioritySet = new Set<string>();
    const tagSet = new Set<string>();

    for (const { key, value } of filters) {
      const normalizedKey = key.trim().toLowerCase();
      const normalizedValue = value.trim().toLowerCase();

      if (normalizedKey.startsWith("status")) statusSet.add(normalizedValue);
      else if (normalizedKey.startsWith("priority"))
        prioritySet.add(normalizedValue);
      else if (normalizedKey.startsWith("tag")) tagSet.add(normalizedValue);
    }

    if (statusSet.size) {
      list = list.filter((project) =>
        statusSet.has(project.status.toLowerCase()),
      );
    }

    if (prioritySet.size) {
      list = list.filter((project) =>
        prioritySet.has(project.priority.toLowerCase()),
      );
    }

    if (tagSet.size) {
      list = list.filter((project) =>
        project.workstreams.some((workstream) =>
          tagSet.has(workstream.name.toLowerCase()),
        ),
      );
    }

    const sorted = list.slice();

    if (viewOptions.ordering === "alphabetical") {
      sorted.sort((left, right) => left.name.localeCompare(right.name));
    }

    return sorted;
  }, [filters, projects, viewOptions]);

  const handleProjectSubmit = async (input: ProjectInput) => {
    if (!workspaceId) {
      toast.error("Workspace context is unavailable");
      return;
    }

    try {
      if (dialogState?.mode === "edit" && dialogState.project) {
        await updateProjectMutation.mutateAsync({
          projectId: dialogState.project.id,
          input,
        });
        toast.success("Project updated successfully");
      } else {
        await createProjectMutation.mutateAsync(input);
        toast.success("Project created successfully");
      }

      setDialogState(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save project";
      toast.error(message);
    }
  };

  const handleProjectStatusChange = async (
    project: ProjectSummary,
    status: ProjectStatus,
  ) => {
    if (!workspaceId || project.status === status) return;

    try {
      await updateProjectMutation.mutateAsync({
        projectId: project.id,
        input: { status },
      });
      toast.success("Project updated successfully");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to update project status";
      toast.error(message);
    }
  };

  const handleDeleteProject = async () => {
    if (!workspaceId || !deleteTarget) return;

    try {
      await deleteProjectMutation.mutateAsync(deleteTarget.id);
      toast.success("Project deleted successfully");
      setDeleteTarget(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete project";
      toast.error(message);
    }
  };

  return (
    <>
    <PageLayout>
        <ProjectHeader
          filters={filters}
          onRemoveFilter={removeFilter}
          onFiltersChange={applyFilters}
          counts={computeFilterCounts(filteredProjects)}
          viewOptions={viewOptions}
          onViewOptionsChange={setViewOptions}
          onAddProject={openCreateDialog}
          canAddProject={canManageProjects}
        />

        {viewOptions.viewType === "timeline" && <ProjectTimeline />}
        {viewOptions.viewType === "list" && (
          <ProjectCardsView
            projects={filteredProjects}
            loading={isLoading}
            onCreateProject={openCreateDialog}
            canCreateProject={canManageProjects}
            renderActions={
              canManageProjects
                ? (project) => (
                    <ProjectActionsMenu
                      project={project}
                      onEdit={openEditDialog}
                      onDelete={setDeleteTarget}
                    />
                  )
                : undefined
            }
          />
        )}
        {viewOptions.viewType === "board" && (
          <ProjectBoardView
            projects={filteredProjects}
            loading={isLoading}
            onAddProject={openCreateDialog}
            onEditProject={openEditDialog}
            onChangeStatus={handleProjectStatusChange}
            canManageProjects={canManageProjects}
            renderActions={
              canManageProjects
                ? (project) => (
                    <ProjectActionsMenu
                      project={project}
                      onEdit={openEditDialog}
                      onDelete={setDeleteTarget}
                    />
                  )
                : undefined
            }
          />
        )}
      </PageLayout>

      <ProjectFormDialog
        open={dialogState !== null}
        mode={dialogState?.mode ?? "create"}
        project={dialogState?.project ?? null}
        isPending={
          createProjectMutation.isPending || updateProjectMutation.isPending
        }
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
        onSubmit={handleProjectSubmit}
      />

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !deleteProjectMutation.isPending) {
            setDeleteTarget(null);
          }
        }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete project?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{deleteTarget?.name}&quot;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteProjectMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleteProjectMutation.isPending}
              onClick={handleDeleteProject}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
