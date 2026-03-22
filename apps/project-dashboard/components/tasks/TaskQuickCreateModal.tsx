'use client'

import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { CalendarBlank, ChartBar, Paperclip, Tag, Microphone, UserCircle, X, Folder, Rows } from '@phosphor-icons/react/dist/ssr'

import type { ProjectTask } from '@/lib/data/project-details'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { GenericPicker, DatePicker } from '@/components/project-wizard/steps/StepQuickCreate'
import { ProjectDescriptionEditor } from '@/components/project-wizard/ProjectDescriptionEditor'
import { QuickCreateModalLayout } from '@/components/QuickCreateModalLayout'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import { useTaskProjectsQuery } from '@/lib/projects/projects-query'
import {
  useCreateTaskMutation,
  useUpdateTaskMutation,
} from '@/lib/tasks/tasks-query'
import { useWorkspaceScope } from '@/lib/workspaces/use-workspace-scope'

export type CreateTaskContext = {
  projectId?: string
  workstreamId?: string
  workstreamName?: string
}

interface TaskQuickCreateModalProps {
  open: boolean
  onClose: () => void
  context?: CreateTaskContext
  editingTask?: ProjectTask
}

type TaskStatusId = 'todo' | 'in-progress' | 'done'

type StatusOption = {
  id: TaskStatusId
  label: string
}

type AssigneeOption = {
  id: string
  name: string
}

type PriorityOption = {
  id: "no-priority" | "low" | "medium" | "high" | "urgent"
  label: string
}

export type TagOption = {
  id: string
  label: string
}

interface PickerOption {
  id: string
  label: string
}

const STATUS_OPTIONS: StatusOption[] = [
  { id: 'todo', label: 'To do' },
  { id: 'in-progress', label: 'In progress' },
  { id: 'done', label: 'Done' },
]
const DEFAULT_STATUS_OPTION = STATUS_OPTIONS[0]!

const PRIORITY_OPTIONS: PriorityOption[] = [
  { id: 'no-priority', label: 'No priority' },
  { id: 'low', label: 'Low' },
  { id: 'medium', label: 'Medium' },
  { id: 'high', label: 'High' },
]
const DEFAULT_PRIORITY_OPTION = PRIORITY_OPTIONS[0]!

export const TAG_OPTIONS: TagOption[] = [
  { id: 'feature', label: 'Feature' },
  { id: 'bug', label: 'Bug' },
  { id: 'internal', label: 'Internal' },
]

function resolveCreateDefaults(
  projectOptions: PickerOption[],
  projects: Array<{ id: string; workstreams: PickerOption[] }>,
  context?: CreateTaskContext,
) {
  const resolvedProjectId = context?.projectId ?? projectOptions[0]?.id
  const resolvedProject = projects.find((project) => project.id === resolvedProjectId)
  const workstreamOptions = resolvedProject?.workstreams ?? []
  const resolvedWorkstream =
    workstreamOptions.find((workstream) => workstream.id === context?.workstreamId) ??
    workstreamOptions[0]

  return {
    projectId: resolvedProjectId,
    workstreamId: resolvedWorkstream?.id,
    workstreamName: context?.workstreamName ?? resolvedWorkstream?.label,
  }
}

