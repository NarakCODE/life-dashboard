"use client"

import { ListChecks } from "@phosphor-icons/react/dist/ssr"
import { ProgressCircle } from "@/components/progress-circle"
import { cn } from "@/lib/utils"
import type { ProjectSummary } from "@/lib/projects/projects-client"

export type ProjectProgressProps = {
  project: ProjectSummary
  className?: string
  size?: number
  showTaskSummary?: boolean
}

function computeProjectProgress(project: ProjectSummary) {
  const totalTasks = project.workstreams.length
  const doneTasks =
    project.status === "completed"
      ? totalTasks
      : project.status === "active"
        ? Math.max(1, Math.round(totalTasks / 2))
        : 0

  const percent =
    project.status === "completed"
      ? 100
      : project.status === "active"
        ? 60
        : project.status === "planned"
          ? 25
          : 0

  return {
    totalTasks,
    doneTasks,
    percent: Math.max(0, Math.min(100, percent)),
  }
}

function getProgressColor(percent: number): string {
  // Simple threshold-based mapping, aligned with the sidebar palette
  if (percent >= 80) return "var(--chart-3)" // success
  if (percent >= 50) return "var(--chart-4)" // mid / warning
  if (percent > 0) return "var(--chart-5)" // low / risk
  return "var(--chart-2)" // neutral for 0%
}

export function ProjectProgress({ project, className, size = 18, showTaskSummary = true }: ProjectProgressProps) {
  const { totalTasks, doneTasks, percent } = computeProjectProgress(project)
  const color = getProgressColor(percent)
  const summaryLabel = totalTasks === 1 ? "Workstream" : "Workstreams"

  return (
    <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
      <ProgressCircle progress={percent} color={color} size={size} />
      <div className="flex items-center gap-4">
        <span>{percent}%</span>
        {showTaskSummary && totalTasks > 0 && (
          <span className="flex items-center gap-1 text-sm">
            <ListChecks className="h-4 w-4" />
            {doneTasks} / {totalTasks} {summaryLabel}
          </span>
        )}
      </div>
    </div>
  )
}
