"use client"

import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface PageToolbarProps {
  /** Content for the left side (filters, chips, tabs) */
  left?: ReactNode
  /** Content for the right side (view options, buttons) */
  right?: ReactNode
  /** Optional className for the toolbar container */
  className?: string
  /** Optional className for the left section */
  leftClassName?: string
  /** Optional className for the right section */
  rightClassName?: string
}

/**
 * Standard toolbar layout for page headers.
 * 
 * Provides a consistent two-section layout:
 * - Left: Filters, chips, tabs, search
 * - Right: View options, action buttons, AI button
 * 
 * @example
 * ```tsx
 * <PageToolbar
 *   left={
 *     <>
 *       <FilterPopover />
 *       <ChipOverflow chips={filters} />
 *     </>
 *   }
 *   right={
 *     <>
 *       <ViewOptionsPopover />
 *       <AiButton />
 *     </>
 *   }
 * />
 * ```
 */
export function PageToolbar({
  left,
  right,
  className,
  leftClassName,
  rightClassName,
}: PageToolbarProps) {
  return (
    <div className={cn("flex items-center justify-between w-full", className)}>
      {left && (
        <div className={cn("flex items-center gap-2", leftClassName)}>
          {left}
        </div>
      )}
      {right && (
        <div className={cn("flex items-center gap-2", rightClassName)}>
          {right}
        </div>
      )}
    </div>
  )
}

interface PageToolbarResponsiveProps extends PageToolbarProps {
  /** Whether to use responsive layout (stack on mobile) */
  responsive?: boolean
}

/**
 * Responsive toolbar that stacks on smaller screens.
 */
export function PageToolbarResponsive({
  left,
  right,
  className,
  leftClassName,
  rightClassName,
  responsive = true,
}: PageToolbarResponsiveProps) {
  if (!responsive) {
    return (
      <PageToolbar
        left={left}
        right={right}
        className={className}
        leftClassName={leftClassName}
        rightClassName={rightClassName}
      />
    )
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-2 md:flex-row md:items-center md:justify-between w-full",
        className
      )}
    >
      {left && (
        <div
          className={cn(
            "flex w-full md:w-auto md:justify-start",
            leftClassName
          )}
        >
          {left}
        </div>
      )}
      {right && (
        <div
          className={cn(
            "flex w-full md:w-auto md:justify-end",
            rightClassName
          )}
        >
          {right}
        </div>
      )}
    </div>
  )
}