export function TaskQuickCreateModal({ open, onClose, context, editingTask }: TaskQuickCreateModalProps) {
  const auth = useAuth()
  const { workspaceId } = useWorkspaceScope()
  const { data: projects = [] } = useTaskProjectsQuery(workspaceId ?? "", open)
  const createTaskMutation = useCreateTaskMutation(workspaceId ?? "")
  const updateTaskMutation = useUpdateTaskMutation(workspaceId ?? "")
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState<string | undefined>(undefined)
  const [createMore, setCreateMore] = useState(false)
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)

  const [projectId, setProjectId] = useState<string | undefined>(undefined)
  const [workstreamId, setWorkstreamId] = useState<string | undefined>(undefined)
  const [workstreamName, setWorkstreamName] = useState<string | undefined>(undefined)

  const assigneeOptions = useMemo<AssigneeOption[]>(() => {
    if (!auth.user) return []

    return [{ id: auth.user.id, name: auth.user.displayName }]
  }, [auth.user])

  const [assignee, setAssignee] = useState<AssigneeOption | undefined>(undefined)
  const [status, setStatus] = useState<StatusOption>(DEFAULT_STATUS_OPTION)
  const [startDate, setStartDate] = useState<Date | undefined>(new Date())
  const [targetDate, setTargetDate] = useState<Date | undefined>(undefined)
  const [priority, setPriority] = useState<PriorityOption | undefined>(DEFAULT_PRIORITY_OPTION)
  const [selectedTag, setSelectedTag] = useState<TagOption | undefined>(undefined)

  const projectOptions = useMemo(
    () => projects.map((p) => ({ id: p.id, label: p.name })),
    [projects],
  )

  const projectWorkstreams = useMemo(
    () =>
      projects.map((project) => ({
        id: project.id,
        workstreams: project.workstreams.map((workstream) => ({
          id: workstream.id,
          label: workstream.name,
        })),
      })),
    [projects],
  )

  useEffect(() => {
    if (!open) return

    if (editingTask) {
      setProjectId(editingTask.projectId)
      setWorkstreamId(editingTask.workstreamId)
      setWorkstreamName(editingTask.workstreamName)

      setTitle(editingTask.name)
      setDescription(editingTask.description)
      setCreateMore(false)
      setIsDescriptionExpanded(false)

      if (editingTask.assignee) {
        const assigneeOption = assigneeOptions.find((a) => a.id === editingTask.assignee?.id)
        setAssignee(assigneeOption)
      } else {
        setAssignee(undefined)
      }

      const statusOption = STATUS_OPTIONS.find((s) => s.id === editingTask.status)
      setStatus(statusOption ?? DEFAULT_STATUS_OPTION)

      setStartDate(editingTask.startDate ?? new Date())
      setTargetDate(editingTask.dueDate)

      const priorityOption = editingTask.priority
        ? PRIORITY_OPTIONS.find((p) => p.id === editingTask.priority)
        : undefined
      setPriority(priorityOption ?? DEFAULT_PRIORITY_OPTION)

      const tagOption = editingTask.tag
        ? TAG_OPTIONS.find((t) => t.label === editingTask.tag)
        : undefined
      setSelectedTag(tagOption)

      return
    }

    const defaults = resolveCreateDefaults(projectOptions, projectWorkstreams, context)

    setProjectId(defaults.projectId)
    setWorkstreamId(defaults.workstreamId)
    setWorkstreamName(defaults.workstreamName)
    setTitle('')
    setDescription(undefined)
    setCreateMore(false)
    setIsDescriptionExpanded(false)
    setAssignee(assigneeOptions[0])
    setStatus(DEFAULT_STATUS_OPTION)
    setStartDate(new Date())
    setTargetDate(undefined)
    setPriority(DEFAULT_PRIORITY_OPTION)
    setSelectedTag(undefined)
  }, [
    open,
    context,
    editingTask,
    assigneeOptions,
    projectOptions,
    projectWorkstreams,
  ])

  const workstreamOptions = useMemo(
    () => {
      const project = projects.find((item) => item.id === projectId)
      return (project?.workstreams ?? []).map((workstream) => ({
        id: workstream.id,
        label: workstream.name,
      }))
    },
    [projectId, projects],
  )

  useEffect(() => {
    if (!projectId) {
      setWorkstreamId(undefined)
      setWorkstreamName(undefined)
      return
    }

    if (!workstreamOptions.length) {
      setWorkstreamId(undefined)
      setWorkstreamName(undefined)
      return
    }

    const existing = workstreamOptions.find((ws) => ws.id === workstreamId)
    const fallback = workstreamOptions[0]
    const next = existing ?? fallback
    setWorkstreamId(next?.id)
    setWorkstreamName(next?.label)
  }, [projectId, workstreamOptions, workstreamId])

  const resetCreateForm = () => {
    setTitle('')
    setDescription(undefined)
    setStatus(DEFAULT_STATUS_OPTION)
    setTargetDate(undefined)
    setSelectedTag(undefined)
  }

  const handleSubmit = async () => {
    if (!workspaceId) {
      toast.error('Workspace context is unavailable')
      return
    }

    if (!projectId) {
      toast.error('Please choose a project first')
      return
    }

    if (editingTask) {
      try {
        await updateTaskMutation.mutateAsync({
          taskId: editingTask.id,
          input: {
            name: title.trim() || 'Untitled task',
            projectId,
            workstreamId,
            assigneeId: assignee?.id,
            description,
            status: status.id,
            priority: priority?.id,
            tag: selectedTag?.label,
            startDate: startDate?.toISOString(),
            dueDate: targetDate?.toISOString(),
          },
        })
        toast.success('Task updated successfully')
        onClose()
      } catch {
        toast.error('Failed to update task')
      }
      return
    }

    try {
      await createTaskMutation.mutateAsync({
        name: title.trim() || 'Untitled task',
        projectId,
        workstreamId,
        assigneeId: assignee?.id,
        description,
        status: status.id,
        priority: priority?.id,
        tag: selectedTag?.label,
        startDate: startDate?.toISOString(),
        dueDate: targetDate?.toISOString(),
      })

      if (createMore) {
        toast.success('Task created! Ready for another.')
        resetCreateForm()
        return
      }

      toast.success('Task created successfully')
      onClose()
    } catch {
      toast.error('Failed to create task')
    }
  }

  const projectLabel = projectOptions.find((p) => p.id === projectId)?.label

  const isSubmitting =
    createTaskMutation.isPending || updateTaskMutation.isPending

  return (
    <QuickCreateModalLayout
      open={open}
      onClose={onClose}
      isDescriptionExpanded={isDescriptionExpanded}
      onSubmitShortcut={handleSubmit}
    >
      {/* Context row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <GenericPicker
            items={projectOptions}
            selectedId={projectId}
            onSelect={(item) => {
              setProjectId(item.id)
              setWorkstreamId(undefined)
              setWorkstreamName(undefined)
            }}
            placeholder="Choose project..."
            renderItem={(item) => (
              <div className="flex items-center justify-between w-full gap-2">
                <span>{item.label}</span>
              </div>
            )}
            trigger={
              <button
                disabled={!projectOptions.length}
                className="bg-background flex gap-2 h-7 items-center px-2 py-1 rounded-lg border border-background hover:border-primary/50 transition-colors text-xs disabled:opacity-60"
              >
                <Folder className="size-4 text-muted-foreground" />
                <span className="truncate max-w-40 font-medium text-foreground">
                  {projectLabel ?? 'Choose project'}
                </span>
              </button>
            }
          />
          {workstreamOptions.length > 0 && (
            <>
              <div className="w-2 h-2 bg-muted-foreground/15 rounded-full" />
              <GenericPicker
                items={workstreamOptions}
                selectedId={workstreamId}
                onSelect={(item) => {
                  setWorkstreamId(item.id)
                  setWorkstreamName(item.label)
                }}
                placeholder="Choose workstream..."
                renderItem={(item) => (
                  <div className="flex items-center justify-between w-full gap-2">
                    <span>{item.label}</span>
                  </div>
                )}
                trigger={
                  <button
                    disabled={!workstreamOptions.length}
                    className="bg-background flex gap-2 h-7 items-center px-2 py-1 rounded-lg border border-background hover:border-primary/50 transition-colors text-xs disabled:opacity-60"
                  >
                    <Rows className="size-4 text-muted-foreground" />
                    <span className="truncate max-w-[160px] font-medium text-foreground">
                      {workstreamName ?? 'Choose workstream'}
                    </span>
                  </button>
                }
              />
            </>
          )}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 rounded-full opacity-70 hover:opacity-100"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>

      {/* Title */}
      <div className="flex flex-col gap-2 w-full shrink-0 mt-1">
        <div className="flex gap-1 h-10 items-center w-full">
          <input
            id="task-create-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title"
            className="w-full font-normal leading-7 text-foreground placeholder:text-muted-foreground text-xl outline-none bg-transparent border-none p-0"
            autoComplete="off"
          />
        </div>
      </div>

      {/* Description */}
      <ProjectDescriptionEditor
        value={description}
        onChange={setDescription}
        onExpandChange={setIsDescriptionExpanded}
        placeholder="Briefly describe the goal or details of this task..."
        showTemplates={false}
      />

      {/* Properties */}
      <div className="flex flex-wrap gap-2.5 items-start w-full shrink-0">
        {/* Assignee */}
        <GenericPicker
          items={assigneeOptions}
          onSelect={setAssignee}
          selectedId={assignee?.id}
          placeholder="Assign owner..."
          renderItem={(item) => (
            <div className="flex items-center gap-2 w-full">
              <div className="size-5 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                {item.name.charAt(0)}
              </div>
              <span className="flex-1">{item.name}</span>
            </div>
          )}
          trigger={
            <button className="bg-muted flex gap-2 h-9 items-center px-3 py-2 rounded-lg border border-border hover:border-primary/50 transition-colors">
              <div className="size-4 rounded-full bg-background flex items-center justify-center text-[10px] font-medium">
                {assignee?.name.charAt(0) ?? '?'}
              </div>
              <span className="font-medium text-foreground text-sm leading-5">
                {assignee?.name ?? 'Assignee'}
              </span>
            </button>
          }
        />

        {/* Start date */}
        <DatePicker
          date={startDate}
          onSelect={setStartDate}
          trigger={
            <button className="bg-muted flex gap-2 h-9 items-center px-3 py-2 rounded-lg border border-border hover:border-primary/50 transition-colors">
              <CalendarBlank className="size-4 text-muted-foreground" />
              <span className="font-medium text-foreground text-sm leading-5">
                {startDate ? `Start: ${format(startDate, 'dd/MM/yyyy')}` : 'Start date'}
              </span>
            </button>
          }
        />

        {/* Status */}
        <GenericPicker
          items={STATUS_OPTIONS}
          onSelect={setStatus}
          selectedId={status.id}
          placeholder="Change status..."
          renderItem={(item) => (
            <div className="flex items-center gap-2 w-full">
              <span className="flex-1">{item.label}</span>
            </div>
          )}
          trigger={
            <button className="bg-background flex gap-2 h-9 items-center px-3 py-2 rounded-lg border border-border hover:bg-black/5 transition-colors">
              <UserCircle className="size-4 text-muted-foreground" />
              <span className="font-medium text-foreground text-sm leading-5">
                {status.label}
              </span>
            </button>
          }
        />

        {/* Target date */}
        <DatePicker
          date={targetDate}
          onSelect={setTargetDate}
          trigger={
            <button className="bg-background flex gap-2 h-9 items-center px-3 py-2 rounded-lg border border-border hover:bg-black/5 transition-colors">
              <CalendarBlank className="size-4 text-muted-foreground" />
              <span className="font-medium text-foreground text-sm leading-5">
                {targetDate ? format(targetDate, 'dd/MM/yyyy') : 'Target'}
              </span>
            </button>
          }
        />

        {/* Priority */}
        <GenericPicker
          items={PRIORITY_OPTIONS}
          onSelect={setPriority}
          selectedId={priority?.id}
          placeholder="Set priority..."
          renderItem={(item) => (
            <div className="flex items-center gap-2 w-full">
              <span className="flex-1">{item.label}</span>
            </div>
          )}
          trigger={
            <button className="bg-background flex gap-2 h-9 items-center px-3 py-2 rounded-lg border border-border hover:bg-black/5 transition-colors">
              <ChartBar className="size-4 text-muted-foreground" />
              <span className="font-medium text-foreground text-sm leading-5">
                {priority?.label ?? 'Priority'}
              </span>
            </button>
          }
        />

        {/* Tag */}
        <GenericPicker
          items={TAG_OPTIONS}
          onSelect={setSelectedTag}
          selectedId={selectedTag?.id}
          placeholder="Add tag..."
          renderItem={(item) => (
            <div className="flex items-center gap-2 w-full">
              <span className="flex-1">{item.label}</span>
            </div>
          )}
          trigger={
            <button className="bg-background flex gap-2 h-9 items-center px-3 py-2 rounded-lg border border-border hover:bg-black/5 transition-colors">
              <Tag className="size-4 text-muted-foreground" />
              <span className="font-medium text-foreground text-sm leading-5">
                {selectedTag?.label ?? 'Tag'}
              </span>
            </button>
          }
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto w-full pt-4 shrink-0">
        <div className="flex items-center gap-1">
          <button className="flex items-center justify-center size-10 rounded-lg hover:bg-muted transition-colors">
            <Paperclip className="size-4 text-muted-foreground" />
          </button>
          <button className="flex items-center justify-center size-10 rounded-lg hover:bg-muted transition-colors">
            <Microphone className="size-4 text-muted-foreground" />
          </button>
        </div>

        <div className="flex items-center gap-4">
          {!editingTask && (
            <div className="flex items-center gap-2">
              <Switch
                checked={createMore}
                onCheckedChange={(value) => setCreateMore(Boolean(value))}
              />
              <span className="text-sm font-medium text-foreground">Create more</span>
            </div>
          )}

          <Button type="button" onClick={handleSubmit} className="h-10 px-4 rounded-xl" disabled={isSubmitting}>
            {editingTask ? 'Save changes' : 'Create Task'}
          </Button>
        </div>
      </div>
    </QuickCreateModalLayout>
  )
}
