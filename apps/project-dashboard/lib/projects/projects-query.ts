import { useQuery } from "@tanstack/react-query"

import { getTaskProjects } from "@/lib/projects/projects-client"
import { taskKeys } from "@/lib/tasks/tasks-query"

export function useTaskProjectsQuery(enabled = true) {
  return useQuery({
    queryKey: taskKeys.projects(),
    queryFn: getTaskProjects,
    enabled,
  })
}
