import { Suspense } from "react";

import { BudgetsPage } from "@/components/budgets/BudgetsPage";

export default function WorkspaceBudgetsPage() {
  return (
    <Suspense fallback={null}>
      <BudgetsPage />
    </Suspense>
  );
}
