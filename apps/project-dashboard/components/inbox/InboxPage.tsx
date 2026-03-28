"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"
import {
  Check,
  Circle,
  Trash,
  EnvelopeSimple,
  EnvelopeOpen,
  Spinner,
} from "@phosphor-icons/react/dist/ssr"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { PageHeader, PageToolbarResponsive, PageLayout } from "@/components/page-layout"
import { InboxFilterPopover, type InboxFilters } from "./InboxFilterPopover"
import { cn } from "@/lib/utils"
import {
  getNotificationContextValues,
  getNotificationHref,
  getNotificationIcon,
  getNotificationTypeLabel,
} from "@/lib/notifications/notification-utils"
import {
  notificationKeys,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useNotificationsInfiniteQuery,
  useUnreadNotificationCountQuery,
  useDeleteNotificationMutation,
} from "@/lib/notifications/notifications-query"
import type { Notification } from "@/lib/notifications/types"
import { useWorkspaceScope } from "@/lib/workspaces/use-workspace-scope"
import { useNotificationsSocket } from "@/hooks/use-notifications-socket"
import { useQueryClient } from "@tanstack/react-query"

type InboxTab = "all" | "unread"

const NOTIFICATIONS_PAGE_SIZE = 20

const emptyNotifications: Notification[] = []

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallback
}

function renderNotificationBody(body: string) {
  return body.split("\n").map((line, index, allLines) => {
    const trimmed = line.trim()

    if (!trimmed) {
      return <div key={index} className="h-2" />
    }

    const next = (allLines[index + 1] ?? "").trim()
    const isBullet = trimmed.startsWith("-")
    const isHeading = !isBullet && next.startsWith("-")

    if (isHeading) {
      return (
        <p key={index} className="mt-2 text-xs font-semibold text-foreground">
          {trimmed}
        </p>
      )
    }

    if (isBullet) {
      const content = trimmed.replace(/^[-]+\s*/, "")
      return (
        <p key={index} className="pl-4 text-[13px]">
          <span className="mr-1">•</span>
          {content}
        </p>
      )
    }

    return (
      <p key={index} className="text-[13px]">
        {trimmed}
      </p>
    )
  })
}

