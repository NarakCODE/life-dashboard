"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ClipboardList,
  Filter,
  PencilLine,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";

import { PageHeader, PageToolbarResponsive } from "@/components/page-layout";
import { EmptyState } from "@/components/ui/empty-state";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import {
  useCreateHabitLogMutation,
  useDeleteHabitLogMutation,
  useHabitLogsByHabitQuery,
  useHabitLogsQuery,
  useUpdateHabitLogMutation,
} from "@/lib/habit-logs/habit-logs-query";
import type { CreateHabitLogInput, HabitLog } from "@/lib/habit-logs/types";
import { useHabitsQuery } from "@/lib/habits/habits-query";
import type { Habit } from "@/lib/habits/types";
import { buildWorkspacePath } from "@/lib/workspaces/workspace-routing";
import { useWorkspaceScope } from "@/lib/workspaces/use-workspace-scope";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface HabitLogFormState {
  habitId: string;
  loggedDate: string;
  count: string;
  notes: string;
}

function formatDate(dateString: string, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...options,
  }).format(new Date(dateString));
}

function formatRelativeDay(dateString: string) {
  const today = new Date();
  const target = new Date(dateString);
  const todayUtc = Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const targetUtc = Date.UTC(
    target.getFullYear(),
    target.getMonth(),
    target.getDate(),
  );

  const diffDays = Math.round((todayUtc - targetUtc) / 86400000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays > 1 && diffDays < 7) return `${diffDays} days ago`;
  return formatDate(dateString);
}

function createDefaultFormState(preferredHabitId?: string): HabitLogFormState {
  return {
    habitId: preferredHabitId ?? "",
    loggedDate: new Date().toISOString().slice(0, 10),
    count: "1",
    notes: "",
  };
}

function logToFormState(log: HabitLog): HabitLogFormState {
  return {
    habitId: log.habitId,
    loggedDate: log.loggedDate.slice(0, 10),
    count: String(log.count),
    notes: log.notes ?? "",
  };
}

function formStateToInput(form: HabitLogFormState): CreateHabitLogInput {
  return {
    habitId: form.habitId,
    loggedDate: `${form.loggedDate}T00:00:00.000Z`,
    count: Math.max(1, Number(form.count) || 1),
    notes: form.notes.trim() || undefined,
  };
}

function buildHabitLogQuery(options: {
  search: string;
  startDate: string;
  endDate: string;
}) {
  return {
    page: 1,
    limit: 100,
    sortBy: "loggedDate",
    sortOrder: "desc" as const,
    ...(options.search.trim() ? { search: options.search.trim() } : {}),
    ...(options.startDate
      ? { startDate: `${options.startDate}T00:00:00.000Z` }
      : {}),
    ...(options.endDate ? { endDate: `${options.endDate}T23:59:59.999Z` } : {}),
  };
}

