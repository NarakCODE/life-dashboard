import { apiRequest } from "@/lib/api/api-client"

export interface TaskProjectWorkstream {
  id: string
  name: string
  order: number
}

export interface TaskProjectSummary {
  id: string
  name: string
  status: "backlog" | "planned" | "active" | "cancelled" | "completed"
  priority: "urgent" | "high" | "medium" | "low"
  typeLabel?: string
  durationLabel?: string
  workstreams: TaskProjectWorkstream[]
}

export async function getTaskProjects(): Promise<TaskProjectSummary[]> {
  return apiRequest<TaskProjectSummary[]>({
    path: "/projects",
    auth: "required",
  })
}
