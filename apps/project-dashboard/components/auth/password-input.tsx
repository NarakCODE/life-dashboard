"use client"

import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"

import { Input } from "@/components/ui/input"

type PasswordInputProps = React.ComponentProps<typeof Input>

export function PasswordInput({ className, ...props }: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div className="relative">
      <Input
        {...props}
        type={isVisible ? "text" : "password"}
        className={["pr-11", className].filter(Boolean).join(" ")}
      />
      <button
        type="button"
        onClick={() => setIsVisible((value) => !value)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        aria-label={isVisible ? "Hide password" : "Show password"}
      >
        {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
}
