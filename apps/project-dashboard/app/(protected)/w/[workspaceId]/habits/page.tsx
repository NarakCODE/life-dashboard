import { Suspense } from "react";

import { HabitsPage } from "@/components/habits/HabitsPage";

export default function WorkspaceHabitsPage() {
  return (
    <Suspense fallback={null}>
      <HabitsPage />
    </Suspense>
  );
}
