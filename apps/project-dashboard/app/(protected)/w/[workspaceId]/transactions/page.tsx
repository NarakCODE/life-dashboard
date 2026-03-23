import { Suspense } from "react";

import { TransactionsPage } from "@/components/transactions/TransactionsPage";

export default function WorkspaceTransactionsPage() {
  return (
    <Suspense fallback={null}>
      <TransactionsPage />
    </Suspense>
  );
}
