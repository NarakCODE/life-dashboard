import { Suspense } from "react";

import { InboxPage } from "@/components/inbox/InboxPage";

export default function InboxRoutePage() {
  return (
    <Suspense fallback={null}>
      <InboxPage />
    </Suspense>
  );
}
