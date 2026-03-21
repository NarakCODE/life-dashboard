import { ProtectedAppShell } from "@/components/auth/auth-shell"

interface ProtectedLayoutProps {
  children: React.ReactNode
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  return <ProtectedAppShell>{children}</ProtectedAppShell>
}
