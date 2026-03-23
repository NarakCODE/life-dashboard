import { Suspense } from "react";

import { NotificationsPage } from "@/components/notifications/NotificationsPage";

export default function WorkspaceNotificationsPage() {
  return (
    <Suspense fallback={null}>
      <NotificationsPage />
    </Suspense>
  );
}
