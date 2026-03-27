import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        outline: "text-foreground",
        muted: "border-transparent bg-muted text-muted-foreground dark:bg-muted/30 dark:text-muted-foreground",
        active: "border-transparent bg-teal-50 text-teal-700 dark:bg-teal-500/15 dark:text-teal-100",
        on_hold: "border-transparent bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-100",
        archived: "border-transparent bg-slate-100 text-slate-600 dark:bg-slate-600/30 dark:text-slate-200",
      },
      dot: {
        true: "",
        false: "",
      }
    },
    defaultVariants: {
      variant: "default",
      dot: false,
    },
  }
)

const badgeDotVariants = cva("h-1.5 w-1.5 rounded-full", {
  variants: {
    variant: {
      default: "bg-primary-foreground",
      secondary: "bg-secondary-foreground",
      outline: "bg-foreground",
      muted: "bg-zinc-900 dark:bg-zinc-300",
      active: "bg-teal-600 dark:bg-teal-300",
      on_hold: "bg-amber-600 dark:bg-amber-300",
      archived: "bg-slate-500 dark:bg-slate-300",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({
  className,
  variant,
  dot,
  children,
  ...props
}: BadgeProps) {
  return (
    <div
      data-slot="badge"
      className={cn(badgeVariants({ variant, dot }), className)}
      {...props}
    >
      {dot && <span className={cn(badgeDotVariants({ variant }))} />}
      {children}
    </div>
  )
}

export { Badge, badgeVariants }
