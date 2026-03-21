import { AlertCircle, CheckCircle2, Mail, ShieldAlert } from "lucide-react"

import { cn } from "@/lib/utils"

interface VerificationStatusProps {
  variant: "info" | "success" | "error" | "warning"
  title: string
  description: string
}

const variantStyles = {
  info: "border-blue-200 bg-blue-50 text-blue-950",
  success: "border-emerald-200 bg-emerald-50 text-emerald-950",
  error: "border-red-200 bg-red-50 text-red-950",
  warning: "border-amber-200 bg-amber-50 text-amber-950",
}

const variantIcons = {
  info: Mail,
  success: CheckCircle2,
  error: AlertCircle,
  warning: ShieldAlert,
}

export function VerificationStatus({
  variant,
  title,
  description,
}: VerificationStatusProps) {
  const Icon = variantIcons[variant]

  return (
    <div className={cn("flex gap-3 rounded-2xl border px-4 py-3", variantStyles[variant])}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="space-y-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-sm leading-6 opacity-90">{description}</p>
      </div>
    </div>
  )
}
