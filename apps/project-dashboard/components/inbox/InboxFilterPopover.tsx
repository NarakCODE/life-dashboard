"use client"

import { useState } from "react"
import { Funnel } from "@phosphor-icons/react/dist/ssr"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  getNotificationTypeLabel,
} from "@/lib/notifications/notification-utils"
import { NotificationType } from "@/lib/notifications/types"

export type InboxFilters = {
  types: NotificationType[]
}

interface InboxFilterPopoverProps {
  filters: InboxFilters
  onChange: (next: InboxFilters) => void
}

const TYPE_OPTIONS = [
  NotificationType.TASK_DUE,
  NotificationType.HABIT_REMINDER,
  NotificationType.GOAL_MILESTONE,
  NotificationType.BUDGET_ALERT,
  NotificationType.SYSTEM,
]

export function InboxFilterPopover({
  filters,
  onChange,
}: InboxFilterPopoverProps) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<InboxFilters>(filters)

  const activeFilterCount = filters.types.length

  function toggleType(type: NotificationType) {
    setDraft((prev) => {
      const exists = prev.types.includes(type)
      return {
        types: exists
          ? prev.types.filter((value) => value !== type)
          : [...prev.types, type],
      }
    })
  }

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)

        if (nextOpen) {
          setDraft(filters)
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-2 rounded-lg border-border/60 bg-transparent px-3"
        >
          <Funnel />
          <span>Filter</span>
          {activeFilterCount > 0 ? (
            <span className="rounded-full bg-primary/10 px-1.5 text-[10px] font-medium text-primary">
              {activeFilterCount}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-72 rounded-xl p-4" sideOffset={8}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">Notification types</p>
            <p className="text-xs text-muted-foreground">
              Narrow the inbox to the updates you want to review right now.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            {TYPE_OPTIONS.map((type) => (
              <label
                key={type}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-border/60 px-3 py-2 text-sm hover:bg-muted/50"
              >
                <Checkbox
                  checked={draft.types.includes(type)}
                  onCheckedChange={() => toggleType(type)}
                />
                <span className="flex-1">{getNotificationTypeLabel(type)}</span>
              </label>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-border/50 pt-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 rounded-md px-2 text-xs"
              onClick={() => {
                const cleared = { types: [] }
                setDraft(cleared)
                onChange(cleared)
              }}
            >
              Clear
            </Button>

            <Button
              size="sm"
              className="h-8 rounded-md px-3 text-xs"
              onClick={() => {
                onChange(draft)
                setOpen(false)
              }}
            >
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
