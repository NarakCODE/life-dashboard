import { Suspense } from "react"

import { HabitLogsPage } from "@/components/habit-logs/HabitLogsPage"

export default function WorkspaceHabitLogsPage() {
  return (
    <Suspense fallback={null}>
      <HabitLogsPage />
    </Suspense>
  )
}
