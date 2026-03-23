"use client";

import { useMemo, useState } from "react";
import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { Plus } from "@phosphor-icons/react/dist/ssr";

import type { ProjectTask } from "@/lib/data/project-details";
import {
  DEFAULT_VIEW_OPTIONS,
  type FilterChip as FilterChipType,
  type ViewOptions,
} from "@/lib/view-options";
import { TaskWeekBoardView } from "@/components/tasks/TaskWeekBoardView";
import {
  type ProjectTaskGroup,
  ProjectTaskListView,
} from "@/components/tasks/task-helpers";
import { Button } from "@/components/ui/button";
import { FilterPopover } from "@/components/filter-popover";
import { ChipOverflow } from "@/components/chip-overflow";
import { ViewOptionsPopover } from "@/components/view-options-popover";
import {
  TaskQuickCreateModal,
  type CreateTaskContext,
} from "@/components/tasks/TaskQuickCreateModal";
import { PageHeader, PageToolbar, AiButton } from "@/components/page-layout";
import { useAuth } from "@/hooks/use-auth";
import { useTaskProjectsQuery } from "@/lib/projects/projects-query";
import {
  useAllTasksQuery,
  useDeleteTaskMutation,
  useMyTasksQuery,
  useUpdateTaskMutation,
} from "@/lib/tasks/tasks-query";
import type { MyTasksQuery } from "@/lib/tasks/types";
import { useWorkspaceScope } from "@/lib/workspaces/use-workspace-scope";
import { toast } from "sonner";

const TASK_STATUS_OPTIONS = [
  { id: "todo", label: "To do", color: "var(--chart-2)" },
  { id: "in-progress", label: "In progress", color: "var(--chart-3)" },
  { id: "done", label: "Done", color: "var(--chart-4)" },
];

const TASK_PRIORITY_OPTIONS = [
  { id: "no-priority", label: "No priority" },
  { id: "low", label: "Low" },
  { id: "medium", label: "Medium" },
  { id: "high", label: "High" },
  { id: "urgent", label: "Urgent" },
];

function normalizeChipValue(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "-");
}

function buildTaskQuery(
  filters: FilterChipType[],
  viewOptions: ViewOptions,
  currentUser: { id: string; displayName: string } | null,
): MyTasksQuery {
  const query: MyTasksQuery = {
    page: 1,
    limit: 100,
    view: viewOptions.viewType,
    groupBy: viewOptions.groupBy,
    sortBy: viewOptions.viewType === "board" ? "startDate" : "createdAt",
    sortOrder: viewOptions.viewType === "board" ? "asc" : "desc",
  };

  const statuses = filters
    .filter((chip) => chip.key.toLowerCase() === "status")
    .map((chip) => normalizeChipValue(chip.value));

  if (statuses.length) query.status = statuses;

  const priorities = filters
    .filter((chip) => chip.key.toLowerCase() === "priority")
    .map((chip) => normalizeChipValue(chip.value));

  if (priorities.length) query.priority = priorities[0];

  const tags = filters
    .filter((chip) => chip.key.toLowerCase() === "tag")
    .map((chip) => chip.value);

  if (tags.length) query.tags = tags;

  const memberFilters = filters
    .filter((chip) => chip.key.toLowerCase().startsWith("member"))
    .map((chip) => chip.value.toLowerCase());

  if (
    currentUser &&
    memberFilters.some(
      (value) =>
        value === currentUser.displayName.toLowerCase() ||
        value === "current member",
    )
  ) {
    query.assigneeIds = [currentUser.id];
  }

  return query;
}

function buildFallbackProject(task: ProjectTask): ProjectTaskGroup["project"] {
  return {
    id: task.projectId,
    name: task.projectName,
    status: "active",
    priority: "medium",
    workstreams: [],
  };
}

