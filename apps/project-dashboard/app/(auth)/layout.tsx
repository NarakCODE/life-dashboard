import { Suspense } from "react"
import { GuestShell } from "@/components/auth/auth-shell"

interface AuthLayoutProps {
  children: React.ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <Suspense fallback={null}>
      <GuestShell>{children}</GuestShell>
    </Suspense>
  )
}
