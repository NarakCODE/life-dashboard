import { Suspense } from "react";

import { MyTasksPage } from "@/components/tasks/MyTasksPage";

export default function WorkspaceTasksPage() {
  return (
    <Suspense fallback={null}>
      <MyTasksPage />
    </Suspense>
  );
}
