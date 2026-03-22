import { useQuery } from "@tanstack/react-query"

import { getTaskProjects } from "@/lib/projects/projects-client"
import { taskKeys } from "@/lib/tasks/tasks-query"

export function useTaskProjectsQuery(workspaceId: string, enabled = true) {
  return useQuery({
    queryKey: taskKeys.projects(workspaceId),
    queryFn: () => getTaskProjects(workspaceId),
    enabled: enabled && Boolean(workspaceId),
  })
}