export function MyTasksPage() {
  const auth = useAuth();
  const { workspaceId } = useWorkspaceScope();
  const [filters, setFilters] = useState<FilterChipType[]>([]);
  const [viewOptions, setViewOptions] =
    useState<ViewOptions>(DEFAULT_VIEW_OPTIONS);
  const [viewMode, setViewMode] = useState<"my-tasks" | "all-tasks">(
    "my-tasks",
  );
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [createContext, setCreateContext] = useState<
    CreateTaskContext | undefined
  >(undefined);
  const [editingTask, setEditingTask] = useState<ProjectTask | undefined>(
    undefined,
  );
  const [manualOrderByProject, setManualOrderByProject] = useState<
    Record<string, string[]>
  >({});

  const currentUser = useMemo(
    () =>
      auth.user
        ? { id: auth.user.id, displayName: auth.user.displayName }
        : null,
    [auth.user],
  );

  const taskQuery = useMemo(
    () => buildTaskQuery(filters, viewOptions, currentUser),
    [filters, viewOptions, currentUser],
  );

  const isQueryEnabled =
    auth.hasHydrated && auth.isAuthenticated && Boolean(workspaceId);

  const {
    data: myTasks,
    isPending: isMyTasksPending,
    error: myTasksError,
  } = useMyTasksQuery(
    workspaceId ?? "",
    taskQuery,
    isQueryEnabled && viewMode === "my-tasks",
  );
  const {
    data: allTasks,
    isPending: isAllTasksPending,
    error: allTasksError,
  } = useAllTasksQuery(
    workspaceId ?? "",
    taskQuery,
    isQueryEnabled && viewMode === "all-tasks",
  );
  const { data: projects = [] } = useTaskProjectsQuery(
    workspaceId ?? "",
    isQueryEnabled,
  );
  const updateTaskMutation = useUpdateTaskMutation(
    workspaceId ?? "",
    taskQuery,
  );
  const deleteTaskMutation = useDeleteTaskMutation(
    workspaceId ?? "",
    taskQuery,
  );
  const allTasksQuery = useAllTasksQuery(
    workspaceId ?? "",
    taskQuery,
    isQueryEnabled && viewMode === "all-tasks",
  );

  const tasksData = viewMode === "my-tasks" ? myTasks : allTasks;
  const isPending =
    viewMode === "my-tasks" ? isMyTasksPending : isAllTasksPending;
  const error = viewMode === "my-tasks" ? myTasksError : allTasksError;

  const tasks = useMemo(
    () => tasksData?.data.tasks ?? [],
    [tasksData?.data.tasks],
  );
  const filterCounts = useMemo(
    () => tasksData?.meta.filterCounts ?? {},
    [tasksData?.meta.filterCounts],
  );

  const projectMap = useMemo(
    () => new Map(projects.map((project) => [project.id, project])),
    [projects],
  );

  const groups = useMemo<ProjectTaskGroup[]>(() => {
    const grouped = new Map<string, ProjectTaskGroup>();

    for (const task of tasks) {
      const existing = grouped.get(task.projectId);

      if (existing) {
        existing.tasks.push(task);
        continue;
      }

      grouped.set(task.projectId, {
        project: projectMap.get(task.projectId) ?? buildFallbackProject(task),
        tasks: [task],
      });
    }

    return Array.from(grouped.values()).map((group) => {
      const manualOrder = manualOrderByProject[group.project.id] ?? [];
      if (!manualOrder.length) return group;

      const taskMap = new Map(group.tasks.map((task) => [task.id, task]));
      const orderedTasks = [
        ...manualOrder
          .map((id) => taskMap.get(id))
          .filter((task): task is ProjectTask => Boolean(task)),
        ...group.tasks.filter((task) => !manualOrder.includes(task.id)),
      ];

      return {
        ...group,
        tasks: orderedTasks,
      };
    });
  }, [manualOrderByProject, projectMap, tasks]);

  const taskMap = useMemo(
    () => new Map(tasks.map((task) => [task.id, task])),
    [tasks],
  );

  const allVisibleTasks = useMemo(
    () => groups.flatMap((group) => group.tasks),
    [groups],
  );

  const openCreateTask = (context?: CreateTaskContext) => {
    setEditingTask(undefined);
    setCreateContext(context);
    setIsCreateTaskOpen(true);
  };

  const openEditTask = (task: ProjectTask) => {
    setEditingTask(task);
    setCreateContext(undefined);
    setIsCreateTaskOpen(true);
  };

  const handleStatusToggle = async (taskId: string) => {
    const task = taskMap.get(taskId);
    if (!task) return;

    await updateTaskMutation.mutateAsync({
      taskId,
      input: {
        status: task.status === "done" ? "todo" : "done",
      },
    });
  };

  const handleTagChange = async (taskId: string, tagLabel?: string) => {
    await updateTaskMutation.mutateAsync({
      taskId,
      input: {
        tag: tagLabel,
      },
    });
  };

  const handleTaskDateMove = async (taskId: string, newDate: Date) => {
    await updateTaskMutation.mutateAsync({
      taskId,
      input: {
        startDate: newDate.toISOString(),
      },
    });
  };

  const handleDeleteTask = async (taskId: string) => {
    setDeletingTaskId(taskId);
    try {
      await deleteTaskMutation.mutateAsync(taskId);
      toast.success("Task deleted successfully");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete task";
      toast.error(message);
    } finally {
      setDeletingTaskId(null);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const activeGroup = groups.find((group) =>
      group.tasks.some((task) => task.id === active.id),
    );
    const overGroup = groups.find((group) =>
      group.tasks.some((task) => task.id === over.id),
    );

    if (
      !activeGroup ||
      !overGroup ||
      activeGroup.project.id !== overGroup.project.id
    ) {
      return;
    }

    const current = activeGroup.tasks.map((task) => task.id);
    const oldIndex = current.indexOf(String(active.id));
    const newIndex = current.indexOf(String(over.id));

    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
      return;
    }

    setManualOrderByProject((prev) => ({
      ...prev,
      [activeGroup.project.id]: arrayMove(current, oldIndex, newIndex),
    }));
  };

  const taskTagOptions = useMemo(
    () =>
      Object.keys(filterCounts.tags ?? {}).map((tag) => ({
        id: tag,
        label: tag,
      })),
    [filterCounts.tags],
  );

  const memberOptions = useMemo(() => {
    if (!currentUser) return [];

    return [
      {
        id: currentUser.displayName,
        label: currentUser.displayName,
      },
    ];
  }, [currentUser]);

  const isMutating = updateTaskMutation.isPending;
  const isEmpty = !isPending && groups.length === 0;

  return (
    <div className="flex flex-1 flex-col min-h-0 bg-background rounded-lg min-w-0">
      <PageHeader
        title="Tasks"
        actions={
          <Button size="sm" variant="ghost" onClick={() => openCreateTask()}>
            <Plus className="mr-1.5 h-4 w-4" />
            New Task
          </Button>
        }
        toolbar={
          <PageToolbar
            left={
              <>
                <FilterPopover
                  initialChips={filters}
                  onApply={setFilters}
                  onClear={() => setFilters([])}
                  counts={filterCounts}
                  statusOptions={TASK_STATUS_OPTIONS}
                  priorityOptions={TASK_PRIORITY_OPTIONS}
                  memberOptions={memberOptions}
                  tagOptions={taskTagOptions}
                />
                <ChipOverflow
                  chips={filters}
                  onRemove={(key, value) =>
                    setFilters((prev) =>
                      prev.filter(
                        (chip) => !(chip.key === key && chip.value === value),
                      ),
                    )
                  }
                  maxVisible={6}
                />
              </>
            }
            right={
              <>
                <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/50 p-1">
                  <Button
                    size="sm"
                    variant={viewMode === "my-tasks" ? "secondary" : "ghost"}
                    className="h-7 text-xs"
                    onClick={() => setViewMode("my-tasks")}
                  >
                    My Tasks
                  </Button>
                  <Button
                    size="sm"
                    variant={viewMode === "all-tasks" ? "secondary" : "ghost"}
                    className="h-7 text-xs"
                    onClick={() => setViewMode("all-tasks")}
                  >
                    All Tasks
                  </Button>
                </div>
                <ViewOptionsPopover
                  options={viewOptions}
                  onChange={setViewOptions}
                  allowedViewTypes={["list", "board"]}
                />
                <AiButton />
              </>
            }
          />
        }
      />

      <div className="flex-1 min-h-0 space-y-4 overflow-y-auto px-4 py-4">
        {isPending && (
          <p className="text-sm text-muted-foreground">Loading tasks...</p>
        )}
        {error && (
          <p className="text-sm text-destructive">Failed to load tasks.</p>
        )}
        {isMutating && (
          <p className="text-xs text-muted-foreground">
            Saving task changes...
          </p>
        )}
        {isEmpty && (
          <p className="text-sm text-muted-foreground">
            No tasks available yet.
          </p>
        )}

        {!isPending && !isEmpty && viewOptions.viewType === "list" && (
          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <ProjectTaskListView
              groups={groups}
              onToggleTask={handleStatusToggle}
              onAddTask={(context) => openCreateTask(context)}
              onOpenTask={openEditTask}
              onDeleteTask={handleDeleteTask}
              deletingTaskId={deletingTaskId}
            />
          </DndContext>
        )}

        {!isPending && !isEmpty && viewOptions.viewType === "board" && (
          <TaskWeekBoardView
            tasks={allVisibleTasks}
            onAddTask={(context) => openCreateTask(context)}
            onToggleTask={handleStatusToggle}
            onChangeTag={handleTagChange}
            onMoveTaskDate={handleTaskDateMove}
            onOpenTask={openEditTask}
            onDeleteTask={handleDeleteTask}
            deletingTaskId={deletingTaskId}
          />
        )}
      </div>

      <TaskQuickCreateModal
        open={isCreateTaskOpen}
        onClose={() => {
          setIsCreateTaskOpen(false);
          setEditingTask(undefined);
          setCreateContext(undefined);
        }}
        context={editingTask ? undefined : createContext}
        editingTask={editingTask}
      />
    </div>
  );
}
