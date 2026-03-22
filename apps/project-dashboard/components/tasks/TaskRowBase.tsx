"use client"

import type { ReactNode } from "react"

import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

export type TaskRowBaseProps = {
  checked: boolean
  title: string
  onCheckedChange?: () => void
  onOpen?: () => void
  titleAriaLabel?: string
  titleSuffix?: ReactNode
  meta?: ReactNode
  className?: string
  subtitle?: ReactNode
}

export function TaskRowBase({
  checked,
  title,
  onCheckedChange,
  onOpen,
  titleAriaLabel,
  titleSuffix,
  meta,
  className,
  subtitle,
}: TaskRowBaseProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-muted/60",
        onOpen && "cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring",
        className,
      )}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (!onOpen) return
        if (event.key !== "Enter" && event.key !== " ") return
        event.preventDefault()
        onOpen()
      }}
      tabIndex={onOpen ? 0 : undefined}
      role={onOpen ? "button" : undefined}
      aria-label={onOpen ? `Edit task ${title}` : undefined}
    >
      <Checkbox
        checked={checked}
        onCheckedChange={onCheckedChange}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
        aria-label={titleAriaLabel ?? title}
        className="rounded-full border-border bg-background data-[state=checked]:border-teal-600 data-[state=checked]:bg-teal-600 hover:cursor-pointer"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "flex-1 truncate text-left max-w-[60vw] sm:max-w-none",
              checked && "line-through text-muted-foreground",
            )}
          >
            {title}
          </span>
          {titleSuffix}
        </div>
        {subtitle && (
          <div
            className={cn(
              "mt-0.5 text-xs text-muted-foreground truncate",
              checked && "line-through opacity-70",
            )}
          >
            {subtitle}
          </div>
        )}
      </div>
      <div className="flex items-center gap-3 text-xs shrink-0 ml-2">
        {meta}
      </div>
    </div>
  )
}
