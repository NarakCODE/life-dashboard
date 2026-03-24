import { apiRequest } from "@/lib/api/api-client"
import type { ProjectDetails } from "@/lib/data/project-details"
import type { UpdateTaskInput } from "@/lib/tasks/types"

type ProjectDetailsUserPayload = {
  id: string
  name: string
  avatarUrl?: string
  role?: string
}

type ProjectDetailsWorkstreamTaskPayload = {
  id: string
  name: string
  status: "todo" | "in-progress" | "done"
  dueLabel?: string
  dueTone?: "danger" | "warning" | "muted"
  assignee?: ProjectDetailsUserPayload
  startDate?: string
  dueDate?: string
  priority?: "no-priority" | "low" | "medium" | "high" | "urgent"
  tag?: string
  description?: string
  order?: number
}

type ProjectDetailsProjectTaskPayload = ProjectDetailsWorkstreamTaskPayload & {
  projectId: string
  projectName: string
  workstreamId: string
  workstreamName: string
}

type ProjectDetailsPayload = Omit<
  ProjectDetails,
  "timelineTasks" | "workstreams" | "time" | "files" | "notes" | "projectTasks"
> & {
  timelineTasks: Array<{
    id: string
    name: string
    startDate: string
    endDate: string
    status: "planned" | "in-progress" | "done"
  }>
  workstreams: Array<{
    id: string
    name: string
    order?: number
    tasks: ProjectDetailsWorkstreamTaskPayload[]
  }>
  projectTasks?: ProjectDetailsProjectTaskPayload[]
  time: Omit<ProjectDetails["time"], "dueDate"> & {
    dueDate: string
  }
  files: Array<
    Omit<ProjectDetails["files"][number], "addedDate"> & {
      addedDate: string
    }
  >
  notes: Array<
    Omit<ProjectDetails["notes"][number], "addedDate"> & {
      addedDate: string
    }
  >
}

function toDate(value?: string | Date | null) {
  if (!value) return undefined
  return value instanceof Date ? value : new Date(value)
}

function deserializeProjectDetails(payload: ProjectDetailsPayload): ProjectDetails {
  return {
    ...payload,
    timelineTasks: payload.timelineTasks.map((task) => ({
      ...task,
      startDate: new Date(task.startDate),
      endDate: new Date(task.endDate),
    })),
    workstreams: payload.workstreams.map((workstream) => ({
      ...workstream,
      tasks: workstream.tasks.map((task) => ({
        ...task,
        startDate: toDate(task.startDate),
        dueDate: toDate(task.dueDate),
      })),
    })),
    projectTasks: payload.projectTasks?.map((task) => ({
      ...task,
      startDate: toDate(task.startDate),
      dueDate: toDate(task.dueDate),
    })),
    time: {
      ...payload.time,
      dueDate: new Date(payload.time.dueDate),
    },
    files: payload.files.map((file) => ({
      ...file,
      addedDate: new Date(file.addedDate),
    })),
    notes: payload.notes.map((note) => ({
      ...note,
      addedDate: new Date(note.addedDate),
    })),
  }
}

export async function getProjectDetails(
  workspaceId: string,
  projectId: string,
): Promise<ProjectDetails> {
  const payload = await apiRequest<ProjectDetailsPayload>({
    path: `/projects/${projectId}/details`,
    auth: "required",
    workspaceId,
  })

  return deserializeProjectDetails(payload)
}

export async function patchProjectTask(
  workspaceId: string,
  projectId: string,
  taskId: string,
  input: UpdateTaskInput,
) {
  return apiRequest<unknown>({
    path: `/projects/${projectId}/tasks/${taskId}`,
    method: "PATCH",
    body: input,
    auth: "required",
    workspaceId,
  })
}

export async function moveProjectTask(
  workspaceId: string,
  projectId: string,
  taskId: string,
  input: {
    targetWorkstreamId?: string
    targetOrder?: number
  },
) {
  return apiRequest<unknown>({
    path: `/projects/${projectId}/tasks/${taskId}/move`,
    method: "PATCH",
    body: input,
    auth: "required",
    workspaceId,
  })
}

export async function reorderProjectWorkstreamTasks(
  workspaceId: string,
  projectId: string,
  workstreamId: string,
  taskIds: string[],
) {
  return apiRequest<{ message: string }>({
    path: `/projects/${projectId}/workstreams/${workstreamId}/tasks/reorder`,
    method: "PATCH",
    body: { taskIds },
    auth: "required",
    workspaceId,
  })
}

export async function reorderProjectTasks(
  workspaceId: string,
  projectId: string,
  taskIds: string[],
) {
  return apiRequest<{ message: string }>({
    path: `/projects/${projectId}/tasks/reorder`,
    method: "PATCH",
    body: { taskIds },
    auth: "required",
    workspaceId,
  })
}
