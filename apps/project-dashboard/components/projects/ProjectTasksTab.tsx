"use client"

import { useEffect, useMemo, useState } from "react"
import { DotsThreeVertical, Plus, Spinner, Trash } from "@phosphor-icons/react/dist/ssr"
import {
  DndContext,
  type DragEndEvent,
  closestCenter,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { toast } from "sonner"

import type { ProjectTask } from "@/lib/data/project-details"
import type { FilterCounts } from "@/lib/data/projects"
import type { FilterChip as FilterChipType } from "@/lib/view-options"
import type { MyTasksQuery } from "@/lib/tasks/types"
import { useAllTasksQuery, useUpdateTaskMutation, useDeleteTaskMutation } from "@/lib/tasks/tasks-query"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { FilterPopover } from "@/components/filter-popover"
import { ChipOverflow } from "@/components/chip-overflow"
import { TaskRowBase } from "@/components/tasks/TaskRowBase"
import { TaskQuickCreateModal } from "@/components/tasks/TaskQuickCreateModal"
import { cn } from "@/lib/utils"

type ProjectTasksTabProps = {
  workspaceId: string
  projectId: string
  projectName: string
  isActive?: boolean
}

export function ProjectTasksTab({
  workspaceId,
  projectId,
  projectName,
  isActive = false,
}: ProjectTasksTabProps) {
  // Local state for filters and UI
  const [filters, setFilters] = useState<FilterChipType[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<ProjectTask | null>(null)

  // Query params for fetching tasks
  const queryParams: MyTasksQuery = useMemo(() => ({
    projectId,
    page: 1,
    limit: 100,
  }), [projectId])

  // Fetch tasks from BFF API - only when tab is active
  const { data: tasksData, isLoading, error } = useAllTasksQuery(
    workspaceId,
    queryParams,
    isActive // Only enable when tab is active
  )

  // Mutations
  const updateTaskMutation = useUpdateTaskMutation(workspaceId, queryParams)
  const deleteTaskMutation = useDeleteTaskMutation(workspaceId, queryParams)

  const tasks = tasksData?.data.tasks ?? []
  const filterCounts = tasksData?.meta.filterCounts

  // Apply local filters to the fetched tasks
  const filteredTasks = useMemo(
    () => filterTasksByChips(tasks, filters),
    [tasks, filters]
  )

  // Show error toast if query fails
  useEffect(() => {
    if (error) {
      toast.error("Failed to load tasks. Please try again.")
    }
  }, [error])

  const handleToggleTask = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return

    const nextStatus = task.status === "done" ? "todo" : "done"

    try {
      await updateTaskMutation.mutateAsync({
        taskId,
        input: { status: nextStatus },
      })
      toast.success(`Task marked as ${nextStatus === "done" ? "done" : "todo"}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update task"
      toast.error(message)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = tasks.findIndex((item) => item.id === active.id)
      const newIndex = tasks.findIndex((item) => item.id === over.id)
      const reorderedTasks = arrayMove(tasks, oldIndex, newIndex)

      // Note: Reordering via BFF API would need a dedicated endpoint
      // For now, we just update the local order optimistically
      // This can be enhanced when the API supports task reordering
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTaskMutation.mutateAsync(taskId)
      toast.success("Task deleted successfully")
      setEditingTask(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete task"
      toast.error(message)
    }
  }

  // Compute filter counts from API data
  const counts: FilterCounts = useMemo(() => {
    if (filterCounts) {
      return filterCounts
    }
    return computeTaskFilterCounts(tasks)
  }, [filterCounts, tasks])

  if (isLoading) {
    return (
      <section className="rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-center px-4 py-16">
          <Spinner className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="rounded-2xl border border-dashed border-border/70 bg-muted/30 px-4 py-10 text-center">
        <p className="text-sm text-muted-foreground">Failed to load tasks.</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </section>
    )
  }

  if (!tasks.length && !filters.length) {
    return (
      <>
        <section className="rounded-2xl border border-dashed border-border/70 bg-muted/30 px-4 py-10 text-center text-sm text-muted-foreground">
          <p>No tasks defined yet.</p>
          <Button
            size="sm"
            className="mt-4"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Create your first task
          </Button>
        </section>
        <TaskQuickCreateModal
          open={isCreateDialogOpen}
          onClose={() => setIsCreateDialogOpen(false)}
          context={{ projectId }}
        />
      </>
    )
  }

  return (
    <>
      <section className="rounded-2xl border border-border bg-card shadow-[var(--shadow-workstream)]">
        <header className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
          <div className="flex items-center gap-2">
            <FilterPopover
              initialChips={filters}
              onApply={setFilters}
              onClear={() => setFilters([])}
              counts={counts}
            />
            <ChipOverflow
              chips={filters}
              onRemove={(key, value) =>
                setFilters((prev) => prev.filter((chip) => !(chip.key === key && chip.value === value)))
              }
              maxVisible={4}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {filteredTasks.length} task{filteredTasks.length !== 1 ? "s" : ""}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-lg border-border/60 bg-transparent px-3 text-xs font-medium"
            >
              View
            </Button>
            <Button
              size="sm"
              className="h-8 rounded-lg px-3 text-xs font-medium"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              New Task
            </Button>
          </div>
        </header>

        <div className="space-y-1 px-2 py-3">
          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={filteredTasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
              {filteredTasks.map((task) => (
                <TaskRowDnD
                  key={task.id}
                  task={task}
                  onToggle={() => handleToggleTask(task.id)}
                  onEdit={() => setEditingTask(task)}
                  onDelete={() => handleDeleteTask(task.id)}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      </section>

      {/* Create/Edit Task Dialog */}
      <TaskQuickCreateModal
        open={isCreateDialogOpen || !!editingTask}
        onClose={() => {
          setIsCreateDialogOpen(false)
          setEditingTask(null)
        }}
        context={{ projectId }}
        editingTask={editingTask ?? undefined}
      />
    </>
  )
}

type TaskBadgesProps = {
  workstreamName?: string
}

function TaskBadges({ workstreamName }: TaskBadgesProps) {
  if (!workstreamName) return null

  return (
    <Badge variant="muted" className="whitespace-nowrap text-[11px]">
      {workstreamName}
    </Badge>
  )
}

type TaskStatusProps = {
  status: ProjectTask["status"]
}

function TaskStatus({ status }: TaskStatusProps) {
  const label = getStatusLabel(status)
  const color = getStatusColor(status)

  return <span className={cn("font-medium", color)}>{label}</span>
}

function getStatusLabel(status: ProjectTask["status"]): string {
  switch (status) {
    case "done":
      return "Done"
    case "in-progress":
      return "In Progress"
    default:
      return "To do"
  }
}

function filterTasksByChips(tasks: ProjectTask[], chips: FilterChipType[]): ProjectTask[] {
  if (!chips.length) return tasks

  const memberValues = chips
    .filter((chip) => chip.key.toLowerCase().startsWith("member") || chip.key.toLowerCase() === "pic")
    .map((chip) => chip.value.toLowerCase())

  if (!memberValues.length) return tasks

  return tasks.filter((task) => {
    const name = task.assignee?.name.toLowerCase() ?? ""

    for (const value of memberValues) {
      if (value === "no member" && !task.assignee) return true
      if (value === "current member" && task.assignee) return true
      if (value && name.includes(value)) return true
    }

    return false
  })
}

function computeTaskFilterCounts(tasks: ProjectTask[]): FilterCounts {
  const counts: FilterCounts = {
    members: {
      "no-member": 0,
      current: 0,
      jason: 0,
    },
  }

  for (const task of tasks) {
    if (!task.assignee) {
      counts.members!["no-member"] = (counts.members!["no-member"] || 0) + 1
    } else {
      counts.members!.current = (counts.members!.current || 0) + 1

      const name = task.assignee.name.toLowerCase()
      if (name.includes("jason duong")) {
        counts.members!.jason = (counts.members!.jason || 0) + 1
      }
    }
  }

  return counts
}

function getStatusColor(status: ProjectTask["status"]): string {
  switch (status) {
    case "done":
      return "text-emerald-500"
    case "in-progress":
      return "text-amber-500"
    default:
      return "text-muted-foreground"
  }
}

type TaskRowDnDProps = {
  task: ProjectTask
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
}

function TaskRowDnD({ task, onToggle, onEdit, onDelete }: TaskRowDnDProps) {
  const isDone = task.status === "done"

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete()
  }

  return (
    <div ref={setNodeRef} style={style} onClick={onEdit} className="cursor-pointer">
      <TaskRowBase
        checked={isDone}
        title={task.name}
        onCheckedChange={onToggle}
        titleAriaLabel={task.name}
        titleSuffix={<TaskBadges workstreamName={task.workstreamName} />}
        meta={
          <>
            <TaskStatus status={task.status} />
            {task.dueLabel && (
              <span className="text-muted-foreground">{task.dueLabel}</span>
            )}
            {task.assignee && (
              <Avatar className="size-6">
                {task.assignee.avatarUrl && (
                  <AvatarImage src={task.assignee.avatarUrl} alt={task.assignee.name} />
                )}
                <AvatarFallback>{task.assignee.name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
            )}
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              className="size-7 rounded-md text-muted-foreground hover:text-destructive"
              aria-label="Delete task"
              onClick={handleDelete}
            >
              <Trash className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              className="size-7 rounded-md text-muted-foreground cursor-grab active:cursor-grabbing"
              aria-label="Reorder task"
              onClick={(e) => e.stopPropagation()}
              {...attributes}
              {...listeners}
            >
              <DotsThreeVertical className="h-4 w-4" weight="regular" />
            </Button>
          </>
        }
        className={isDragging ? "opacity-60" : ""}
      />
    </div>
  )
}
