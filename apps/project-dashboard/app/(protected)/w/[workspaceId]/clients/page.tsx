import { Suspense } from "react";

import { ClientsContent } from "@/components/clients-content";

export default function WorkspaceClientsPage() {
  return (
    <Suspense fallback={null}>
      <ClientsContent />
    </Suspense>
  );
}
