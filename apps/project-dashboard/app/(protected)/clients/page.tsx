import { Suspense } from "react"

import { ClientsContent } from "@/components/clients-content"

export default function ClientsPage() {
  return (
    <Suspense fallback={null}>
      <ClientsContent />
    </Suspense>
  )
}