export function InboxPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { workspaceId } = useWorkspaceScope()
  const [tab, setTab] = useState<InboxTab>("all")
  const [filters, setFilters] = useState<InboxFilters>({ types: [] })
  const listRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<Map<string, HTMLButtonElement>>(new Map())

  // Get selectedId from URL query param
  const selectedIdFromUrl = searchParams.get("notificationId")
  const [selectedId, setSelectedId] = useState<string | null>(selectedIdFromUrl)

  // Sync URL with selectedId
  const updateSelectedId = useCallback(
    (id: string | null) => {
      setSelectedId(id)
      const params = new URLSearchParams(searchParams.toString())
      if (id) {
        params.set("notificationId", id)
      } else {
        params.delete("notificationId")
      }
      router.push(`?${params.toString()}`, { scroll: false })
    },
    [router, searchParams],
  )

  const isEnabled = Boolean(workspaceId)
  
  // Use infinite query for pagination
  const infiniteQuery = useNotificationsInfiniteQuery(
    workspaceId ?? "",
    {
      limit: NOTIFICATIONS_PAGE_SIZE,
      sortBy: "createdAt",
      sortOrder: "desc",
    },
    isEnabled,
  )
  
  const unreadCountQuery = useUnreadNotificationCountQuery(
    workspaceId ?? "",
    isEnabled,
  )
  const markNotificationReadMutation = useMarkNotificationReadMutation(
    workspaceId ?? "",
  )
  const markAllReadMutation = useMarkAllNotificationsReadMutation(
    workspaceId ?? "",
  )
  const deleteNotificationMutation = useDeleteNotificationMutation(
    workspaceId ?? "",
  )
  const queryClient = useQueryClient()

  // Flatten all pages into a single array
  const allNotifications = useMemo(() => {
    return infiniteQuery.data?.pages.flatMap((page: { data: Notification[] }) => page.data) ?? emptyNotifications
  }, [infiniteQuery.data])

  // Get total count from first page
  const totalCount = infiniteQuery.data?.pages[0]?.meta.pagination.total ?? 0
  const hasNextPage = infiniteQuery.hasNextPage
  const isFetchingNextPage = infiniteQuery.isFetchingNextPage

  // Real-time notification updates via WebSocket
  useNotificationsSocket({
    workspaceId: workspaceId ?? undefined,
    onNewNotification: () => {
      // Invalidate queries to refresh the list
      queryClient.invalidateQueries({
        queryKey: [...notificationKeys.all(workspaceId ?? ""), "list"],
      })
      queryClient.invalidateQueries({
        queryKey: [...notificationKeys.all(workspaceId ?? ""), "unread-count"],
      })
    },
    onUnreadCountUpdate: (count: number) => {
      // Optimistically update the unread count
      queryClient.setQueryData(
        [...notificationKeys.all(workspaceId ?? ""), "unread-count"],
        { count }
      )
    },
    enabled: isEnabled,
  })

  const unreadCount = unreadCountQuery.data?.count ?? 0

  // Filter notifications client-side
  const items = useMemo(() => {
    let nextItems = allNotifications

    if (tab === "unread") {
      nextItems = nextItems.filter((item: Notification) => !item.isRead)
    }

    if (filters.types.length > 0) {
      nextItems = nextItems.filter((item: Notification) => filters.types.includes(item.type))
    }

    return nextItems
  }, [filters.types, allNotifications, tab])

  // Handle URL-based selection
  useEffect(() => {
    if (selectedIdFromUrl && items.some((item) => item.id === selectedIdFromUrl)) {
      setSelectedId(selectedIdFromUrl)
    } else if (!selectedIdFromUrl && items.length > 0) {
      // Auto-select first item if none selected
      setSelectedId(items[0]?.id ?? null)
    } else if (items.length === 0) {
      setSelectedId(null)
    }
  }, [items, selectedIdFromUrl])

  const selected = useMemo(() => {
    if (!selectedId) return null
    return allNotifications.find((item) => item.id === selectedId) ?? null
  }, [allNotifications, selectedId])

  // Get selected index for keyboard navigation
  const selectedIndex = useMemo(() => {
    if (!selectedId) return -1
    return items.findIndex((item) => item.id === selectedId)
  }, [items, selectedId])

  async function updateNotificationReadState(
    notificationId: string,
    isRead: boolean,
  ) {
    if (!workspaceId) return

    try {
      await markNotificationReadMutation.mutateAsync({ notificationId, isRead })
    } catch (error) {
      toast.error(
        getErrorMessage(
          error,
          isRead
            ? "Unable to mark the notification as read"
            : "Unable to mark the notification as unread",
        ),
      )
    }
  }

  async function handleMarkAllAsRead() {
    if (!workspaceId || unreadCount === 0) return

    try {
      const response = await markAllReadMutation.mutateAsync()
      toast.success(
        response.markedCount > 0
          ? `Marked ${response.markedCount} notifications as read`
          : "All notifications are already read",
      )
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to mark all notifications as read"))
    }
  }

  async function handleDeleteNotification(notificationId: string) {
    if (!workspaceId) return

    try {
      await deleteNotificationMutation.mutateAsync(notificationId)
      toast.success("Notification deleted")

      // Select next item if deleted was selected
      if (selectedId === notificationId) {
        const index = items.findIndex((item) => item.id === notificationId)
        const nextItem = items[index + 1] ?? items[index - 1]
        updateSelectedId(nextItem?.id ?? null)
      }
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to delete notification"))
    }
  }

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // Don't handle if user is typing in an input
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      switch (event.key) {
        case "ArrowDown": {
          event.preventDefault()
          const nextIndex = selectedIndex < items.length - 1 ? selectedIndex + 1 : 0
          const nextItem = items[nextIndex]
          if (nextItem) {
            updateSelectedId(nextItem.id)
            itemRefs.current.get(nextItem.id)?.scrollIntoView({ block: "nearest" })
            if (!nextItem.isRead) {
              void updateNotificationReadState(nextItem.id, true)
            }
          }
          break
        }
        case "ArrowUp": {
          event.preventDefault()
          const prevIndex = selectedIndex > 0 ? selectedIndex - 1 : items.length - 1
          const prevItem = items[prevIndex]
          if (prevItem) {
            updateSelectedId(prevItem.id)
            itemRefs.current.get(prevItem.id)?.scrollIntoView({ block: "nearest" })
            if (!prevItem.isRead) {
              void updateNotificationReadState(prevItem.id, true)
            }
          }
          break
        }
        case "Enter": {
          event.preventDefault()
          if (selected?.id) {
            const href = getNotificationHref(selected, workspaceId)
            if (href) {
              router.push(href)
            }
          }
          break
        }
        case "r":
        case "R": {
          event.preventDefault()
          if (selected?.id) {
            void updateNotificationReadState(selected.id, !selected.isRead)
          }
          break
        }
        case "Delete":
        case "Backspace": {
          if (selected?.id && event.key === "Delete") {
            event.preventDefault()
            void handleDeleteNotification(selected.id)
          }
          break
        }
        case "Escape": {
          event.preventDefault()
          updateSelectedId(null)
          break
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [items, selectedIndex, selected, workspaceId, router, updateSelectedId])

  const selectedHref = selected
    ? getNotificationHref(selected, workspaceId)
    : null
  const selectedContextValues = selected
    ? getNotificationContextValues(selected)
    : []

  // Count of displayed items (filtered)
  const displayedCount = items.length

  return (
    <PageLayout>
      <PageHeader
        title="Inbox"
        actions={
          <>
            {unreadCount > 0 ? (
              <Badge variant="secondary" className="rounded-full px-2 py-1 text-[11px]">
                {unreadCount} unread
              </Badge>
            ) : null}
            <Button
              size="sm"
              variant="ghost"
              disabled={unreadCount === 0 || markAllReadMutation.isPending}
              onClick={() => void handleMarkAllAsRead()}
            >
              Mark all as read
            </Button>
          </>
        }
        toolbar={
          <PageToolbarResponsive
            left={<InboxFilterPopover filters={filters} onChange={setFilters} />}
            right={
              <Tabs
                value={tab}
                onValueChange={(value) => setTab(value as InboxTab)}
                className="w-full md:w-auto"
              >
                <TabsList className="inline-flex h-8 w-full justify-between rounded-full border border-border/50 bg-muted px-1 py-0.5 text-xs md:w-auto md:justify-start">
                  <TabsTrigger
                    value="all"
                    className="h-7 rounded-full px-3 text-xs data-[state=active]:bg-background data-[state=active]:text-foreground"
                  >
                    All
                  </TabsTrigger>
                  <TabsTrigger
                    value="unread"
                    className="h-7 rounded-full px-3 text-xs data-[state=active]:bg-background data-[state=active]:text-foreground"
                  >
                    Unread
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            }
          />
        }
        toolbarClassName="flex-col gap-2 md:flex-row md:items-center md:justify-between"
      />

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <div className="flex min-h-0 flex-col border-b border-border/40 md:w-[320px] md:border-b-0 md:border-r lg:w-[360px]">
          <ScrollArea
            ref={listRef}
            className="flex-1 px-2"
            role="listbox"
            aria-label="Notifications"
          >
            {infiniteQuery.isPending ? (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-24 rounded-lg" />
                <Skeleton className="h-24 rounded-lg" />
                <Skeleton className="h-24 rounded-lg" />
              </div>
            ) : null}

            {!infiniteQuery.isPending && infiniteQuery.isError ? (
              <div className="p-2 text-sm text-destructive">
                {getErrorMessage(infiniteQuery.error, "Unable to load notifications")}
              </div>
            ) : null}

            {!infiniteQuery.isPending &&
            !infiniteQuery.isError &&
            items.length === 0 ? (
              <Empty className="min-h-[18rem] border-none">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Badge variant="secondary" className="rounded-full px-2 py-1">
                      Inbox
                    </Badge>
                  </EmptyMedia>
                  <EmptyTitle>No notifications match</EmptyTitle>
                  <EmptyDescription>
                    You are all caught up, or the current filters removed every
                    item from view.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setFilters({ types: [] })
                      setTab("all")
                    }}
                  >
                    Reset filters
                  </Button>
                </EmptyContent>
              </Empty>
            ) : null}

            {!infiniteQuery.isPending && !infiniteQuery.isError ? (
              <div className="flex flex-col gap-1 py-2">
                {items.map((item) => {
                  const Icon = getNotificationIcon(item.type)
                  const isSelected = item.id === selectedId
                  const contextValues = getNotificationContextValues(item)

                  return (
                    <button
                      key={item.id}
                      ref={(el) => {
                        if (el) {
                          itemRefs.current.set(item.id, el)
                        }
                      }}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        updateSelectedId(item.id)
                        if (!item.isRead) {
                          void updateNotificationReadState(item.id, true)
                        }
                      }}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left transition-colors",
                        isSelected ? "bg-muted" : "hover:bg-muted/70",
                      )}
                    >
                      <div className="flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        <Icon />
                      </div>

                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="truncate text-xs font-medium text-foreground">
                            {item.title}
                          </p>
                          <span className="shrink-0 text-[10px] text-muted-foreground">
                            {formatDistanceToNow(new Date(item.createdAt), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>

                        <p className="line-clamp-2 text-[11px] text-muted-foreground">
                          {item.body}
                        </p>

                        <div className="mt-1 flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="h-5 rounded-full px-2 text-[10px] font-medium"
                          >
                            {getNotificationTypeLabel(item.type)}
                          </Badge>
                          {contextValues[0] ? (
                            <span className="truncate text-[10px] text-muted-foreground">
                              {contextValues[0]}
                            </span>
                          ) : null}
                          {!item.isRead ? (
                            <span className="ml-auto size-2 rounded-full bg-primary" />
                          ) : null}
                        </div>
                      </div>
                    </button>
                  )
                })}

                {/* Load More Button */}
                {hasNextPage && (
                  <div className="flex flex-col items-center gap-2 py-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => infiniteQuery.fetchNextPage()}
                      disabled={isFetchingNextPage}
                    >
                      {isFetchingNextPage ? (
                        <>
                          <Spinner className="mr-2 size-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        "Load more"
                      )}
                    </Button>
                    <p className="text-[10px] text-muted-foreground">
                      Showing {displayedCount} of {totalCount} notifications
                    </p>
                  </div>
                )}

                {/* End of list indicator */}
                {!hasNextPage && displayedCount > 0 && (
                  <p className="py-4 text-center text-[10px] text-muted-foreground">
                    {displayedCount === totalCount
                      ? `Showing all ${totalCount} notifications`
                      : `Showing ${displayedCount} of ${totalCount} notifications (filtered)`}
                  </p>
                )}
              </div>
            ) : null}
          </ScrollArea>
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          {selected ? (
            <div className="flex min-h-0 flex-1 flex-col gap-4 px-4 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Avatar className="size-9">
                    <AvatarFallback className="text-xs font-semibold">
                      {selected.title[0] ?? "N"}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex min-w-0 flex-col gap-1">
                    <p className="text-sm font-medium text-foreground">
                      {selected.title}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      <Badge
                        variant="outline"
                        className="h-5 rounded-full px-2 text-[10px]"
                      >
                        {getNotificationTypeLabel(selected.type)}
                      </Badge>
                      {selectedContextValues.map((value, index) => (
                        <span key={`${value}-${index}`}>{value}</span>
                      ))}
                      <span className="flex items-center gap-1">
                        <span className="size-1 rounded-full bg-muted-foreground" />
                        <span>
                          {formatDistanceToNow(new Date(selected.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                <Badge
                  variant={selected.isRead ? "outline" : "default"}
                  className="h-6 rounded-full px-2 text-[10px]"
                >
                  {selected.isRead ? (
                    <span className="flex items-center gap-1">
                      <EnvelopeOpen className="size-3" />
                      Read
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <EnvelopeSimple className="size-3" />
                      Unread
                    </span>
                  )}
                </Badge>
              </div>

              <div className="flex-1 rounded-xl border border-border bg-card/80 px-4 py-3">
                <div className="text-sm leading-relaxed text-foreground">
                  {renderNotificationBody(selected.body)}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                {selectedHref ? (
                  <Button asChild size="sm" variant="outline">
                    <Link href={selectedHref}>Open related work</Link>
                  </Button>
                ) : null}

                <Button
                  size="sm"
                  variant="ghost"
                  disabled={markNotificationReadMutation.isPending}
                  onClick={() =>
                    void updateNotificationReadState(
                      selected.id,
                      selected.isRead ? false : true,
                    )
                  }
                >
                  {selected.isRead ? (
                    <span className="flex items-center gap-1">
                      <Circle className="size-4" />
                      Mark as unread
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Check className="size-4" />
                      Mark as read
                    </span>
                  )}
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={deleteNotificationMutation.isPending}
                      className="text-destructive hover:text-destructive"
                    >
                      <span className="flex items-center gap-1">
                        <Trash className="size-4" />
                        Delete
                      </span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete notification?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete
                        the notification from your inbox.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteNotification(selected.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center px-6">
              <Empty className="min-h-[18rem] border-none">
                <EmptyHeader>
                  <EmptyTitle>Select a notification</EmptyTitle>
                  <EmptyDescription>
                    Choose an item from the inbox list to see the full details.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  )
}
