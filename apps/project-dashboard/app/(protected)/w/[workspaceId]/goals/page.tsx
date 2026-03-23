import { Suspense } from "react";

import { GoalsPage } from "@/components/goals/GoalsPage";

export default function WorkspaceGoalsPage() {
  return (
    <Suspense fallback={null}>
      <GoalsPage />
    </Suspense>
  );
}
