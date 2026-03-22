import { apiRequest } from "@/lib/api/api-client"

export type ProjectStatus =
  | "backlog"
  | "planned"
  | "active"
  | "cancelled"
  | "completed"

export type ProjectPriority = "urgent" | "high" | "medium" | "low"

export interface TaskProjectWorkstream {
  id: string
  name: string
  order: number
}

export interface ProjectSummary {
  id: string
  workspaceId: string
  name: string
  status: ProjectStatus
  priority: ProjectPriority
  typeLabel?: string
  durationLabel?: string
  workstreams: TaskProjectWorkstream[]
}

export interface TaskProjectSummary {
  id: string
  name: string
  status: ProjectStatus
  priority: ProjectPriority
  typeLabel?: string
  durationLabel?: string
  workstreams: TaskProjectWorkstream[]
}

export interface ProjectInput {
  name: string
  status?: ProjectStatus
  priority?: ProjectPriority
  typeLabel?: string
  durationLabel?: string
  memberUserIds?: string[]
  workstreams?: Array<{
    name: string
    order?: number
  }>
}

export type UpdateProjectInput = Partial<ProjectInput>

export async function getTaskProjects(
  workspaceId: string,
): Promise<TaskProjectSummary[]> {
  return apiRequest<TaskProjectSummary[]>({
    path: "/projects",
    auth: "required",
    workspaceId,
  })
}

export async function getProjects(
  workspaceId: string,
): Promise<ProjectSummary[]> {
  return apiRequest<ProjectSummary[]>({
    path: "/projects",
    auth: "required",
    workspaceId,
  })
}

export async function getProject(
  workspaceId: string,
  projectId: string,
): Promise<ProjectSummary> {
  return apiRequest<ProjectSummary>({
    path: `/projects/${projectId}`,
    auth: "required",
    workspaceId,
  })
}

export async function createProject(
  workspaceId: string,
  input: ProjectInput,
): Promise<ProjectSummary> {
  return apiRequest<ProjectSummary>({
    path: "/projects",
    method: "POST",
    body: input,
    auth: "required",
    workspaceId,
  })
}

export async function updateProject(
  workspaceId: string,
  projectId: string,
  input: UpdateProjectInput,
): Promise<ProjectSummary> {
  return apiRequest<ProjectSummary>({
    path: `/projects/${projectId}`,
    method: "PATCH",
    body: input,
    auth: "required",
    workspaceId,
  })
}

export async function deleteProject(
  workspaceId: string,
  projectId: string,
): Promise<{ message: string }> {
  return apiRequest<{ message: string }>({
    path: `/projects/${projectId}`,
    method: "DELETE",
    auth: "required",
    workspaceId,
  })
}