function SummaryCard({
  title,
  value,
  detail,
}: {
  title: string;
  value: string;
  detail: string;
}) {
  return (
    <Card className="border-border/60 bg-card/70">
      <CardContent className="space-y-2 p-4">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {title}
        </p>
        <p className="text-2xl font-semibold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}

function HabitLogsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <Card key={index} className="border-border/60">
          <CardContent className="space-y-3 p-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-4 w-36" />
          </CardContent>
        </Card>
      ))}
      <Card className="border-border/60 md:col-span-3">
        <CardContent className="space-y-4 p-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="space-y-2 rounded-2xl border border-border/60 p-4"
            >
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function HabitLogFormDialog({
  open,
  onClose,
  onSubmit,
  habits,
  initialLog,
  preferredHabitId,
  isSubmitting,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: CreateHabitLogInput) => Promise<void>;
  habits: Habit[];
  initialLog?: HabitLog;
  preferredHabitId?: string;
  isSubmitting: boolean;
}) {
  const [formState, setFormState] = useState<HabitLogFormState>(
    createDefaultFormState(preferredHabitId),
  );

  useEffect(() => {
    if (!open) return;

    if (initialLog) {
      setFormState(logToFormState(initialLog));
      return;
    }

    setFormState(createDefaultFormState(preferredHabitId ?? habits[0]?.id));
  }, [habits, initialLog, open, preferredHabitId]);

  const isEditing = Boolean(initialLog);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formState.habitId || !formState.loggedDate) return;

    await onSubmit(formStateToInput(formState));
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <form className="space-y-5" onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit habit log" : "Log habit progress"}
            </DialogTitle>
            <DialogDescription>
              Capture the day, count, and a short note so your habit history
              stays useful.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="habit-id">Habit</Label>
              <Select
                value={formState.habitId}
                onValueChange={(value) =>
                  setFormState((current) => ({ ...current, habitId: value }))
                }
              >
                <SelectTrigger id="habit-id">
                  <SelectValue placeholder="Select a habit" />
                </SelectTrigger>
                <SelectContent>
                  {habits.map((habit) => (
                    <SelectItem key={habit.id} value={habit.id}>
                      {habit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="logged-date">Logged date</Label>
              <Input
                id="logged-date"
                type="date"
                value={formState.loggedDate}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    loggedDate: event.target.value,
                  }))
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="count">Count</Label>
              <Input
                id="count"
                type="number"
                min={1}
                value={formState.count}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    count: event.target.value,
                  }))
                }
              />
            </div>

            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                rows={4}
                value={formState.notes}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    notes: event.target.value,
                  }))
                }
                placeholder="What made this session easy, hard, or worth remembering?"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                !formState.habitId ||
                !formState.loggedDate ||
                Number(formState.count) < 1
              }
            >
              {isSubmitting
                ? "Saving..."
                : isEditing
                  ? "Save changes"
                  : "Create log"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function HabitLogsPage() {
  const auth = useAuth();
  const { workspaceId } = useWorkspaceScope();
  const [selectedHabitId, setSelectedHabitId] = useState("all");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<HabitLog | undefined>(undefined);
  const [deletingLog, setDeletingLog] = useState<HabitLog | undefined>(
    undefined,
  );

  const habitQuery = useMemo(
    () => ({
      page: 1,
      limit: 100,
      sortBy: "createdAt",
      sortOrder: "desc" as const,
    }),
    [],
  );
  const habitLogQuery = useMemo(
    () => buildHabitLogQuery({ search, startDate, endDate }),
    [endDate, search, startDate],
  );
  const isQueryEnabled =
    auth.hasHydrated && auth.isAuthenticated && Boolean(workspaceId);

  const { data: habitsData } = useHabitsQuery(
    workspaceId ?? "",
    habitQuery,
    isQueryEnabled,
  );
  const habits = useMemo(
    () => habitsData?.data.items ?? [],
    [habitsData?.data.items],
  );

  const listQuery = useHabitLogsQuery(
    workspaceId ?? "",
    habitLogQuery,
    isQueryEnabled && selectedHabitId === "all",
  );
  const byHabitQuery = useHabitLogsByHabitQuery(
    workspaceId ?? "",
    selectedHabitId,
    habitLogQuery,
    isQueryEnabled && selectedHabitId !== "all",
  );

  const createMutation = useCreateHabitLogMutation(workspaceId ?? "", {
    ...habitLogQuery,
    ...(selectedHabitId !== "all" ? { habitId: selectedHabitId } : {}),
  });
  const updateMutation = useUpdateHabitLogMutation(workspaceId ?? "", {
    ...habitLogQuery,
    ...(selectedHabitId !== "all" ? { habitId: selectedHabitId } : {}),
  });
  const deleteMutation = useDeleteHabitLogMutation(workspaceId ?? "", {
    ...habitLogQuery,
    ...(selectedHabitId !== "all" ? { habitId: selectedHabitId } : {}),
  });

  const activeQuery = selectedHabitId === "all" ? listQuery : byHabitQuery;
  const logs = useMemo(
    () => activeQuery.data?.data.logs ?? [],
    [activeQuery.data?.data.logs],
  );
  const pagination = activeQuery.data?.data.pagination;
  const isPending = activeQuery.isPending;
  const error = activeQuery.error;
  const habitMap = useMemo(
    () => new Map(habits.map((habit) => [habit.id, habit])),
    [habits],
  );

  const stats = useMemo(() => {
    const totalCount = logs.reduce((sum, log) => sum + log.count, 0);
    const uniqueHabits = new Set(logs.map((log) => log.habitId)).size;
    const latestLog = logs[0]?.loggedDate;

    return {
      totalLogs: pagination?.total ?? logs.length,
      totalCount,
      uniqueHabits,
      latestLog,
    };
  }, [logs, pagination?.total]);

  const selectedHabit =
    selectedHabitId === "all" ? undefined : habitMap.get(selectedHabitId);
  const canCreateLog = habits.length > 0;
  const isMutating =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  const handleCreate = async (input: CreateHabitLogInput) => {
    try {
      await createMutation.mutateAsync(input);
      toast.success("Habit log created");
      setIsCreateOpen(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create habit log";
      toast.error(message);
    }
  };

  const handleUpdate = async (input: CreateHabitLogInput) => {
    if (!editingLog) return;

    try {
      await updateMutation.mutateAsync({
        habitLogId: editingLog.id,
        input: {
          loggedDate: input.loggedDate,
          count: input.count,
          notes: input.notes,
        },
      });
      toast.success("Habit log updated");
      setEditingLog(undefined);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update habit log";
      toast.error(message);
    }
  };

  const handleDelete = async () => {
    if (!deletingLog) return;

    try {
      await deleteMutation.mutateAsync(deletingLog.id);
      toast.success("Habit log deleted");
      setDeletingLog(undefined);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete habit log";
      toast.error(message);
    }
  };

  const clearFilters = () => {
    setSelectedHabitId("all");
    setSearch("");
    setStartDate("");
    setEndDate("");
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-lg border border-border bg-background mx-2 my-2 min-w-0">
      <PageHeader
        title="Habit Logs"
        actions={
          <Button
            onClick={() => setIsCreateOpen(true)}
            disabled={!canCreateLog}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            New log
          </Button>
        }
        toolbar={
          <PageToolbarResponsive
            left={
              <div className="flex w-full flex-col gap-2 lg:flex-row">
                <div className="flex flex-1 items-center gap-2 rounded-xl border border-border/70 bg-muted/35 px-3">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search notes"
                    className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                  />
                </div>

                <Select
                  value={selectedHabitId}
                  onValueChange={setSelectedHabitId}
                >
                  <SelectTrigger className="w-full lg:w-[220px]">
                    <SelectValue placeholder="All habits" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All habits</SelectItem>
                    {habits.map((habit) => (
                      <SelectItem key={habit.id} value={habit.id}>
                        {habit.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  className="w-full lg:w-[170px]"
                />

                <Input
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  className="w-full lg:w-[170px]"
                />
              </div>
            }
            right={
              <div className="flex w-full justify-end gap-2">
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Reset
                </Button>
              </div>
            }
          />
        }
      />

      <div className="flex-1 overflow-auto p-4 md:p-5">
        {isPending ? (
          <HabitLogsSkeleton />
        ) : error ? (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="space-y-2 p-5">
              <p className="font-medium text-foreground">
                Unable to load habit logs
              </p>
              <p className="text-sm text-muted-foreground">
                {error instanceof Error
                  ? error.message
                  : "Something went wrong"}
              </p>
            </CardContent>
          </Card>
        ) : !canCreateLog && logs.length === 0 ? (
          <EmptyState
            title="Create a habit before logging progress"
            description="Habit logs depend on an existing habit. Set up a habit first, then come back here to capture your history."
            icon={Sparkles}
            action={
              workspaceId ? (
                <Button asChild>
                  <Link href={buildWorkspacePath(workspaceId, "/habits")}>
                    Open habits
                  </Link>
                </Button>
              ) : null
            }
            className="border border-dashed border-border/70"
          />
        ) : logs.length === 0 ? (
          <EmptyState
            title="No habit logs match these filters"
            description="Try a different date range, clear the habit filter, or add a new log."
            icon={ClipboardList}
            action={
              <Button
                onClick={() => setIsCreateOpen(true)}
                disabled={!canCreateLog}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add a log
              </Button>
            }
            className="border border-dashed border-border/70"
          />
        ) : (
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-3">
              <SummaryCard
                title="Visible logs"
                value={String(stats.totalLogs)}
                detail={
                  selectedHabit
                    ? `Filtered to ${selectedHabit.name}`
                    : "Across every habit in this workspace"
                }
              />
              <SummaryCard
                title="Completion volume"
                value={String(stats.totalCount)}
                detail="Total repetitions across the current result set"
              />
              <SummaryCard
                title="Latest entry"
                value={
                  stats.latestLog ? formatRelativeDay(stats.latestLog) : "None"
                }
                detail={
                  stats.latestLog
                    ? formatDate(stats.latestLog, {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "No logged activity yet"
                }
              />
            </div>

            <Card className="overflow-hidden border-border/60 bg-card/80">
              <CardHeader className="border-b border-border/60 bg-muted/20 px-4 py-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">
                      Recent log history
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {stats.uniqueHabits} habit
                      {stats.uniqueHabits === 1 ? "" : "s"} represented in this
                      view.
                    </p>
                  </div>
                  {pagination ? (
                    <Badge variant="outline" className="w-fit">
                      {pagination.total} total
                    </Badge>
                  ) : null}
                </div>
              </CardHeader>

              <CardContent className="p-4">
                <div className="space-y-3">
                  {logs.map((log) => {
                    const habit = habitMap.get(log.habitId);

                    return (
                      <div
                        key={log.id}
                        className="rounded-2xl border border-border/70 bg-background/75 p-4 transition-colors hover:border-border"
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0 flex-1 space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <div
                                className="h-2.5 w-2.5 rounded-full"
                                style={{
                                  backgroundColor:
                                    habit?.color ?? "var(--muted-foreground)",
                                }}
                              />
                              <p className="font-medium text-foreground">
                                {habit?.name ?? "Unknown habit"}
                              </p>
                              <Badge variant="secondary">
                                {log.count} {log.count === 1 ? "rep" : "reps"}
                              </Badge>
                              <Badge variant="outline" className="gap-1">
                                <CalendarDays className="h-3.5 w-3.5" />
                                {formatRelativeDay(log.loggedDate)}
                              </Badge>
                            </div>

                            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                              <p>{formatDate(log.loggedDate)}</p>
                              <p>Created {formatDate(log.createdAt)}</p>
                            </div>

                            {log.notes ? (
                              <p className="max-w-3xl text-sm leading-6 text-foreground/85">
                                {log.notes}
                              </p>
                            ) : (
                              <p className="text-sm italic text-muted-foreground">
                                No notes attached to this entry.
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingLog(log)}
                            >
                              <PencilLine className="mr-1.5 h-4 w-4" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className={cn(
                                "border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive",
                              )}
                              onClick={() => setDeletingLog(log)}
                            >
                              <Trash2 className="mr-1.5 h-4 w-4" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <HabitLogFormDialog
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreate}
        habits={habits}
        preferredHabitId={
          selectedHabitId === "all" ? undefined : selectedHabitId
        }
        isSubmitting={createMutation.isPending}
      />

      <HabitLogFormDialog
        open={Boolean(editingLog)}
        onClose={() => setEditingLog(undefined)}
        onSubmit={handleUpdate}
        habits={habits}
        initialLog={editingLog}
        isSubmitting={updateMutation.isPending}
      />

      <AlertDialog
        open={Boolean(deletingLog)}
        onOpenChange={(open) => !open && setDeletingLog(undefined)}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete habit log</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the selected log entry permanently. The associated
              habit stays intact.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isMutating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isMutating}
              onClick={handleDelete}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
