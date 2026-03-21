"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface PageHeaderProps {
  /** Page title displayed next to the sidebar trigger */
  title: string
  /** Actions to display in the top-right corner (e.g., buttons) */
  actions?: ReactNode
  /** Content for the bottom section (filters, tabs, etc.) */
  toolbar?: ReactNode
  /** Optional className for the header element */
  className?: string
  /** Optional className for the top row */
  topRowClassName?: string
  /** Optional className for the toolbar row */
  toolbarClassName?: string
}

/**
 * Standard page header layout component.
 * 
 * Provides a consistent two-row header structure:
 * - Top row: Sidebar trigger + title (left), actions (right)
 * - Bottom row: Toolbar area for filters, tabs, etc.
 * 
 * @example
 * ```tsx
 * <PageHeader
 *   title="Projects"
 *   actions={<Button>Add Project</Button>}
 *   toolbar={<FilterPopover />}
 * />
 * ```
 */
export function PageHeader({
  title,
  actions,
  toolbar,
  className,
  topRowClassName,
  toolbarClassName,
}: PageHeaderProps) {
  return (
    <header className={cn("flex flex-col border-b border-border/40", className)}>
      {/* Top row: Title + Actions */}
      <div
        className={cn(
          "flex items-center justify-between px-4 py-3 border-b border-border/70",
          topRowClassName
        )}
      >
        <div className="flex items-center gap-3">
          <SidebarTrigger className="h-8 w-8 rounded-lg hover:bg-accent text-muted-foreground" />
          <p className="text-base font-medium text-foreground">{title}</p>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {/* Bottom row: Toolbar (filters, tabs, etc.) */}
      {toolbar && (
        <div
          className={cn(
            "flex items-center justify-between px-4 pb-3 pt-3",
            toolbarClassName
          )}
        >
          {toolbar}
        </div>
      )}
    </header>
  )
}
