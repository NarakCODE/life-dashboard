"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"

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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader, PageToolbarResponsive } from "@/components/page-layout"
import { InboxFilterPopover, type InboxFilters } from "./InboxFilterPopover"
import { cn } from "@/lib/utils"
import {
  getNotificationContextValues,
  getNotificationHref,
  getNotificationIcon,
  getNotificationTypeLabel,
} from "@/lib/notifications/notification-utils"
import {
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useNotificationsQuery,
  useUnreadNotificationCountQuery,
} from "@/lib/notifications/notifications-query"
import type { Notification } from "@/lib/notifications/types"
import { useWorkspaceScope } from "@/lib/workspaces/use-workspace-scope"

type InboxTab = "all" | "unread"

const notificationsQuery = {
  page: 1,
  limit: 100,
  sortBy: "createdAt",
  sortOrder: "desc" as const,
}

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
  const searchParams = useSearchParams()
  const { workspaceId } = useWorkspaceScope()
  const [tab, setTab] = useState<InboxTab>("all")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filters, setFilters] = useState<InboxFilters>({ types: [] })

  const isEnabled = Boolean(workspaceId)
  const listQuery = useNotificationsQuery(
    workspaceId ?? "",
    notificationsQuery,
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

  const notificationIdFromQuery = searchParams.get("notificationId")
  const notifications = listQuery.data?.data ?? emptyNotifications
  const unreadCount = unreadCountQuery.data?.count ?? 0

  const items = useMemo(() => {
    let nextItems = notifications

    if (tab === "unread") {
      nextItems = nextItems.filter((item) => !item.isRead)
    }

    if (filters.types.length > 0) {
      nextItems = nextItems.filter((item) => filters.types.includes(item.type))
    }

    return nextItems
  }, [filters.types, notifications, tab])

  useEffect(() => {
    if (!items.length) {
      setSelectedId(null)
      return
    }

    if (
      notificationIdFromQuery &&
      items.some((item) => item.id === notificationIdFromQuery)
    ) {
      setSelectedId(notificationIdFromQuery)
      return
    }

    if (!selectedId || !items.some((item) => item.id === selectedId)) {
      setSelectedId(items[0]?.id ?? null)
    }
  }, [items, notificationIdFromQuery, selectedId])

  const selected = useMemo(() => {
    if (!selectedId) return null
    return notifications.find((item) => item.id === selectedId) ?? null
  }, [notifications, selectedId])

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

  const selectedHref = selected
    ? getNotificationHref(selected, workspaceId)
    : null
  const selectedContextValues = selected
    ? getNotificationContextValues(selected)
    : []

  return (
    <div className="mx-2 my-2 flex min-h-0 min-w-0 flex-1 flex-col rounded-lg border border-border bg-background">
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
          <div className="flex-1 overflow-y-auto px-2 py-2">
            {listQuery.isPending ? (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-24 rounded-lg" />
                <Skeleton className="h-24 rounded-lg" />
                <Skeleton className="h-24 rounded-lg" />
              </div>
            ) : null}

            {!listQuery.isPending && listQuery.isError ? (
              <div className="p-2 text-sm text-destructive">
                {getErrorMessage(listQuery.error, "Unable to load notifications")}
              </div>
            ) : null}

            {!listQuery.isPending &&
            !listQuery.isError &&
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

            {!listQuery.isPending && !listQuery.isError ? (
              <div className="flex flex-col gap-1">
                {items.map((item) => {
                  const Icon = getNotificationIcon(item.type)
                  const isSelected = item.id === selectedId
                  const contextValues = getNotificationContextValues(item)

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setSelectedId(item.id)

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
              </div>
            ) : null}
          </div>
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
                      {selectedContextValues.map((value) => (
                        <span key={value}>{value}</span>
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
                  {selected.isRead ? "Read" : "Unread"}
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
                  {selected.isRead ? "Mark as unread" : "Mark as read"}
                </Button>
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
    </div>
  )
}
