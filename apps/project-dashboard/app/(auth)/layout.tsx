import { GuestShell } from "@/components/auth/auth-shell"

interface AuthLayoutProps {
  children: React.ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return <GuestShell>{children}</GuestShell>
}
