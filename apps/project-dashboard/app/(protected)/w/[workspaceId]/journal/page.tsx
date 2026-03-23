import { Suspense } from "react";

import { JournalEntriesPage } from "@/components/journal/JournalEntriesPage";

export default function WorkspaceJournalPage() {
  return (
    <Suspense fallback={null}>
      <JournalEntriesPage />
    </Suspense>
  );
}
