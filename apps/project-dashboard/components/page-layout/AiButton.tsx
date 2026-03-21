"use client"

import { Button } from "@/components/ui/button"
import { Sparkle } from "@phosphor-icons/react/dist/ssr"
import { cn } from "@/lib/utils"

interface AiButtonProps {
  /** Optional click handler */
  onClick?: () => void
  /** Optional className for styling */
  className?: string
  /** Button text (defaults to "Ask AI") */
  text?: string
  /** Whether the button is disabled */
  disabled?: boolean
}

/**
 * Standard "Ask AI" button used across pages.
 * 
 * @example
 * ```tsx
 * <AiButton onClick={() => console.log("AI clicked")} />
 * ```
 */
export function AiButton({
  onClick,
  className,
  text = "Ask AI",
  disabled,
}: AiButtonProps) {
  return (
    <div className="relative">
      <Button
        onClick={onClick}
        disabled={disabled}
        className={cn(
          "h-8 gap-2 shadow-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 relative z-10 px-3",
          className
        )}
      >
        <Sparkle className="h-4 w-4" weight="fill" />
        {text}
      </Button>
    </div>
  )
}
