import { Suspense } from "react"

import { PerformanceContent } from "@/components/performance-content"

export default function PerformancePage() {
  return (
    <Suspense fallback={null}>
      <PerformanceContent />
    </Suspense>
  )
}
