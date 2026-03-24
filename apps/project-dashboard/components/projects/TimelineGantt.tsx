"use client"

import { useState, useMemo, useCallback } from "react"
import {
  addDays,
  differenceInDays,
  format,
  isWithinInterval,
  startOfWeek,
  startOfMonth,
  endOfMonth,
  isSameDay,
} from "date-fns"

import type { TimelineTask } from "@/lib/data/project-details"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  CaretLeft,
  CaretRight,
  CalendarBlank,
  MagnifyingGlass,
  X,
  Faders,
  Check,
} from "@phosphor-icons/react/dist/ssr"
import { cn } from "@/lib/utils"

type ViewMode = "week" | "2weeks" | "month"

type TaskStatus = "all" | "planned" | "in-progress" | "done"

interface DateRange {
  from: Date | undefined
  to: Date | undefined
}

interface TimelineGanttProps {
  tasks: TimelineTask[]
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function getViewModeDays(mode: ViewMode): number {
  switch (mode) {
    case "week":
      return 7
    case "2weeks":
      return 14
    case "month":
      return 30
    default:
      return 7
  }
}

export function TimelineGantt({ tasks }: TimelineGanttProps) {
  // View state
  const [viewMode, setViewMode] = useState<ViewMode>("week")
  const [rangeStart, setRangeStart] = useState<Date | null>(null)

  // Filter state
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<TaskStatus>("all")
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined })
  const [showFilters, setShowFilters] = useState(false)

  // UI state
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isDateRangeOpen, setIsDateRangeOpen] = useState(false)

  // Calculate date bounds from all tasks
  const { minDate, maxDate } = useMemo(() => {
    if (tasks.length === 0) {
      const today = new Date()
      return { minDate: today, maxDate: addDays(today, 7) }
    }
    const dates = tasks.flatMap((t) => [t.startDate, t.endDate])
    return {
      minDate: new Date(Math.min(...dates.map((d) => d.getTime()))),
      maxDate: new Date(Math.max(...dates.map((d) => d.getTime()))),
    }
  }, [tasks])

  const minWeekStart = startOfWeek(minDate, { weekStartsOn: 1 })
  const maxWeekStart = startOfWeek(maxDate, { weekStartsOn: 1 })

  // Filter tasks based on search, status, and date range
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        if (!task.name.toLowerCase().includes(query)) {
          return false
        }
      }

      // Status filter
      if (statusFilter !== "all" && task.status !== statusFilter) {
        return false
      }

      // Date range filter
      if (dateRange.from || dateRange.to) {
        const from = dateRange.from || minDate
        const to = dateRange.to || maxDate
        // Task overlaps with selected range
        const taskInRange = task.startDate <= to && task.endDate >= from
        if (!taskInRange) {
          return false
        }
      }

      return true
    })
  }, [tasks, searchQuery, statusFilter, dateRange, minDate, maxDate])

  // Calculate visible date range based on view mode
  const viewDays = getViewModeDays(viewMode)
  const effectiveRangeStart = rangeStart ?? minWeekStart

  const days = useMemo(() => {
    const start = startOfWeek(effectiveRangeStart, { weekStartsOn: 1 })
    return Array.from({ length: viewDays }).map((_, i) => addDays(start, i))
  }, [effectiveRangeStart, viewDays])

  const rangeStartDate = days[0]!
  const rangeEndDate = addDays(rangeStartDate, viewDays)

  // Navigation handlers
  const clampToRange = useCallback(
    (date: Date) => {
      if (date.getTime() < minWeekStart.getTime()) return minWeekStart
      if (date.getTime() > maxWeekStart.getTime()) return maxWeekStart
      return date
    },
    [minWeekStart, maxWeekStart]
  )

  const handlePrevious = () => {
    setRangeStart((prev) => {
      const base = prev ?? minWeekStart
      const offset = viewMode === "month" ? -30 : viewMode === "2weeks" ? -14 : -7
      return clampToRange(addDays(base, offset))
    })
  }

  const handleNext = () => {
    setRangeStart((prev) => {
      const base = prev ?? minWeekStart
      const offset = viewMode === "month" ? 30 : viewMode === "2weeks" ? 14 : 7
      return clampToRange(addDays(base, offset))
    })
  }

  const handleToday = () => {
    const base = startOfWeek(new Date(), { weekStartsOn: 1 })
    setRangeStart(base)
  }

  // Check if today is in current view
  const today = new Date()
  const todayInRange = isWithinInterval(today, { start: rangeStartDate, end: rangeEndDate })
  const todayIndex = todayInRange
    ? clamp(differenceInDays(today, rangeStartDate), 0, days.length - 1)
    : Math.floor(days.length / 2)

  // Check if tasks exist in current view
  const hasTasksInRange = filteredTasks.some(
    (t) => t.startDate < rangeEndDate && t.endDate >= rangeStartDate
  )

  // Navigation availability
  const canGoPrevious = rangeStartDate.getTime() > minWeekStart.getTime()
  const canGoNext = rangeStartDate.getTime() < maxWeekStart.getTime()

  // Active filters count
  const activeFiltersCount =
    (searchQuery ? 1 : 0) + (statusFilter !== "all" ? 1 : 0) + (dateRange.from || dateRange.to ? 1 : 0)

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("")
    setStatusFilter("all")
    setDateRange({ from: undefined, to: undefined })
  }

  // Group days for column headers based on view mode
  const dayGroups = useMemo(() => {
    if (viewMode === "month") {
      // Group by week for month view
      const weeks: { days: Date[]; label: string }[] = []
      let currentWeek: Date[] = []
      days.forEach((day, idx) => {
        if (idx % 7 === 0 && currentWeek.length > 0) {
          weeks.push({
            days: currentWeek,
            label: format(currentWeek[0]!, "MMM d"),
          })
          currentWeek = []
        }
        currentWeek.push(day)
      })
      if (currentWeek.length > 0) {
        weeks.push({
          days: currentWeek,
          label: format(currentWeek[0]!, "MMM d"),
        })
      }
      return weeks
    }
    // Single group for week/2weeks view
    return [{ days, label: format(rangeStartDate, "MMMM yyyy") }]
  }, [days, viewMode, rangeStartDate])

  if (tasks.length === 0) {
    return (
      <section>
        <h2 className="text-base font-semibold text-foreground">Expected Timeline</h2>
        <div className="mt-4 rounded-lg border border-dashed border-border/70 p-6 text-sm text-muted-foreground">
          No tasks scheduled
        </div>
      </section>
    )
  }

  return (
    <section>
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-base font-semibold text-foreground">Expected Timeline</h2>
      </div>

      {/* Toolbar */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {/* Navigation */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Previous"
            onClick={handlePrevious}
            disabled={!canGoPrevious}
          >
            <CaretLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 rounded-lg px-3 text-xs"
            onClick={handleToday}
          >
            Today
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Next"
            onClick={handleNext}
            disabled={!canGoNext}
          >
            <CaretRight className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* View Mode Selector */}
        <Select value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
          <SelectTrigger className="h-7 w-[100px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Week</SelectItem>
            <SelectItem value="2weeks">2 Weeks</SelectItem>
            <SelectItem value="month">Month</SelectItem>
          </SelectContent>
        </Select>

        {/* Date Range Picker */}
        <Popover open={isDateRangeOpen} onOpenChange={setIsDateRangeOpen}>
          <PopoverTrigger asChild>
            <Button
              variant={dateRange.from || dateRange.to ? "default" : "outline"}
              size="sm"
              className="h-7 gap-1.5 text-xs"
            >
              <CalendarBlank className="h-3.5 w-3.5" />
              {dateRange.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "MMM d")} - {format(dateRange.to, "MMM d")}
                  </>
                ) : (
                  format(dateRange.from, "MMM d")
                )
              ) : (
                "Date range"
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="p-3 border-b">
              <p className="text-sm font-medium">Filter by date range</p>
              <p className="text-xs text-muted-foreground">Show tasks within selected dates</p>
            </div>
            <Calendar
              mode="range"
              selected={{
                from: dateRange.from,
                to: dateRange.to,
              }}
              onSelect={(range) => {
                setDateRange({
                  from: range?.from,
                  to: range?.to,
                })
                if (range?.from && range?.to) {
                  setIsDateRangeOpen(false)
                }
              }}
              numberOfMonths={2}
              initialFocus
            />
            <div className="p-3 border-t flex justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDateRange({ from: minDate, to: maxDate })
                  setIsDateRangeOpen(false)
                }}
              >
                All tasks
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDateRange({ from: undefined, to: undefined })
                  setIsDateRangeOpen(false)
                }}
              >
                Clear
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Search */}
        <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
          <PopoverTrigger asChild>
            <Button
              variant={searchQuery ? "default" : "outline"}
              size="icon-sm"
              aria-label="Search tasks"
              className="h-7 w-7"
            >
              <MagnifyingGlass className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-3">
              <div className="space-y-1">
                <p className="text-sm font-medium">Search tasks</p>
                <p className="text-xs text-muted-foreground">Filter tasks by name</p>
              </div>
              <div className="relative">
                <MagnifyingGlass className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Type to search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  autoFocus
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="absolute right-1 top-1 h-6 w-6"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {filteredTasks.length} of {tasks.length} tasks shown
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Filters Toggle */}
        <Button
          variant={showFilters || activeFiltersCount > 0 ? "default" : "outline"}
          size="sm"
          className="h-7 gap-1.5 text-xs"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Faders className="h-3.5 w-3.5" />
          Filters
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1 text-[10px]">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Active Filters Bar */}
      {(showFilters || activeFiltersCount > 0) && (
        <div className="mt-3 flex flex-wrap items-center gap-2 p-3 bg-muted/50 rounded-lg">
          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as TaskStatus)}>
            <SelectTrigger className="h-7 w-[130px] text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="planned">Planned</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="done">Done</SelectItem>
            </SelectContent>
          </Select>

          {/* Clear Filters */}
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
              onClick={clearFilters}
            >
              Clear all
            </Button>
          )}

          {/* Results count */}
          <div className="ml-auto text-xs text-muted-foreground">
            Showing {filteredTasks.length} of {tasks.length} tasks
          </div>
        </div>
      )}

      {/* Gantt Chart */}
      <div className="mt-4 overflow-x-auto rounded-lg border border-border">
        <div className="min-w-[600px]">
          {/* Header Row */}
          <div className="grid grid-cols-[200px_1fr]">
            <div className="px-4 py-3 text-sm font-medium text-muted-foreground border-r border-border bg-muted/20">
              Name
            </div>
            <div className="px-4 py-3 bg-muted/20 border-b border-border">
              <div className="text-xs text-muted-foreground">
                {format(rangeStartDate, "MMMM yyyy")}
              </div>
            </div>
          </div>

          {/* Days Header */}
          <div className="grid grid-cols-[200px_1fr]">
            <div className="border-r border-border bg-muted/10" />
            <div className="grid" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(2.5rem, 1fr))` }}>
              {days.map((d) => {
                const isToday = isSameDay(d, today)
                const isWeekend = d.getDay() === 0 || d.getDay() === 6
                return (
                  <div
                    key={d.toISOString()}
                    className={cn(
                      "flex flex-col items-center py-2 text-[11px] leading-4 border-b border-border",
                      isToday && "bg-primary/5",
                      isWeekend && "bg-muted/30"
                    )}
                  >
                    <span className={cn("font-medium", isToday && "text-primary")}>
                      {format(d, "EEE")}
                    </span>
                    <span className={cn("text-xs", isToday && "font-semibold text-primary")}>
                      {format(d, "d")}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          <Separator />

          {/* Tasks */}
          <div className="relative">
            {/* Today indicator line */}
            {todayInRange && (
              <div
                className="absolute top-0 bottom-0 w-px bg-primary z-10"
                style={{ left: `calc(200px + ${((todayIndex + 0.5) / days.length) * 100}%)` }}
                aria-hidden="true"
              >
                <div className="absolute -top-1 -translate-x-1/2 w-2 h-2 rounded-full bg-primary" />
              </div>
            )}

            {/* No tasks message */}
            {!hasTasksInRange && (
              <div className="flex items-center justify-center py-12 bg-background">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">No tasks in this range</p>
                  {activeFiltersCount > 0 && (
                    <Button
                      variant="link"
                      size="sm"
                      className="mt-1"
                      onClick={clearFilters}
                    >
                      Clear filters
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Task rows */}
            {filteredTasks.map((t, rowIdx) => {
              const startOffset = differenceInDays(t.startDate, rangeStartDate)
              const endOffset = differenceInDays(t.endDate, rangeStartDate)

              const totalDays = days.length
              const leftPct = clamp((startOffset / totalDays) * 100, 0, 100)
              const rightPct = clamp((endOffset / totalDays) * 100, 0, 100)
              const minWidthPct = (1 / totalDays) * 50
              const widthPct = clamp(rightPct - leftPct + minWidthPct, minWidthPct, 100)

              const isVisible = t.startDate < rangeEndDate && t.endDate >= rangeStartDate
              if (!isVisible) return null

              // Status colors
              const statusColors = {
                planned: "bg-slate-200 border-slate-300 text-slate-700",
                "in-progress": "bg-blue-100 border-blue-300 text-blue-700",
                done: "bg-green-100 border-green-300 text-green-700",
              }

              return (
                <div key={t.id} className="grid grid-cols-[200px_1fr]">
                  <div className="px-4 py-2 text-sm text-foreground border-r border-border truncate flex items-center gap-2">
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full",
                        t.status === "done" && "bg-green-500",
                        t.status === "in-progress" && "bg-blue-500",
                        t.status === "planned" && "bg-slate-400"
                      )}
                    />
                    <span className="truncate">{t.name}</span>
                  </div>
                  <div className="relative py-2">
                    <div
                      className="absolute inset-0 grid"
                      style={{ gridTemplateColumns: `repeat(${days.length}, 1fr)` }}
                    >
                      {days.map((_, i) => (
                        <div
                          key={i}
                          className={cn(
                            "border-r border-border/50",
                            i % 7 === 6 && "border-r-border"
                          )}
                        />
                      ))}
                    </div>
                    <div
                      className={cn(
                        "absolute top-1/2 -translate-y-1/2 h-6 rounded-md border px-2 flex items-center text-xs truncate transition-all",
                        statusColors[t.status]
                      )}
                      style={{ left: `${leftPct}%`, width: `${widthPct}%`, minWidth: "4rem" }}
                      title={`${t.name} (${format(t.startDate, "MMM d")} - ${format(t.endDate, "MMM d")})`}
                    >
                      <span className="truncate">{t.name}</span>
                    </div>
                  </div>
                  {rowIdx < filteredTasks.length - 1 && (
                    <Separator className="col-span-2" />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-slate-400" />
          <span>Planned</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span>In Progress</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span>Done</span>
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          <div className="w-px h-4 bg-primary" />
          <span>Today</span>
        </div>
      </div>
    </section>
  )
}
